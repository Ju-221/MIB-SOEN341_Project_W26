import React from 'react';

interface Recipe {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  estimatedCost: number;
  heroImage: string | null;
  categories: string[];
}

interface RecentRecipesProps {
  recipes: Recipe[];
}

const RecentRecipes: React.FC<RecentRecipesProps> = ({ recipes }) => {
  if (recipes.length === 0) return null;

  return (
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
  );
};

export default RecentRecipes;
