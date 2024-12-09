import { useState } from 'react';
import { filesService } from '../services';
import { useToast } from "@/hooks/use-toast";

interface UseFilesOptions {
  maxSize?: number;
  acceptedTypes?: string[];
  maxFiles?: number;
}

export function useFiles(options: UseFilesOptions = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 10,
  } = options;

  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload only supported image formats.',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Maximum file size is ${maxSize / 1024 / 1024}MB.`,
      });
      return false;
    }

    return true;
  };

  const addFiles = (newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(validateFile);

    if (files.length + validFiles.length > maxFiles) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed.`,
      });
      return;
    }

    setFiles([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];

    setIsUploading(true);
    try {
      const urls = await filesService.uploadFiles(files);
      setFiles([]);
      return urls;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload files. Please try again.',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadFiles,
  };
}