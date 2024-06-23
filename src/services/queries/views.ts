import { client } from '$services/redis';
import { itemCacheKey, itemsByViewsKey, itemsViewsKey } from '$services/keys';

export const incrementView = async (itemId: string, userId: string) => {
	// pfAdd is used to add the userId to the hyperloglog structure
	// if the userId is already in the hyperloglog structure, it will not be added and will return false
	const inserted = await client.pfAdd(itemsViewsKey(itemId), userId);

	// the hyperloglog structure ocuppies less memory than a set only 12kb
	// this is useful when we have a large number of data like views

	if (inserted) {
		return Promise.all([
			// increment the views count for the item, which is stored in a hash
			client.hIncrBy(itemCacheKey(itemId), 'views', 1),
			// increment the views count for the item with id=itemId, which is stored in a sorted set
			// unlike the hIncrBy command, zIncrBy second argument is the score to increment by and then the value to increment
			client.zIncrBy(itemsByViewsKey(), 1, itemId)
		]);
	}
};
