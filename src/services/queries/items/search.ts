import { client } from '$services/redis';
import { deserialize } from './deserialize';
import { itemsIndexKey } from '$services/keys';

export const searchItems = async (term: string, size: number = 5) => {
	const cleaned = term
		// find all non-alphanumeric characters and remove them
		.replaceAll(/[^a-zA-Z0-9\s]/g, '')
		// remove all whitespace characters
		.trim()
		// split the string into an array of words
		.split(' ')
		// if the word is empty, remove it otherwise return word with % appended to the start and end
		// %word% is used to search for partial matches in redis
		.map((word) => (word ? `%${word}%` : ''))
		// join the array of words into a single string
		.join(' ');

	// if user sends an empty string, return an empty array
	if (cleaned === '') {
		return [];
	}

	// create a query to search for the term in the name and description fields
	// if the term is found in the name field, give it a higher weight
	const query = `(@name:(${cleaned}) => {$weight: 5.0}) | (@description:(${cleaned}))`;

	const idexKey = itemsIndexKey();
	// client.ft.search is used to search the redis index for the given term
	// in this case we are using fuzzy search by appending % to the start and end of each word
	// to search for partial matches
	const results = await client.ft.search(idexKey, query, {
		LIMIT: { from: 0, size: size }
	});

	const searchResults = results.documents.map(({ id, value }) => deserialize(id, value as any));

	return searchResults;
};
