import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { userCacheKey, usernameUniqueKey, userNamesKey } from '$services/keys';

// this is example of using redis sorted set
// actually, we can use hash to store and get userbyId
export const getUserByUsername = async (username: string) => {
	// get the user id as number from the sorted set
	const decimalId = await client.zScore(userNamesKey(), username);

	if (!decimalId) {
		return null;
	}

	// convert the number to a hexadecimal string
	const userId = decimalId.toString(16);

	// get the user object from redis
	const user = await getUserById(userId);

	return user;
};

export const getUserById = async (id: string) => {
	const key = userCacheKey(id);
	const user = await client.hGetAll(key);

	if (!user) {
		return null;
	}

	const deserializedUser = deserializeUser(id, user);

	return deserializedUser;
};

export const createUser = async (attrs: CreateUserAttrs) => {
	// generate a unique id for the user
	const id = genId();
	// create a key for the user in redis
	const key = userCacheKey(id);
	// serialize the user object
	const serializedUser = serializeUser(attrs);

	// Check if the username already exists in redis set
	const usernameIniqueKey = usernameUniqueKey();
	// sIsMember returns 1 if the member exists in the set, 0 if it does not, and -1 if the key does not exist.
	const exists = await client.sIsMember(usernameIniqueKey, attrs.username);

	if (exists) {
		throw new Error('Username already exists');
	}

	// Add user to redis database
	await client.hSet(key, serializedUser);
	// Add username to set in order to check for uniqueness
	await client.sAdd(usernameIniqueKey, attrs.username);

	// Add username to sorted set
	await client.zAdd(userNamesKey(), {
		value: attrs.username,
		// In redis sorted sets, the score is used to sort the elements
		// score is an integer value
		// genId() returns a string in hexadecimal format
		// parseInt converts the hexadecimal string to an integer number
		score: parseInt(id, 16)
	});

	return id;
};

const serializeUser = (user: CreateUserAttrs) => {
	return {
		username: user.username,
		password: user.password
	};
};

const deserializeUser = (id: string, user: { [key: string]: string }) => {
	return {
		id,
		username: user.username,
		password: user.password
	};
};
