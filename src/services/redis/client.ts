import { itemCacheKey, itemsByViewsKey, itemsIndexKey, itemsViewsKey } from '$services/keys';
import { createClient, defineScript } from 'redis';
import { createIndexes } from './create-indexes';

export type Client = typeof client;
// declare redis client
const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	},
	password: process.env.REDIS_PW,
	scripts: {
		unlock: defineScript({
			NUMBER_OF_KEYS: 1,
			transformArguments(key: string, token: string) {
				return [key, token];
			},
			transformReply(reply) {
				return reply;
			},
			SCRIPT: `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        end
      `
		}),
		// defineScript is called with an object argument that specifies the details of the Redis script to be defined
		addOneAndStore: defineScript({
			// NUMBER_OF_KEYS: Specifies the number of keys that the script will operate on.
			// In this case, it's set to 1, indicating that the script expects a single key.
			NUMBER_OF_KEYS: 1,
			// SCRIPT: Contains the Lua script to be executed on the Redis server.
			//The script uses the redis.call function to execute a Redis command.
			// Here, the SET command is used to set the value of a key (specified by KEYS[1],
			// the first key argument passed to the script) to the result of 1 + tonumber(ARGV[1]).
			// ARGV[1] is the first argument passed to the script, which is expected to be a number.
			// The tonumber function converts this argument to a number, adds one to it, and then the SET command stores this new value under the specified key.
			SCRIPT: `
        return redis.call('SET', KEYS[1], 1 + tonumber(ARGV[1]))
      `,
			// transformArguments: A function that prepares the arguments to be passed to the Lua script.
			// It takes two parameters: key (the Redis key to operate on) and value (the value to be incremented).
			// The function returns an array where the first element is the key and the second element is the value converted to a string
			// (since Redis commands and Lua scripts expect arguments as strings).
			transformArguments(key: string, value: number) {
				return [key, value.toString()];
			},
			// transformReply: A function that processes the reply from the Redis script execution.
			// In this case, it simply returns the reply without any transformation.
			transformReply(reply) {
				return reply;
			}
		}),
		incrementView: defineScript({
			NUMBER_OF_KEYS: 3,
			SCRIPT: `
        local itemsViews = KEYS[1]
        local itemCache = KEYS[2]
        local itemsByViews = KEYS[3]
        local itemId = ARGV[1]
        local userId = ARGV[2]

        local inserted = redis.call('PFADD', itemsViews, userId)

        if inserted == 1 then
          redis.call('HINCRBY', itemCache, 'views', 1)
          redis.call('ZINCRBY', itemsByViews, 1, itemId)
        end
      `,
			transformArguments(itemId: string, userId: string) {
				return [
					itemsViewsKey(itemId), // local items:views = KEYS[1]
					itemCacheKey(itemId), // local itemCache = KEYS[2]
					itemsByViewsKey(), // local items:byviews = KEYS[3]
					itemId, // local itemId = ARGV[1]
					userId // local userId = ARGV[2]
				];
				// EVALSHA ID 3 items:views#itemId itemCache#itemId items:byviews itemId userId
			},
			transformReply() {}
		})
	}
});

// error handling
client.on('error', (err) => console.error(err));
// connect to redis
client.connect();

// create indexes
client.on('connect', async () => {
	try {
		await createIndexes(client);
	} catch (err) {
		console.error('Error creating indexes:', err);
	}
});

export { client };
