import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export const imageUploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req: unknown, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      callback(new BadRequestException('Faqat jpg, png, webp yoki gif rasm yuklash mumkin'), false);
      return;
    }
    callback(null, true);
  },
};
