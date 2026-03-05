import React from 'react';

const FeatureSection: React.FC = () => {
  return (
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
  );
};

export default FeatureSection;
