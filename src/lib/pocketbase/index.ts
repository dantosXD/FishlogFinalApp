import PocketBase from 'pocketbase';

export const pb = new PocketBase('https://pocketbase.sustainablegrowthlabs.com');

// Add response type for auth endpoints
pb.autoCancellation(false);