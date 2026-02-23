import React, { useState } from 'react';
import './CreateRecipe.css';

interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
  prepTime: number;
  cookTime: number;
  image: string;
}

const RecipeManager: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'Sample Recipe',
      description: 'A delicious sample recipe',
      ingredients: ['Ingredient 1', 'Ingredient 2'],
      instructions: ['Step 1', 'Step 2'],
      servings: 4,
      prepTime: 15,
      cookTime: 30,
      image: 'https://via.placeholder.com/300x200?text=Recipe',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState<Recipe>({
    id: '',
    name: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    servings: 4,
    prepTime: 15,
    cookTime: 30,
    image: '',
  });

  const handleCreateRecipe = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      ingredients: [''],
      instructions: [''],
      servings: 4,
      prepTime: 15,
      cookTime: 30,
      image: '',
    });
    setImagePreview('');
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setFormData(recipe);
    setImagePreview(recipe.image);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteRecipe = (id: string) => {
    setSelectedRecipeId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRecipe = () => {
    if (selectedRecipeId) {
      setRecipes(recipes.filter((recipe) => recipe.id !== selectedRecipeId));
      setShowDeleteConfirm(false);
      setSelectedRecipeId(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({ ...formData, image: result });
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
    field: 'ingredients' | 'instructions',
    value: string
  ) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData({ ...formData, [field]: updatedArray });
  };

  const handleAddArrayField = (field: 'ingredients' | 'instructions') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const handleRemoveArrayField = (
    index: number,
    field: 'ingredients' | 'instructions'
  ) => {
    const updatedArray = formData[field].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [field]: updatedArray.length > 0 ? updatedArray : [''],
    });
  };

  const handleSaveRecipe = () => {
    if (!formData.name.trim()) {
      alert('Please enter a recipe name');
      return;
    }

    if (isEditing) {
      setRecipes(
        recipes.map((recipe) => (recipe.id === formData.id ? formData : recipe))
      );
    } else {
      const newRecipe: Recipe = {
        ...formData,
        id: Date.now().toString(),
      };
      setRecipes([...recipes, newRecipe]);
    }

    setShowModal(false);
    setFormData({
      id: '',
      name: '',
      description: '',
      ingredients: [''],
      instructions: [''],
      servings: 4,
      prepTime: 15,
      cookTime: 30,
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
        {recipes.map((recipe) => (
          <div key={recipe.id} className="recipe-card">
            <div className="recipe-image-container">
              <img
                src={recipe.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={recipe.name}
                className="recipe-image"
              />
            </div>
            <div className="recipe-content">
              <h2>{recipe.name}</h2>
              <p className="recipe-description">{recipe.description}</p>
              <div className="recipe-meta">
                <div className="meta-item">
                  <span className="meta-label">Servings:</span>
                  <span>{recipe.servings}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Prep:</span>
                  <span>{recipe.prepTime} min</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Cook:</span>
                  <span>{recipe.cookTime} min</span>
                </div>
              </div>
            </div>
            <div className="recipe-actions">
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
        ))}
      </div>

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
                      <span className="upload-icon">📷</span>
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
                <label htmlFor="name" className="form-label">
                  Recipe Name *
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
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
                <label className="form-label">Ingredients</label>
                <div className="array-fields">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="array-field-row">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            index,
                            'ingredients',
                            e.target.value
                          )
                        }
                        className="form-input"
                        placeholder={`Ingredient ${index + 1}`}
                      />
                      {formData.ingredients.length > 1 && (
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
                  ))}
                  <button
                    type="button"
                    className="btn btn-add-field"
                    onClick={() => handleAddArrayField('ingredients')}
                  >
                    + Add Ingredient
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <div className="array-fields">
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="array-field-row">
                      <textarea
                        value={instruction}
                        onChange={(e) =>
                          handleArrayFieldChange(
                            index,
                            'instructions',
                            e.target.value
                          )
                        }
                        className="form-input form-textarea"
                        placeholder={`Step ${index + 1}`}
                        rows={2}
                      />
                      {formData.instructions.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() =>
                            handleRemoveArrayField(index, 'instructions')
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-add-field"
                    onClick={() => handleAddArrayField('instructions')}
                  >
                    + Add Step
                  </button>
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
