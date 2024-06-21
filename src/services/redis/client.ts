import { createClient } from 'redis';

// declare redis client
const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	},
	password: process.env.REDIS_PW
});

// error handling
client.on('error', (err) => console.error(err));
// connect to redis
client.connect();

export { client };
