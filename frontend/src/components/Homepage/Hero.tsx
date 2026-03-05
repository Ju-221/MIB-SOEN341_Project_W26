import React from 'react';
import { TextAnimation, RotatingImage } from './Animations';

interface HeroProps {
  isLoggedIn: boolean;
}

const MainHeroSection = () => {
  return (
    <div className="meal-major-container">
      <div className="title-image-wrapper">
        {/* 1. Large Background Title */}
        <div className="text-container">
          <TextAnimation />
        </div>

        {/* 2. Rotating Plate and Callouts Overlayed */}
        <div className="plate-container">
          <RotatingImage />
        </div>
      </div>
    </div>
  );
};

const Hero: React.FC<HeroProps> = ({ isLoggedIn }) => {
  return (
    <header className="homepage-hero">
      <MainHeroSection />
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
  );
};

export default Hero;
