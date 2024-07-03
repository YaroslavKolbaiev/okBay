import { SchemaFieldTypes } from 'redis';
import { itemsIndexKey, itemCacheKey } from '$services/keys';
import type { Client } from './client';

export const createIndexes = async (client: Client) => {
	const indexKey = itemsIndexKey();
	const itemKeyWithoutId = itemCacheKey('');

	// get all the indexes
	const indexes = await client.ft._list();

	// check if the index exists in redis
	const indexExists = indexes.includes(indexKey);

	// if the index exists, return in order to avoid creating it again and throwing an error
	if (indexExists) {
		return;
	}

	// This invokes the create method on the ft (full-text search)
	return client.ft.create(
		// The first argument is the index key
		indexKey,
		//
		{
			// the schema for the index. It specifies that both name and description
			// fields should be indexed as text (SchemaFieldTypes.TEXT).
			// This means that these fields will be searchable
			name: { type: SchemaFieldTypes.TEXT, SORTABLE: true },
			description: { type: SchemaFieldTypes.TEXT, SORTABLE: false },
			ownerId: { type: SchemaFieldTypes.TAG, SORTABLE: false },
			endingAt: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			bids: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			views: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			price: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			likes: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true }
		} as any,
		// options for the index
		{
			// the index is created on HASH data structure
			ON: 'HASH',
			// prefix that all keys in the hash must have for them to be indexed
			// in this case, the prefix is the item key without the id (itemcache#)
			PREFIX: itemKeyWithoutId
		}
	);
};
