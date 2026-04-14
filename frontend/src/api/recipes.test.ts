/*# The following file was generated with the assistance of Claude.
#Prompt:  Create a test suite for the recipes API functions using Vitest. Cover successful fetch/create/update/delete, error handling for non-ok responses, and edge cases like missing response body or invalid input.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe, IMAGES_URL } from './recipes';

// `fetch` is globally mocked in src/test/setup.ts

const BASE_RECIPE = {
  id: 1,
  title: 'Pasta',
  description: 'Yummy pasta',
  ingredients: [{ name: 'pasta', amount: '200', unit: 'g', cost: 1 }],
  steps: [{ text: 'Boil water' }],
  categories: ['dinner'],
  prepTime: 10,
  cookTime: 20,
  estimatedCost: 5,
  heroImage: '',
  createdBy: 1,
  createdAt: '2026-01-01',
};

// ── IMAGES_URL ────────────────────────────────────────────────────────────────

describe('IMAGES_URL', () => {
  it('points to the uploads endpoint', () => {
    expect(IMAGES_URL).toBe('http://localhost:3000/uploads');
  });
});

// ── fetchRecipes ──────────────────────────────────────────────────────────────

describe('fetchRecipes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns parsed recipes on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: {},
      json: async () => [BASE_RECIPE],
    } as Response);

    const result = await fetchRecipes();
    expect(result[0].title).toBe('Pasta');
  });

  it('throws the server error message when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      body: {},
      json: async () => ({ message: 'Internal Server Error' }),
    } as Response);

    await expect(fetchRecipes()).rejects.toThrow('Internal Server Error');
  });

  it('throws when the response has no body', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      body: null,
      json: async () => [],
    } as unknown as Response);

    await expect(fetchRecipes()).rejects.toThrow('No response body for fetch recipes');
  });
});

// ── createRecipe ──────────────────────────────────────────────────────────────

describe('createRecipe', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns the created recipe on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...BASE_RECIPE, id: 99 }),
    } as Response);

    const result = await createRecipe(BASE_RECIPE, 'token');
    expect((result as typeof BASE_RECIPE).id).toBe(99);
  });

  it('throws the server message on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    } as Response);

    await expect(createRecipe(BASE_RECIPE, 'bad-token')).rejects.toThrow('Unauthorized');
  });

  it('sends title, description, and other scalar fields in FormData', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => BASE_RECIPE,
    } as Response);

    await createRecipe(BASE_RECIPE, 'token');

    const [, opts] = vi.mocked(fetch).mock.calls[0];
    const body = opts?.body as FormData;
    expect(body.get('title')).toBe('Pasta');
    expect(body.get('prepTime')).toBe('10');
    expect(body.get('estimatedCost')).toBe('5');
  });

  it('attaches a File heroImage directly when heroImageFile is provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => BASE_RECIPE,
    } as Response);

    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    await createRecipe(BASE_RECIPE, 'token', file);

    const [, opts] = vi.mocked(fetch).mock.calls[0];
    const body = opts?.body as FormData;
    expect(body.get('heroImage')).toBe(file);
  });

  it('converts a base64 data URI to a File when heroImageFile is not given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => BASE_RECIPE,
    } as Response);

    // 1×1 transparent PNG encoded as base64
    const b64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    await createRecipe({ ...BASE_RECIPE, heroImage: b64 }, 'token');

    const [, opts] = vi.mocked(fetch).mock.calls[0];
    const body = opts?.body as FormData;
    const img = body.get('heroImage') as File;
    expect(img).toBeInstanceOf(File);
    expect(img.type).toBe('image/png');
  });

  it('omits heroImage from FormData when image is empty and no file is given', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => BASE_RECIPE,
    } as Response);

    await createRecipe({ ...BASE_RECIPE, heroImage: '' }, 'token', null);

    const [, opts] = vi.mocked(fetch).mock.calls[0];
    const body = opts?.body as FormData;
    expect(body.get('heroImage')).toBeNull();
  });
});

// ── updateRecipe ──────────────────────────────────────────────────────────────

describe('updateRecipe', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns the updated recipe on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...BASE_RECIPE, title: 'Updated Pasta' }),
    } as Response);

    const result = await updateRecipe('1', BASE_RECIPE, 'token');
    expect(result.title).toBe('Updated Pasta');
  });

  it('throws the server message on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Forbidden' }),
    } as Response);

    await expect(updateRecipe('1', BASE_RECIPE, 'token')).rejects.toThrow('Forbidden');
  });

  it('sends a PUT request to the correct URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => BASE_RECIPE,
    } as Response);

    await updateRecipe('42', BASE_RECIPE, 'mytoken');

    const [url, opts] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('/42');
    expect((opts as RequestInit).method).toBe('PUT');
  });

  it('includes the Authorization header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => BASE_RECIPE,
    } as Response);

    await updateRecipe('1', BASE_RECIPE, 'secret-token');

    const [, opts] = vi.mocked(fetch).mock.calls[0];
    expect((opts as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer secret-token',
    });
  });
});

// ── deleteRecipe ──────────────────────────────────────────────────────────────

describe('deleteRecipe', () => {
  beforeEach(() => vi.resetAllMocks());

  it('resolves without a value on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Recipe deleted' }),
    } as Response);

    await expect(deleteRecipe('1', 'token')).resolves.toBeUndefined();
  });

  it('throws the server message on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Recipe not found' }),
    } as Response);

    await expect(deleteRecipe('999', 'token')).rejects.toThrow('Recipe not found');
  });

  it('sends a DELETE request to the correct URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await deleteRecipe('7', 'tok');

    const [url, opts] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('/7');
    expect((opts as RequestInit).method).toBe('DELETE');
  });
});
