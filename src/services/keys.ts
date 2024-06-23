export const pageCacheKey = (id: string) => `pagecache#${id}`;
export const userCacheKey = (userId: string) => `usercache#${userId}`;
export const sessionCacheKey = (sessionId: string) => `sessioncache#${sessionId}`;
export const usernameUniqueKey = () => `username:unique`;
export const userLikesKey = (userId: string) => `user:likes#${userId}`;
export const userNamesKey = () => `usernames`;

// Items
export const itemCacheKey = (itemId: string) => `itemcache#${itemId}`;
export const itemsByViewsKey = () => `items:byviews`;
export const itemsByEndingKey = () => `items:byending`;
export const itemsViewsKey = (itemId: string) => `items:views#${itemId}`;
export const bidHistoryKey = (itemId: string) => `history#${itemId}`;
