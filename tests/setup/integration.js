import dotenv from 'dotenv';
import { connectToDB } from '../../db';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.test' });

await connectToDB();

afterAll(async () => {
  await mongoose.connection.close();
});
