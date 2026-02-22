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

function Homepage({ isLoggedIn, userEmail }: HomepageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  useEffect(() => {
    loadRecipes()
  }, [])

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

  return (
    <div className="homepage">
      <header className="homepage-hero">
        <div className="homepage-hero-content">
          <h1>Plan Meals. Save Money. Eat Well.</h1>
          <p>
            MealMajor helps university students plan weekly meals, discover budget-friendly
            recipes, and manage grocery lists -- all in one place.
          </p>
          {!isLoggedIn && (
            <a href="#signin" className="homepage-hero-cta">
              Get Started
            </a>
          )}
        </div>
      </header>

      <main className="homepage-main">
        <section className="homepage-features">
          <h2 className="homepage-section-title">What You Can Do</h2>
          <div className="homepage-feature-grid">
            <div className="homepage-feature-card">
              <h3>Discover Recipes</h3>
              <p>Browse and search recipes tailored to your dietary preferences and budget.</p>
            </div>
            <div className="homepage-feature-card">
              <h3>Plan Your Week</h3>
              <p>Organize meals for the entire week and generate smart grocery lists.</p>
            </div>
            <div className="homepage-feature-card">
              <h3>Save Money</h3>
              <p>Find affordable meal options with estimated cost breakdowns per recipe.</p>
            </div>
          </div>
        </section>

        {recipes.length > 0 && (
          <section className="homepage-recipes">
            <h2 className="homepage-section-title">Recent Recipes</h2>
            <div className="homepage-recipe-grid">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="homepage-recipe-card">
                  {recipe.heroImage && (
                    <div className="homepage-recipe-image">
                      <img
                        src={`http://localhost:3000/uploads/${recipe.heroImage}`}
                        alt={recipe.title}
                      />
                    </div>
                  )}
                  <div className="homepage-recipe-body">
                    <h3>{recipe.title}</h3>
                    <p className="homepage-recipe-desc">{recipe.description}</p>
                    <div className="homepage-recipe-meta">
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                      <span>${recipe.estimatedCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isLoggedIn && (
          <section className="homepage-user-section">
            <h2 className="homepage-section-title">Your Activity</h2>
            <div className="homepage-activity-card">
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
        <p>MealMajor -- Built for university students, by university students.</p>
      </footer>
    </div>
  )
}

export default Homepage
