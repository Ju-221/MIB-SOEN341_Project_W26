import React, { useEffect } from 'react';
import './RecipePopup.css';
import { IMAGES_URL } from '../../api/recipes';

interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedCost: number;
  heroImage: string | null;
  ingredients: (string | Ingredient)[];
  steps: string[];
  categories: string[];
  createdAt?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
}

interface RecipePopupProps {
  recipe: Recipe;
  onClose: () => void;
}

const difficultyColor: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
};

function formatIngredient(ing: string | Ingredient): string {
  if (typeof ing === 'string') return ing;
  const parts = [ing.amount, ing.unit].filter(Boolean).join(' ');
  return parts ? `${ing.name} — ${parts}` : ing.name;
}

function loadHeroImage(recipe: Recipe) {
  if (!recipe.heroImage) {
    return '/food-clipart.jpg';
  } else {
    return `${IMAGES_URL}/${recipe.heroImage}`;
  }
}

const RecipePopup: React.FC<RecipePopupProps> = ({ recipe, onClose }) => {
  const [heroImageCache, setHeroImageCache] = React.useState<Map<number, string>>(new Map());

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        {/* Hero image */}
        <div className="popup-hero">
          {(() => {
            const cachedImage = heroImageCache.get(recipe.id);
            const imageUrl = cachedImage || loadHeroImage(recipe);
            if (!cachedImage) {
              setHeroImageCache((prev) => new Map(prev).set(recipe.id, imageUrl));
            }
            return (
              <img src={imageUrl} alt={recipe.title} />
            );
          })()}
          <div className="popup-hero-overlay" />
          <button className="popup-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="popup-body">
          {/* Title + difficulty */}
          <div className="popup-title-row">
            <h2 className="popup-title">{recipe.title}</h2>
            <span
              className="popup-difficulty"
              style={{ background: difficultyColor[recipe.difficulty] }}
            >
              {recipe.difficulty}
            </span>
          </div>

          {/* Meta bar */}
          <div className="popup-meta">
            <div className="popup-meta-item">
              <span className="popup-meta-icon">⏱️</span>
              <div>
                <p className="popup-meta-label">Total time</p>
                <p className="popup-meta-value">{totalTime} min</p>
              </div>
            </div>
            <div className="popup-meta-divider" />
            <div className="popup-meta-item">
              <span className="popup-meta-icon">🥘</span>
              <div>
                <p className="popup-meta-label">Prep</p>
                <p className="popup-meta-value">{recipe.prepTime} min</p>
              </div>
            </div>
            <div className="popup-meta-divider" />
            <div className="popup-meta-item">
              <span className="popup-meta-icon">🔥</span>
              <div>
                <p className="popup-meta-label">Cook</p>
                <p className="popup-meta-value">{recipe.cookTime} min</p>
              </div>
            </div>
            <div className="popup-meta-divider" />
            <div className="popup-meta-item">
              <span className="popup-meta-icon">💰</span>
              <div>
                <p className="popup-meta-label">Est. cost</p>
                <p className="popup-meta-value">${recipe.estimatedCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <section className="popup-section">
            <p className="popup-description">{recipe.description}</p>
          </section>

          {/* Ingredients */}
          <section className="popup-section">
            <h3 className="popup-section-title">Ingredients</h3>
            <ul className="popup-ingredients">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="popup-ingredient">
                  <span className="popup-ingredient-dot" />
                  {formatIngredient(ing)}
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <section className="popup-section">
              <h3 className="popup-section-title">Instructions</h3>
              <ol className="popup-steps">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="popup-step">
                    <span className="popup-step-num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Tags */}
          <section className="popup-section popup-tags-section">
            {recipe.categories.length > 0 && (
              <div className="popup-tag-group">
                <p className="popup-tag-label">Categories</p>
                <div className="popup-tags">
                  {recipe.categories.map((t) => (
                    <span key={t} className="popup-tag popup-tag--category">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {recipe.dietaryPreferences && recipe.dietaryPreferences.length > 0 && (
              <div className="popup-tag-group">
                <p className="popup-tag-label">Dietary</p>
                <div className="popup-tags">
                  {recipe.dietaryPreferences.map((t) => (
                    <span key={t} className="popup-tag popup-tag--diet">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {recipe.allergies && recipe.allergies.length > 0 && (
              <div className="popup-tag-group">
                <p className="popup-tag-label">Allergens</p>
                <div className="popup-tags">
                  {recipe.allergies.map((t) => (
                    <span key={t} className="popup-tag popup-tag--allergy">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default RecipePopup;
