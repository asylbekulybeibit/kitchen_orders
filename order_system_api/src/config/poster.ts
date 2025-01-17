import dotenv from 'dotenv';

dotenv.config();

export const posterConfig = {
  applicationId: process.env.POSTER_APPLICATION_ID,
  applicationSecret: process.env.POSTER_APPLICATION_SECRET,
  accessToken: process.env.POSTER_ACCESS_TOKEN,
  account: process.env.POSTER_ACCOUNT,
  apiUrl: 'https://joinposter.com/api'
}; 