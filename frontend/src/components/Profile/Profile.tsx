import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

import './Profile.css'

function Profile() {
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
  ]
  const allergyOptions = [
    'Nuts',
    'Peanuts',
    'Dairy',
    'Eggs',
    'Gluten',
    'Shellfish',
    'Fish',
    'Soy',
    'Sesame',
    'Sulfites',
  ]
  const initialSelectedDiets = ['Vegetarian', 'Vegan']
  const initialSelectedAllergies: string[] = []

  const [selectedDiets, setSelectedDiets] = useState<string[]>(
    initialSelectedDiets
  )
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    initialSelectedAllergies
  )
  const [customDiets, setCustomDiets] = useState<string[]>([])
  const [customAllergies, setCustomAllergies] = useState<string[]>([])
  const [customDietInput, setCustomDietInput] = useState('')
  const [customAllergyInput, setCustomAllergyInput] = useState('')

  const toggleSelection = (
    value: string,
    setSelected: Dispatch<SetStateAction<string[]>>
  ) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    )
  }

  const addCustomItem = (
    value: string,
    selected: string[],
    customList: string[],
    options: string[],
    setSelected: Dispatch<SetStateAction<string[]>>,
    setCustomList: Dispatch<SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const normalized = trimmed.toLowerCase()
    const existingItem = [...customList, ...options].find(
      (item) => item.toLowerCase() === normalized
    )
    if (existingItem) {
      setSelected((current) =>
        current.includes(existingItem) ? current : [...current, existingItem]
      )
      return
    }
    const alreadySelected = selected.some(
      (item) => item.toLowerCase() === normalized
    )
    if (alreadySelected) return
    setCustomList((current) => [...current, trimmed])
    setSelected((current) => [...current, trimmed])
  }

  const handleReset = () => {
    setSelectedDiets(initialSelectedDiets)
    setSelectedAllergies(initialSelectedAllergies)
    setCustomDiets([])
    setCustomAllergies([])
    setCustomDietInput('')
    setCustomAllergyInput('')
  }

  return (
    <div className="profile-page">
      <button
        type="button"
        className="profile-nav-button"
        onClick={() => {
          window.location.hash = '#signin'
        }}
      >
        ← Sign In
      </button>
      <div className="profile-shell">
        <header className="profile-header">
          <div>
            <h1>Profile</h1>
            <p className="profile-subtitle">
              Manage your personal information and food information.
            </p>
          </div>
        </header>
        <section className="profile-card">
          <div className="profile-card-header">
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
                <input
                  id="email"
                  type="email"
                  defaultValue="final.test@example.com"
                  disabled
                />
                <p className="profile-hint">Email cannot be changed</p>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-header">
            <h2>Diet Preferences</h2>
          </div>
          <div className="profile-card-body">
            <p className="profile-card-title">Select your dietary preferences</p>
            <p className="profile-card-subtitle">
              Select your preferences and we will recommend recipes that match your lifestyle.
            </p>
            <div className="profile-chip-grid">
              {dietOptions.map((option) => {
                const selected = selectedDiets.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() =>
                      toggleSelection(option, setSelectedDiets)
                    }
                  >
                    {option}
                    {selected ? ' ✓' : ''}
                  </button>
                )
              })}
              {customDiets.map((option) => {
                const selected = selectedDiets.includes(option)
                return (
                  <button
                    key={`custom-diet-${option}`}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() =>
                      toggleSelection(option, setSelectedDiets)
                    }
                  >
                    {option}
                    {selected ? ' ✓' : ''}
                  </button>
                )
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
                    event.preventDefault()
                    addCustomItem(
                      customDietInput,
                      selectedDiets,
                      customDiets,
                      dietOptions,
                      setSelectedDiets,
                      setCustomDiets
                    )
                    setCustomDietInput('')
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
                  )
                  setCustomDietInput('')
                }}
              >
                Add
              </button>
            </div>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-header">
            <h2>Allergies &amp; Intolerances</h2>
          </div>
          <div className="profile-card-body">
            <p className="profile-card-title">
              Select any allergies or food intolerances
            </p>
            <p className="profile-card-subtitle">
              We'll exclude these ingredients from recipe recommendations.
            </p>
            <div className="profile-chip-grid">
              {allergyOptions.map((option) => {
                const selected = selectedAllergies.includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() =>
                      toggleSelection(option, setSelectedAllergies)
                    }
                  >
                    {option}
                    {selected ? ' ✓' : ''}
                  </button>
                )
              })}
              {customAllergies.map((option) => {
                const selected = selectedAllergies.includes(option)
                return (
                  <button
                    key={`custom-allergy-${option}`}
                    type="button"
                    className={`profile-chip ${selected ? 'selected' : ''}`}
                    onClick={() =>
                      toggleSelection(option, setSelectedAllergies)
                    }
                  >
                    {option}
                    {selected ? ' ✓' : ''}
                  </button>
                )
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
                    event.preventDefault()
                    addCustomItem(
                      customAllergyInput,
                      selectedAllergies,
                      customAllergies,
                      allergyOptions,
                      setSelectedAllergies,
                      setCustomAllergies
                    )
                    setCustomAllergyInput('')
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
                  )
                  setCustomAllergyInput('')
                }}
              >
                Add
              </button>
            </div>
          </div>
        </section>
        <div className="profile-actions">
            <button
              type="button"
              className="profile-button secondary"
              onClick={handleReset}
            >
              Reset Changes
            </button>
            <button type="button" className="profile-button primary">
              Save Changes
            </button>
          </div>
      </div>
      
    </div>
  )
}

export default Profile
