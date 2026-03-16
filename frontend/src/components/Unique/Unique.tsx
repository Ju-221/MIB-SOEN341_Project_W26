import React from 'react'
import Card from './Card'
import Aurora from './Background'
import { useState, useEffect } from 'react'

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

const Unique: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([])

  const loadRecipes = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/recipes')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data)
      }
    } catch (error) {
      console.error('Error loading recipes:', error)
    }
  }

  useEffect(() => {
    loadRecipes()
  }, [])

  // Get 2 random recipes
  const getRandomRecipes = (count: number) => {
    const shuffled = [...recipes].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  const displayRecipes = getRandomRecipes(2)

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Aurora background - positioned absolutely */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50vh', zIndex: 0 }}>
        <Aurora
          colorStops={["#7cff67", "#B19EEF", "#5227FF"]}
          blend={0.5}
          amplitude={1.5}
          speed={0.5}
        />
      </div>

      {/* Content on top */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: '40px' }}>
        {recipes.length === 0 ? (
          // No recipes
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 'calc(60vh - 40px)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: '600',
                color: '#1f2937',
              }}
            >
              Can't decide what to eat? <br /> Generate a recipe from scratch!
            </div>
          </div>
        ) : recipes.length === 1 ? (
          // Single recipe
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              minHeight: 'calc(100vh - 40px)',
              justifyContent: 'center',
              paddingBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                color: '#6b7280',
                fontWeight: '500',
              }}
            >
              You have a single recipe in your profile:
            </div>
            <Card {...recipes[0]} />
          </div>
        ) : (
          // Multiple recipes
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '60px',
              paddingBottom: '60px',
              paddingTop: '20px',
            }}
          >
            {/* 2 random cards side by side */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '40px',
                maxWidth: '350px',
                width: '100%',
                padding: '0 20px',
                margin: '0 auto',
              }}
            >
              {displayRecipes.map((recipe) => (
                <Card key={recipe.id} {...recipe} />
              ))}
            </div>

            {/* Generate recipe label at bottom */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '16px',
                color: '#6b7280',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Can't decide? Generate a recipe from scratch!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Unique