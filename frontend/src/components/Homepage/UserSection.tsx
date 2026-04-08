import React from 'react';

interface UserSectionProps {
  isLoggedIn: boolean;
  userEmail: string | null;
}

const UserSection: React.FC<UserSectionProps> = ({ isLoggedIn, userEmail }) => {
  if (!isLoggedIn) return null;

  return (
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
  );
};

export default UserSection;
