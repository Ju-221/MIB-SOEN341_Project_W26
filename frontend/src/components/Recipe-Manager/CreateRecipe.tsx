import React, { useState, useEffect } from 'react';
import './CreateRecipe.css';
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../api/recipes';

export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
  cost?: number;
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

const RecipeManager: React.FC = () => {
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



  // Available tags organized by category
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

  const userProfileTags = ['quick', 'easy', 'healthy', 'vegetarian'];
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [stepImagePreviews, setStepImagePreviews] = useState<{ [key: number]: string }>({});

  const [recipes, setRecipes] = useState<Recipe[]>([]);

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

  const [formData, setFormData] = useState<Recipe>({
    id: '',
    title: '',
    name: '',
    description: '',
    ingredients: [{ name: '', amount: '', unit: '', cost: 0 }],
    steps: [{ text: '' }],
    instructions: [''],
    categories: [],
    difficulty: 'Medium',
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    estimatedCost: 0,
    heroImage: '',
    image: '',
  });

  const handleCreateRecipe = () => {
    setFormData({
      id: '',
      title: '',
      name: '',
      description: '',
      ingredients: [{ name: '', amount: '', unit: '', cost: 0 }],
      steps: [{ text: '' }],
      instructions: [''],
      categories: [],
      difficulty: 'Medium',
      servings: 0,
      prepTime: 0,
      cookTime: 30,
      estimatedCost: 0,
      heroImage: '',
      image: '',
    });
    setImagePreview('');
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setFormData(recipe);
    // Extract custom tags that aren't in the predefined categories
    const allPredefinedTags = Object.values(tagCategories).flatMap(cat => cat.tags);
    const customRecipeTags = recipe.categories.filter(tag => !allPredefinedTags.includes(tag));
    setCustomTags(customRecipeTags);
    setImagePreview(recipe.heroImage || recipe.image || '');
    setIsEditing(true);
    setShowModal(true);
  };

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

  const confirmDeleteRecipe = () => {
    try {
      const jwt_token = getJwtToken()

      if (!selectedRecipeId) {
        throw new Error("Recipe ID for deletion is null");
      }
      
      // API call
        deleteRecipe(selectedRecipeId.toString(), jwt_token);

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
      setFormData({ ...formData, [name]: parseInt(value) });
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
    const currentArray = Array.isArray(formData[field]) ? [...(formData[field] as (string | any)[])] : [];

    if (field === 'ingredients') {
      const ingredient = currentArray[index];
      if (typeof ingredient === 'object') {
        if (subfield === 'cost') {
          // Allow empty string for user to clear field, otherwise parse as float
          if (value === '' || value === '-') {
            currentArray[index] = { ...ingredient, cost: 0 };
          } else {
            const costValue = parseFloat(value);
            // Only update if it's a valid number
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
        currentArray[index] = { name: value, amount: '', unit: '', cost: 0 };
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
  const handleStepImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setStepImagePreviews({ ...stepImagePreviews, [index]: result });

        const currentArray = Array.isArray(formData.steps) ? [...(formData.steps as (string | Step)[])] : [];
        const step = currentArray[index];
        if (typeof step === 'object') {
          currentArray[index] = { ...step, image: result };
        } else {
          currentArray[index] = { text: step || '', image: result };
        }
        setFormData({ ...formData, steps: currentArray });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddArrayField = (field: 'ingredients' | 'steps') => {
    const currentArray = formData[field] as (string | any)[];
    if (!currentArray) return;

    const newItem = field === 'ingredients' ? { name: '', amount: '', unit: '', cost: 0 } : { text: '' };
    setFormData({
      ...formData,
      [field]: [...currentArray, newItem],
    });
  };

  const handleRemoveArrayField = (
    index: number,
    field: 'ingredients' | 'steps'
  ) => {
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
    if (!formData.title?.trim() && !formData.name?.trim()) {
      alert('Please enter a recipe name');
      return;
    }

    // Calculate total ingredient cost
    const totalCost = (formData.ingredients as (string | Ingredient)[])?.reduce((sum, ing) => {
      const cost = typeof ing === 'object' ? (ing.cost || 0) : 0;
      return sum + cost;
    }, 0) || 0;

    if (isEditing) {
      try {
        // API call
        updateRecipe(formData.id.toString(), { ...formData, estimatedCost: totalCost }, getJwtToken());
        
        setRecipes(
          recipes.map((recipe) =>
            recipe.id === formData.id ? { ...formData, estimatedCost: totalCost } : recipe
          )
        );
      } catch (error) {
        console.error(error);
      }
    } else {
      const tempNewRecipe: Recipe = {
        ...formData,
        id: Date.now().toString(),
        title: formData.title || formData.name || '',
        estimatedCost: totalCost,
      };
      try {
        // API call 
        const returnedRecipe: Recipe = await createRecipe(tempNewRecipe, getJwtToken());
        
        setRecipes([...recipes, returnedRecipe]);
      } catch (error) {
        console.error(error)
      }
    }

    setShowModal(false);
    setCustomTags([]);
    setCustomTagInput('');
    setFormData({
      id: '',
      title: '',
      name: '',
      description: '',
      ingredients: [{ name: '', amount: '', unit: '', cost: 0 }],
      steps: [{ text: '' }],
      instructions: [''],
      categories: [],
      difficulty: 'Medium',
      servings: 4,
      prepTime: 15,
      cookTime: 30,
      estimatedCost: 0,
      heroImage: '',
      image: '',
    });
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

      {/* Recipe Grid */}
      <div className="recipe-grid">
        {recipes.map((recipe) => {
          // Calculate total ingredient cost
          const totalIngredientCost = (recipe.ingredients as (string | Ingredient)[])?.reduce((sum, ing) => {
            const cost = typeof ing === 'object' ? (ing.cost || 0) : 0;
            return sum + cost;
          }, 0) || 0;

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
                  <div className="stat-value">${selectedRecipe.estimatedCost?.toFixed(2) || '0.00'}</div>
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
                      Total: ${((formData.ingredients as (string | Ingredient)[])?.reduce((sum, ing) => {
                        const cost = typeof ing === 'object' ? (ing.cost || 0) : 0;
                        return sum + cost;
                      }, 0) || 0).toFixed(2)}
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
                  {(formData.ingredients as (string | any)[])?.map((ingredient, index) => {
                    const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient?.name || '';
                    const ingredientAmount = typeof ingredient === 'object' ? ingredient?.amount || '' : '';
                    const ingredientUnit = typeof ingredient === 'object' ? ingredient?.unit || '' : '';
                    const ingredientCost = typeof ingredient === 'object' ? ingredient?.cost || 0 : 0;
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
                          <input
                            type="text"
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
                            placeholder="Unit"
                            list={`unit-options-${index}`}
                          />
                          <datalist id={`unit-options-${index}`}>
                            {unitOptions.map((unit) => (
                              <option key={unit} value={unit} />
                            ))}
                          </datalist>
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
                    const stepImage = typeof step === 'object' ? step?.image : undefined;
                    const preview = stepImagePreviews[index] || stepImage;

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
