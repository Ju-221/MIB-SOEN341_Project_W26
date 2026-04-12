import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { seedUser, RECIPE_PAYLOAD, type SeedUser } from './helpers.js';

let user: SeedUser;

beforeEach(async () => {
  user = await seedUser('chef@example.com');
});

async function createRecipe(token: string, overrides: Record<string, unknown> = {}) {
  return request(app)
    .post('/api/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send({ ...RECIPE_PAYLOAD, ...overrides });
}

describe('GET /api/recipes', () => {
  it('returns an empty array when there are no recipes', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all recipes', async () => {
    await createRecipe(user.token);
    await createRecipe(user.token, { title: 'Second Recipe' });

    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters recipes by title query param', async () => {
    await createRecipe(user.token, { title: 'Spaghetti Bolognese' });
    await createRecipe(user.token, { title: 'Chicken Salad' });

    const res = await request(app).get('/api/recipes?title=Spaghetti');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Spaghetti Bolognese');
  });
});

describe('GET /api/recipes/:id', () => {
  it('returns a recipe by id', async () => {
    const created = await createRecipe(user.token);
    const id = created.body.id;

    const res = await request(app).get(`/api/recipes/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.title).toBe(RECIPE_PAYLOAD.title);
  });

  it('returns 404 for a non-existent recipe', async () => {
    const res = await request(app).get('/api/recipes/99999');
    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-numeric id', async () => {
    const res = await request(app).get('/api/recipes/abc');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/recipes', () => {
  it('creates a recipe and returns it', async () => {
    const res = await createRecipe(user.token);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: RECIPE_PAYLOAD.title,
      description: RECIPE_PAYLOAD.description,
      createdBy: user.id,
    });
    expect(Array.isArray(res.body.ingredients)).toBe(true);
    expect(Array.isArray(res.body.steps)).toBe(true);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/recipes').send(RECIPE_PAYLOAD);
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/recipes/:id', () => {
  it('updates a recipe owned by the requester', async () => {
    const created = await createRecipe(user.token);
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });

  it('returns 403 when another user tries to update', async () => {
    const created = await createRecipe(user.token);
    const id = created.body.id;

    const other = await seedUser('other@example.com');
    const res = await request(app)
      .put(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Stolen Update' });

    expect(res.status).toBe(403);
  });

  it('returns 404 when updating a non-existent recipe', async () => {
    const res = await request(app)
      .put('/api/recipes/99999')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Ghost Update' });
    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const created = await createRecipe(user.token);
    const res = await request(app).put(`/api/recipes/${created.body.id}`).send({ title: 'X' });
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/recipes/:id', () => {
  it('deletes a recipe owned by the requester', async () => {
    const created = await createRecipe(user.token);
    const id = created.body.id;

    const res = await request(app)
      .delete(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const check = await request(app).get(`/api/recipes/${id}`);
    expect(check.status).toBe(404);
  });

  it('returns 403 when another user tries to delete', async () => {
    const created = await createRecipe(user.token);
    const other = await seedUser('intruder@example.com');

    const res = await request(app)
      .delete(`/api/recipes/${created.body.id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent recipe', async () => {
    const res = await request(app)
      .delete('/api/recipes/99999')
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const created = await createRecipe(user.token);
    const res = await request(app).delete(`/api/recipes/${created.body.id}`);
    expect(res.status).toBe(401);
  });
});
