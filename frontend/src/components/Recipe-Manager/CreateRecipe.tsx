import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CreateRecipe.css';
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../api/recipes';

export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
  cost?: number;
}

type FormNumberValue = number | '';

interface FormIngredient extends Omit<Ingredient, 'cost'> {
  cost?: FormNumberValue;
}

export interface Step {
  text: string;
  image?: string;
}

export interface Recipe {
  id: string | number;
  title: string;
  description: string;
  ingredients: (string | Ingredient)[];
  steps: (string | Step)[];
  categories: string[];
  difficulty?: string;
  prepTime: number;
  cookTime: number;
  estimatedCost: number;
  heroImage?: string;
  createdBy?: number;
  createdAt?: string;
  // Legacy fields for compatibility
  name?: string;
  servings?: number;
  image?: string;
  instructions?: string[];
}

interface RecipeFormData extends Omit<Recipe, 'ingredients' | 'prepTime' | 'cookTime' | 'estimatedCost' | 'servings'> {
  ingredients: (string | FormIngredient)[];
  prepTime: FormNumberValue;
  cookTime: FormNumberValue;
  estimatedCost: FormNumberValue;
  servings?: FormNumberValue;
}

interface RecipeManagerProps {
  initialEditRecipeId?: string | number | null;
  onRecipeSaved?: (recipe: Recipe) => void;
}

const tagCategories = {
  allergies: {
    label: 'Allergies & Intolerances',
    tags: ['peanuts', 'tree-nuts', 'eggs', 'milk', 'fish', 'crustaceans', 'soy', 'wheat', 'sesame', 'mustard', 'lactose', 'gluten']
  },
  difficulty: {
    label: 'Difficulty Level',
    tags: ['easy', 'medium', 'hard']
  },
  diet: {
    label: 'Diet Preferences',
    tags: ['vegetarian', 'vegan', 'keto', 'low-carb', 'high-protein', 'pescetarian', 'halal', 'kosher']
  },
  goals: {
    label: 'Goals & Attributes',
    tags: ['quick', 'healthy', 'budget-friendly', 'gluten-free', 'dairy-free']
  }
};

const predefinedTags = Object.values(tagCategories).flatMap((category) => category.tags);

const createEmptyFormData = (): RecipeFormData => ({
  id: '',
  title: '',
  name: '',
  description: '',
  ingredients: [{ name: '', amount: '', unit: '', cost: '' }],
  steps: [{ text: '' }],
  instructions: [''],
  categories: [],
  difficulty: 'Medium',
  servings: '',
  prepTime: '',
  cookTime: '',
  estimatedCost: 0,
  heroImage: '',
  image: '',
});

const RecipeManager: React.FC<RecipeManagerProps> = ({
  initialEditRecipeId = null,
  onRecipeSaved,
}) => {
  // Unit options for ingredients
  const unitOptions = [
    'unit',
    'ml',
    'l',
    'mg',
    'g',
    'kg',
    'tsp',
    'tbsp',
    'cup',
    'oz',
    'lb',
    'fl oz',
    'gallon',
    'pinch',
    'slice',
    'can',
  ];
  const userProfileTags = ['quick', 'easy', 'healthy', 'vegetarian'];
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const hasHandledInitialEdit = useRef(false);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await fetchRecipes();
        setRecipes(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadRecipes();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | number | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saveError, setSaveError] = useState('');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [ingredientFilterQuery, setIngredientFilterQuery] = useState('');
  const [maxPrepTimeFilter, setMaxPrepTimeFilter] = useState('');
  const [maxCookTimeFilter, setMaxCookTimeFilter] = useState('');
  const [maxTotalTimeFilter, setMaxTotalTimeFilter] = useState('');
  const [maxCostFilter, setMaxCostFilter] = useState('');
  const [selectedDietFilters, setSelectedDietFilters] = useState<string[]>([]);
  const [selectedGoalFilters, setSelectedGoalFilters] = useState<string[]>([]);
  const [selectedAllergyFilters, setSelectedAllergyFilters] = useState<string[]>([]);
  const [selectedDifficultyFilters, setSelectedDifficultyFilters] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [formData, setFormData] = useState<RecipeFormData>(createEmptyFormData());

  const normalizeText = (value: string = '') => value.trim().toLowerCase();

  const parseFilterNumber = (value: string): number | null => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getRecipeIngredientNames = (recipe: Recipe): string[] =>
    (recipe.ingredients || [])
      .map((ingredient) => {
        if (typeof ingredient === 'string') return ingredient;
        return ingredient?.name || '';
      })
      .map((name) => name.trim())
      .filter(Boolean);

  const getRecipeStepTexts = (recipe: Recipe): string[] =>
    (recipe.steps || [])
      .map((step) => (typeof step === 'string' ? step : step?.text || ''))
      .map((text) => text.trim())
      .filter(Boolean);

  const getRecipeDisplayCost = (recipe: Recipe): number => {
    const ingredientCost = (recipe.ingredients || []).reduce((sum, ing) => {
      const cost = typeof ing === 'object' ? (ing.cost || 0) : 0;
      return sum + cost;
    }, 0);
    return ingredientCost > 0 ? ingredientCost : recipe.estimatedCost || 0;
  };

  const getRecipeDifficulty = (recipe: Recipe): string => {
    const categoryDifficulty = (recipe.categories || []).find((tag) =>
      tagCategories.difficulty.tags.includes(normalizeText(tag))
    );

    if (categoryDifficulty) return normalizeText(categoryDifficulty);
    if (recipe.difficulty) return normalizeText(recipe.difficulty);
    return '';
  };

  const getIngredientCostTotal = (recipe: Pick<RecipeFormData, 'ingredients'>): number =>
    (recipe.ingredients as (string | FormIngredient)[] | undefined)?.reduce((sum, ing) => {
      const cost = typeof ing === 'object' ? Number(ing.cost) || 0 : 0;
      return sum + cost;
    }, 0) || 0;

  const toggleFilterTag = (
    tag: string,
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>,
    singleSelect: boolean = false
  ) => {
    const normalizedTag = normalizeText(tag);

    if (singleSelect) {
      setSelectedTags((current) =>
        current.includes(normalizedTag) ? [] : [normalizedTag]
      );
      return;
    }

    setSelectedTags((current) =>
      current.includes(normalizedTag)
        ? current.filter((item) => item !== normalizedTag)
        : [...current, normalizedTag]
    );
  };

  const clearRecipeFilters = () => {
    setRecipeSearchQuery('');
    setIngredientFilterQuery('');
    setMaxPrepTimeFilter('');
    setMaxCookTimeFilter('');
    setMaxTotalTimeFilter('');
    setMaxCostFilter('');
    setSelectedDietFilters([]);
    setSelectedGoalFilters([]);
    setSelectedAllergyFilters([]);
    setSelectedDifficultyFilters([]);
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const normalizedCategories = (recipe.categories || []).map((tag) => normalizeText(tag));
    const ingredientNames = getRecipeIngredientNames(recipe).map((name) => normalizeText(name));
    const stepTexts = getRecipeStepTexts(recipe).map((text) => normalizeText(text));
    const recipeDifficulty = getRecipeDifficulty(recipe);
    const totalCost = getRecipeDisplayCost(recipe);
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

    const searchableText = [
      recipe.title || '',
      recipe.name || '',
      recipe.description || '',
      ...normalizedCategories,
      ...ingredientNames,
      ...stepTexts,
      recipeDifficulty,
    ]
      .join(' ')
      .toLowerCase();

    const searchTokens = recipeSearchQuery
      .split(',')
      .flatMap((chunk) => chunk.split(/\s+/))
      .map(normalizeText)
      .filter(Boolean);

    const ingredientTokens = ingredientFilterQuery
      .split(',')
      .map(normalizeText)
      .filter(Boolean);

    const maxPrepTime = parseFilterNumber(maxPrepTimeFilter);
    const maxCookTime = parseFilterNumber(maxCookTimeFilter);
    const maxTotalTime = parseFilterNumber(maxTotalTimeFilter);
    const maxCost = parseFilterNumber(maxCostFilter);

    if (searchTokens.some((token) => !searchableText.includes(token))) return false;
    if (
      ingredientTokens.some(
        (token) => !ingredientNames.some((ingredient) => ingredient.includes(token))
      )
    ) {
      return false;
    }
    if (maxPrepTime !== null && (recipe.prepTime || 0) > maxPrepTime) return false;
    if (maxCookTime !== null && (recipe.cookTime || 0) > maxCookTime) return false;
    if (maxTotalTime !== null && totalTime > maxTotalTime) return false;
    if (maxCost !== null && totalCost > maxCost) return false;
    if (selectedDietFilters.some((tag) => !normalizedCategories.includes(tag))) return false;
    if (selectedGoalFilters.some((tag) => !normalizedCategories.includes(tag))) return false;
    // Allergy/intolerance filters are exclusion filters:
    // if a recipe contains any selected allergy tag, hide it.
    if (selectedAllergyFilters.some((tag) => normalizedCategories.includes(tag))) return false;
    if (
      selectedDifficultyFilters.length > 0 &&
      !selectedDifficultyFilters.includes(recipeDifficulty)
    ) {
      return false;
    }

    return true;
  });

  const handleCreateRecipe = () => {
    setSaveError('');
    setFormData(createEmptyFormData());
    setImagePreview('');
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditRecipe = useCallback((recipe: Recipe) => {
    setSaveError('');
    setFormData({
      ...recipe,
      ingredients: (recipe.ingredients || []).map((ingredient) =>
        typeof ingredient === 'string'
          ? ingredient
          : {
            ...ingredient,
            amount: ingredient.amount || '',
            unit: ingredient.unit || '',
            cost: ingredient.cost ?? '',
          }
      ),
      servings: recipe.servings ?? '',
      prepTime: recipe.prepTime ?? '',
      cookTime: recipe.cookTime ?? '',
      estimatedCost: recipe.estimatedCost ?? 0,
    });
    const customRecipeTags = recipe.categories.filter(tag => !predefinedTags.includes(tag));
    setCustomTags(customRecipeTags);
    setImagePreview(recipe.heroImage || recipe.image || '');
    setIsEditing(true);
    setShowModal(true);
  }, []);

  useEffect(() => {
    if (hasHandledInitialEdit.current || initialEditRecipeId === null) return;
    if (recipes.length === 0) return;

    const matchedRecipe = recipes.find((recipe) => recipe.id.toString() === initialEditRecipeId.toString());
    hasHandledInitialEdit.current = true;

    if (matchedRecipe) {
      handleEditRecipe(matchedRecipe);
    }
  }, [handleEditRecipe, initialEditRecipeId, recipes]);

  const handleViewRecipeDetail = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetail(true);
  };

  const handleDeleteRecipe = (id: string | number) => {
    setSelectedRecipeId(id);
    setShowDeleteConfirm(true);
  };

  const getJwtToken = () => {
    const jwt_token: string | null = localStorage.getItem('token');

    if (!jwt_token) {
        throw new Error("jwt token not found");
    }

    return jwt_token;
  }

  const confirmDeleteRecipe = async () => {
    try {
      const jwt_token = getJwtToken()

      if (!selectedRecipeId) {
        throw new Error("Recipe ID for deletion is null");
      }
      
      await deleteRecipe(selectedRecipeId.toString(), jwt_token);

      setRecipes(recipes.filter((recipe) => recipe.id !== selectedRecipeId));
      setShowDeleteConfirm(false);
      setSelectedRecipeId(null)
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image: result, heroImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'servings' || name === 'prepTime' || name === 'cookTime') {
      if (value === '') {
        setFormData({ ...formData, [name]: '' });
        return;
      }

      const parsedValue = parseInt(value, 10);
      if (!Number.isNaN(parsedValue)) {
        setFormData({ ...formData, [name]: parsedValue });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleArrayFieldChange = (
    index: number,
    field: 'ingredients' | 'steps',
    value: string,
    subfield?: string
  ) => {
    if (!formData[field]) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentArray = Array.isArray(formData[field]) ? [...(formData[field] as (string | any)[])] : [];

    if (field === 'ingredients') {
      const ingredient = currentArray[index];
      if (typeof ingredient === 'object') {
        if (subfield === 'cost') {
          if (value === '' || value === '-') {
            currentArray[index] = { ...ingredient, cost: '' };
          } else {
            const costValue = parseFloat(value);
            if (!isNaN(costValue) && costValue >= 0) {
              currentArray[index] = { ...ingredient, cost: costValue };
            }
          }
        } else if (subfield === 'amount') {
          // Handle amount separately - just store as string
          currentArray[index] = { ...ingredient, amount: value };
        } else if (subfield === 'unit') {
          // Handle unit separately - just store as string
          currentArray[index] = { ...ingredient, unit: value };
        } else if (subfield === 'name') {
          // Explicitly handle name to avoid confusion
          currentArray[index] = { ...ingredient, name: value };
        } else {
          currentArray[index] = { ...ingredient, [subfield || 'name']: value };
        }
      } else {
        currentArray[index] = { name: value, amount: '', unit: '', cost: '' };
      }
    } else if (field === 'steps') {
      const step = currentArray[index];
      if (typeof step === 'object') {
        currentArray[index] = { ...step, [subfield || 'text']: value };
      } else {
        currentArray[index] = { text: value };
      }
    } else {
      currentArray[index] = value;
    }

    setFormData({ ...formData, [field]: currentArray });
  };

  const handleAddArrayField = (field: 'ingredients' | 'steps') => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentArray = formData[field] as (string | any)[];
    if (!currentArray) return;

    const newItem = field === 'ingredients' ? { name: '', amount: '', unit: '', cost: '' } : { text: '' };
    setFormData({
      ...formData,
      [field]: [...currentArray, newItem],
    });
  };

  const handleRemoveArrayField = (
    index: number,
    field: 'ingredients' | 'steps'
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentArray = formData[field] as (string | any)[];
    if (!currentArray) return;
    const updatedArray = currentArray.filter((_, i) => i !== index);
    const emptyItem = field === 'ingredients' ? [{ name: '', cost: 0 }] : [{ text: '' }];
    setFormData({
      ...formData,
      [field]: updatedArray.length > 0 ? updatedArray : emptyItem,
    });
  };

  const handleToggleTag = (tag: string) => {
    const isDifficultyTag = tagCategories.difficulty.tags.includes(tag);

    if (isDifficultyTag) {
      // For difficulty tags, ensure only one can be selected
      const nonDifficultyCategories = formData.categories.filter(t => !tagCategories.difficulty.tags.includes(t));

      if (formData.categories.includes(tag)) {
        // If already selected, deselect it
        setFormData({
          ...formData,
          categories: nonDifficultyCategories,
        });
      } else {
        // Select this difficulty, removing any other difficulty
        setFormData({
          ...formData,
          categories: [...nonDifficultyCategories, tag],
        });
      }
    } else {
      // For other tags, toggle normally
      setFormData({
        ...formData,
        categories: formData.categories.includes(tag)
          ? formData.categories.filter((t) => t !== tag)
          : [...formData.categories, tag],
      });
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !customTags.includes(customTagInput.trim())) {
      const newTag = customTagInput.trim().toLowerCase();
      setCustomTags([...customTags, newTag]);
      setFormData({
        ...formData,
        categories: [...formData.categories, newTag],
      });
      setCustomTagInput('');
    }
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
    setFormData({
      ...formData,
      categories: formData.categories.filter((t) => t !== tag),
    });
  };

  const handleSaveRecipe = async () => {
    setSaveError('');

    if (!formData.title?.trim() && !formData.name?.trim()) {
      alert('Please enter a recipe name');
      return;
    }

    // Load default image if no image is provided
    const getDefaultImage = async (): Promise<string> => {
      try {
        const response = await fetch('/food-clipart.jpg');
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Failed to load default image:', error);
        return '';
      }
    };

    // Preserve the previously saved total for legacy recipes whose per-ingredient costs were not stored.
    const ingredientCostTotal = getIngredientCostTotal(formData);
    const totalCost = ingredientCostTotal > 0 ? ingredientCostTotal : (formData.estimatedCost || 0);

    const cleanedIngredients = (formData.ingredients as (string | FormIngredient)[])
      .map((ingredient) => {
        if (typeof ingredient === 'string') {
          const name = ingredient.trim();
          return name ? { name, amount: '', unit: '', cost: 0 } : null;
        }

        const name = ingredient?.name?.trim() || '';
        if (!name) return null;

        return {
          ...ingredient,
          name,
          amount: ingredient?.amount || '',
          unit: ingredient?.unit || '',
          cost: ingredient?.cost === '' || ingredient?.cost === undefined ? 0 : ingredient.cost,
        };
      })
      .filter((ingredient) => ingredient !== null) as Ingredient[];

    const cleanedSteps = (formData.steps as (string | Step)[])
      .map((step) => {
        if (typeof step === 'string') {
          const text = step.trim();
          return text ? { text } : null;
        }

        const text = step?.text?.trim() || '';
        return text ? { ...step, text } : null;
      })
      .filter((step) => step !== null) as Step[];

    if (cleanedIngredients.length === 0) {
      setSaveError('Add at least one ingredient before saving.');
      return;
    }

    if (cleanedSteps.length === 0) {
      setSaveError('Add at least one instruction before saving.');
      return;
    }

    const baseRecipeData: Recipe = {
      ...formData,
      title: (formData.title || formData.name || '').trim(),
      name: (formData.name || formData.title || '').trim(),
      ingredients: cleanedIngredients,
      steps: cleanedSteps,
      servings: formData.servings === '' ? 0 : formData.servings,
      prepTime: formData.prepTime === '' ? 0 : formData.prepTime,
      cookTime: formData.cookTime === '' ? 0 : formData.cookTime,
      estimatedCost: totalCost,
    };
    const defaultImage = !baseRecipeData.heroImage && !baseRecipeData.image
      ? await getDefaultImage()
      : null;
    const recipeData: Recipe = {
      ...baseRecipeData,
      heroImage: baseRecipeData.heroImage || defaultImage || undefined,
      image: baseRecipeData.image || defaultImage || undefined,
    };

    if (defaultImage) {
      setImagePreview(defaultImage);
    }

    if (isEditing) {
      try {
        const updatedRecipe = await updateRecipe(recipeData.id.toString(), recipeData, getJwtToken());
        
        setRecipes(
          recipes.map((recipe) =>
            recipe.id === recipeData.id ? updatedRecipe : recipe
          )
        );
        setSelectedRecipe((currentRecipe) =>
          currentRecipe && currentRecipe.id === recipeData.id ? updatedRecipe : currentRecipe
        );
        onRecipeSaved?.(updatedRecipe);
      } catch (error) {
        console.error(error);
        setSaveError(error instanceof Error ? error.message : 'Failed to update recipe.');
        return;
      }
    } else {
      const tempNewRecipe: Recipe = {
        ...recipeData,
        id: Date.now().toString(),
        title: recipeData.title || recipeData.name || '',
      };
      try {
        // API call 
        const potentialArray = await createRecipe(tempNewRecipe, getJwtToken());
        // Account for default recipe creation returning an array of recipes
        if (Array.isArray(potentialArray)) {
            const loadedRecipes = await Promise.all(potentialArray)
            setRecipes([...recipes, ...loadedRecipes])
            loadedRecipes.forEach((recipe) => onRecipeSaved?.(recipe))
        } else {
          const returnedRecipe: Recipe = potentialArray
          setRecipes([...recipes, returnedRecipe]);
          onRecipeSaved?.(returnedRecipe);
        } 
      } catch (error) {
        console.error(error)
        setSaveError(error instanceof Error ? error.message : 'Failed to create recipe.');
        return;
      }
    }

    setShowModal(false);
    setCustomTags([]);
    setCustomTagInput('');
    setFormData(createEmptyFormData());
    setImagePreview('');
  };

  return (
    <div className="recipe-manager">
      <div className="recipe-header">
        <h1>Recipe Manager</h1>
        <button
          className="btn btn-create"
          onClick={handleCreateRecipe}
        >
          + Add Recipe
        </button>
      </div>

      <div className="recipe-filters">
        <div className="recipe-filters-header">
          <h3>Filter Recipes</h3>
          <div className="recipe-filters-actions">
            <span className="recipe-filter-count">
              Showing {filteredRecipes.length} of {recipes.length}
            </span>
            <button
              type="button"
              className="btn btn-filter-clear"
              onClick={clearRecipeFilters}
            >
              Clear Filters
            </button>
            <button
              type="button"
              className="btn btn-filter-toggle"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              aria-label={filtersExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              {filtersExpanded ? '−' : '+'}
            </button>
          </div>
        </div>

        {filtersExpanded && (
          <>
        <div className="recipe-filters-grid">
          <div className="filter-field wide">
            <label className="form-label" htmlFor="recipe-search-query">
              Search (title, description, tags, steps)
            </label>
            <input
              id="recipe-search-query"
              type="text"
              className="form-input"
              value={recipeSearchQuery}
              onChange={(e) => setRecipeSearchQuery(e.target.value)}
              placeholder="e.g. healthy quick pasta"
            />
          </div>

          <div className="filter-field wide">
            <label className="form-label" htmlFor="ingredient-filter-query">
              Ingredients (comma separated)
            </label>
            <input
              id="ingredient-filter-query"
              type="text"
              className="form-input"
              value={ingredientFilterQuery}
              onChange={(e) => setIngredientFilterQuery(e.target.value)}
              placeholder="e.g. tomato, basil"
            />
          </div>

          <div className="filter-field">
            <label className="form-label" htmlFor="max-prep-time-filter">
              Max Prep Time (min)
            </label>
            <input
              id="max-prep-time-filter"
              type="number"
              min="0"
              className="form-input"
              value={maxPrepTimeFilter}
              onChange={(e) => setMaxPrepTimeFilter(e.target.value)}
              placeholder="Any"
            />
          </div>

          <div className="filter-field">
            <label className="form-label" htmlFor="max-cook-time-filter">
              Max Cook Time (min)
            </label>
            <input
              id="max-cook-time-filter"
              type="number"
              min="0"
              className="form-input"
              value={maxCookTimeFilter}
              onChange={(e) => setMaxCookTimeFilter(e.target.value)}
              placeholder="Any"
            />
          </div>

          <div className="filter-field">
            <label className="form-label" htmlFor="max-total-time-filter">
              Max Total Time (min)
            </label>
            <input
              id="max-total-time-filter"
              type="number"
              min="0"
              className="form-input"
              value={maxTotalTimeFilter}
              onChange={(e) => setMaxTotalTimeFilter(e.target.value)}
              placeholder="Any"
            />
          </div>

          <div className="filter-field">
            <label className="form-label" htmlFor="max-cost-filter">
              Max Cost ($)
            </label>
            <input
              id="max-cost-filter"
              type="number"
              min="0"
              step="0.01"
              className="form-input"
              value={maxCostFilter}
              onChange={(e) => setMaxCostFilter(e.target.value)}
              placeholder="Any"
            />
          </div>
        </div>

        <div className="filter-tag-groups">
          <div className="tag-category compact">
            <h4 className="tag-category-title">Difficulty</h4>
            <div className="tags-container">
              {tagCategories.difficulty.tags.map((tag) => (
                <button
                  key={`filter-difficulty-${tag}`}
                  type="button"
                  className={`tag-button ${selectedDifficultyFilters.includes(tag) ? 'selected' : ''}`}
                  onClick={() =>
                    toggleFilterTag(tag, setSelectedDifficultyFilters, true)
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="tag-category compact">
            <h4 className="tag-category-title">Dietary Tags</h4>
            <div className="tags-container">
              {tagCategories.diet.tags.map((tag) => (
                <button
                  key={`filter-diet-${tag}`}
                  type="button"
                  className={`tag-button ${selectedDietFilters.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleFilterTag(tag, setSelectedDietFilters)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="tag-category compact">
            <h4 className="tag-category-title">Goals & Attributes</h4>
            <div className="tags-container">
              {tagCategories.goals.tags.map((tag) => (
                <button
                  key={`filter-goal-${tag}`}
                  type="button"
                  className={`tag-button ${selectedGoalFilters.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleFilterTag(tag, setSelectedGoalFilters)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="tag-category compact">
            <h4 className="tag-category-title">Allergies & Intolerances</h4>
            <div className="tags-container">
              {tagCategories.allergies.tags.map((tag) => (
                <button
                  key={`filter-allergy-${tag}`}
                  type="button"
                  className={`tag-button ${selectedAllergyFilters.includes(tag) ? 'selected' : ''}`}
                  onClick={() =>
                    toggleFilterTag(tag, setSelectedAllergyFilters)
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Recipe Grid */}
      <div className="recipe-grid">
        {filteredRecipes.map((recipe) => {
          // Calculate total ingredient cost
          const totalIngredientCost = getRecipeDisplayCost(recipe);

          return (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => handleViewRecipeDetail(recipe)}
              style={{ cursor: 'pointer' }}
            >
              <div className="recipe-image-container">
                <img
                  src={recipe.heroImage || recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={" "}
                  className="recipe-image"
                />
              </div>
              <div className="recipe-content">
                <h2>{recipe.title || recipe.name}</h2>
                <p className="recipe-description">{recipe.description}</p>
                <div className="recipe-meta">
                  <div className="meta-item">
                    <span className="meta-label">Prep:</span>
                    <span>{recipe.prepTime} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Cook:</span>
                    <span>{recipe.cookTime} min</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Cost:</span>
                    <span>${totalIngredientCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="recipe-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-edit"
                  onClick={() => handleEditRecipe(recipe)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-delete"
                  onClick={() => handleDeleteRecipe(recipe.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filteredRecipes.length === 0 && (
        <div className="recipe-empty-state">
          No recipes match the current filters.
        </div>
      )}

      {/* Recipe Detail Modal */}
      {showRecipeDetail && selectedRecipe && (
        <div className="modal-overlay" onClick={() => setShowRecipeDetail(false)}>
          <div className="modal-content recipe-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-detail-close">
              <button
                className="modal-close"
                onClick={() => setShowRecipeDetail(false)}
              >
                ×
              </button>
            </div>

            {/* Recipe Hero Image */}
            <div className="recipe-detail-hero">
              <img
                src={selectedRecipe.heroImage || selectedRecipe.image || 'https://via.placeholder.com/500x300?text=Recipe'}
                alt={selectedRecipe.title || selectedRecipe.name}
                className="recipe-detail-image"
              />
            </div>

            {/* Recipe Title */}
            <div className="recipe-detail-header">
              <h1>{selectedRecipe.title || selectedRecipe.name}</h1>
            </div>

            {/* Recipe Stats */}
            <div className="recipe-detail-stats">
              <div className="stat-item">
                <div className="stat-content">
                  <div className="stat-label">Time</div>
                  <div className="stat-value">{(selectedRecipe.prepTime || 0) + (selectedRecipe.cookTime || 0)} Min</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-content">
                  <div className="stat-label">Ingredients</div>

                  <div className="stat-value">
                    {Array.isArray(selectedRecipe.ingredients)
                      ? selectedRecipe.ingredients.length
                      : 0}
                  </div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-content">
                  <div className="stat-label">Cost</div>
                  <div className="stat-value">${getRecipeDisplayCost(selectedRecipe).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Recipe Categories/Tags */}
            {selectedRecipe.categories && selectedRecipe.categories.length > 0 && (
              <div className="recipe-detail-tags">
                {selectedRecipe.categories.map((category, index) => (
                  <span key={index} className="recipe-tag">{category}</span>
                ))}
              </div>
            )}

            {/* Get Started Button (Does not lead to anything for now) */}
            <div className="recipe-detail-actions">
              <button className="btn btn-get-started">Get Started →</button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Recipe' : 'Create New Recipe'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Image Upload */}
              <div className="form-group image-upload-group">
                <label htmlFor="image-upload" className="form-label">
                  Recipe Image
                </label>
                <div className="image-upload-area">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="btn-change-image"
                        onClick={() =>
                          document.getElementById('image-upload')?.click()
                        }
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div
                      className="image-placeholder"
                      onClick={() =>
                        document.getElementById('image-upload')?.click()
                      }
                    >
                      <span>Click to upload image</span>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Recipe Name */}
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  Recipe Name *
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter recipe name"
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Enter recipe description"
                  rows={3}
                />
              </div>

              {/* Cooking Info */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="servings" className="form-label">
                    Servings
                  </label>
                  <input
                    id="servings"
                    type="number"
                    name="servings"
                    value={formData.servings}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="prepTime" className="form-label">
                    Prep Time (min)
                  </label>
                  <input
                    id="prepTime"
                    type="number"
                    name="prepTime"
                    value={formData.prepTime}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cookTime" className="form-label">
                    Cook Time (min)
                  </label>
                  <input
                    id="cookTime"
                    type="number"
                    name="cookTime"
                    value={formData.cookTime}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                  />
                </div>
              </div>

              {/* Ingredients */}
              <div className="form-group">
                <div className="form-label-row">
                  {/* Added 'label-wrapper' class here */}
                  <span className="label-wrapper">
                    <label className="form-label">Ingredients</label>
                    <span className="ingredient-count">
                      {(formData.ingredients as (string | Ingredient)[])?.length || 0}
                    </span>
                  </span>

                  <div className="ingredient-stats">
                    <div className="ingredient-total-cost">
                      Total: ${(getIngredientCostTotal(formData) > 0
                        ? getIngredientCostTotal(formData)
                        : (formData.estimatedCost || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="ingredient-header-row">
                  <div className="ingredient-name-col"><small>Name</small></div>
                  <div className="ingredient-amount-col"><small>Amount</small></div>
                  <div className="ingredient-unit-col"><small>Unit</small></div>
                  <div className="ingredient-cost-col"><small>Cost</small></div>
                </div>
                <div className="array-fields">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(formData.ingredients as (string | any)[])?.map((ingredient, index) => {
                    const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient?.name || '';
                    const ingredientAmount = typeof ingredient === 'object' ? ingredient?.amount || '' : '';
                    const ingredientUnit = typeof ingredient === 'object' ? ingredient?.unit || '' : '';
                    const ingredientCost = typeof ingredient === 'object' ? ingredient?.cost ?? '' : '';
                    return (
                      <div key={index} className="ingredient-row">
                        <div className="ingredient-name-col">
                          <input
                            type="text"
                            value={ingredientName}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                index,
                                'ingredients',
                                e.target.value,
                                'name'
                              )
                            }
                            className="form-input"
                            placeholder={`Ingredient ${index + 1}`}
                          />
                        </div>
                        <div className="ingredient-amount-col">
                          <input
                            type="text"
                            value={ingredientAmount}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                index,
                                'ingredients',
                                e.target.value,
                                'amount'
                              )
                            }
                            className="form-input"
                            placeholder="Amount"
                          />
                        </div>
                        <div className="ingredient-unit-col">
                          <select
                            value={ingredientUnit}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                index,
                                'ingredients',
                                e.target.value,
                                'unit'
                              )
                            }
                            className="form-input"
                            aria-label={`Ingredient ${index + 1} unit`}
                          >
                            <option value="">Unit</option>
                            {unitOptions.map((unit) => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <div className="ingredient-cost-col">
                          <input
                            type="number"
                            value={ingredientCost}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                index,
                                'ingredients',
                                e.target.value,
                                'cost'
                              )
                            }
                            className="form-input"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                          />
                        </div>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(formData.ingredients as (string | any)[])?.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() =>
                              handleRemoveArrayField(index, 'ingredients')
                            }
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  }) || []}
                  <button
                    type="button"
                    className="btn btn-add-field"
                    onClick={() => handleAddArrayField('ingredients')}
                  >
                    + Add Ingredient
                  </button>
                </div>
              </div>

              {/* Instructions / Steps */}
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <div className="array-fields">
                  {(formData.steps || []).map((step, index) => {
                    const stepText = typeof step === 'string' ? step : step?.text || '';

                    return (
                      <div key={index} className="step-card">
                        <div className="step-main">
                          <textarea
                            value={stepText}
                            onChange={(e) =>
                              handleArrayFieldChange(
                                index,
                                'steps',
                                e.target.value,
                                'text'
                              )
                            }
                            className="form-input form-textarea"
                            placeholder={`Step ${index + 1}`}
                            rows={2}
                          />
                          {(formData.steps || []).length > 1 && (
                            <button
                              type="button"
                              className="btn-remove"
                              onClick={() =>
                                handleRemoveArrayField(index, 'steps')
                              }
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Step Image (put on hold for now) */}
                       {/*  <div className="step-image-section">
                          {preview ? (
                            <div className="step-image-preview">
                              <img src={preview} alt={`Step ${index + 1}`} />
                              <button
                                type="button"
                                className="btn-change-image"
                                onClick={() =>
                                  document.getElementById(`step-image-${index}`)?.click()
                                }
                              >
                                Change Image
                              </button>
                            </div>
                          ) : (
                            <div
                              className="step-image-placeholder"
                              onClick={() =>
                                document.getElementById(`step-image-${index}`)?.click()
                              }
                            >
                              <span>Add Step Image</span>
                            </div>
                          )}
                          <input
                            id={`step-image-${index}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleStepImageUpload(index, e)}
                            style={{ display: 'none' }}
                          />
                        </div> */}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    className="btn btn-add-field"
                    onClick={() => handleAddArrayField('steps')}
                  >
                    + Add Step
                  </button>
                </div>
              </div>

              {/* Tags/Categories */}
              <div className="form-group">
                <label className="form-label">Tags</label>

                {/* Predefined Tags by Category */}
                {Object.entries(tagCategories).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="tag-category">
                    <h4 className="tag-category-title">{category.label}</h4>
                    <div className="tags-container">
                      {category.tags.map((tag) => {
                        const isSelected = formData.categories.includes(tag);
                        const isProfileTag = userProfileTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`tag-button ${isSelected ? 'selected' : ''} ${isProfileTag && isSelected ? 'profile-tag' : ''}`}
                            onClick={() => handleToggleTag(tag)}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Custom Tags */}
                <div className="custom-tags-section">
                  <h4 className="tag-category-title">Custom Tags</h4>

                  {/* Custom Tags Display */}
                  {customTags.length > 0 && (
                    <div className="custom-tags-list">
                      {customTags.map((tag) => (
                        <div key={tag} className="custom-tag">
                          <span>{tag}</span>
                          <button
                            type="button"
                            className="custom-tag-remove"
                            onClick={() => handleRemoveCustomTag(tag)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Custom Tag Input */}
                  <div className="custom-tag-input-group">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTag();
                        }
                      }}
                      className="form-input"
                      placeholder="Add custom tag"
                    />
                    <button
                      type="button"
                      className="btn btn-add-custom-tag"
                      onClick={handleAddCustomTag}
                    >
                      + Add Tag
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {saveError && <p className="form-error-message">{saveError}</p>}
              <button
                className="btn btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-save" onClick={handleSaveRecipe}>
                {isEditing ? 'Update Recipe' : 'Create Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="modal-content confirmation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Delete</h2>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this recipe? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-delete-confirm"
                onClick={confirmDeleteRecipe}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManager;
