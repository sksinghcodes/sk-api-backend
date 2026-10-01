import 'dotenv';
import app from './app';
import { connectToDB } from './db';

const PORT = process.env.PORT || 5000;

await connectToDB();

app.listen(PORT, () => {
  console.log('Server is running on port: ' + PORT);
});
