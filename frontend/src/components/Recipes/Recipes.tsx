import { useState, useEffect, useCallback } from 'react';
import type { Recipe, Ingredient, Step } from '../Recipe-Manager/CreateRecipe';
import {
  fetchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  IMAGES_URL,
} from '../../api/recipes';
import {
  ALLERGY_FIELD_TO_OPTION,
  ALLERGY_OPTIONS,
  normalizeAllergyLabels,
} from '../../constants/allergies';
import './Recipes.css';

type ViewMode = 'list' | 'cook' | 'edit' | 'add';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

type AllergyPreferences = Record<string, boolean | number | string | null | undefined>;

const emptyRecipe = (): Omit<Recipe, 'id' | 'createdBy' | 'createdAt'> => ({
  title: '',
  description: '',
  ingredients: [{ name: '', amount: '', unit: '', cost: 0 }],
  steps: [{ text: '' }],
  categories: [],
  allergies: [],
  dietaryPreferences: [],
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

function getSelectedAllergyTags(allergies: AllergyPreferences): string[] {
  return Object.entries(allergies).flatMap(([key, value]) => {
    if (value !== true && value !== 1 && value !== 'true') return [];
    return ALLERGY_FIELD_TO_OPTION[key] ?? [key];
  });
}

function getRecipeAllergyMatches(recipe: Recipe, selectedAllergyTags: string[]): string[] {
  if (selectedAllergyTags.length === 0) return [];

  const recipeAllergies = new Set(
    normalizeAllergyLabels(recipe.allergies).map((allergy) => allergy.toLowerCase())
  );
  const matches = selectedAllergyTags.filter((tag) => recipeAllergies.has(tag.toLowerCase()));

  return [...new Set(matches)];
}

export default function Recipes() {
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id as number;
    } catch {
      return null;
    }
  })();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedAllergyTags, setSelectedAllergyTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [maxPrepTime, setMaxPrepTime] = useState('');
  const [maxCookTime, setMaxCookTime] = useState('');
  const [maxTotalTime, setMaxTotalTime] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [filterDifficulties, setFilterDifficulties] = useState<Set<string>>(new Set());
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());
  const [filterAllergens, setFilterAllergens] = useState<Set<string>>(new Set());

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSelectedAllergyTags([]);
      return;
    }

    const loadAllergies = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = (await response.json()) as { allergies?: AllergyPreferences };
        setSelectedAllergyTags(getSelectedAllergyTags(data.allergies ?? {}));
      } catch {
        setSelectedAllergyTags([]);
      }
    };

    void loadAllergies();
  }, []);

  const openCook = (recipe: Recipe) => {
    setSelected(recipe);
    setCurrentStep(0);
    setCheckedIngredients(new Set());
    setViewMode('cook');
  };

  const resolveImageUrl = (heroImage?: string | null): string => {
    if (!heroImage) return '/food-clipart.jpg';
    if (heroImage.startsWith('http') || heroImage.startsWith('data:')) return heroImage;
    return `${IMAGES_URL}/${heroImage}`;
  };

  const openEdit = (recipe: Recipe) => {
    setSelected(recipe);
    setForm({
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients.map(toIngredientObj),
      steps: recipe.steps.map(toStepObj),
      categories: [...recipe.categories],
      allergies: normalizeAllergyLabels(recipe.allergies),
      dietaryPreferences: [...(recipe.dietaryPreferences ?? [])],
      difficulty: recipe.difficulty ?? 'Easy',
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      estimatedCost: recipe.estimatedCost,
      heroImage: recipe.heroImage ?? '',
    });
    setImagePreview(resolveImageUrl(recipe.heroImage));
    setHeroImageFile(null);
    setFormError(null);
    setViewMode('edit');
  };

  const openAdd = () => {
    setSelected(null);
    setForm(emptyRecipe());
    setImagePreview(null);
    setHeroImageFile(null);
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
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((f) => ({ ...f, heroImage: file.name }));
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

  const toggleFilterDifficulty = (d: string) => {
    setFilterDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) {
        next.delete(d);
      } else {
        next.add(d);
      }
      return next;
    });
  };

  const toggleFilterTag = (tag: string) => {
    setFilterTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const toggleFilterAllergen = (tag: string) => {
    setFilterAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setIngredientSearch('');
    setMaxPrepTime('');
    setMaxCookTime('');
    setMaxTotalTime('');
    setMaxCost('');
    setFilterDifficulties(new Set());
    setFilterTags(new Set());
    setFilterAllergens(new Set());
  };

  const toggleCategory = (tag: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(tag)
        ? f.categories.filter((c) => c !== tag)
        : [...f.categories, tag],
    }));
  };

  const toggleAllergy = (tag: string) => {
    setForm((f) => {
      const allergies = f.allergies ?? [];
      return {
        ...f,
        allergies: allergies.includes(tag)
          ? allergies.filter((allergy) => allergy !== tag)
          : [...allergies, tag],
      };
    });
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
          token,
          heroImageFile
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
          token,
          heroImageFile
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
    const token = localStorage.getItem('token');
    if (!token) {
      setDeleteError('You must be logged in to delete recipes.');
      return;
    }
    setDeleteError(null);
    try {
      await deleteRecipe(String(recipe.id), token);
      setRecipes((prev) => prev.filter((r) => String(r.id) !== String(recipe.id)));
      setDeleteConfirmId(null);
      if (selected && String(selected.id) === String(recipe.id)) backToList();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete recipe.');
      setDeleteConfirmId(null);
    }
  };

  const filteredRecipes = recipes.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const inTitle = r.title.toLowerCase().includes(q);
      const inDesc = (r.description ?? '').toLowerCase().includes(q);
      const inTags = r.categories.some((c) => c.toLowerCase().includes(q));
      const inSteps = r.steps.map(toStepObj).some((s) => s.text.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inTags && !inSteps) return false;
    }
    if (ingredientSearch.trim()) {
      const wanted = ingredientSearch
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const have = r.ingredients.map(toIngredientObj).map((i) => i.name.toLowerCase());
      if (!wanted.every((w) => have.some((h) => h.includes(w)))) return false;
    }
    if (maxPrepTime !== '' && (r.prepTime ?? 0) > Number(maxPrepTime)) return false;
    if (maxCookTime !== '' && (r.cookTime ?? 0) > Number(maxCookTime)) return false;
    if (maxTotalTime !== '' && (r.prepTime ?? 0) + (r.cookTime ?? 0) > Number(maxTotalTime))
      return false;
    if (maxCost !== '' && (r.estimatedCost ?? 0) > Number(maxCost)) return false;
    if (filterDifficulties.size > 0) {
      const d = (r.difficulty ?? 'Easy').toLowerCase();
      if (!filterDifficulties.has(d)) return false;
    }
    if (filterTags.size > 0) {
      const recipeTags = r.categories.map((c) => c.toLowerCase());
      for (const tag of filterTags) {
        if (!recipeTags.includes(tag)) return false;
      }
    }
    if (filterAllergens.size > 0) {
      const recipeAllergies = normalizeAllergyLabels(r.allergies).map((allergy) =>
        allergy.toLowerCase()
      );
      for (const allergen of filterAllergens) {
        if (recipeAllergies.includes(allergen)) return false;
      }
    }
    return true;
  });

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (ingredientSearch.trim() ? 1 : 0) +
    (maxPrepTime ? 1 : 0) +
    (maxCookTime ? 1 : 0) +
    (maxTotalTime ? 1 : 0) +
    (maxCost ? 1 : 0) +
    filterDifficulties.size +
    filterTags.size +
    filterAllergens.size;

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

          {/* ── Filter panel ──────────────────────────────────────────── */}
          <div className="recipes-filter-panel">
            <div className="recipes-filter-header">
              <span className="recipes-filter-title">Filter Recipes</span>
              <div className="recipes-filter-header-actions">
                <span className="recipes-filter-count">
                  Showing {filteredRecipes.length} of {recipes.length}
                </span>
                {activeFilterCount > 0 && (
                  <button type="button" className="recipes-filter-clear" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  className="recipes-filter-toggle"
                  onClick={() => setFilterOpen((o) => !o)}
                  aria-label={filterOpen ? 'Collapse filters' : 'Expand filters'}
                >
                  {filterOpen ? '−' : '+'}
                </button>
              </div>
            </div>

            {filterOpen && (
              <div className="recipes-filter-body">
                {/* Row 1: text search + ingredient search */}
                <div className="recipes-filter-grid-2">
                  <div className="recipes-filter-field">
                    <label className="recipes-filter-label">
                      Search (title, description, tags, steps)
                    </label>
                    <input
                      type="text"
                      className="recipes-filter-input"
                      placeholder="e.g. healthy quick pasta"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="recipes-filter-field">
                    <label className="recipes-filter-label">Ingredients (comma separated)</label>
                    <input
                      type="text"
                      className="recipes-filter-input"
                      placeholder="e.g. tomato, basil"
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 2: time + cost */}
                <div className="recipes-filter-grid-4">
                  <div className="recipes-filter-field">
                    <label className="recipes-filter-label">Max Prep Time (min)</label>
                    <input
                      type="number"
                      min={0}
                      className="recipes-filter-input"
                      placeholder="Any"
                      value={maxPrepTime}
                      onChange={(e) => setMaxPrepTime(e.target.value)}
                    />
                  </div>
                  <div className="recipes-filter-field">
                    <label className="recipes-filter-label">Max Cook Time (min)</label>
                    <input
                      type="number"
                      min={0}
                      className="recipes-filter-input"
                      placeholder="Any"
                      value={maxCookTime}
                      onChange={(e) => setMaxCookTime(e.target.value)}
                    />
                  </div>
                  <div className="recipes-filter-field">
                    <label className="recipes-filter-label">Max Total Time (min)</label>
                    <input
                      type="number"
                      min={0}
                      className="recipes-filter-input"
                      placeholder="Any"
                      value={maxTotalTime}
                      onChange={(e) => setMaxTotalTime(e.target.value)}
                    />
                  </div>
                  <div className="recipes-filter-field">
                    <label className="recipes-filter-label">Max Cost ($)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="recipes-filter-input"
                      placeholder="Any"
                      value={maxCost}
                      onChange={(e) => setMaxCost(e.target.value)}
                    />
                  </div>
                </div>

                {/* Difficulty */}
                <div className="recipes-filter-group">
                  <span className="recipes-filter-group-label">Difficulty</span>
                  <div className="recipes-filter-chips">
                    {['easy', 'medium', 'hard'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`recipes-filter-chip ${filterDifficulties.has(d) ? 'active' : ''}`}
                        onClick={() => toggleFilterDifficulty(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dietary tags */}
                <div className="recipes-filter-group">
                  <span className="recipes-filter-group-label">Dietary Tags</span>
                  <div className="recipes-filter-chips">
                    {[
                      'vegetarian',
                      'vegan',
                      'keto',
                      'low-carb',
                      'high-protein',
                      'pescetarian',
                      'halal',
                      'kosher',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`recipes-filter-chip ${filterTags.has(tag) ? 'active' : ''}`}
                        onClick={() => toggleFilterTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goals & attributes */}
                <div className="recipes-filter-group">
                  <span className="recipes-filter-group-label">Goals &amp; Attributes</span>
                  <div className="recipes-filter-chips">
                    {['quick', 'healthy', 'budget-friendly', 'gluten-free', 'dairy-free'].map(
                      (tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`recipes-filter-chip ${filterTags.has(tag) ? 'active' : ''}`}
                          onClick={() => toggleFilterTag(tag)}
                        >
                          {tag}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Allergies & intolerances — excludes recipes tagged with selected items */}
                <div className="recipes-filter-group">
                  <span className="recipes-filter-group-label">Allergies &amp; Intolerances</span>
                  <p className="recipes-filter-group-hint">
                    Select what you can&apos;t eat — recipes containing these will be hidden.
                  </p>
                  <div className="recipes-filter-chips">
                    {ALLERGY_OPTIONS.map((allergy) => (
                      <button
                        key={allergy}
                        type="button"
                        className={`recipes-filter-chip allergen ${filterAllergens.has(allergy) ? 'active' : ''}`}
                        onClick={() => toggleFilterAllergen(allergy)}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {deleteError && (
            <div className="recipes-delete-error">
              <span>{deleteError}</span>
              <button type="button" onClick={() => setDeleteError(null)}>
                ✕
              </button>
            </div>
          )}

          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Recipe Collection</h2>
            </div>
            <div className="profile-card-body">
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
                {filteredRecipes.map((recipe) => {
                  const allergyMatches = getRecipeAllergyMatches(recipe, selectedAllergyTags);

                  return (
                    <div key={recipe.id} className="recipe-card">
                      <img
                        src={resolveImageUrl(recipe.heroImage)}
                        alt={recipe.title}
                        className="recipe-card-img"
                      />
                      <div className="recipe-card-body">
                        <div className="recipe-card-tags">
                          <span className={difficultyColor(recipe.difficulty)}>
                            {recipe.difficulty ?? 'Easy'}
                          </span>
                          <span className="recipes-badge time">
                            {(recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)} min
                          </span>
                        </div>
                        {allergyMatches.length > 0 && (
                          <p className="recipe-allergy-warning">
                            Contains an allergy associated with your profile.
                          </p>
                        )}
                        <h3 className="recipe-card-title">{recipe.title}</h3>
                        <p className="recipe-card-desc">{recipe.description}</p>
                      </div>
                      <div className="recipe-card-actions">
                        {deleteConfirmId === String(recipe.id) ? (
                          <div className="recipes-delete-confirm">
                            <span>Delete this recipe?</span>
                            <button
                              type="button"
                              className="recipes-delete-confirm-yes"
                              onClick={() => handleDelete(recipe)}
                            >
                              Yes, delete
                            </button>
                            <button
                              type="button"
                              className="recipes-delete-confirm-no"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="profile-button primary"
                              onClick={() => openCook(recipe)}
                            >
                              Cook
                            </button>
                            {currentUserId === recipe.createdBy && (
                              <>
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
                                  onClick={() => setDeleteConfirmId(String(recipe.id))}
                                  title="Delete"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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
            {currentUserId === selected.createdBy && (
              <button
                type="button"
                className="profile-button secondary"
                onClick={() => openEdit(selected)}
              >
                Switch to Edit
              </button>
            )}
          </header>

          {/* Hero image */}
          <div className="recipes-hero-wrap">
            <img
              src={resolveImageUrl(selected.heroImage)}
              alt={selected.title}
              className="recipes-hero-img"
            />
          </div>

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
                    setHeroImageFile(null);
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
              <p className="profile-card-subtitle recipes-allergy-tags-title">
                Select any allergies or intolerances this recipe contains.
              </p>
              <div className="profile-chip-grid">
                {ALLERGY_OPTIONS.map((allergy) => (
                  <button
                    key={allergy}
                    type="button"
                    className={`profile-chip ${(form.allergies ?? []).includes(allergy) ? 'selected' : ''}`}
                    onClick={() => toggleAllergy(allergy)}
                  >
                    {allergy}
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
