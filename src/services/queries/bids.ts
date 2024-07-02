import type { CreateBidAttrs, Bid } from '$services/types';
import { client, withLock } from '$services/redis';
import { bidHistoryKey, itemCacheKey, itemsByPriceKey } from '$services/keys';
import { DateTime } from 'luxon';
import { getItem } from './items';

// createBid is used to add a new bid to the bid history
// redis list is used to store the bid history

export const createBid = async (attrs: CreateBidAttrs) => {
	return withLock(attrs.itemId, async (lockedClient: typeof client, signal: any) => {
		const item = await getItem(attrs.itemId);

		if (!item) {
			throw new Error('Item does not exist');
		}

		// check if current bid more than last bed
		if (item.price >= attrs.amount) {
			throw new Error('Bid to low');
		}

		// check if item is still open for bidding
		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
			throw new Error('Item closed to bidding');
		}

		const historyKey = bidHistoryKey(attrs.itemId);
		const itemKey = itemCacheKey(item.id);

		const serializedBid = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

		if (signal.expired) {
			throw new Error('Timeout. Try again later.');
		}

		return Promise.all([
			// rPush adds the serializedBid to the end of the list
			// same as array.push
			lockedClient.rPush(historyKey, serializedBid),
			// update item in redis hash
			lockedClient.hSet(itemKey, {
				bids: item.bids + 1,
				price: attrs.amount,
				highestBidUserId: attrs.userId
			}),
			// zAdd adds the item to the sorted set with the new price as the score
			// when user adds a bid, we need to update object in sorted set with the new price
			lockedClient.zAdd(itemsByPriceKey(), {
				value: item.id,
				score: attrs.amount
			})
		]);
	});

	// // executeIsolated is used to execute a block of code in a transaction
	// // transactions are atomic, meaning that all commands in the transaction are executed sequentially
	// // and no other commands can be executed until the transaction is complete
	// // this is useful when we need to solve concurrency issues

	// // isolatedClient is a new instance of the redis client that is only used within the transaction
	// return client.executeIsolated(async (isolatedClient) => {
	// 	// watch is used to monitor the key for changes
	// 	// in this case, we are watching the item key to ensure that the item has not changed since we last read it
	// 	// if the key changes, the transaction will fail
	// 	await isolatedClient.watch(itemCacheKey(attrs.itemId));

	// 	const item = await getItem(attrs.itemId);

	// 	if (!item) {
	// 		throw new Error('Item does not exist');
	// 	}

	// 	// check if current bid more than last bed
	// 	if (item.price >= attrs.amount) {
	// 		throw new Error('Bid to low');
	// 	}

	// 	// check if item is still open for bidding
	// 	if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
	// 		throw new Error('Item closed to bidding');
	// 	}

	// 	const historyKey = bidHistoryKey(attrs.itemId);
	// 	const itemKey = itemCacheKey(item.id);

	// 	const serializedBid = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

	// 	return (
	// 		isolatedClient
	// 			// multi is used to start a new transaction
	// 			.multi()
	// 			// rPush adds the serializedBid to the end of the list
	// 			// same as array.push
	// 			.rPush(historyKey, serializedBid)
	// 			// update item in redis hash
	// 			.hSet(itemKey, {
	// 				bids: item.bids + 1,
	// 				price: attrs.amount,
	// 				highestBidUserId: attrs.userId
	// 			})
	// 			// zAdd adds the item to the sorted set with the new price as the score
	// 			// when user adds a bid, we need to update object in sorted set with the new price
	// 			.zAdd(itemsByPriceKey(), {
	// 				value: item.id,
	// 				score: attrs.amount
	// 			})
	// 			// exec is used to execute the transaction
	// 			.exec()
	// 	);
	// });
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
