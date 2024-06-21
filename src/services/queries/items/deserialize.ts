import type { Item } from '$services/types';
import { parse } from 'cookie';
import { DateTime } from 'luxon';

export const deserialize = (id: string, item: { [key: string]: string }): Item => {
	// redis returns object with string keys and values
	// in order to use the data we need to convert the values to the correct type
	return {
		id,
		name: item.name,
		description: item.description,
		imageUrl: item.imageUrl,
		highestBidUserId: item.highestBidUserId,
		ownerId: item.ownerId,
		price: parseFloat(item.price),
		createdAt: DateTime.fromMillis(parseInt(item.createdAt)),
		endingAt: DateTime.fromMillis(parseInt(item.endingAt)),
		views: Number(item.views),
		likes: Number(item.likes),
		bids: Number(item.bids)
	};
};
