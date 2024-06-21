import { client } from '$services/redis';
import { itemsByEndingKey, itemCacheKey } from '$services/keys';
import { deserialize } from './deserialize';
import { getItems } from './items';

export const itemsByEndingTime = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
	const key = itemsByEndingKey();
	// zRange returns the specified range of elements in the sorted set stored at the key
	// second argument is the start index, third argument is the end index
	// in this case we are getting all the items with a score greater than the current time
	const ids = await client.zRange(key, Date.now(), '+inf', {
		// BY: 'SCORE' means that we want to sort the items by their score
		BY: 'SCORE',
		// LIMIT is used to limit the number of items returned
		LIMIT: {
			// OFFSET is the number of items to skip
			offset,
			// COUNT is the number of items to return
			count
		}
	});

	const items = await getItems(ids);

	return order === 'DESC' ? items : items.reverse();
};
