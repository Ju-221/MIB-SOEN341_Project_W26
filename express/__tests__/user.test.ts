import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { seedUser, type SeedUser } from './helpers.js';

let user: SeedUser;

beforeEach(async () => {
  user = await seedUser('profile@example.com');
});

describe('GET /api/user', () => {
  it('returns the authenticated user profile', async () => {
    const res = await request(app).get('/api/user').set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: 'profile@example.com',
      firstName: '',
      lastName: '',
    });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user', () => {
  it('updates first and last name', async () => {
    const res = await request(app)
      .put('/api/user')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ firstName: 'Alice', lastName: 'Smith' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);

    const profile = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${user.token}`);

    expect(profile.body).toMatchObject({ firstName: 'Alice', lastName: 'Smith' });
  });

  it('trims whitespace from names', async () => {
    await request(app)
      .put('/api/user')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ firstName: '  Bob  ', lastName: '  Jones  ' });

    const profile = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${user.token}`);

    expect(profile.body.firstName).toBe('Bob');
    expect(profile.body.lastName).toBe('Jones');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).put('/api/user').send({ firstName: 'X' });
    expect(res.status).toBe(401);
  });
});
