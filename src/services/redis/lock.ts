import { randomBytes } from 'crypto';
import { Client, client } from './client';

// This TypeScript function, withLock, is designed to execute a callback function
// with a locking mechanism to prevent race conditions or concurrent execution issues.

export const withLock = async (
	key: string,
	callback: (redisClient: Client, signal: any) => any
) => {
	// retryDelay: A constant set to 100 milliseconds, used to wait before retrying to
	//  acquire the lock if it's already held by another process.
	const retryDelay = 100;
	// retries: A constant set to 20, used to define the maximum number of retries to acquire the lock.
	let retries = 20;
	const timeoutMs = 2000;

	// token: A unique string generated using randomBytes(16).toString('hex'), which will be used as the value of the lock.
	const token = randomBytes(16).toString('hex');
	// lockKey: A string that represents the key for the lock, using the format lock:${key}.
	const lockKey = `lock:${key}`;

	// lock acquisition loop
	// The function enters a loop, attempting to acquire the lock up to retries times.
	while (retries >= 0) {
		// each iteration, the retries counter is decremented.
		retries--;

		// It tries to set the lock in a client
		// using the set method with the lockKey, token, and options
		const acuired = await client.set(lockKey, token, {
			// EX: 10: Sets the lock to expire after 10 seconds to prevent deadlocks in case the process crashes or fails to release the lock.
			EX: 10,
			// NX: true: Ensures the lock can only be set if it does not already exist, preventing overwriting an existing lock.
			NX: true
		});

		// If the lock is not acquired, the function pauses for retryDelay milliseconds before trying again.
		if (!acuired) {
			// pause: A function that returns a promise that resolves after a specified duration.
			await pause(retryDelay);
			// continue: A keyword that skips the rest of the current iteration and proceeds to the next one.
			continue;
		}

		try {
			// signal: An object with an expired property set to false, used to signal whether the lock has expired.
			const signal = { expired: false };
			setTimeout(() => {
				signal.expired = true;
			}, 2000);
			// If the lock is acquired, the function executes the callback function and stores the result in the result variable.
			const proxiedClient = buildClientProxy(timeoutMs);
			const result = await callback(proxiedClient, signal);
			return result;
		} finally {
			// After executing the callback, the function releases the lock by deleting the lockKey.
			await client.unlock(lockKey, token);
		}
	}
};

// buildClientProxy: A function that creates a proxy object for the Redis client with a timeout mechanism.
// this is done to prevent the client from being used after the lock has expired.
// Proxy: A built-in JavaScript object that allows you to intercept and customize operations performed on objects.
// this is super advanced JavaScript feature, you are not yet ready to understand it
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
