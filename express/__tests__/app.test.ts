import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /', () => {
  it('returns the API health check message with status 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'MealMajor API is running...' });
  });
});
