import type { Recipe } from '../components/Recipe-Manager/CreateRecipe';

const BASE_URL = "http://localhost:3000/api/recipes";

export async function fetchRecipes() {
  const response = await fetch(BASE_URL);

    if (!response.ok) {
    throw new Error("Failed to fetch recipes");
  }

  // TODO convert into objects
  return []
}

export async function createRecipe(recipeData: Recipe) {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipeData),
  });

  if (!response.ok) {
    throw new Error("Failed to create recipe");
  }

  // TODO convert to backend expected format
  return null
}

export async function updateRecipe(id: string, recipeData: Recipe, jwt_token: string) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt_token}}`
    },
    body: JSON.stringify(recipeData),
  });

  if (!response.ok) {
    throw new Error("Failed to update recipe");
  }

  // TODO convert to backend expected format
  return null
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
    throw new Error(errorData.message || "Unknown error");
  }
}