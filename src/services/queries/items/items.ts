import { itemCacheKey, itemsByViewsKey, itemsByEndingKey, itemsByPriceKey } from '$services/keys';
import { client } from '$services/redis';
import type { CreateItemAttrs } from '$services/types';
import { genId } from '$services/utils';
import { itemsByPrice } from './by-price';
import { deserialize } from './deserialize';
import { serialize } from './serialize';

export const getItem = async (id: string) => {
	const key = itemCacheKey(id);
	const item = await client.hGetAll(key);

	// If the item does not exist, return null
	if (Object.keys(item).length === 0) {
		return null;
	}

	return deserialize(id, item);
};

export const getItems = async (ids: string[]) => {
	// Create an array of commands to get each item
	// important to note that we are not executing the commands here
	const commands = ids.map((id) => {
		return client.hGetAll(itemCacheKey(id));
	});

	// Execute all commands concurrently
	const items = await Promise.all(commands);

	return items.map((item, index) => {
		// If the item does not exist, return null
		if (Object.keys(item).length === 0) {
			return null;
		}

		return deserialize(ids[index], item);
	});
};

export const createItem = async (attrs: CreateItemAttrs) => {
	const id = genId();
	const key = itemCacheKey(id);
	const serializedItem = serialize(attrs);

	// in oder to optimize the performance, we can use pipeline to execute multiple commands in a single request
	// await client.hSet(key, serializedItem);
	// await client.zAdd(itemsByViewsKey(), {
	// value: id,
	// score: 0
	// });

	// optimized version. execute multiple commands in a single request
	await Promise.all([
		// Add the item to the hash
		client.hSet(key, serializedItem),
		// Add the itemId to the sorted set with initial score of 0
		// itemsByView tracks the views of the item
		client.zAdd(itemsByViewsKey(), {
			value: id,
			score: 0
		}),
		client.zAdd(itemsByEndingKey(), {
			value: id,
			// endingAt is a timestamp, so we need to convert it to milliseconds
			score: attrs.endingAt.toMillis()
		}),
		// when item is created we add it to the itemsByPrice sorted set with initial score of 0
		// itemsByPrice sorted set stores the items with highest bid price
		client.zAdd(itemsByPriceKey(), {
			value: id,
			score: 0
		})
	]);

	return id;
};
