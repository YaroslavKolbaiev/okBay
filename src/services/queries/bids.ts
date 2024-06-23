import type { CreateBidAttrs, Bid } from '$services/types';
import { client } from '$services/redis';
import { bidHistoryKey } from '$services/keys';
import { DateTime } from 'luxon';

// createBid is used to add a new bid to the bid history
// redis list is used to store the bid history

export const createBid = async (attrs: CreateBidAttrs) => {
	const key = bidHistoryKey(attrs.itemId);

	const serializedBid = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

	// rPush adds the serializedBid to the end of the list
	// same as array.push
	return client.rPush(key, serializedBid);
};

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const key = bidHistoryKey(itemId);

	// in oder to get the last 10 bids, we need to get the range from -10 to -1
	const startIndex = -1 * offset - count;
	const endIndex = -1 - offset;

	// lRange returns the specified range of elements in the list stored at the key
	const range = await client.lRange(key, startIndex, endIndex);

	return range.map(deserializeHistory);
};

const serializeHistory = (amount: number, createdAt: number) => {
	return `${amount}:${createdAt}`;
};

const deserializeHistory = (stored: string) => {
	const [amount, createdAt] = stored.split(':');
	return {
		amount: parseFloat(amount),
		createdAt: DateTime.fromMillis(parseInt(createdAt))
	};
};
