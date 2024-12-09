import { pb } from './client';
import type { BaseModel } from './types';
import type { FishingGroup } from './types';

export function getFileUrl(record: BaseModel, filename: string): string {
  return pb.files.getUrl(record, filename);
}

export function getThumbUrl(record: BaseModel, filename: string, thumb = '100x100'): string {
  return pb.files.getUrl(record, filename, { thumb });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString();
}

export async function isAdmin(groupId: string, userId: string): Promise<boolean> {
  try {
    const group = await pb.collection('fishing_groups').getOne<FishingGroup>(groupId);
    return Array.isArray(group.admins) && group.admins.includes(userId);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function isMember(groupId: string, userId: string): Promise<boolean> {
  try {
    const group = await pb.collection('fishing_groups').getOne<FishingGroup>(groupId);
    return Array.isArray(group.members) && group.members.includes(userId);
  } catch (error) {
    console.error('Error checking member status:', error);
    return false;
  }
}

export async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  
  try {
    const result = await pb.collection('files').create(formData);
    return Array.isArray(result.files) ? result.files.map((file: string) => file) : [];
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}