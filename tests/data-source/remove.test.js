import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import User from '../../models/user';
import DataSource from '../../models/dataSource';
import Data from '../../models/data';

describe('DELETE /api/data-source/:id', () => {
  it('should delete the data source and its associated data', async () => {
    const user = await User.create({
      username: 'removedatasourceuser',
      email: 'removedatasource@example.com',
      password: 'Password123!',
      role: 1
    });

    const dataSource = await DataSource.create({
      source: 'https://example.com/form',
      headings: ['name', 'message'],
      key: 'remove-data-source-key',
      userId: user._id.toString()
    });

    const associatedData = await Data.create({
      userId: user._id.toString(),
      dataSourceId: dataSource._id.toString(),
      name: 'John',
      message: 'Hello'
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY);

    try {
      const response = await request(app)
        .delete(`/api/data-source/${dataSource._id}`)
        .set('Cookie', [`jwt-token=${token}`]);

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Datasource deleted successfully',
        dataSources: []
      });

      const deletedDataSource = await DataSource.findById(dataSource._id);
      expect(deletedDataSource).toBeNull();

      const deletedData = await Data.findById(associatedData._id);
      expect(deletedData).toBeNull();
    } finally {
      await Data.deleteMany({
        userId: user._id.toString()
      });
      await DataSource.deleteMany({
        userId: user._id.toString()
      });
      await User.deleteOne({ _id: user._id });
    }
  }, 15000);
});
