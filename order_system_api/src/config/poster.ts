import dotenv from 'dotenv';

dotenv.config();

export const posterConfig = {
  applicationId: process.env.POSTER_APPLICATION_ID || '',
  applicationSecret: process.env.POSTER_APPLICATION_SECRET || '',
  accountName: process.env.POSTER_ACCOUNT_NAME || '',
  accessToken: process.env.POSTER_ACCESS_TOKEN || ''
};

// Функция для проверки подписи от Poster
export function validatePosterSignature(req: any): boolean {
  const signature = req.headers['x-poster-signature'];
  if (!signature) return false;

  // В реальном приложении здесь должна быть проверка подписи
  // с использованием applicationSecret
  return true;
} 