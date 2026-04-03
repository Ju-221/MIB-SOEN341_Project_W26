import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Homepage.css';
import Hero from './Hero';
import FeatureSection from './FeatureSection';
import RecentRecipes from './RecentRecipes';
import UserSection from './UserSection';

gsap.registerPlugin(ScrollTrigger);

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

  useEffect(() => {
    const hero = document.querySelector('.homepage-hero') as HTMLElement;
    if (!hero) return;

    // Slide the goo in from the top and bottom once the hero has fully scrolled out of view
    const gooAnim = gsap.to('.goo-top, .goo-bottom', {
      y: '0%',
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'bottom top',
        end: '+=250',
        scrub: 1.5,
      },
    });

    return () => {
      gooAnim.scrollTrigger?.kill();
      gooAnim.kill();
    };
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
      {/* Goo blob that drips in from the top after the hero scrolls away */}
      <div className="goo-top" aria-hidden="true" />
      <div className="goo-bottom" aria-hidden="true" />
      <Hero isLoggedIn={isLoggedIn} />

      <main className="homepage-main">
        {/* <FeatureSection /> */}
        {/*<RecentRecipes recipes={recipes} />*/}
        <UserSection isLoggedIn={isLoggedIn} userEmail={userEmail} />
        {/* Temporary spacer — gives the page enough height for the goo scroll animation */}
        <div style={{ height: '400vh' }} />
      </main>

    
    </div>
  );
}

export default Homepage;
