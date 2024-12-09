import type { RecordModel } from 'pocketbase';

export interface BaseModel extends RecordModel {
  created: string;
  updated: string;
}

export interface User extends BaseModel {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Location {
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Catch extends BaseModel {
  species: string;
  weight: number;
  length: number;
  location: string | Location;
  date: string;
  photos: string[];
  featurePhotoIndex: number;
  weather?: {
    temperature: number;
    conditions: string;
  };
  user: string;
  sharedWithGroups?: string[];
  notes?: string;
  expand?: {
    user: User;
    sharedWithGroups?: FishingGroup[]; // Made optional here
  };
}

export interface FishingGroup extends BaseModel {
  name: string;
  description?: string;
  avatar?: string;
  members: string[];
  admins: string[];
  expand?: {
    members: User[];
    admins: User[];
  };
}

export interface Event extends BaseModel {
  title: string;
  description?: string;
  date: string;
  location: string;
  group: string;
  participants?: string[];
  creator: string;
  expand?: {
    participants: User[];
    creator: User;
    group: FishingGroup;
  };
}

export interface Challenge extends BaseModel {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'biggest_catch' | 'species_variety' | 'total_weight';
  target?: {
    species?: string;
    metric?: 'weight' | 'length';
    count?: number;
  };
  group: string;
  participants?: string[];
  completed: boolean;
  winner?: string;
  expand?: {
    group: FishingGroup;
    participants: User[];
    winner: User;
  };
}

export interface Comment extends BaseModel {
  content: string;
  user: string;
  catch: string;
  expand?: {
    user: User;
    catch: Catch;
  };
}

// Type alias for backward compatibility
export type Group = FishingGroup;

// Additional exports

/**
 * Extended Catch interface that includes the expanded user information.
 */
export interface CatchWithUser extends Catch {
  expand: {
    user: User;
    sharedWithGroups?: FishingGroup[]; // Now optional to match the base interface
  };
}

/**
 * Type guard to check if a record is of type User.
 * @param record - The record to check.
 * @returns Boolean indicating whether the record is a User.
 */
export function isUser(record: any): record is User {
  return (
    typeof record === 'object' &&
    record !== null &&
    'name' in record &&
    'email' in record
  );
}

// Export all types
export type { RecordModel };
