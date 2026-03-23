import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Recipe } from '../Recipe-Manager/CreateRecipe'
import RecipeManager from '../Recipe-Manager/CreateRecipe'
import type { CalendarDay, MealType, ViewMode } from './types'
import {
  MONTH_NAMES,
  DAY_LABELS,
  MEAL_TYPES,
  MEAL_LABELS,
  buildEmptyMonth,
  emptyMeals,
} from './types'
import './Calendar.css'

const API = 'http://localhost:3000'

type ModalView = 'closed' | 'choices' | 'picker' | 'ai'

interface GridCell {
  day: CalendarDay
  currentMonth: boolean
  isToday: boolean
  fullDate: Date
}

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [days, setDays] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [recipes, setRecipes] = useState<Recipe[]>([])

  // Modal state
  const [modalView, setModalView] = useState<ModalView>('closed')
  const [pickerDay, setPickerDay] = useState<number | null>(null)
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const [animating, setAnimating] = useState(false)
  const [showRecipeManager, setShowRecipeManager] = useState(false)
  const [recipeManagerInitialEditId, setRecipeManagerInitialEditId] = useState<number | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = MONTH_NAMES[month]
  const today = new Date()

  const fetchCalendar = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    try {
      const res = await fetch(
        `${API}/api/calendar?month=${MONTH_NAMES[month]}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        const backendDays: CalendarDay[] = data.days
        const full = buildEmptyMonth(year, month)
        for (const d of backendDays) {
          const idx = d.date - 1
          if (idx >= 0 && idx < full.length) {
            full[idx] = d
          }
        }
        setDays(full)
      } else {
        setDays(buildEmptyMonth(year, month))
      }
    } catch {
      setDays(buildEmptyMonth(year, month))
    }
    setLoading(false)
  }, [month, year])

  const fetchRecipes = useCallback(() => {
    fetch(`${API}/api/recipes`)
      .then(r => r.ok ? r.json() : [])
      .then(setRecipes)
      .catch(() => setRecipes([]))
  }, [])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])
  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  const saveCalendar = useCallback(async (updatedDays: CalendarDay[]) => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      await fetch(`${API}/api/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ month: MONTH_NAMES[month], year, days: updatedDays }),
      })
    } catch { /* silent */ }
  }, [month, year])

  const syncDaysWithRecipes = useCallback((calendarDays: CalendarDay[], recipeList: Recipe[]) => {
    if (calendarDays.length === 0 || recipeList.length === 0) {
      return { updatedDays: calendarDays, changed: false }
    }

    let changed = false
    const updatedDays = calendarDays.map(day => {
      let dayChanged = false
      const updatedMeals = { ...day.meals }

      for (const mealType of MEAL_TYPES) {
        const slot = day.meals[mealType]
        if (slot.recipeId === null) continue

        const matchingRecipe = recipeList.find(recipe => {
          const recipeId = typeof recipe.id === 'string' ? parseInt(recipe.id) : recipe.id
          return recipeId === slot.recipeId
        })

        if (matchingRecipe && slot.recipeTitle !== matchingRecipe.title) {
          updatedMeals[mealType] = {
            ...slot,
            recipeTitle: matchingRecipe.title,
          }
          dayChanged = true
        }
      }

      if (!dayChanged) return day
      changed = true
      return {
        ...day,
        meals: updatedMeals,
      }
    })

    return { updatedDays, changed }
  }, [])

  // Navigation
  const navigate = (direction: number) => {
    setAnimating(true)
    setTimeout(() => {
      if (viewMode === 'month') {
        setCurrentDate(new Date(year, month + direction, 1))
      } else {
        const d = new Date(currentDate)
        d.setDate(d.getDate() + direction * 7)
        setCurrentDate(d)
      }
      setAnimating(false)
    }, 150)
  }

  const goToToday = () => {
    setAnimating(true)
    setTimeout(() => {
      setCurrentDate(new Date())
      setAnimating(false)
    }, 150)
  }

  // Close any modal
  const closeModal = () => {
    setModalView('closed')
    setAiPrompt('')
    setAiError('')
    setAiLoading(false)
  }

  const closeRecipeManager = () => {
    setShowRecipeManager(false)
    setRecipeManagerInitialEditId(null)
    fetchRecipes()
  }

  const handleRecipeSaved = (savedRecipe: Recipe) => {
    setRecipes(currentRecipes => {
      const existingIndex = currentRecipes.findIndex(recipe => recipe.id.toString() === savedRecipe.id.toString())
      if (existingIndex === -1) {
        return [...currentRecipes, savedRecipe]
      }

      const nextRecipes = [...currentRecipes]
      nextRecipes[existingIndex] = savedRecipe
      return nextRecipes
    })
  }

  // Meal slot click — open choices modal
  const handleSlotClick = (dayDate: number, meal: MealType) => {
    setPickerDay(dayDate)
    setPickerMeal(meal)
    setSearchQuery('')
    setAiPrompt('')
    setAiError('')

    // If a recipe is already assigned, go straight to picker (to change/remove)
    const dayData = days.find(d => d.date === dayDate)
    if (dayData && dayData.meals[meal].recipeId !== null) {
      setModalView('picker')
    } else {
      setModalView('choices')
    }
  }

  const handleAssignRecipe = (recipe: Recipe) => {
    if (pickerDay === null || pickerMeal === null) return
    const updated = days.map(d => {
      if (d.date !== pickerDay) return d
      return {
        ...d,
        meals: {
          ...d.meals,
          [pickerMeal]: {
            recipeId: typeof recipe.id === 'string' ? parseInt(recipe.id) : recipe.id,
            recipeTitle: recipe.title,
          },
        },
      }
    })
    setDays(updated)
    saveCalendar(updated)
    closeModal()
  }

  const handleRemoveMeal = () => {
    if (pickerDay === null || pickerMeal === null) return
    const updated = days.map(d => {
      if (d.date !== pickerDay) return d
      return {
        ...d,
        meals: {
          ...d.meals,
          [pickerMeal]: { recipeId: null, recipeTitle: null },
        },
      }
    })
    setDays(updated)
    saveCalendar(updated)
    closeModal()
  }

  const handleEditCurrentRecipe = () => {
    if (!currentSlot?.recipeId) return
    closeModal()
    setRecipeManagerInitialEditId(currentSlot.recipeId)
    setShowRecipeManager(true)
  }

  // AI generate recipe
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    const token = localStorage.getItem('token')
    if (!token) return

    setAiLoading(true)
    setAiError('')

    try {
      const res = await fetch(`${API}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Generation failed')
      }

      const recipe = await res.json()
      // Assign the generated recipe to the slot
      if (pickerDay !== null && pickerMeal !== null) {
        const updated = days.map(d => {
          if (d.date !== pickerDay) return d
          return {
            ...d,
            meals: {
              ...d.meals,
              [pickerMeal]: {
                recipeId: recipe.id,
                recipeTitle: recipe.title,
              },
            },
          }
        })
        setDays(updated)
        saveCalendar(updated)
      }
      // Refresh recipes list so the new one appears in the picker
      fetchRecipes()
      closeModal()
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate recipe')
    } finally {
      setAiLoading(false)
    }
  }

  // Build continuous grid with leading/trailing days from adjacent months
  const monthGrid: GridCell[] = useMemo(() => {
    const cells: GridCell[] = []
    const firstDay = new Date(year, month, 1)
    const startOffset = (firstDay.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

    for (let i = 0; i < totalCells; i++) {
      const date = new Date(year, month, 1 - startOffset + i)
      const dayOfMonth = date.getDate()
      const isCurrent = date.getMonth() === month && date.getFullYear() === year
      const dayData = isCurrent
        ? (days.find(d => d.date === dayOfMonth) || { date: dayOfMonth, meals: emptyMeals() })
        : { date: dayOfMonth, meals: emptyMeals() }

      cells.push({
        day: dayData,
        currentMonth: isCurrent,
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date,
      })
    }
    return cells
  }, [days, year, month, today])

  const weekGrid: GridCell[] = useMemo(() => {
    const cells: GridCell[] = []
    const dow = (currentDate.getDay() + 6) % 7
    const mondayOfWeek = new Date(currentDate)
    mondayOfWeek.setDate(currentDate.getDate() - dow)

    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayOfWeek)
      date.setDate(mondayOfWeek.getDate() + i)
      const isCurrent = date.getMonth() === month && date.getFullYear() === year
      const dayOfMonth = date.getDate()
      const dayData = isCurrent
        ? (days.find(d => d.date === dayOfMonth) || { date: dayOfMonth, meals: emptyMeals() })
        : { date: dayOfMonth, meals: emptyMeals() }

      cells.push({
        day: dayData,
        currentMonth: isCurrent,
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date,
      })
    }
    return cells
  }, [days, currentDate, month, year, today])

  const grid = viewMode === 'week' ? weekGrid : monthGrid

  const weekRange = useMemo(() => {
    if (viewMode !== 'week' || weekGrid.length === 0) return ''
    const start = weekGrid[0].fullDate
    const end = weekGrid[6].fullDate
    const fmt = (d: Date) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`
    return `${fmt(start)} - ${fmt(end)}`
  }, [viewMode, weekGrid])

  const filteredRecipes = recipes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const { updatedDays, changed } = syncDaysWithRecipes(days, recipes)
    if (!changed) return

    setDays(updatedDays)
    saveCalendar(updatedDays)
  }, [days, recipes, saveCalendar, syncDaysWithRecipes])

  const currentSlot = pickerDay !== null && pickerMeal !== null
    ? days.find(d => d.date === pickerDay)?.meals[pickerMeal]
    : null

  const getRecipeDetail = (recipeId: number | null): Recipe | undefined => {
    if (recipeId === null) return undefined
    return recipes.find(r => {
      const rid = typeof r.id === 'string' ? parseInt(r.id) : r.id
      return rid === recipeId
    })
  }

  const getSlotDisplayTitle = (recipeId: number | null, fallbackTitle: string | null) => {
    const recipe = getRecipeDetail(recipeId)
    return recipe?.title || fallbackTitle
  }

  if (loading) {
    return (
      <div className="cal">
        <div className="cal-loading">
          <div className="cal-loading-spinner" />
          <p>Loading your meal plan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cal">
      {/* Header */}
      <div className="cal-header">
        <div className="cal-header-left">
          <button className="cal-nav-arrow" onClick={() => navigate(-1)} aria-label="Previous">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="cal-nav-arrow" onClick={() => navigate(1)} aria-label="Next">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="cal-title">{monthName} {year}</h1>
          {viewMode === 'week' && <span className="cal-week-range">{weekRange}</span>}
        </div>
        <div className="cal-header-right">
          <button className="cal-today-btn" onClick={goToToday}>Today</button>
          <div className="cal-view-toggle">
            <button
              className={`cal-view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >Week</button>
            <button
              className={`cal-view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >Month</button>
          </div>
        </div>
      </div>

      {/* Day labels */}
      <div className="cal-day-labels">
        {DAY_LABELS.map(label => (
          <div key={label} className="cal-day-label">{label}</div>
        ))}
      </div>

      {/* Grid */}
      <div className={`cal-grid ${viewMode} ${animating ? 'animating' : ''}`}>
        {grid.map((cell, i) => (
          <div
            key={`${viewMode}-${i}`}
            className={`cal-cell ${viewMode} ${cell.isToday ? 'today' : ''} ${!cell.currentMonth ? 'muted' : ''}`}
          >
            <div className="cal-cell-header">
              <span className={`cal-cell-date ${cell.isToday ? 'today' : ''}`}>
                {cell.day.date}
              </span>
              {(!cell.currentMonth || cell.day.date === 1) && (
                <span className="cal-cell-month">
                  {MONTH_NAMES[cell.fullDate.getMonth()].slice(0, 3)}
                </span>
              )}
            </div>
            <div className="cal-cell-meals">
              {MEAL_TYPES.map(mealType => {
                const slot = cell.day.meals[mealType]
                const filled = slot.recipeId !== null
                const recipe = viewMode === 'week' ? getRecipeDetail(slot.recipeId) : undefined
                const displayTitle = getSlotDisplayTitle(slot.recipeId, slot.recipeTitle)
                return (
                  <button
                    key={mealType}
                    className={`cal-meal-slot ${mealType} ${filled ? 'filled' : ''} ${viewMode}`}
                    onClick={() => cell.currentMonth ? handleSlotClick(cell.day.date, mealType) : undefined}
                    disabled={!cell.currentMonth}
                    title={filled ? displayTitle || '' : `Add ${MEAL_LABELS[mealType]}`}
                  >
                    <span className="cal-meal-label">{MEAL_LABELS[mealType]}</span>
                    {filled ? (
                      <div className="cal-meal-content">
                        <span className="cal-meal-title">{displayTitle}</span>
                        {viewMode === 'week' && recipe && (
                          <div className="cal-meal-detail week">
                            <div className="cal-meal-metric">
                              <span className="cal-meal-metric-label">Time</span>
                              <span className="cal-meal-metric-value">{recipe.prepTime + recipe.cookTime} min</span>
                            </div>
                            <div className="cal-meal-metric">
                              <span className="cal-meal-metric-label">Cost</span>
                              <span className="cal-meal-metric-value">${recipe.estimatedCost.toFixed(2)}</span>
                            </div>
                            {recipe.difficulty && (
                              <div className="cal-meal-metric">
                                <span className="cal-meal-metric-label">Difficulty</span>
                                <span className="cal-meal-metric-value">{recipe.difficulty}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="cal-meal-empty">
                        <svg className="cal-meal-plus-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modals ── */}
      {modalView !== 'closed' && (
        <div className="cal-modal-overlay" onClick={closeModal}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            {/* Shared close button */}
            <button className="cal-modal-close" onClick={closeModal} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* ── Choices View ── */}
            {modalView === 'choices' && (
              <div className="cal-choices">
                <div className="cal-choices-header">
                  <h2 className="cal-modal-title">Add a meal</h2>
                  <p className="cal-modal-subtitle">
                    {pickerMeal && MEAL_LABELS[pickerMeal]} &middot; {monthName} {pickerDay}
                  </p>
                </div>

                <div className="cal-choices-grid">
                  <button className="cal-choice-card browse" onClick={() => { closeModal(); setShowRecipeManager(true) }}>
                    <div className="cal-choice-icon browse">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="cal-choice-label">Manage Recipes</span>
                    <span className="cal-choice-desc">Create, edit, and then come back to assign one</span>
                  </button>

                  <button className="cal-choice-card browse" onClick={() => setModalView('picker')}>
                    <div className="cal-choice-icon browse">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 7h14M5 12h14M5 17h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span className="cal-choice-label">Choose from Recipes</span>
                    <span className="cal-choice-desc">Pick one from your existing recipe list</span>
                  </button>

                  <button className="cal-choice-card ai" onClick={() => setModalView('ai')}>
                    <div className="cal-choice-icon ai">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="cal-choice-label">Generate with AI</span>
                    <span className="cal-choice-desc">Let Gemini create a recipe for you</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── AI Generation View ── */}
            {modalView === 'ai' && (
              <div className="cal-ai">
                <button className="cal-modal-back" onClick={() => setModalView('choices')}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
                <div className="cal-ai-header">
                  <div className="cal-choice-icon ai large">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 className="cal-modal-title">Generate with AI</h2>
                  <p className="cal-modal-subtitle">
                    Describe what you'd like to eat and Gemini will create a recipe
                  </p>
                </div>

                {aiError && <div className="cal-ai-error">{aiError}</div>}

                <textarea
                  className="cal-ai-input"
                  placeholder="e.g. A quick high-protein breakfast under $5..."
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  rows={3}
                  disabled={aiLoading}
                  autoFocus
                />

                <button
                  className="cal-ai-submit"
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                >
                  {aiLoading ? (
                    <>
                      <span className="cal-ai-submit-spinner" />
                      Generating...
                    </>
                  ) : (
                    'Generate Recipe'
                  )}
                </button>
              </div>
            )}

            {/* ── Recipe Picker View ── */}
            {modalView === 'picker' && (
              <div className="cal-picker-view">
                {pickerDay !== null && modalView === 'picker' && !currentSlot?.recipeId && (
                  <button className="cal-modal-back" onClick={() => setModalView('choices')}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                  </button>
                )}
                <div className="cal-picker-header">
                  <div>
                    <h2 className="cal-modal-title">
                      {pickerMeal && MEAL_LABELS[pickerMeal]}
                    </h2>
                    <p className="cal-modal-subtitle">
                      {monthName} {pickerDay}, {year}
                    </p>
                  </div>
                </div>

                {currentSlot?.recipeId && (
                  <div className="cal-picker-current">
                    <span>Current: <strong>{getSlotDisplayTitle(currentSlot.recipeId, currentSlot.recipeTitle)}</strong></span>
                    <div className="cal-picker-current-actions">
                      <button className="cal-picker-edit" onClick={handleEditCurrentRecipe}>Edit</button>
                      <button className="cal-picker-remove" onClick={handleRemoveMeal}>Remove</button>
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  className="cal-picker-search"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />

                <div className="cal-picker-list">
                  {filteredRecipes.length === 0 ? (
                    <p className="cal-picker-empty">No recipes found. Create one in your Profile.</p>
                  ) : (
                    filteredRecipes.map(recipe => (
                      <button
                        key={recipe.id}
                        className="cal-picker-item"
                        onClick={() => handleAssignRecipe(recipe)}
                      >
                        <div className="cal-picker-item-info">
                          <span className="cal-picker-item-title">{recipe.title}</span>
                          <span className="cal-picker-item-meta">
                            {recipe.prepTime + recipe.cookTime} min &middot; ${recipe.estimatedCost.toFixed(2)}
                            {recipe.difficulty && <> &middot; {recipe.difficulty}</>}
                          </span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe Manager Modal */}
      {showRecipeManager && (
        <div
          className="cal-modal-overlay"
          onClick={closeRecipeManager}
        >
          <div
            className="cal-recipe-manager-modal"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="cal-modal-close"
              onClick={closeRecipeManager}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <RecipeManager
              initialEditRecipeId={recipeManagerInitialEditId}
              onRecipeSaved={handleRecipeSaved}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
