import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageDialogProps {
  image: string;
  alt: string;
  trigger: React.ReactNode;
}

export function ImageDialog({ image, alt, trigger }: ImageDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl lg:max-w-4xl">
        <DialogTitle>
          <VisuallyHidden>{alt}</VisuallyHidden>
        </DialogTitle>
        <div className="aspect-square w-full overflow-hidden rounded-lg">
          <img
            src={image}
            alt={alt}
            className="w-full h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}