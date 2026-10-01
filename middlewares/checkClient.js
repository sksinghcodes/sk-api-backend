import cors from 'cors';

export default cors({
  credentials: true,
  origin: process.env.ALLOWED_CLIENT.split(' ')
});
