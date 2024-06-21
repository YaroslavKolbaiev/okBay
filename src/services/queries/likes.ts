import { client } from '$services/redis';
import { userLikesKey, itemCacheKey } from '$services/keys';
import { getItems } from './items';

export const userLikesItem = async (itemId: string, userId: string) => {
	const key = userLikesKey(userId);
	// check if itemId exists in the redis set
	const result = await client.sIsMember(key, itemId);

	return result;
};

export const likedItems = async (userId: string) => {
	// fetch all the items that the user has liked
	const key = userLikesKey(userId);
	// // sMembers returns all the members of the set
	const itemsIds = await client.sMembers(key);

	return getItems(itemsIds);
};

export const likeItem = async (itemId: string, userId: string) => {
	const key = userLikesKey(userId);
	// add itemId to the redis set
	const inserted = await client.sAdd(key, itemId);

	if (inserted) {
		// increment the likes count for the item, which is stored in a hash
		return client.hIncrBy(itemCacheKey(itemId), 'likes', 1);
	}
};

export const unlikeItem = async (itemId: string, userId: string) => {
	const key = userLikesKey(userId);
	// remove itemId from the redis set
	const removed = await client.sRem(key, itemId);

	if (removed) {
		// decrement the likes count for the item
		return client.hIncrBy(itemCacheKey(itemId), 'likes', -1);
	}
};

export const commonLikedItems = async (userOneId: string, userTwoId: string) => {
	const keyOne = userLikesKey(userOneId);
	const keyTwo = userLikesKey(userTwoId);

	// get the intersection of the two sets.
	// sInter returns the members of the set resulting from the intersection of all the sets provided
	// in this case, it returns the items that both users have liked
	const commonItemsIds = await client.sInter([keyOne, keyTwo]);

	return getItems(commonItemsIds);
};
