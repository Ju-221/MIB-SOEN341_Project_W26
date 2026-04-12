import type { Recipe } from '../components/Recipe-Manager/CreateRecipe';

const BASE_URL = 'http://localhost:3000/api/recipes';
export const IMAGES_URL = 'http://localhost:3000/uploads';

export async function fetchRecipes() {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  if (!response.body) {
    throw new Error('No response body for fetch recipes');
  }

  const data: Recipe[] = await response.json(); // Parse

  return data;
}

export async function createRecipe(
  recipeObj: Recipe,
  jwt_token: string,
  heroImageFile?: File | null
): Promise<Recipe | Recipe[]> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt_token}`,
    },
    body: await serializeRecipe(recipeObj, heroImageFile),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data: Recipe = await response.json();
  return data;
}

export async function updateRecipe(
  id: string,
  recipeObj: Recipe,
  jwt_token: string,
  heroImageFile?: File | null
) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${jwt_token}`,
    },
    body: await serializeRecipe(recipeObj, heroImageFile),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data: Recipe = await response.json();
  return data;
}

export async function deleteRecipe(id: string, jwt_token: string) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${jwt_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

async function serializeRecipe(recipe: Recipe, heroImageFile?: File | null): Promise<FormData> {
  const formData = new FormData();

  // Regular attributes
  formData.append('title', recipe.title);
  formData.append('description', recipe.description);

  formData.append('prepTime', recipe.prepTime.toString());
  formData.append('cookTime', recipe.cookTime.toString());
  formData.append('estimatedCost', recipe.estimatedCost.toString());

  if (recipe.difficulty) {
    formData.append('difficulty', recipe.difficulty.toString());
  }

  formData.append(
    'ingredients',
    JSON.stringify(recipe.ingredients, ['name', 'amount', 'unit', 'cost'])
  );
  formData.append('steps', JSON.stringify(recipe.steps, ['text'])); // Assuming no image for steps
  formData.append('categories', JSON.stringify(recipe.categories));

  // Image - only send if user selected an image
  if (heroImageFile) {
    formData.append('heroImage', heroImageFile);
  } else if (recipe.heroImage?.startsWith('data:')) {
    console.log('Serializing recipe with heroImage data URI, length:', recipe.heroImage.length);
    formData.append('heroImage', base64ToImageFile(recipe.heroImage));
  }
  // If no image selected, don't send anything - backend will handle default display

  return formData;
}

function base64ToImageFile(b64Str: string) {
  console.log('Converting base64 to image file, starts with:', b64Str.substring(0, 50));
  const arr = b64Str.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || ''; // Prefix to file data
  const bstr = atob(arr[1]); // Base64 file into binary text

  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  const fileExtension = mime.split('/')[1];
  return new File([u8arr], `name_doesn't_matter.${fileExtension}`, { type: mime });
}

