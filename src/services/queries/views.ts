import { client } from '$services/redis';
import { itemCacheKey, itemsByViewsKey } from '$services/keys';

export const incrementView = async (itemId: string, userId: string) => {
	return Promise.all([
		// increment the views count for the item, which is stored in a hash
		client.hIncrBy(itemCacheKey(itemId), 'views', 1),
		// increment the views count for the item with id=itemId, which is stored in a sorted set
		// unlike the hIncrBy command, zIncrBy second argument is the score to increment by and then the value to increment
		client.zIncrBy(itemsByViewsKey(), 1, itemId)
	]);
};
