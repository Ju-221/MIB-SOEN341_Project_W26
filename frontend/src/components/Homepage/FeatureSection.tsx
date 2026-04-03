import React from 'react';

const FeatureSection: React.FC = () => {
  return (
    <section className="homepage-features">
      <h2 className="homepage-section-title">What You Can Do</h2>
      <div className="homepage-feature-grid">
        <div className="homepage-feature-card">
          <h3>Create Your Recipes</h3>
          <p>Create from scratch or generate with AI!</p>
        </div>
        <div className="homepage-feature-card">
          <h3>Plan Your Week</h3>
          <p>Organize your meals  with our meal planner.</p>
        </div>
        <div className="homepage-feature-card">
          <h3>Save Money</h3>
          <p>Find the best deals and reduce food waste.</p>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
