import { useState, useEffect, useCallback } from 'react';
import type { Recipe, Ingredient, Step } from '../Recipe-Manager/CreateRecipe';
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe } from '../../api/recipes';
import './Recipes.css';

type ViewMode = 'list' | 'cook' | 'edit' | 'add';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

const emptyRecipe = (): Omit<Recipe, 'id' | 'createdBy' | 'createdAt'> => ({
  title: '',
  description: '',
  ingredients: [{ name: '', amount: '', unit: '', cost: 0 }],
  steps: [{ text: '' }],
  categories: [],
  difficulty: 'Easy',
  prepTime: 0,
  cookTime: 0,
  estimatedCost: 0,
  heroImage: '',
});

function toIngredientObj(ing: string | Ingredient): Ingredient {
  if (typeof ing === 'string') return { name: ing };
  return ing;
}

function toStepObj(step: string | Step): Step {
  if (typeof step === 'string') return { text: step };
  return step;
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Cook mode state
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  // Edit / Add state
  const [form, setForm] = useState<Omit<Recipe, 'id' | 'createdBy' | 'createdAt'>>(emptyRecipe());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch {
      setError('Failed to load recipes. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCook = (recipe: Recipe) => {
    setSelected(recipe);
    setCurrentStep(0);
    setCheckedIngredients(new Set());
    setViewMode('cook');
  };

  const openEdit = (recipe: Recipe) => {
    setSelected(recipe);
    setForm({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.map(toIngredientObj),
      steps: recipe.steps.map(toStepObj),
      categories: [...recipe.categories],
      difficulty: recipe.difficulty ?? 'Easy',
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      estimatedCost: recipe.estimatedCost,
      heroImage: recipe.heroImage ?? '',
    });
    setImagePreview(recipe.heroImage ?? null);
    setFormError(null);
    setViewMode('edit');
  };

  const openAdd = () => {
    setSelected(null);
    setForm(emptyRecipe());
    setImagePreview(null);
    setFormError(null);
    setViewMode('add');
  };

  const backToList = () => {
    setSelected(null);
    setViewMode('list');
  };

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) { next.delete(idx); } else { next.add(idx); }
      return next;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setForm((f) => ({ ...f, heroImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string | number) => {
    setForm((f) => {
      const ingredients = f.ingredients.map(toIngredientObj);
      ingredients[idx] = { ...ingredients[idx], [field]: value };
      return { ...f, ingredients };
    });
  };

  const addIngredient = () => {
    setForm((f) => ({
      ...f,
      ingredients: [...f.ingredients.map(toIngredientObj), { name: '', amount: '', unit: '' }],
    }));
  };

  const removeIngredient = (idx: number) => {
    setForm((f) => {
      const ingredients = f.ingredients.map(toIngredientObj).filter((_, i) => i !== idx);
      return {
        ...f,
        ingredients: ingredients.length ? ingredients : [{ name: '', amount: '', unit: '' }],
      };
    });
  };

  const updateStep = (idx: number, value: string) => {
    setForm((f) => {
      const steps = f.steps.map(toStepObj);
      steps[idx] = { text: value };
      return { ...f, steps };
    });
  };

  const addStep = () => {
    setForm((f) => ({ ...f, steps: [...f.steps.map(toStepObj), { text: '' }] }));
  };

  const removeStep = (idx: number) => {
    setForm((f) => {
      const steps = f.steps.map(toStepObj).filter((_, i) => i !== idx);
      return { ...f, steps: steps.length ? steps : [{ text: '' }] };
    });
  };

  const toggleCategory = (tag: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(tag)
        ? f.categories.filter((c) => c !== tag)
        : [...f.categories, tag],
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError('Recipe title is required.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('You must be logged in to save recipes.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (viewMode === 'add') {
        const created = await createRecipe(
          {
            ...form,
            id: '',
            prepTime: Number(form.prepTime),
            cookTime: Number(form.cookTime),
            estimatedCost: Number(form.estimatedCost),
          },
          token
        );
        const newRecipe = Array.isArray(created) ? created[0] : created;
        setRecipes((prev) => [newRecipe, ...prev]);
      } else if (viewMode === 'edit' && selected) {
        const updated = await updateRecipe(
          String(selected.id),
          {
            ...form,
            id: selected.id,
            prepTime: Number(form.prepTime),
            cookTime: Number(form.cookTime),
            estimatedCost: Number(form.estimatedCost),
          },
          token
        );
        setRecipes((prev) => prev.map((r) => (String(r.id) === String(selected.id) ? updated : r)));
        setSelected(updated);
      }
      backToList();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save recipe.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recipe: Recipe) => {
    if (!confirm(`Delete "${recipe.title}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await deleteRecipe(String(recipe.id), token);
      setRecipes((prev) => prev.filter((r) => String(r.id) !== String(recipe.id)));
      if (selected && String(selected.id) === String(recipe.id)) backToList();
    } catch {
      alert('Failed to delete recipe.');
    }
  };

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const steps = selected ? selected.steps.map(toStepObj) : [];
  const ingredients = selected ? selected.ingredients.map(toIngredientObj) : [];
  const formIngredients = form.ingredients.map(toIngredientObj);
  const formSteps = form.steps.map(toStepObj);

  const categoryTags = [
    'vegetarian',
    'vegan',
    'keto',
    'quick',
    'healthy',
    'budget-friendly',
    'gluten-free',
    'dairy-free',
    'high-protein',
    'pescetarian',
    'halal',
    'kosher',
  ];

  const difficultyColor = (d?: string) => {
    if (d === 'Hard') return 'recipes-badge hard';
    if (d === 'Medium') return 'recipes-badge medium';
    return 'recipes-badge easy';
  };

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="profile-page">
        <div className="profile-shell">
          <header className="profile-header">
            <div>
              <h1>My Recipes</h1>
              <p className="profile-subtitle">
                Add, browse, cook and edit your personal recipe collection.
              </p>
            </div>
            <button type="button" className="profile-button primary" onClick={openAdd}>
              + Add Recipe
            </button>
          </header>

          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Recipe Collection</h2>
            </div>
            <div className="profile-card-body">
              <div className="recipes-search-row">
                <input
                  type="text"
                  className="recipes-search"
                  placeholder="Search recipes…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="recipes-count">
                  {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading && <p className="recipes-status">Loading recipes…</p>}
              {error && <p className="recipes-status error">{error}</p>}

              {!loading && !error && filteredRecipes.length === 0 && (
                <div className="recipes-empty">
                  <p>No recipes found. Add your first recipe!</p>
                  <button type="button" className="profile-button primary" onClick={openAdd}>
                    + Add Recipe
                  </button>
                </div>
              )}

              <div className="recipes-grid">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-card">
                    {recipe.heroImage ? (
                      <img src={recipe.heroImage} alt={recipe.title} className="recipe-card-img" />
                    ) : (
                      <div className="recipe-card-img-placeholder" />
                    )}
                    <div className="recipe-card-body">
                      <div className="recipe-card-tags">
                        <span className={difficultyColor(recipe.difficulty)}>
                          {recipe.difficulty ?? 'Easy'}
                        </span>
                        <span className="recipes-badge time">
                          {(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min
                        </span>
                      </div>
                      <h3 className="recipe-card-title">{recipe.title}</h3>
                      <p className="recipe-card-desc">{recipe.description}</p>
                    </div>
                    <div className="recipe-card-actions">
                      <button
                        type="button"
                        className="profile-button primary"
                        onClick={() => openCook(recipe)}
                      >
                        Cook
                      </button>
                      <button
                        type="button"
                        className="profile-button secondary"
                        onClick={() => openEdit(recipe)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="recipes-delete-btn"
                        onClick={() => handleDelete(recipe)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── COOK MODE ────────────────────────────────────────────────────────────────
  if (viewMode === 'cook' && selected) {
    const totalSteps = steps.length;
    const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

    return (
      <div className="profile-page">
        <div className="profile-shell">
          <header className="profile-header">
            <div>
              <button type="button" className="recipes-back-btn" onClick={backToList}>
                Back
              </button>
              <h1>{selected.title}</h1>
              <p className="profile-subtitle">Cooking Mode — follow the steps below</p>
            </div>
            <button
              type="button"
              className="profile-button secondary"
              onClick={() => openEdit(selected)}
            >
              Switch to Edit
            </button>
          </header>

          {/* Hero image */}
          {selected.heroImage && (
            <div className="recipes-hero-wrap">
              <img src={selected.heroImage} alt={selected.title} className="recipes-hero-img" />
            </div>
          )}

          {/* Meta row */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Overview</h2>
            </div>
            <div className="profile-card-body">
              <div className="recipes-meta-row">
                <div className="recipes-meta-item">
                  <span className="recipes-meta-label">Prep</span>
                  <span className="recipes-meta-value">{selected.prepTime} min</span>
                </div>
                <div className="recipes-meta-item">
                  <span className="recipes-meta-label">Cook</span>
                  <span className="recipes-meta-value">{selected.cookTime} min</span>
                </div>
                <div className="recipes-meta-item">
                  <span className="recipes-meta-label">Difficulty</span>
                  <span className={difficultyColor(selected.difficulty)}>
                    {selected.difficulty ?? 'Easy'}
                  </span>
                </div>
                <div className="recipes-meta-item">
                  <span className="recipes-meta-label">Est. Cost</span>
                  <span className="recipes-meta-value">${selected.estimatedCost?.toFixed(2)}</span>
                </div>
              </div>
              <p className="recipes-description">{selected.description}</p>
            </div>
          </section>

          {/* Ingredients checklist */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Ingredients</h2>
            </div>
            <div className="profile-card-body">
              <p className="profile-card-subtitle">Check off each ingredient as you gather it.</p>
              <ul className="recipes-ingredient-list">
                {ingredients.map((ing, idx) => (
                  <li
                    key={idx}
                    className={`recipes-ingredient-item ${checkedIngredients.has(idx) ? 'checked' : ''}`}
                    onClick={() => toggleIngredient(idx)}
                  >
                    <span className="recipes-ingredient-check">
                      {checkedIngredients.has(idx) ? 'v' : ''}
                    </span>
                    <span className="recipes-ingredient-name">{ing.name}</span>
                    {(ing.amount || ing.unit) && (
                      <span className="recipes-ingredient-amount">
                        {ing.amount} {ing.unit}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Step-by-step */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Steps</h2>
              <span className="recipes-step-counter">
                {currentStep + 1} / {totalSteps}
              </span>
            </div>
            <div className="profile-card-body">
              {/* Progress bar */}
              <div className="recipes-progress-bar">
                <div className="recipes-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* All steps with current highlighted */}
              <div className="recipes-steps-cook">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`recipes-step-item ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'done' : ''}`}
                    onClick={() => setCurrentStep(idx)}
                  >
                    <div className="recipes-step-num">{idx + 1}</div>
                    <p className="recipes-step-text">{step.text}</p>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="recipes-step-nav">
                <button
                  type="button"
                  className="profile-button secondary"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                >
                  Previous
                </button>
                {currentStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    className="profile-button primary"
                    onClick={() => setCurrentStep((s) => s + 1)}
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    className="profile-button primary recipes-done-btn"
                    onClick={backToList}
                  >
                    Done Cooking!
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── EDIT / ADD FORM ──────────────────────────────────────────────────────────
  if (viewMode === 'edit' || viewMode === 'add') {
    const isAdding = viewMode === 'add';
    const heading = isAdding ? 'New Recipe' : `Editing: ${selected?.title ?? ''}`;

    return (
      <div className="profile-page">
        <div className="profile-shell">
          <header className="profile-header">
            <div>
              <button type="button" className="recipes-back-btn" onClick={backToList}>
                Back
              </button>
              <h1>{heading}</h1>
              <p className="profile-subtitle">
                {isAdding
                  ? 'Fill in the details to add a new recipe.'
                  : 'Make changes and save when ready.'}
              </p>
            </div>
            {!isAdding && selected && (
              <button
                type="button"
                className="profile-button secondary"
                onClick={() => openCook(selected)}
              >
                Switch to Cook
              </button>
            )}
          </header>

          {formError && <div className="recipes-form-error">{formError}</div>}

          {/* Basic Info */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Basic Info</h2>
            </div>
            <div className="profile-card-body">
              <div className="profile-grid one">
                <div className="profile-field">
                  <label htmlFor="r-title">
                    Title <span className="required">*</span>
                  </label>
                  <input
                    id="r-title"
                    type="text"
                    value={form.title}
                    placeholder="e.g. Spaghetti Carbonara"
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
              </div>
              <div className="profile-grid one" style={{ marginTop: 16 }}>
                <div className="profile-field">
                  <label htmlFor="r-desc">Description</label>
                  <textarea
                    id="r-desc"
                    className="recipes-textarea"
                    value={form.description}
                    placeholder="A short description of the recipe…"
                    rows={3}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="profile-grid two" style={{ marginTop: 16 }}>
                <div className="profile-field">
                  <label htmlFor="r-prep">Prep Time (min)</label>
                  <input
                    id="r-prep"
                    type="number"
                    min={0}
                    value={form.prepTime}
                    onChange={(e) => setForm((f) => ({ ...f, prepTime: Number(e.target.value) }))}
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="r-cook">Cook Time (min)</label>
                  <input
                    id="r-cook"
                    type="number"
                    min={0}
                    value={form.cookTime}
                    onChange={(e) => setForm((f) => ({ ...f, cookTime: Number(e.target.value) }))}
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="r-difficulty">Difficulty</label>
                  <select
                    id="r-difficulty"
                    className="recipes-select"
                    value={form.difficulty ?? 'Easy'}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="profile-field">
                  <label htmlFor="r-cost">Estimated Cost ($)</label>
                  <input
                    id="r-cost"
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.estimatedCost}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, estimatedCost: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Hero Image */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Photo</h2>
            </div>
            <div className="profile-card-body recipes-image-section">
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="recipes-image-preview" />
              )}
              <label className="profile-button secondary recipes-image-label">
                {imagePreview ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="recipes-image-input"
                />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  className="profile-button secondary"
                  onClick={() => {
                    setImagePreview(null);
                    setForm((f) => ({ ...f, heroImage: '' }));
                  }}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </section>

          {/* Ingredients */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Ingredients</h2>
            </div>
            <div className="profile-card-body">
              <div className="recipes-ingredients-header">
                <span className="recipes-col-label">Name</span>
                <span className="recipes-col-label">Amount</span>
                <span className="recipes-col-label">Unit</span>
                <span className="recipes-col-label">Cost ($)</span>
                <span />
              </div>
              {formIngredients.map((ing, idx) => (
                <div key={idx} className="recipes-ingredient-row">
                  <input
                    type="text"
                    placeholder="e.g. Flour"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="e.g. 200"
                    value={ing.amount ?? ''}
                    onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="e.g. g"
                    value={ing.unit ?? ''}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={ing.cost ?? ''}
                    onChange={(e) => updateIngredient(idx, 'cost', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="recipes-row-remove"
                    onClick={() => removeIngredient(idx)}
                    title="Remove"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="profile-button secondary recipes-add-row-btn"
                onClick={addIngredient}
              >
                + Add Ingredient
              </button>
            </div>
          </section>

          {/* Steps */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Steps</h2>
            </div>
            <div className="profile-card-body">
              {formSteps.map((step, idx) => (
                <div key={idx} className="recipes-step-edit-row">
                  <div className="recipes-step-edit-num">{idx + 1}</div>
                  <textarea
                    className="recipes-textarea"
                    placeholder={`Step ${idx + 1}…`}
                    value={step.text}
                    rows={2}
                    onChange={(e) => updateStep(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="recipes-row-remove"
                    onClick={() => removeStep(idx)}
                    title="Remove"
                  >
                    x
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="profile-button secondary recipes-add-row-btn"
                onClick={addStep}
              >
                + Add Step
              </button>
            </div>
          </section>

          {/* Categories */}
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Tags &amp; Categories</h2>
            </div>
            <div className="profile-card-body">
              <p className="profile-card-subtitle">Select any that apply to this recipe.</p>
              <div className="profile-chip-grid">
                {categoryTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`profile-chip ${form.categories.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleCategory(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="profile-actions">
            <button type="button" className="profile-button secondary" onClick={backToList}>
              Cancel
            </button>
            <button
              type="button"
              className="profile-button primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : isAdding ? 'Create Recipe' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
