import { SchemaFieldTypes } from 'redis';
import { itemsIndexKey, itemCacheKey } from '$services/keys';
import type { Client } from './client';

export const createIndexes = async (client: Client) => {
	const indexKey = itemsIndexKey();
	const itemKeyWithoutId = itemCacheKey('');

	const indexes = await client.ft._list();

	const indexExists = indexes.includes(indexKey);

	if (indexExists) {
		return;
	}

	return client.ft.create(
		indexKey,
		{
			name: { type: SchemaFieldTypes.TEXT, SORTABLE: true },
			description: { type: SchemaFieldTypes.TEXT, SORTABLE: false },
			ownerId: { type: SchemaFieldTypes.TAG, SORTABLE: false },
			endingAt: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			bids: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			views: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			price: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true },
			likes: { type: SchemaFieldTypes.NUMERIC, SORTABLE: true }
		} as any,
		{
			ON: 'HASH',
			PREFIX: itemKeyWithoutId
		}
	);
};
