import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { seedUser, type SeedUser } from './helpers.js';

let user: SeedUser;

beforeEach(async () => {
  user = await seedUser('calendar@example.com');
});

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('Auth middleware', () => {
  it('returns 401 with message "No token provided" when Authorization header is absent', async () => {
    const res = await request(app).get('/api/calendar').query({ months: '["JANUARY:2026"]' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  it('returns 401 with message "Invalid token" for a malformed token', async () => {
    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', 'Bearer this.is.not.a.real.jwt')
      .query({ months: '["JANUARY:2026"]' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid token/i);
  });
});

// ── GET /api/calendar ─────────────────────────────────────────────────────────

describe('GET /api/calendar', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/calendar');
    expect(res.status).toBe(401);
  });

  it('returns 400 when months query param is absent', async () => {
    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/months query param is required/i);
  });

  it('returns 400 when months is not valid JSON', async () => {
    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ months: 'not-json' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/json array/i);
  });

  it('returns 400 when months is valid JSON but not an array', async () => {
    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ months: '"january:2026"' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/json array/i);
  });

  it('returns empty arrays when user has no saved calendar', async () => {
    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ months: '["JANUARY:2026"]' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ months: [], days: [] });
  });

  it('returns only requested months that exist in storage', async () => {
    const months = ['JANUARY:2026', 'FEBRUARY:2026'];
    const days = [{ date: 1, meals: {} }, { date: 2, meals: {} }];

    await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ months, days });

    // Request only JANUARY:2026
    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ months: JSON.stringify(['JANUARY:2026']) });

    expect(res.status).toBe(200);
    expect(res.body.months).toEqual(['JANUARY:2026']);
    expect(res.body.days).toHaveLength(1);
  });

  it('month matching is case-insensitive (lowercased query matches uppercased storage)', async () => {
    await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ months: ['MARCH:2026'], days: [{ date: 3 }] });

    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ months: JSON.stringify(['march:2026']) });

    expect(res.status).toBe(200);
    expect(res.body.months).toEqual(['MARCH:2026']);
  });
});

// ── POST /api/calendar ────────────────────────────────────────────────────────

describe('POST /api/calendar', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/calendar')
      .send({ months: ['JANUARY:2026'], days: [{}] });
    expect(res.status).toBe(401);
  });

  it('returns 400 when months is missing from the body', async () => {
    const res = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ days: [{}] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/months and days/i);
  });

  it('returns 400 when days is missing from the body', async () => {
    const res = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ months: ['JANUARY:2026'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/months and days/i);
  });

  it('saves and retrieves calendar data', async () => {
    const months = ['APRIL:2026'];
    const days = [{ date: 1, meals: { breakfast: null } }];

    const save = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ months, days });

    expect(save.status).toBe(200);
    expect(save.body.message).toMatch(/saved/i);

    const get = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ months: JSON.stringify(months) });

    expect(get.status).toBe(200);
    expect(get.body.months).toEqual(['APRIL:2026']);
    expect(get.body.days).toHaveLength(1);
  });

  it('second POST overwrites the previous calendar row', async () => {
    await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ months: ['MAY:2026'], days: [{ v: 1 }] });

    await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ months: ['JUNE:2026'], days: [{ v: 2 }] });

    // MAY should no longer be found
    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .query({ months: JSON.stringify(['MAY:2026']) });

    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(0);
  });

  it('calendar data is isolated per user', async () => {
    const other = await seedUser('other@example.com');

    await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ months: ['JULY:2026'], days: [{ v: 1 }] });

    const res = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${other.token}`)
      .query({ months: JSON.stringify(['JULY:2026']) });

    expect(res.status).toBe(200);
    expect(res.body.months).toHaveLength(0);
  });
});
