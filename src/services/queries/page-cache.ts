import { pageCacheKey } from '$services/keys';
import { client } from '$services/redis';

const cacheRoutes = ['/about', '/privacy', '/auth/signin', '/auth/signup'];

export const setCachedPage = (route: string, page: string) => {
	if (cacheRoutes.includes(route)) {
		const key = pageCacheKey(route);
		return client.set(key, page, {
			EX: 20
		});
	}
};

export const getCachedPage = (route: string) => {
	if (cacheRoutes.includes(route)) {
		const key = pageCacheKey(route);
		return client.get(key);
	}

	return null;
};
