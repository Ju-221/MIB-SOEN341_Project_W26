import { useEffect } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onReady: () => void;
}

function LoadingScreen({ onReady }: LoadingScreenProps) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      onReady();
      return;
    }

    const checkBackendReady = async () => {
      try {
        await fetch('http://localhost:3000/api/preferences', {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Backend not reachable — still proceed so the user isn't stuck
      }
      onReady();
    };

    checkBackendReady();
  }, [onReady]);

  return (
    <div className="loading-screen">
      <div className="loading-screen-brand">MealMajor</div>
      <div className="loading-screen-spinner" />
      <p className="loading-screen-text">Getting everything ready...</p>
    </div>
  );
}

export default LoadingScreen;
