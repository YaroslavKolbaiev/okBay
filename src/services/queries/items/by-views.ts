import { client } from '$services/redis';
import { itemsByViewsKey, itemCacheKey } from '$services/keys';
import { deserialize } from './deserialize';

// using the sort command instead of hGetAll
// in this case we do only one request to the redis server
// which is more efficient than multiple requests

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
	const key = itemsByViewsKey(); // => items:byviews

	// sort items:byviews takes all the items in the sorted set.
	// in this case we are getting ids of the items => itemId
	let results: any = await client.sort(key, {
		GET: [
			// get # returns itemId
			'#',
			// get ${itemCacheKey('*')}->name takes itemId and inserts it into the hash itemcache#itemId.name
			`${itemCacheKey('*')}->name`,
			// get ${itemCacheKey('*')}->views takes itemId and inserts it into the hash itemcache#itemId.views
			`${itemCacheKey('*')}->views`,
			`${itemCacheKey('*')}->endingAt`,
			`${itemCacheKey('*')}->imageUrl`,
			`${itemCacheKey('*')}->price`
		],
		// BY: 'nosort' means that we are not sorting the items
		BY: 'views',
		// DIECTION: 'ASC' or 'DESC' is used to sort the items in ascending or descending order
		DIRECTION: order,
		// LIMIT is used to limit the number of items returned
		LIMIT: {
			// OFFSET is the number of items to skip
			offset,
			// COUNT is the number of items to return
			count
		}
	});

	const items = [];

	// the idea here is to iterate over the results array and get the first 6 elements
	// on each iteration, push the item to the items array
	// update the results array with the remaining items
	// repeat the process until the results array is empty

	while (results.length) {
		// get the first 6 elements from the results array using destructuring
		const [id, name, views, endingAt, imageUrl, price, ...rest] = results;
		// deserialize the item
		const item = deserialize(id, { name, views, endingAt, imageUrl, price });
		// on each iteration, push the item to the items array
		items.push(item);
		// update the results array with the remaining items
		results = rest;
	}

	return items;
};
