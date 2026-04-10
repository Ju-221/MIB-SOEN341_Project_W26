import { useState, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import RecipeManager from '../Recipe-Manager/CreateRecipe';

import './Profile.css';

function getInitial(email: string): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

const CheckIcon = () => (
  <span className="chip-check" aria-hidden="true">
    <svg
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1.5,5 4,7.5 8.5,2.5" />
    </svg>
  </span>
);

function Profile() {
  const [profileEmail, setProfileEmail] = useState('');

  const getEmailFromToken = (token: string): string => {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return '';

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );

      const parsed = JSON.parse(jsonPayload) as { email?: string };
      return parsed.email ?? '';
    } catch {
      return '';
    }
  };

  const loadPreferences = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/preferences', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await response.json();
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  useEffect(() => {
    loadPreferences();

    const token = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('userEmail') ?? '';

    if (token) {
      const tokenEmail = getEmailFromToken(token);
      if (tokenEmail) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfileEmail(tokenEmail);
        return;
      }
    }

    setProfileEmail(storedEmail);
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const allergyData = {
      peanuts: selectedAllergies.includes('Peanuts'),
      treeNuts: selectedAllergies.includes('Nuts'),
      eggs: selectedAllergies.includes('Eggs'),
      milk: selectedAllergies.includes('Dairy'),
      fish: selectedAllergies.includes('Fish'),
      crustaceans: selectedAllergies.includes('Shellfish'),
      soy: selectedAllergies.includes('Soy'),
      wheat: selectedAllergies.includes('Wheat'),
      sesame: selectedAllergies.includes('Sesame'),
      mustard: selectedAllergies.includes('Mustard'),
      lactoseIntolerance: selectedAllergies.includes('Lactose Intolerance'),
      glutenIntolerance: selectedAllergies.includes('Gluten'),
    };

    const dietData = {
      vegetarian: selectedDiets.includes('Vegetarian'),
      vegan: selectedDiets.includes('Vegan'),
      pescetarian: selectedDiets.includes('Pescatarian'),
      halal: selectedDiets.includes('Halal'),
      kosher: selectedDiets.includes('Kosher'),
      keto: selectedDiets.includes('Keto'),
    };

    try {
      const response = await fetch('http://localhost:3000/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          allergies: allergyData,
          dietaryPreferences: dietData,
        }),
      });

      if (response.ok) {
        alert('Preferences saved!');
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const dietOptions = [
    'Vegetarian',
    'Vegan',
    'Keto',
    'Paleo',
    'Mediterranean',
    'Low Carb',
    'Gluten-Free',
    'Dairy-Free',
    'Pescatarian',
    'Halal',
    'Kosher',
  ];
  const allergyOptions = [
    'Nuts',
    'Peanuts',
    'Dairy',
    'Eggs',
    'Wheat',
    'Gluten',
    'Shellfish',
    'Fish',
    'Soy',
    'Sesame',
    'Mustard',
    'Lactose Intolerance',
    'Sulfites',
  ];

  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customDiets, setCustomDiets] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [customDietInput, setCustomDietInput] = useState('');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [showRecipeManager, setShowRecipeManager] = useState(false);

  // The following function was drafted with the assistance of ChatGPT Codex.
  // Prompt: "Help me clean up and ensure the toggleSelection helper function works correctly for diet/allergy selection, This function should simply manage the selection state of either diets or allergies or both. Once a button is clicked, it should change colour and show that it is selected. ."
  // I Ashton Levine reviewed, modified, and tested the code to ensure correctness.

  //the toggleSelection function is a helper function that manages the selection state for both diets and allergies. It takes a value (the diet or allergy being toggled) and a state setter function (either setSelectedDiets or setSelectedAllergies). The function checks if the value is already in the current selection; if it is, it removes it, and if it's not, it adds it to the selection. This allows users to easily toggle their preferences on and off by clicking the corresponding buttons in the UI.
  const toggleSelection = (value: string, setSelected: Dispatch<SetStateAction<string[]>>) => {
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  // The following function was drafted with the assistance of ChatGPT Codex.
  // Prompt: "Help me clean up and ensure the addCustomItem helper function properly handles custom diet/allergy inputs, This function should essentially ensure that custom items can be added to dietary preferences and allergies."
  // I Ashton Levine reviewed, modified, and tested the code to ensure correctness.

  //the addCustomItem function is a helper function that handles the addition of custom diets or allergies. It takes the input value, the current selected items, the current custom list, the predefined options, and the corresponding state setter functions. The function first trims and normalizes the input to ensure consistency. It checks if the input already exists in either the custom list or predefined options (case-insensitive). If it exists, it adds it to the selected items if it's not already selected. If it doesn't exist and isn't already selected, it adds the new custom item to both the custom list and the selected items. This allows users to easily add their own dietary preferences or allergies that may not be included in the predefined options.
  const addCustomItem = (
    value: string,
    selected: string[],
    customList: string[],
    options: string[],
    setSelected: Dispatch<SetStateAction<string[]>>,
    setCustomList: Dispatch<SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    const existingItem = [...customList, ...options].find(
      (item) => item.toLowerCase() === normalized
    );
    if (existingItem) {
      setSelected((current) =>
        current.includes(existingItem) ? current : [...current, existingItem]
      );
      return;
    }
    const alreadySelected = selected.some((item) => item.toLowerCase() === normalized);
    if (alreadySelected) return;
    setCustomList((current) => [...current, trimmed]);
    setSelected((current) => [...current, trimmed]);
  };

  // The following function was drafted with the assistance of ChatGPT Codex.
  // Prompt: "Help me clean up and ensure the handleReset helper function resets custom inputs safely, This function should work with the reset button and ensure that once the button is clicked, the values are reset."
  // I Ashton Levine reviewed, modified, and tested the code to ensure correctness.

  //The handle reset function clears all custom diets and allergies, as well as the input fields for adding new custom items. This allows users to quickly reset their selections and start fresh if they want to change their preferences significantly. The function is triggered when the "Reset Changes" button is clicked, ensuring that all relevant state variables are cleared effectively.
  const handleReset = () => {
    setCustomDiets([]);
    setCustomAllergies([]);
    setCustomDietInput('');
    setCustomAllergyInput('');
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {getInitial(profileEmail)}
          </div>
          <div>
            <h1>Profile</h1>
            <p className="profile-subtitle">
              Manage your personal information and food preferences.
            </p>
          </div>
        </header>

        {/* Personal Information */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2>Personal Information</h2>
          </div>
          <div className="profile-card-body">
            <div className="profile-grid two">
              <div className="profile-field">
                <label htmlFor="firstName">
                  First Name <span className="required">*</span>
                </label>
                <input id="firstName" type="text" defaultValue="Final.test" />
              </div>
              <div className="profile-field">
                <label htmlFor="lastName">
                  Last Name <span className="required">*</span>
                </label>
                <input id="lastName" type="text" placeholder="Enter last name" />
              </div>
            </div>
            <div className="profile-grid one">
              <div className="profile-field">
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" value={profileEmail || 'No email found'} disabled />
                <p className="profile-hint">Email cannot be changed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Diet Preferences */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <h2>Diet Preferences</h2>
          </div>
          <div className="profile-card-body">
            <p className="profile-card-title">Select your dietary preferences</p>
            <p className="profile-card-subtitle">
              We&apos;ll recommend recipes that match your lifestyle.
            </p>
            <div className="profile-chip-grid">
              {dietOptions.map((option) => {
                const selected = selectedDiets.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(option, setSelectedDiets)}
                  >
                    {selected && <CheckIcon />}
                    {option}
                  </button>
                );
              })}
              {customDiets.map((option) => {
                const selected = selectedDiets.includes(option);
                return (
                  <button
                    key={`custom-diet-${option}`}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(option, setSelectedDiets)}
                  >
                    {selected && <CheckIcon />}
                    {option}
                  </button>
                );
              })}
            </div>
            <div className="profile-custom-row">
              <input
                type="text"
                value={customDietInput}
                placeholder="Add a custom dietary preference"
                onChange={(event) => setCustomDietInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCustomItem(
                      customDietInput,
                      selectedDiets,
                      customDiets,
                      dietOptions,
                      setSelectedDiets,
                      setCustomDiets
                    );
                    setCustomDietInput('');
                  }
                }}
              />
              <button
                type="button"
                className="profile-button secondary"
                onClick={() => {
                  addCustomItem(
                    customDietInput,
                    selectedDiets,
                    customDiets,
                    dietOptions,
                    setSelectedDiets,
                    setCustomDiets
                  );
                  setCustomDietInput('');
                }}
              >
                Add
              </button>
            </div>
          </div>
        </section>

        {/* Allergies */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2>Allergies &amp; Intolerances</h2>
          </div>
          <div className="profile-card-body">
            <p className="profile-card-title">Select any allergies or food intolerances</p>
            <p className="profile-card-subtitle">
              We&apos;ll exclude these ingredients from recipe recommendations.
            </p>
            <div className="profile-chip-grid">
              {allergyOptions.map((option) => {
                const selected = selectedAllergies.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(option, setSelectedAllergies)}
                  >
                    {selected && <CheckIcon />}
                    {option}
                  </button>
                );
              })}
              {customAllergies.map((option) => {
                const selected = selectedAllergies.includes(option);
                return (
                  <button
                    key={`custom-allergy-${option}`}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(option, setSelectedAllergies)}
                  >
                    {selected && <CheckIcon />}
                    {option}
                  </button>
                );
              })}
            </div>
            <div className="profile-custom-row">
              <input
                type="text"
                value={customAllergyInput}
                placeholder="Add a custom allergy or intolerance"
                onChange={(event) => setCustomAllergyInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCustomItem(
                      customAllergyInput,
                      selectedAllergies,
                      customAllergies,
                      allergyOptions,
                      setSelectedAllergies,
                      setCustomAllergies
                    );
                    setCustomAllergyInput('');
                  }
                }}
              />
              <button
                type="button"
                className="profile-button secondary"
                onClick={() => {
                  addCustomItem(
                    customAllergyInput,
                    selectedAllergies,
                    customAllergies,
                    allergyOptions,
                    setSelectedAllergies,
                    setCustomAllergies
                  );
                  setCustomAllergyInput('');
                }}
              >
                Add
              </button>
            </div>
          </div>
        </section>

        <div className="profile-actions">
          <button type="button" className="profile-button secondary" onClick={handleReset}>
            Reset Changes
          </button>
          <button
            type="button"
            className="profile-button secondary"
            onClick={() => setShowRecipeManager(true)}
          >
            Manage Recipes
          </button>
          <button type="button" className="profile-button primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>

      {showRecipeManager && (
        <div className="modal-overlay-profile" onClick={() => setShowRecipeManager(false)}>
          <div className="modal-content-profile" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-profile"
              onClick={() => setShowRecipeManager(false)}
              aria-label="Close"
            >
              ×
            </button>
            <RecipeManager />
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
