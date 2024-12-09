import PocketBase from 'pocketbase';
import type { RecordModel } from './types'; // Import RecordModel if it's defined in types

// Create PocketBase instance
export const pb = new PocketBase('https://pocketbase.sustainablegrowthlabs.com');

// Disable auto-cancellation globally for all requests
pb.autoCancellation(false);

// Add auth change handler
pb.authStore.onChange(() => {
  console.log('Auth state changed:', pb.authStore.isValid);
});

// Re-export RecordModel if it exists in types
export type { RecordModel };
