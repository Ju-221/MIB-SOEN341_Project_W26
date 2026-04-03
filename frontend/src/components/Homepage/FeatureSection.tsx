import React from 'react';

const FeatureSection: React.FC = () => {
  return (
    <section className="homepage-features">
      <h2 className="homepage-section-title">What You Can Do</h2>
      <div className="homepage-feature-grid">
        <div className="homepage-feature-card">
          <h3>Discover Recipes</h3>
        </div>
        <div className="homepage-feature-card">
          <h3>Plan Your Week</h3>
        </div>
        <div className="homepage-feature-card">
          <h3>Save Money</h3>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
