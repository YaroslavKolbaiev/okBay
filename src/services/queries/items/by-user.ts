import { client } from '$services/redis';
import { itemsIndexKey } from '$services/keys';
import { deserialize } from './deserialize';

interface QueryOpts {
	page: number;
	perPage: number;
	sortBy: string;
	direction: string;
}

export const itemsByUser = async (userId: string, opts: QueryOpts) => {
	// create a query to search for the term in the name and description fields
	// ownerId is a TAG field, so we can search for it using the TAG syntax {}
	const query = `@ownerId:{${userId}}`;

	// if we have a sort field which is sortBy and deriction we assign object with keys BY and DIRECTION to sortCriteria
	const sortCriteria = opts.sortBy &&
		opts.direction && {
			BY: opts.sortBy,
			DIRECTION: opts.direction
		};

	const { total, documents } = await client.ft.search(itemsIndexKey(), query, {
		// search on HASH data structure
		ON: 'HASH',
		// sortCriteria is an object with keys BY and DIRECTION
		SORTBY: sortCriteria,
		// LIMIT
		LIMIT: {
			from: opts.page * opts.perPage,
			size: opts.perPage
		}
	} as any);

	return {
		totalPages: Math.ceil(total / opts.perPage),
		items: documents.map(({ id, value }) => {
			return deserialize(id.replace('itemcache#', ''), value as any);
		})
	};
};
