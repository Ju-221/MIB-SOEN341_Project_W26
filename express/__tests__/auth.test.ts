import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /', () => {
  it('returns the API health message', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/MealMajor API is running/i);
  });
});

describe('POST /api/auth/signup', () => {
  it('creates a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'new@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'new@example.com' });
    expect(res.body.user).toHaveProperty('id');
  });

  it('rejects signup with a duplicate email', async () => {
    const payload = { email: 'dup@example.com', password: 'Password123!' };
    await request(app).post('/api/auth/signup').send(payload);

    const res = await request(app).post('/api/auth/signup').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });
});

describe('POST /api/auth/signin', () => {
  it('returns a token for valid credentials', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'signin@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'signin@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: 'signin@example.com' });
  });

  it('returns 404 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'nobody@example.com', password: 'Password123!' });

    expect(res.status).toBe(404);
  });

  it('returns 400 for a wrong password', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'wrongpw@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'wrongpw@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });
});
