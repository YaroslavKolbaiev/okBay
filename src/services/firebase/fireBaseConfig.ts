import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

const config = {
	apiKey,
	authDomain,
	projectId,
	storageBucket,
	messagingSenderId,
	appId
} as any;

export const firebaseApp = initializeApp(config);
export const storage = getStorage(firebaseApp);
