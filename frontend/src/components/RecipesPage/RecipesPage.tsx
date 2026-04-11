import { useState, useEffect } from 'react';
import './RecipesPage.css';

interface RecipesPageProps {
  isLoggedIn: boolean;
  userEmail: string | null;
}

interface Recipe {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  estimatedCost: number;
  heroImage: string | null;
  categories: string[];
}

function IconRecipes() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="14" y="14" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M8 12h8M12 8v8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.2" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg
      className="hp-feature-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg
      className="hp-recipe-placeholder-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <IconRecipes />,
    title: 'My Recipes',
    desc: 'Build and manage your personal recipe collection. Cook step-by-step or edit on the fly.',
    href: '#recipes',
  },
  {
    icon: <IconCalendar />,
    title: 'Meal Calendar',
    desc: 'Plan every meal for the week. Drag recipes onto any day and stay organised.',
    href: '#calendar',
  },
  {
    icon: <IconAI />,
    title: 'AI Recipe Gen',
    desc: 'Describe what you feel like eating and get a full recipe generated in seconds.',
    href: '#aichat',
  },
  {
    icon: <IconProfile />,
    title: 'Profile',
    desc: 'Set your dietary preferences and allergies so recommendations always fit your lifestyle.',
    href: '#profile',
  },
];

function difficultyBadgeClass(d?: string) {
  if (d === 'Hard') return 'hp-badge hard';
  if (d === 'Medium') return 'hp-badge medium';
  return 'hp-badge easy';
}

function RecipesPage({ isLoggedIn, userEmail }: RecipesPageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/recipes')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Recipe[]) => setRecipes(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-shell">
        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="profile-header">
          <div>
            <h1>
              {isLoggedIn
                ? `Welcome back${userEmail ? `, ${userEmail.split('@')[0]}` : ''}`
                : 'Welcome to MealMajor'}
            </h1>
            <p className="profile-subtitle">
              {isLoggedIn
                ? "Here's a quick look at your app. Jump in from any section below."
                : 'Plan meals, discover recipes, and eat well on a budget. Sign in to get started.'}
            </p>
          </div>
          {!isLoggedIn && (
            <a href="#signin" className="profile-button primary hp-cta">
              Get Started
            </a>
          )}
        </header>

        {/* ── Quick-nav cards ─────────────────────────────────────── */}
        <section className="profile-card">
          <div className="profile-card-header">
            <h2>What You Can Do</h2>
          </div>
          <div className="profile-card-body">
            <div className="hp-feature-grid">
              {FEATURES.map((f) => (
                <a key={f.href} href={isLoggedIn ? f.href : '#signin'} className="hp-feature-card">
                  {f.icon}
                  <h3 className="hp-feature-title">{f.title}</h3>
                  <p className="hp-feature-desc">{f.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Recent recipes (only when there are some) ───────────── */}
        {recipes.length > 0 && (
          <section className="profile-card">
            <div className="profile-card-header">
              <h2>Recent Recipes</h2>
              {isLoggedIn && (
                <a href="#recipes" className="hp-see-all">
                  See all
                </a>
              )}
            </div>
            <div className="profile-card-body">
              <div className="hp-recipe-grid">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="hp-recipe-card">
                    {recipe.heroImage ? (
                      <img
                        src={`http://localhost:3000/uploads/${recipe.heroImage}`}
                        alt={recipe.title}
                        className="hp-recipe-img"
                      />
                    ) : (
                      <div className="hp-recipe-img-placeholder">
                        <IconImage />
                      </div>
                    )}
                    <div className="hp-recipe-body">
                      <div className="hp-recipe-tags">
                        <span className={difficultyBadgeClass(recipe.difficulty)}>
                          {recipe.difficulty ?? 'Easy'}
                        </span>
                        <span className="hp-badge time">
                          {recipe.prepTime + recipe.cookTime} min
                        </span>
                      </div>
                      <h3 className="hp-recipe-title">{recipe.title}</h3>
                      <p className="hp-recipe-desc">{recipe.description}</p>
                      <span className="hp-recipe-cost">${recipe.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default RecipesPage;
