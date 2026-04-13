/*# The following file was generated with the assistance of Claude.
#Prompt:  Create a test suite for the recipes API functions using Vitest. Cover successful fetch/create/update/delete, error handling for non-ok responses, and edge cases like missing response body or invalid input.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
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

// ── Allergy normalization ──────────────────────────────────────────────────────

describe('Allergy normalization on POST /api/recipes', () => {
  it('normalizes known aliases to canonical labels', async () => {
    const res = await createRecipe(user.token, {
      allergies: JSON.stringify(['milk', 'treenuts', 'egg', 'crustaceans', 'lactose', 'sulphites']),
    });
    expect(res.status).toBe(201);
    expect(res.body.allergies).toContain('Dairy');
    expect(res.body.allergies).toContain('Nuts');
    expect(res.body.allergies).toContain('Eggs');
    expect(res.body.allergies).toContain('Shellfish');
    expect(res.body.allergies).toContain('Lactose Intolerance');
    expect(res.body.allergies).toContain('Sulfites');
  });

  it('filters out unknown allergy labels', async () => {
    const res = await createRecipe(user.token, {
      allergies: JSON.stringify(['InvalidAllergy', 'RandomFood']),
    });
    expect(res.status).toBe(201);
    expect(res.body.allergies).toEqual([]);
  });

  it('deduplicates aliases that resolve to the same canonical label', async () => {
    const res = await createRecipe(user.token, {
      allergies: JSON.stringify(['Peanuts', 'peanuts', 'peanut']),
    });
    expect(res.status).toBe(201);
    const peanutCount = (res.body.allergies as string[]).filter((a) => a === 'Peanuts').length;
    expect(peanutCount).toBe(1);
  });

  it('accepts an empty allergies array', async () => {
    const res = await createRecipe(user.token, {
      allergies: JSON.stringify([]),
    });
    expect(res.status).toBe(201);
    expect(res.body.allergies).toEqual([]);
  });

  it('returns parsed allergies as an array on GET after create', async () => {
    await createRecipe(user.token, { allergies: JSON.stringify(['Dairy', 'Eggs']) });
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body[0].allergies).toContain('Dairy');
    expect(res.body[0].allergies).toContain('Eggs');
  });
});

describe('Allergy normalization on PUT /api/recipes/:id', () => {
  it('normalizes allergies when the update includes the allergies field', async () => {
    const created = await createRecipe(user.token, { allergies: JSON.stringify([]) });
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ allergies: JSON.stringify(['egg', 'soy', 'lactose']) });

    expect(res.status).toBe(200);
    expect(res.body.allergies).toContain('Eggs');
    expect(res.body.allergies).toContain('Soy');
    expect(res.body.allergies).toContain('Lactose Intolerance');
  });

  it('preserves existing allergies when the update omits the allergies field', async () => {
    const created = await createRecipe(user.token, {
      allergies: JSON.stringify(['Peanuts', 'Dairy']),
    });
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'New Title Only' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title Only');
    expect(res.body.allergies).toContain('Peanuts');
    expect(res.body.allergies).toContain('Dairy');
  });

  it('clears allergies when the update sends an empty array', async () => {
    const created = await createRecipe(user.token, {
      allergies: JSON.stringify(['Peanuts']),
    });
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/recipes/${id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ allergies: JSON.stringify([]) });

    expect(res.status).toBe(200);
    expect(res.body.allergies).toEqual([]);
  });
});
