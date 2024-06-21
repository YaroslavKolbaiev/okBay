import 'dotenv/config';
import { client } from '../src/services/redis';

const run = async () => {
	client.hSet('car', {
		color: 'red',
		year: 1950
	});
	client.hSet('car1', {
		color: 'green',
		year: 1951
	});
	client.hSet('car2', {
		color: 'blue',
		year: 1952
	});

	// This is a good example of how to use Promise.all to run multiple async functions in parallel
	// In this case, Promise.all() is used to send three hGetAll requests to the Redis client concurrently.
	// The code will wait until all requests have completed before proceeding.
	// This can improve performance by not waiting for each request to complete sequentially.
	const result = await Promise.all([
		client.hGetAll('car'),
		client.hGetAll('car1'),
		client.hGetAll('car2')
	]);

	console.log(result);
};
run();
