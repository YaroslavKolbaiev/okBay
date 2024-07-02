import { randomBytes } from 'crypto';
import { Client, client } from './client';

export const withLock = async (
	key: string,
	callback: (redisClient: Client, signal: any) => any
) => {
	const retryDelay = 100;
	let retries = 20;
	const timeoutMs = 2000;
	const token = randomBytes(16).toString('hex');
	const lockKey = `lock:${key}`;

	while (retries >= 0) {
		retries--;

		const acuired = await client.set(lockKey, token, {
			EX: 10,
			NX: true
		});

		if (!acuired) {
			await pause(retryDelay);
			continue;
		}

		try {
			const signal = { expired: false };
			setTimeout(() => {
				signal.expired = true;
			}, 2000);

			const proxiedClient = buildClientProxy(timeoutMs);
			const result = await callback(proxiedClient, signal);
			return result;
		} finally {
			await client.unlock(lockKey, token);
		}
	}
};

const buildClientProxy = (timeout: number) => {
	const startTime = Date.now();

	const handler = {
		get(target: Client, prop: keyof Client) {
			if (Date.now() >= startTime + timeout) {
				throw new Error('Lock has expired');
			}

			const value = target[prop];
			return typeof value === 'function' ? value.bind(target) : value;
		}
	};

	return new Proxy(client, handler) as Client;
};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
