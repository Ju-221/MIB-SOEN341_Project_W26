import type { Recipe } from '../components/Recipe-Manager/CreateRecipe';

const BASE_URL = 'http://localhost:3000/api/recipes';
const IMAGES_URL = 'http://localhost:3000/uploads';

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
  // Convert image files to base64 for frontend
  const filesConverted = await Promise.all(
    data.map(async (recipe) => {
      if (recipe.heroImage) {
        recipe.heroImage = (await filenameToBase64(recipe.heroImage)) as string;
      }
      return recipe;
    })
  );

  return filesConverted;
}

export async function createRecipe(
  recipeObj: Recipe,
  jwt_token: string
): Promise<Recipe | Recipe[]> {
  if (recipeObj.title.toLowerCase() == 'default') {
    console.log('Making defaults');
    return createDefaultRecipes(jwt_token);
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt_token}`,
    },
    body: serializeRecipe(recipeObj),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data: Recipe = await response.json();
  if (data.heroImage) {
    data.heroImage = (await filenameToBase64(data.heroImage)) as string;
  }
  return data;
}

export async function updateRecipe(id: string, recipeObj: Recipe, jwt_token: string) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${jwt_token}`,
    },
    body: serializeRecipe(recipeObj),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data: Recipe = await response.json();
  if (data.heroImage) {
    data.heroImage = (await filenameToBase64(data.heroImage)) as string;
  }

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

  formData.append(
    'ingredients',
    JSON.stringify(recipe.ingredients, ['name', 'amount', 'unit', 'cost'])
  );
  formData.append('steps', JSON.stringify(recipe.steps, ['text'])); // Assuming no image for steps
  formData.append('categories', JSON.stringify(recipe.categories));

  // Image
  if (recipe.heroImage) {
    console.log('Serializing recipe with heroImage, length:', recipe.heroImage.length);
    formData.append('heroImage', base64ToImageFile(recipe.heroImage));
  } else {
    console.log('No heroImage found on recipe');
  }

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

async function filenameToBase64(imageName: string) {
  const imageUrl = `${IMAGES_URL}/${imageName}`;
  const response = await fetch(imageUrl);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error('Error loading image:', errorData.message);
  }

  const blob = await response.blob();

  const imagePromise = new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(blob); // Converts to base64
  });

  return imagePromise;
}

async function createDefaultRecipes(jwt_token: string): Promise<Recipe[]> {
  const returnedRecipes = await Promise.all(
    defaultRecipes.map((recipe) => createRecipe(recipe, jwt_token) as Promise<Recipe>)
  );

  return returnedRecipes;
}

const defaultRecipes: Recipe[] = [
  {
    id: '1000000',
    title: 'Veggie Pasta Primavera',
    name: 'Veggie Pasta Primavera',
    description: 'A quick vegetarian pasta with tomatoes, basil, and sauteed vegetables.',
    ingredients: [
      { name: 'Pasta', amount: '250', unit: 'g', cost: 2.5 },
      { name: 'Cherry Tomatoes', amount: '200', unit: 'g', cost: 2.0 },
      { name: 'Zucchini', amount: '1', unit: 'unit', cost: 1.5 },
      { name: 'Basil', amount: '10', unit: 'g', cost: 1.0 },
      { name: 'Olive Oil', amount: '2', unit: 'tbsp', cost: 0.75 },
      { name: 'Parmesan', amount: '40', unit: 'g', cost: 1.75 },
    ],
    steps: [
      { text: 'Boil pasta until al dente.' },
      { text: 'Saute zucchini and tomatoes in olive oil.' },
      { text: 'Toss pasta with vegetables and basil, then top with parmesan.' },
    ],
    instructions: ['Boil pasta', 'Saute vegetables', 'Toss and serve'],
    categories: ['easy', 'vegetarian', 'quick', 'healthy'],
    difficulty: 'Easy',
    servings: 2,
    prepTime: 10,
    cookTime: 15,
    estimatedCost: 9.5,
    heroImage: '',
    image: '',
    // heroImage: 'https://via.placeholder.com/300x200?text=Veggie+Pasta',
    // image: 'https://via.placeholder.com/300x200?text=Veggie+Pasta',
  },
  {
    id: '1000001',
    title: 'Keto Salmon Bowl',
    name: 'Keto Salmon Bowl',
    description: 'High-protein salmon bowl with avocado, cucumber, and sesame-soy dressing.',
    ingredients: [
      { name: 'Salmon Fillet', amount: '2', unit: 'unit', cost: 9.0 },
      { name: 'Avocado', amount: '1', unit: 'unit', cost: 2.5 },
      { name: 'Cucumber', amount: '1', unit: 'unit', cost: 1.25 },
      { name: 'Soy Sauce', amount: '2', unit: 'tbsp', cost: 0.5 },
      { name: 'Sesame Seeds', amount: '1', unit: 'tbsp', cost: 0.75 },
      { name: 'Cauliflower Rice', amount: '300', unit: 'g', cost: 3.0 },
    ],
    steps: [
      { text: 'Season and pan-sear salmon until cooked through.' },
      { text: 'Warm cauliflower rice and prepare sliced avocado and cucumber.' },
      { text: 'Assemble bowl and drizzle with soy sauce, then top with sesame seeds.' },
    ],
    instructions: ['Cook salmon', 'Prep bowl ingredients', 'Assemble and serve'],
    categories: ['medium', 'keto', 'high-protein', 'healthy', 'fish', 'soy', 'sesame'],
    difficulty: 'Medium',
    servings: 2,
    prepTime: 15,
    cookTime: 20,
    estimatedCost: 17.0,
    heroImage: '',
    image: '',
    // heroImage: 'https://via.placeholder.com/300x200?text=Keto+Salmon+Bowl',
    // image: 'https://via.placeholder.com/300x200?text=Keto+Salmon+Bowl',
  },
  {
    id: '1000002',
    title: 'Vegan Chickpea Curry',
    name: 'Vegan Chickpea Curry',
    description: 'A budget-friendly vegan curry with chickpeas, coconut milk, and spinach.',
    ingredients: [
      { name: 'Chickpeas', amount: '1', unit: 'can', cost: 1.5 },
      { name: 'Coconut Milk', amount: '1', unit: 'can', cost: 2.0 },
      { name: 'Spinach', amount: '120', unit: 'g', cost: 2.0 },
      { name: 'Onion', amount: '1', unit: 'unit', cost: 0.75 },
      { name: 'Garlic', amount: '3', unit: 'unit', cost: 0.5 },
      { name: 'Curry Powder', amount: '2', unit: 'tbsp', cost: 0.6 },
      { name: 'Rice', amount: '1', unit: 'cup', cost: 1.2 },
    ],
    steps: [
      { text: 'Saute onion and garlic, then stir in curry powder.' },
      { text: 'Add chickpeas and coconut milk, then simmer.' },
      { text: 'Fold in spinach and serve over rice.' },
    ],
    instructions: ['Saute aromatics', 'Simmer curry', 'Add spinach and serve'],
    categories: ['medium', 'vegan', 'healthy', 'budget-friendly', 'dairy-free', 'gluten-free'],
    difficulty: 'Medium',
    servings: 4,
    prepTime: 12,
    cookTime: 25,
    estimatedCost: 8.55,
    heroImage: '',
    image: '',
    // heroImage: 'https://via.placeholder.com/300x200?text=Vegan+Chickpea+Curry',
    // image: 'https://via.placeholder.com/300x200?text=Vegan+Chickpea+Curry',
  },
  {
    id: '1000003',
    title: 'Peanut Tofu Stir-Fry Noodles',
    name: 'Peanut Tofu Stir-Fry Noodles',
    description: 'A hearty stir-fry with tofu, noodles, peanuts, and a savory soy sauce.',
    ingredients: [
      { name: 'Rice Noodles', amount: '200', unit: 'g', cost: 2.75 },
      { name: 'Tofu', amount: '300', unit: 'g', cost: 3.0 },
      { name: 'Bell Pepper', amount: '1', unit: 'unit', cost: 1.5 },
      { name: 'Carrot', amount: '1', unit: 'unit', cost: 0.75 },
      { name: 'Peanuts', amount: '50', unit: 'g', cost: 1.25 },
      { name: 'Soy Sauce', amount: '3', unit: 'tbsp', cost: 0.75 },
      { name: 'Sesame Oil', amount: '1', unit: 'tbsp', cost: 0.8 },
    ],
    steps: [
      { text: 'Soak or cook noodles according to package instructions.' },
      { text: 'Stir-fry tofu and vegetables until lightly browned.' },
      { text: 'Add noodles, soy sauce, and sesame oil, then top with peanuts.' },
    ],
    instructions: ['Cook noodles', 'Stir-fry tofu and veggies', 'Combine and finish'],
    categories: ['hard', 'vegetarian', 'quick', 'wheat', 'soy', 'sesame', 'peanuts'],
    difficulty: 'Hard',
    servings: 3,
    prepTime: 20,
    cookTime: 18,
    estimatedCost: 10.8,
    heroImage: '',
    image: '',
    // heroImage: 'https://via.placeholder.com/300x200?text=Peanut+Tofu+Noodles',
    // image: 'https://via.placeholder.com/300x200?text=Peanut+Tofu+Noodles',
  },
];
