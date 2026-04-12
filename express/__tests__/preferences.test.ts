import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { seedUser, type SeedUser } from './helpers.js';

let user: SeedUser;

beforeEach(async () => {
  user = await seedUser('prefs@example.com');
});

describe('GET /api/preferences', () => {
  it('returns empty objects when no preferences are set', async () => {
    const res = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('allergies');
    expect(res.body).toHaveProperty('dietaryPreferences');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/preferences');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/preferences', () => {
  it('saves and retrieves allergy preferences', async () => {
    const res = await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        allergies: { peanuts: true, milk: false },
        dietaryPreferences: { vegan: false, vegetarian: true },
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);

    const get = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${user.token}`);

    expect(get.body.allergies.peanuts).toBe(true);
    expect(get.body.dietaryPreferences.vegetarian).toBe(true);
  });

  it('updates existing preferences', async () => {
    await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ allergies: { peanuts: true }, dietaryPreferences: { vegan: true } });

    await request(app)
      .put('/api/preferences')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ allergies: { peanuts: false }, dietaryPreferences: { vegan: false } });

    const get = await request(app)
      .get('/api/preferences')
      .set('Authorization', `Bearer ${user.token}`);

    expect(get.body.allergies.peanuts).toBe(false);
    expect(get.body.dietaryPreferences.vegan).toBe(false);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).put('/api/preferences').send({ allergies: {}, dietaryPreferences: {} });
    expect(res.status).toBe(401);
  });
});
