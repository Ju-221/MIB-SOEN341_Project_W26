import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Recipe } from '../Recipe-Manager/CreateRecipe';
import {
  type CalendarDay,
  type MealType,
  type ViewMode,
  MONTH_NAMES,
  DAY_LABELS,
  MEAL_TYPES,
  MEAL_LABELS,
  buildEmptyMonth,
  emptyMeals,
} from './types';
import {
  fetchCalendarWindow,
  getCalendarMonthKey,
  getCalendarMonthWindow,
  replaceMonthInCalendarWindow,
  saveCalendarWindow,
  type CalendarWindowData,
} from '../../api/calendar';
import './Calendar.css';

const API = 'http://localhost:3000';

type ModalView = 'closed' | 'choices' | 'picker' | 'ai';

interface GridCell {
  day: CalendarDay;
  currentMonth: boolean;
  interactive: boolean;
  isToday: boolean;
  fullDate: Date;
}

interface GenerateRecipeErrorResponse {
  message?: string;
  details?: {
    type?: string;
    statusCode?: string;
    code?: string;
    message?: string;
  };
}

function Calendar() {
  const today = useMemo(() => new Date(), []);
  const baseMonthDate = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const allowedMonthDates = useMemo(() => getCalendarMonthWindow(baseMonthDate), [baseMonthDate]);
  const [visibleMonthIndex, setVisibleMonthIndex] = useState(3);
  const visibleMonthDate = allowedMonthDates[visibleMonthIndex];
  const visibleMonthKey = useMemo(() => getCalendarMonthKey(visibleMonthDate), [visibleMonthDate]);
  const [currentDate, setCurrentDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [calendarWindow, setCalendarWindow] = useState<CalendarWindowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  // Modal state
  const [modalView, setModalView] = useState<ModalView>('closed');
  const [pickerDate, setPickerDate] = useState<Date | null>(null);
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Recipe assignment error (duplicate in week)
  const [assignmentError, setAssignmentError] = useState('');
  const [saveError, setSaveError] = useState(false);

  const [animating, setAnimating] = useState(false);

  const year = visibleMonthDate.getFullYear();
  const month = visibleMonthDate.getMonth();
  const monthName = MONTH_NAMES[month];
  const days = calendarWindow?.monthData[visibleMonthKey] ?? buildEmptyMonth(year, month);
  const getMonthDays = useCallback(
    (date: Date) => {
      const monthKey = getCalendarMonthKey(new Date(date.getFullYear(), date.getMonth(), 1));
      return (
        calendarWindow?.monthData[monthKey] ?? buildEmptyMonth(date.getFullYear(), date.getMonth())
      );
    },
    [calendarWindow]
  );

  const getDayDataForDate = useCallback(
    (date: Date) => {
      return (
        getMonthDays(date).find((day) => day.date === date.getDate()) ?? {
          date: date.getDate(),
          meals: emptyMeals(),
        }
      );
    },
    [getMonthDays]
  );

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setCalendarWindow({
        monthDates: allowedMonthDates,
        monthKeys: allowedMonthDates.map(getCalendarMonthKey),
        monthData: Object.fromEntries(
          allowedMonthDates.map((date) => [
            getCalendarMonthKey(date),
            buildEmptyMonth(date.getFullYear(), date.getMonth()),
          ])
        ),
      });
      setLoading(false);
      return;
    }

    try {
      const windowData = await fetchCalendarWindow(token, baseMonthDate);
      setCalendarWindow(windowData);
    } catch {
      setCalendarWindow({
        monthDates: allowedMonthDates,
        monthKeys: allowedMonthDates.map(getCalendarMonthKey),
        monthData: Object.fromEntries(
          allowedMonthDates.map((date) => [
            getCalendarMonthKey(date),
            buildEmptyMonth(date.getFullYear(), date.getMonth()),
          ])
        ),
      });
    }
    setLoading(false);
  }, [allowedMonthDates, baseMonthDate]);

  const fetchRecipes = useCallback(() => {
    fetch(`${API}/api/recipes`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRecipes)
      .catch(() => setRecipes([]));
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);
  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);
  useEffect(() => {
    if (viewMode !== 'month') return;
    const nextVisibleDate = new Date(
      visibleMonthDate.getFullYear(),
      visibleMonthDate.getMonth(),
      visibleMonthDate.getTime() === baseMonthDate.getTime() ? today.getDate() : 1
    );
    setCurrentDate(nextVisibleDate);
  }, [baseMonthDate, today, viewMode, visibleMonthDate]);

  const showSaveError = useCallback(() => {
    setSaveError(true);
    setTimeout(() => setSaveError(false), 4000);
  }, []);

  const saveCalendar = useCallback(
    async (updatedDays: CalendarDay[]) => {
      const token = localStorage.getItem('token');
      if (!token || !calendarWindow) return;
      const updatedWindow = replaceMonthInCalendarWindow(
        calendarWindow,
        visibleMonthDate,
        updatedDays
      );
      setCalendarWindow(updatedWindow);
      try {
        await saveCalendarWindow(token, updatedWindow);
      } catch {
        showSaveError();
      }
    },
    [calendarWindow, visibleMonthDate, showSaveError]
  );

  const saveCalendarForDate = useCallback(
    async (targetDate: Date, updatedDays: CalendarDay[]) => {
      const token = localStorage.getItem('token');
      if (!token || !calendarWindow) return;
      const updatedWindow = replaceMonthInCalendarWindow(calendarWindow, targetDate, updatedDays);
      setCalendarWindow(updatedWindow);
      try {
        await saveCalendarWindow(token, updatedWindow);
      } catch {
        showSaveError();
      }
    },
    [calendarWindow, showSaveError]
  );

  const syncDaysWithRecipes = useCallback((calendarDays: CalendarDay[], recipeList: Recipe[]) => {
    if (calendarDays.length === 0 || recipeList.length === 0) {
      return { updatedDays: calendarDays, changed: false };
    }

    let changed = false;
    const updatedDays = calendarDays.map((day) => {
      let dayChanged = false;
      const updatedMeals = { ...day.meals };

      for (const mealType of MEAL_TYPES) {
        const slot = day.meals[mealType];
        if (slot.recipeId === null) continue;

        const matchingRecipe = recipeList.find((recipe) => {
          const recipeId = typeof recipe.id === 'string' ? parseInt(recipe.id) : recipe.id;
          return recipeId === slot.recipeId;
        });

        if (matchingRecipe && slot.recipeTitle !== matchingRecipe.title) {
          updatedMeals[mealType] = {
            ...slot,
            recipeTitle: matchingRecipe.title,
          };
          dayChanged = true;
        }
      }

      if (!dayChanged) return day;
      changed = true;
      return {
        ...day,
        meals: updatedMeals,
      };
    });

    return { updatedDays, changed };
  }, []);

  const navigateMonth = (direction: number) => {
    const nextIndex = visibleMonthIndex + direction;
    if (nextIndex < 0 || nextIndex >= allowedMonthDates.length) return;
    setAnimating(true);
    setTimeout(() => {
      setVisibleMonthIndex(nextIndex);
      setAnimating(false);
    }, 150);
  };

  const navigateWeek = (direction: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + direction * 7);

    const earliestMonth = allowedMonthDates[0];
    const latestMonth = allowedMonthDates[allowedMonthDates.length - 1];
    const minDate = new Date(earliestMonth.getFullYear(), earliestMonth.getMonth(), 1);
    const maxDate = new Date(latestMonth.getFullYear(), latestMonth.getMonth() + 1, 0);

    if (nextDate < minDate || nextDate > maxDate) return;

    const nextMonthIndex = allowedMonthDates.findIndex(
      (date) =>
        date.getFullYear() === nextDate.getFullYear() && date.getMonth() === nextDate.getMonth()
    );

    setAnimating(true);
    setTimeout(() => {
      setCurrentDate(nextDate);
      if (nextMonthIndex !== -1) {
        setVisibleMonthIndex(nextMonthIndex);
      }
      setAnimating(false);
    }, 150);
  };

  const goToCurrentPeriod = () => {
    setAnimating(true);
    setTimeout(() => {
      setVisibleMonthIndex(3);
      setCurrentDate(today);
      setAnimating(false);
    }, 150);
  };

  // Close any modal
  const closeModal = () => {
    setModalView('closed');
    setAiPrompt('');
    setAiError('');
    setAssignmentError('');
    setAiLoading(false);
  };

  // Navigate to the Recipes page and open a specific recipe
  const handleViewRecipe = (recipeId: number) => {
    sessionStorage.setItem('viewRecipeId', String(recipeId));
    globalThis.location.hash = '#recipes';
  };

  // Remove a recipe from a slot directly without opening a modal
  const handleRemoveMealDirect = (date: Date, mealType: MealType) => {
    const currentMonthDays = getMonthDays(date);
    const updated = currentMonthDays.map((d) => {
      if (d.date !== date.getDate()) return d;
      return {
        ...d,
        meals: {
          ...d.meals,
          [mealType]: { recipeId: null, recipeTitle: null },
        },
      };
    });
    saveCalendarForDate(date, updated);
  };

  // Meal slot click — only for empty slots; filled slots navigate to recipe view
  const handleSlotClick = (date: Date, meal: MealType) => {
    setPickerDate(date);
    setPickerMeal(meal);
    setSearchQuery('');
    setAiPrompt('');
    setAiError('');
    setModalView('choices');
  };

  const handleAssignRecipe = (recipe: Recipe) => {
    if (pickerDate === null || pickerMeal === null) return;

    setAssignmentError('');

    const recipeId = typeof recipe.id === 'string' ? parseInt(recipe.id) : recipe.id;
    const currentMonthDays = getMonthDays(pickerDate);
    const currentDay = currentMonthDays.find((d) => d.date === pickerDate.getDate());
    if (!currentDay) return;

    if (hasDuplicatesInWeek(pickerDate, recipeId)) {
      setAssignmentError('Recipe already assigned in this week. Please pick a different recipe.');
      return;
    }

    const updated = currentMonthDays.map((d) => {
      if (d.date !== pickerDate.getDate()) {
        return d;
      }
      return {
        ...d,
        meals: {
          ...d.meals,
          [pickerMeal]: {
            recipeId,
            recipeTitle: recipe.title,
          },
        },
      };
    });

    saveCalendarForDate(pickerDate, updated);
    closeModal();
  };

  // AI generate recipe
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setAiLoading(true);
    setAiError('');

    try {
      const res = await fetch(`${API}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      if (!res.ok) {
        const data = (await res.json()) as GenerateRecipeErrorResponse;
        const logDetails = {
          status: res.status,
          type: data.details?.type,
          statusCode: data.details?.statusCode,
          code: data.details?.code,
          message: data.details?.message ?? data.message,
        };
        console.error(
          `Calendar AI recipe generation failed\n${JSON.stringify(logDetails, null, 2)}`
        );
        throw new Error(data.message || 'Generation failed');
      }

      const recipe = await res.json();
      // Assign the generated recipe to the slot
      if (pickerDate !== null && pickerMeal !== null) {
        const currentMonthDays = getMonthDays(pickerDate);
        const updated = currentMonthDays.map((d) => {
          if (d.date !== pickerDate.getDate()) return d;
          return {
            ...d,
            meals: {
              ...d.meals,
              [pickerMeal]: {
                recipeId: recipe.id,
                recipeTitle: recipe.title,
              },
            },
          };
        });
        saveCalendarForDate(pickerDate, updated);
      }
      // Refresh recipes list so the new one appears in the picker
      fetchRecipes();
      closeModal();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate recipe');
    } finally {
      setAiLoading(false);
    }
  };

  // Build continuous grid with leading/trailing days from adjacent months
  const monthGrid: GridCell[] = useMemo(() => {
    const cells: GridCell[] = [];
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const date = new Date(year, month, 1 - startOffset + i);
      const dayOfMonth = date.getDate();
      const isCurrent = date.getMonth() === month && date.getFullYear() === year;
      const dayData = isCurrent
        ? days.find((d) => d.date === dayOfMonth) || { date: dayOfMonth, meals: emptyMeals() }
        : { date: dayOfMonth, meals: emptyMeals() };

      cells.push({
        day: dayData,
        currentMonth: isCurrent,
        interactive: isCurrent,
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date,
      });
    }
    return cells;
  }, [days, year, month, today]);

  const dayHasRecipe = (day: CalendarDay, recipeId: number) => {
    return MEAL_TYPES.some((mealType) => {
      const slot = day.meals[mealType];
      return slot.recipeId === recipeId;
    });
  };

  const hasDuplicatesInWeek = (targetDate: Date, recipeId: number) => {
    const dayOfWeek = (targetDate.getDay() + 6) % 7; // Monday=0 .. Sunday=6

    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - dayOfWeek);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const sourceGrid = viewMode === 'week' ? weekGrid : monthGrid;
    return sourceGrid.some((cell) => {
      if (cell.fullDate < weekStart || cell.fullDate > weekEnd) return false;
      return dayHasRecipe(cell.day, recipeId);
    });
  };

  const weekGrid: GridCell[] = useMemo(() => {
    const cells: GridCell[] = [];
    const dow = (currentDate.getDay() + 6) % 7;
    const mondayOfWeek = new Date(currentDate);
    mondayOfWeek.setDate(currentDate.getDate() - dow);

    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayOfWeek);
      date.setDate(mondayOfWeek.getDate() + i);
      const isCurrent = date.getMonth() === month && date.getFullYear() === year;

      cells.push({
        day: getDayDataForDate(date),
        currentMonth: isCurrent,
        interactive: true,
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date,
      });
    }
    return cells;
  }, [currentDate, getDayDataForDate, month, year, today]);

  const grid = viewMode === 'week' ? weekGrid : monthGrid;

  const weekRange = useMemo(() => {
    if (viewMode !== 'week' || weekGrid.length === 0) return '';
    const start = weekGrid[0].fullDate;
    const end = weekGrid[6].fullDate;
    const fmt = (d: Date) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
    return `${fmt(start)} - ${fmt(end)}`;
  }, [viewMode, weekGrid]);

  const canNavigatePrevWeek = useMemo(() => {
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 7);
    const earliestMonth = allowedMonthDates[0];
    const minDate = new Date(earliestMonth.getFullYear(), earliestMonth.getMonth(), 1);
    return previousDate >= minDate;
  }, [allowedMonthDates, currentDate]);

  const canNavigateNextWeek = useMemo(() => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 7);
    const latestMonth = allowedMonthDates[allowedMonthDates.length - 1];
    const maxDate = new Date(latestMonth.getFullYear(), latestMonth.getMonth() + 1, 0);
    return nextDate <= maxDate;
  }, [allowedMonthDates, currentDate]);

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const { updatedDays, changed } = syncDaysWithRecipes(days, recipes);
    if (!changed) return;
    saveCalendar(updatedDays);
  }, [days, recipes, saveCalendar, syncDaysWithRecipes]);

  const getRecipeDetail = (recipeId: number | null): Recipe | undefined => {
    if (recipeId === null) return undefined;
    return recipes.find((r) => {
      const rid = typeof r.id === 'string' ? parseInt(r.id) : r.id;
      return rid === recipeId;
    });
  };

  const getSlotDisplayTitle = (recipeId: number | null, fallbackTitle: string | null) => {
    const recipe = getRecipeDetail(recipeId);
    return recipe?.title || fallbackTitle;
  };

  if (loading) {
    return (
      <div className="cal">
        <div className="cal-loading">
          <div className="cal-loading-spinner" />
          <p>Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cal">
      {saveError && (
        <div className="cal-save-error-toast">Failed to save your meal plan. Please try again.</div>
      )}
      {/* Header */}
      <div className="cal-header">
        <div className="cal-header-left">
          <button
            className="cal-nav-arrow"
            onClick={() => (viewMode === 'week' ? navigateWeek(-1) : navigateMonth(-1))}
            aria-label={viewMode === 'week' ? 'Previous week' : 'Previous month'}
            disabled={viewMode === 'week' ? !canNavigatePrevWeek : visibleMonthIndex === 0}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="cal-nav-arrow"
            onClick={() => (viewMode === 'week' ? navigateWeek(1) : navigateMonth(1))}
            aria-label={viewMode === 'week' ? 'Next week' : 'Next month'}
            disabled={
              viewMode === 'week'
                ? !canNavigateNextWeek
                : visibleMonthIndex === allowedMonthDates.length - 1
            }
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="cal-title">
            {monthName} {year}
          </h1>
          {viewMode === 'week' && <span className="cal-week-range">{weekRange}</span>}
        </div>
        <div className="cal-header-right">
          <button className="cal-today-btn" onClick={goToCurrentPeriod} type="button">
            {viewMode === 'week' ? 'Current Week' : 'Current Month'}
          </button>
          <div className="cal-view-toggle">
            <button
              className={`cal-view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`cal-view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Day labels */}
      <div className="cal-day-labels">
        {DAY_LABELS.map((label) => (
          <div key={label} className="cal-day-label">
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className={`cal-grid ${viewMode} ${animating ? 'animating' : ''}`}>
        {grid.map((cell, i) => (
          <div
            key={`${viewMode}-${i}`}
            className={`cal-cell ${viewMode} ${cell.isToday ? 'today' : ''} ${viewMode === 'month' && !cell.currentMonth ? 'muted' : ''}`}
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
              {MEAL_TYPES.map((mealType) => {
                const slot = cell.day.meals[mealType];
                const filled = slot.recipeId !== null;
                const recipe = viewMode === 'week' ? getRecipeDetail(slot.recipeId) : undefined;
                const displayTitle = getSlotDisplayTitle(slot.recipeId, slot.recipeTitle);

                if (filled) {
                  return (
                    <div key={mealType} className="cal-meal-slot-group">
                      <button
                        className={`cal-meal-slot ${mealType} filled ${viewMode}`}
                        disabled={!cell.interactive}
                        onClick={() =>
                          slot.recipeId === null ? undefined : handleViewRecipe(slot.recipeId)
                        }
                        title={displayTitle || ''}
                      >
                        <span className="cal-meal-label">{MEAL_LABELS[mealType]}</span>
                        <div className="cal-meal-content">
                          <span className="cal-meal-title">{displayTitle}</span>
                          {viewMode === 'week' && recipe && (
                            <div className="cal-meal-detail week">
                              <div className="cal-meal-metric">
                                <span className="cal-meal-metric-label">Time</span>
                                <span className="cal-meal-metric-value">
                                  {recipe.prepTime + recipe.cookTime} min
                                </span>
                              </div>
                              <div className="cal-meal-metric">
                                <span className="cal-meal-metric-label">Cost</span>
                                <span className="cal-meal-metric-value">
                                  ${recipe.estimatedCost.toFixed(2)}
                                </span>
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
                      </button>
                      {cell.interactive && (
                        <button
                          className="cal-meal-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMealDirect(cell.fullDate, mealType);
                          }}
                          title={`Remove ${displayTitle}`}
                          aria-label={`Remove ${displayTitle}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={mealType}
                    className={`cal-meal-slot ${mealType} ${viewMode}`}
                    onClick={() =>
                      cell.interactive ? handleSlotClick(cell.fullDate, mealType) : undefined
                    }
                    disabled={!cell.interactive}
                    title={`Add ${MEAL_LABELS[mealType]}`}
                  >
                    <span className="cal-meal-label">{MEAL_LABELS[mealType]}</span>
                    <span className="cal-meal-empty">
                      <svg
                        className="cal-meal-plus-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M7 2v10M2 7h10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modals ── */}
      {modalView !== 'closed' && (
        <div className="cal-modal-overlay" onClick={closeModal}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            {/* Shared close button */}
            <button className="cal-modal-close" onClick={closeModal} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* ── Choices View ── */}
            {modalView === 'choices' && (
              <div className="cal-choices">
                <div className="cal-choices-header">
                  <h2 className="cal-modal-title">Add a meal</h2>
                  <p className="cal-modal-subtitle">
                    {pickerMeal && MEAL_LABELS[pickerMeal]} &middot;{' '}
                    {pickerDate
                      ? `${MONTH_NAMES[pickerDate.getMonth()]} ${pickerDate.getDate()}`
                      : ''}
                  </p>
                </div>

                <div className="cal-choices-grid">
                  <button
                    className="cal-choice-card browse"
                    onClick={() => {
                      closeModal();
                      globalThis.location.hash = '#recipes';
                    }}
                  >
                    <div className="cal-choice-icon browse">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 6h16M4 12h16M4 18h16"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="cal-choice-label">Manage Recipes</span>
                    <span className="cal-choice-desc">
                      Go to your recipe list to create or edit one
                    </span>
                  </button>

                  <button className="cal-choice-card browse" onClick={() => setModalView('picker')}>
                    <div className="cal-choice-icon browse">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 7h14M5 12h14M5 17h8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="cal-choice-label">Choose from Recipes</span>
                    <span className="cal-choice-desc">Pick one from your existing recipe list</span>
                  </button>

                  <button className="cal-choice-card ai" onClick={() => setModalView('ai')}>
                    <div className="cal-choice-icon ai">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
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
                    <path
                      d="M12.5 15L7.5 10L12.5 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Back
                </button>
                <div className="cal-ai-header">
                  <div className="cal-choice-icon ai large">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
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
                  onChange={(e) => setAiPrompt(e.target.value)}
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
                {pickerDate !== null && modalView === 'picker' && (
                  <button className="cal-modal-back" onClick={() => setModalView('choices')}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M12.5 15L7.5 10L12.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Back
                  </button>
                )}
                <div className="cal-picker-header">
                  <div>
                    <h2 className="cal-modal-title">{pickerMeal && MEAL_LABELS[pickerMeal]}</h2>
                    <p className="cal-modal-subtitle">
                      {pickerDate
                        ? `${MONTH_NAMES[pickerDate.getMonth()]} ${pickerDate.getDate()}, ${pickerDate.getFullYear()}`
                        : ''}
                    </p>
                  </div>
                </div>

                {assignmentError && <div className="cal-picker-error">{assignmentError}</div>}

                <input
                  type="text"
                  className="cal-picker-search"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />

                <div className="cal-picker-list">
                  {filteredRecipes.length === 0 ? (
                    <p className="cal-picker-empty">
                      No recipes found. Create one in your Profile.
                    </p>
                  ) : (
                    filteredRecipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        className="cal-picker-item"
                        onClick={() => handleAssignRecipe(recipe)}
                      >
                        <div className="cal-picker-item-info">
                          <span className="cal-picker-item-title">{recipe.title}</span>
                          <span className="cal-picker-item-meta">
                            {recipe.prepTime + recipe.cookTime} min &middot; $
                            {recipe.estimatedCost.toFixed(2)}
                            {recipe.difficulty && <> &middot; {recipe.difficulty}</>}
                          </span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M6 12l4-4-4-4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
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
    </div>
  );
}

export default Calendar;
