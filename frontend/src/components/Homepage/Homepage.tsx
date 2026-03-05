import { useState, useEffect } from 'react';
import './Homepage.css';
import Hero from './Hero';
import FeatureSection from './FeatureSection';
import RecentRecipes from './RecentRecipes';
import UserSection from './UserSection';

interface HomepageProps {
  isLoggedIn: boolean;
  userEmail: string | null;
}

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

function Homepage({ isLoggedIn, userEmail }: HomepageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/recipes');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  return (
    <div className="homepage">
      <Hero isLoggedIn={isLoggedIn} />

      <main className="homepage-main">
        <FeatureSection />
        <RecentRecipes recipes={recipes} />
        <UserSection isLoggedIn={isLoggedIn} userEmail={userEmail} />
      </main>

      <footer className="homepage-footer">
        <p>MealMajor -- Built for university students, by university students.</p>
      </footer>
    </div>
  );
}

export default Homepage;
