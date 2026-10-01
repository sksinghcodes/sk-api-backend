import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user';
import dataSourceRoutes from './routes/dataSource';
import dataRoutes from './routes/data';
import addDataRoute from './routes/addData';
import taskRoutes from './routes/task';
import taskRecordRoutes from './routes/taskRecord';
import { checkDBConnection } from './db';
import checkClient from './middlewares/checkClient';
import isAuthenticated from './middlewares/isAuthenticated';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(checkDBConnection);

app.use('/api/user/', checkClient, userRoutes);
app.use('/api/data-source/', checkClient, isAuthenticated, dataSourceRoutes);
app.use('/api/data/', checkClient, isAuthenticated, dataRoutes);
app.use('/api/add-data/', cors(), addDataRoute);
app.use('/api/task/', checkClient, isAuthenticated, taskRoutes);
app.use('/api/task-record/', checkClient, isAuthenticated, taskRecordRoutes);

export default app;
