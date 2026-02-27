import type { Recipe, Step, Ingredient } from '../components/Recipe-Manager/CreateRecipe';

const BASE_URL = "http://localhost:3000/api/recipes";
const IMAGES_URL = "http://localhost:3000/uploads"

export async function fetchRecipes() {
  const response = await fetch(BASE_URL);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  if (!response.body) {
    throw new Error("No response body for fetch recipes");
  }

  const data: Recipe[] = await response.json();   // Parse
  const filesConverted = data.map((recipe) => {   // Convert image files to bas64 for frontend
    if (recipe.heroImage) {
      recipe.heroImage = filenameToBase64(recipe.heroImage).toString();
    }
    return recipe;
  });

  return filesConverted;
}

export async function createRecipe(recipeObj: Recipe, jwt_token: string) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${jwt_token}`
    },
    body: serializeRecipe(recipeObj),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data: Recipe = await response.json();
  if (data.heroImage) {
    data.heroImage = filenameToBase64(data.heroImage).toString();
  }
  return data
}

export async function updateRecipe(id: string, recipeObj: Recipe, jwt_token: string) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${jwt_token}`
    },
    body: serializeRecipe(recipeObj),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data: Recipe = await response.json()
  if (data.heroImage) {
    data.heroImage = filenameToBase64(data.heroImage).toString();
  }

  return data
}

export async function deleteRecipe(id: string, jwt_token: string) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${jwt_token}`
    },
  })

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

function serializeRecipe(recipe: Recipe) {
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
  
  formData.append('ingredients', JSON.stringify(recipe.ingredients, ['name', 'amount', 'unit'])); // Assuming no ingredient cost
  formData.append('steps', JSON.stringify(recipe.steps, ['text'])); // Assuming no image for steps
  formData.append('categories', JSON.stringify(recipe.categories));

  // Image
  if (recipe.heroImage) {
    // const blob = new Blob([recipe.heroImage], {type: 'text/plain'})
    formData.append('heroImage', base64ToImageFile(recipe.heroImage))
  }

  return formData;
}

function base64ToImageFile(b64Str: string) {
  const arr = b64Str.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "";  // Prefix to file data
  const bstr = atob(arr[1]);  // Base64 file into binary text

  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  const fileExtension = mime.split("/")[1];
  return new File([u8arr], `name_doesn't_matter.${fileExtension}`, { type: mime });
}

async function filenameToBase64(imageName: string) {
  const imageUrl = `${IMAGES_URL}/${imageName}`;
  const response = await fetch(imageUrl);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error("Error loading image:", errorData.message);
  }

  const blob = await response.blob();

  const imagePromise =  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob); // Converts to base64
  });

  return imagePromise;
}