import { useState, useEffect } from 'react'
import './Homepage.css'

interface HomepageProps {
  isLoggedIn: boolean
  userEmail: string | null
}

interface Recipe {
  id: number
  title: string
  description: string
  prepTime: number
  cookTime: number
  estimatedCost: number
  heroImage: string | null
  categories: string[]
}

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: 'Discover Recipes',
    desc: 'Browse and search recipes tailored to your dietary preferences and budget.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    title: 'Plan Your Week',
    desc: 'Organize meals for the entire week and generate smart grocery lists with ease.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Save Money',
    desc: 'Find affordable meal options with estimated cost breakdowns per recipe.',
  },
]

function getInitial(email: string | null): string {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}

function Homepage({ isLoggedIn, userEmail }: HomepageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  const loadRecipes = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/recipes')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.slice(0, 6))
      }
    } catch (error) {
      console.error('Error loading recipes:', error)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecipes()
  }, [])

  return (
    <div className="homepage">
      {/* Hero */}
      <header className="homepage-hero">
        <div className="homepage-hero-content">
          <h1>Plan Meals. Save Money. Eat Well.</h1>
          <p>
            MealMajor helps university students plan weekly meals, discover budget-friendly
            recipes, and manage grocery lists &mdash; all in one place.
          </p>
          {!isLoggedIn && (
            <a href="#signin" className="homepage-hero-cta">
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
        <div className="homepage-hero-curve" aria-hidden="true" />
      </header>

      {/* Stats strip */}
      <div className="homepage-stats">
        <div className="homepage-stat">
          <span className="homepage-stat-value">100+</span>
          <span className="homepage-stat-label">Recipes</span>
        </div>
        <div className="homepage-stat">
          <span className="homepage-stat-value">Free</span>
          <span className="homepage-stat-label">Always</span>
        </div>
        <div className="homepage-stat">
          <span className="homepage-stat-value">AI</span>
          <span className="homepage-stat-label">Powered</span>
        </div>
      </div>

      <main className="homepage-main">
        {/* Features */}
        <section className="homepage-features">
          <h2 className="homepage-section-title">What You Can Do</h2>
          <p className="homepage-section-subtitle">
            Everything you need to eat smarter and spend less.
          </p>
          <div className="homepage-feature-grid">
            {FEATURES.map(feature => (
              <div key={feature.title} className="homepage-feature-card">
                <div className="homepage-feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Recipes */}
        {recipes.length > 0 && (
          <section className="homepage-recipes">
            <h2 className="homepage-section-title">Recent Recipes</h2>
            <p className="homepage-section-subtitle">
              Fresh meals added by our community.
            </p>
            <div className="homepage-recipe-grid">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="homepage-recipe-card">
                  <div className="homepage-recipe-image">
                    <img
                      src={recipe.heroImage
                        ? `http://localhost:3000/uploads/${recipe.heroImage}`
                        : 'http://localhost:3000/uploads/1.jpeg'}
                      alt={recipe.title}
                    />
                  </div>
                  <div className="homepage-recipe-body">
                    <h3>{recipe.title}</h3>
                    <p className="homepage-recipe-desc">{recipe.description}</p>
                    <div className="homepage-recipe-meta">
                      <span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {recipe.prepTime + recipe.cookTime} min
                      </span>
                      <span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        ${recipe.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Logged-in user welcome */}
        {isLoggedIn && (
          <section className="homepage-user-section">
            <h2 className="homepage-section-title">Your Activity</h2>
            <div className="homepage-activity-card">
              <div className="homepage-activity-avatar" aria-hidden="true">
                {getInitial(userEmail)}
              </div>
              <div className="homepage-activity-content">
                <p className="homepage-activity-welcome">
                  Welcome back, <strong>{userEmail}</strong>
                </p>
                <p className="homepage-activity-hint">
                  Head over to your <a href="#profile">Profile</a> to update your dietary
                  preferences and allergies, so we can recommend the best recipes for you.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="homepage-footer">
        <p>MealMajor &mdash; Built for university students, by university students.</p>
      </footer>
    </div>
  )
}

export default Homepage