import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Card from './Card';
import Aurora from './Background';
import { type Recipe } from './fakeRecipes';
import { fetchRecipes } from '../../api/recipes';
import {
  MONTH_NAMES,
  MEAL_TYPES,
  MEAL_LABELS,
  buildEmptyMonth,
  emptyMeals,
  type MealType,
  type CalendarDay,
} from '../Calendar/types';
import './Unique.css';

const API = 'http://localhost:3000';

async function fetchCalendarDays(
  month: string,
  year: number,
  token: string
): Promise<CalendarDay[]> {
  const res = await fetch(`${API}/api/calendar?month=${month}&year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const data = (await res.json()) as { days: CalendarDay[] };
    const today = new Date();
    const full = buildEmptyMonth(today.getFullYear(), today.getMonth());
    for (const d of data.days) {
      const idx = d.date - 1;
      if (idx >= 0 && idx < full.length) full[idx] = d;
    }
    return full;
  }
  return buildEmptyMonth(new Date().getFullYear(), new Date().getMonth());
}

async function saveCalendarDays(month: string, year: number, days: CalendarDay[], token: string) {
  await fetch(`${API}/api/calendar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ month, year, days }),
  });
}

type Phase = 'intro' | 'picker' | 'no-results' | 'game';

const fireConfetti = () => {
  const end = Date.now() + 3 * 1000;
  const colors = ['#00ff75', '#B19EEF', '#5227FF', '#7cff67', '#ffffff'];
  const frame = () => {
    if (Date.now() > end) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors,
    });
    requestAnimationFrame(frame);
  };
  frame();
};

const getUserIdFromToken = (): number | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      )
    ) as { id?: number };
    return payload.id ?? null;
  } catch {
    return null;
  }
};

const AURORA_COLORS = ['#7cff67', '#B19EEF', '#5227FF'];

const Unique: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'any'>('all');
  const [pool, setPool] = useState<Recipe[]>([]);
  const [slots, setSlots] = useState<[Recipe | null, Recipe | null]>([null, null]);
  const [fadingSlot, setFadingSlot] = useState<0 | 1 | null>(null);
  const [winner, setWinner] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [calDay, setCalDay] = useState(today.getDate());
  const [calMeal, setCalMeal] = useState<MealType>('lunch');
  const [calStatus, setCalStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [conflictTitle, setConflictTitle] = useState<string | null>(null);

  useEffect(() => {
    const userId = getUserIdFromToken();
    fetchRecipes()
      .then((data) => {
        const userRecipes = userId !== null ? data.filter((r) => r.createdBy === userId) : data;
        const normalized: Recipe[] = userRecipes.map((r) => ({
          id: typeof r.id === 'string' ? parseInt(r.id, 10) : (r.id as number),
          title: r.title,
          description: r.description,
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          difficulty: (r.difficulty as Recipe['difficulty']) ?? 'Easy',
          estimatedCost: r.estimatedCost,
          heroImage: r.heroImage ?? null,
          categories: r.categories,
          ingredients: r.ingredients,
          steps: r.steps.map((s) => (typeof s === 'string' ? s : (s as { text: string }).text)),
          createdBy: r.createdBy,
          createdAt: r.createdAt,
        }));
        setRecipes(normalized);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getIngredientName = (ing: Recipe['ingredients'][number]): string =>
    typeof ing === 'string' ? ing : ing.name;

  const allIngredients = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.ingredients.forEach((i) => set.add(getIngredientName(i))));
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [recipes]);

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const getFiltered = (mode: 'all' | 'any'): Recipe[] => {
    if (selectedIngredients.length === 0) return recipes;
    return recipes.filter((r) => {
      const names = r.ingredients.map(getIngredientName);
      return mode === 'all'
        ? selectedIngredients.every((ing) => names.includes(ing))
        : selectedIngredients.some((ing) => names.includes(ing));
    });
  };

  const startGame = () => {
    const filtered = getFiltered(filterMode);

    // Common mode: strict handling of 0 or 1 result
    if (filterMode === 'all') {
      if (filtered.length === 0) {
        setPhase('no-results');
        return;
      }
      if (filtered.length === 1) {
        setWinner(filtered[0]);
        fireConfetti();
        setPhase('game'); // winner render is inside game phase check
        return;
      }
    }

    // Uncommon mode or common with enough results: fall back if too few
    const pool = filterMode === 'any' && filtered.length < 4 ? recipes : filtered;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setSlots([shuffled[0], shuffled[1]]);
    setPool(shuffled.slice(2));
    setPhase('game');
  };

  const handleChoose = (chosenIndex: 0 | 1) => {
    if (fadingSlot !== null) return;

    const discardIndex = (1 - chosenIndex) as 0 | 1;

    if (pool.length === 0) {
      setWinner(slots[chosenIndex]!);
      fireConfetti();
      return;
    }

    const poolCopy = [...pool];
    // eslint-disable-next-line react-hooks/purity
    const replaceIdx = Math.floor(Math.random() * poolCopy.length);
    const replacement = poolCopy[replaceIdx];
    const newPool = poolCopy.filter((_, i) => i !== replaceIdx);

    setFadingSlot(discardIndex);

    setTimeout(() => {
      setSlots((prev) => {
        const next: [Recipe | null, Recipe | null] = [prev[0], prev[1]];
        next[discardIndex] = replacement;
        return next;
      });
      setPool(newPool);
      setFadingSlot(null);
    }, 500);
  };

  const doSave = async (recipe: Recipe) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setCalStatus('saving');
    try {
      const month = MONTH_NAMES[today.getMonth()];
      const year = today.getFullYear();
      const days = await fetchCalendarDays(month, year, token);
      const updated = days.map((d) => {
        if (d.date !== calDay) return d;
        return {
          ...d,
          meals: { ...d.meals, [calMeal]: { recipeId: recipe.id, recipeTitle: recipe.title } },
        };
      });
      if (!updated.find((d) => d.date === calDay)) {
        updated.push({
          date: calDay,
          meals: { ...emptyMeals(), [calMeal]: { recipeId: recipe.id, recipeTitle: recipe.title } },
        });
        updated.sort((a, b) => a.date - b.date);
      }
      await saveCalendarDays(month, year, updated, token);
      setCalStatus('saved');
      setTimeout(() => {
        setShowCalPicker(false);
        window.location.hash = '#calendar';
      }, 800);
    } catch {
      setCalStatus('error');
    }
  };

  const handleAddToCalendar = async (recipe: Recipe) => {
    if (calStatus === 'saving') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const days = await fetchCalendarDays(MONTH_NAMES[today.getMonth()], today.getFullYear(), token);
    const slot = days.find((d) => d.date === calDay)?.meals[calMeal];
    if (slot?.recipeId !== null && slot?.recipeTitle) {
      setConflictTitle(slot.recipeTitle);
      return;
    }
    await doSave(recipe);
  };

  const aurora = (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Aurora colorStops={AURORA_COLORS} blend={0.5} amplitude={1.5} speed={0.5} />
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {aurora}
        <p style={{ color: 'white', fontSize: '1.5rem', position: 'relative', zIndex: 1 }}>
          Loading recipes...
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {aurora}
        <div className="intro-overlay" onClick={() => setPhase('picker')}>
          <div className="intro-card">
            <p className="intro-text">
              Can't decide what to eat? Play our new game to discover what you've been craving!
            </p>
            <span className="intro-hint">click anywhere to continue</span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'picker') {
    return (
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        {aurora}
        <div className="picker-wrapper">
          <div className="picker-card">
            <p className="picker-dialogue">
              Before, let's define the ingredients you have in your hands
            </p>
            <p className="picker-tip">
              psssst.... the less ingredients you pick, the more options you will have!
            </p>
          </div>

          <div className="filter-toggle">
            <button
              className={`toggle-option${filterMode === 'all' ? ' toggle-active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              Common
            </button>
            <button
              className={`toggle-option${filterMode === 'any' ? ' toggle-active' : ''}`}
              onClick={() => setFilterMode('any')}
            >
              Uncommon
            </button>
          </div>
          <p className="filter-toggle-hint">
            {filterMode === 'all'
              ? 'Each recipe shown will include all of your ingredients'
              : 'Each recipe shown will include at least one of your ingredients'}
          </p>

          <div className="ingredients-grid">
            {allIngredients.map((ing) => (
              <button
                key={ing}
                className={`ingredient-chip${selectedIngredients.includes(ing) ? ' selected' : ''}`}
                onClick={() => toggleIngredient(ing)}
              >
                {ing}
              </button>
            ))}
          </div>
          <button className="picker-start-btn" onClick={startGame}>
            Let's play!
          </button>
          <a href="#aichat" className="picker-aichat-link">
            Not feeling like choosing from your own recipes? Generate a brand new recipe from
            scratch here →
          </a>
        </div>
      </div>
    );
  }

  if (phase === 'no-results') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {aurora}
        <div className="no-results-container">
          <p className="no-results-icon">X</p>
          <h2 className="no-results-title">No recipe found</h2>
          <p className="no-results-body">
            None of your recipes use all of <strong>{selectedIngredients.join(', ')}</strong>{' '}
            together.
          </p>
          <div className="no-results-actions">
            <a href="#aichat" className="no-results-generate-btn">
              Generate one from scratch with AI →
            </a>
            <button className="no-results-back-btn" onClick={() => setPhase('picker')}>
              ← Change my ingredients
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (winner) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {aurora}
        <div className="winner-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="winner-card-wrapper">
            <Card {...winner} />
          </div>
          <p className="winner-label">
            It looks like you've been craving <strong>{winner.title}</strong>... Time to cook!
          </p>

          {/* ── Add to Calendar ── */}
          <div className="winner-cal-wrapper">
            {calStatus === 'saved' ? (
              <button className="winner-cal-btn winner-cal-btn--done" disabled>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="14"
                  height="14"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added to calendar
              </button>
            ) : !showCalPicker ? (
              <button className="winner-cal-btn" onClick={() => setShowCalPicker(true)}>
                Add to calendar
              </button>
            ) : null}

            {showCalPicker && calStatus !== 'saved' && (
              <div className="winner-cal-picker">
                <div className="winner-cal-picker-row">
                  <label className="winner-cal-label">Day</label>
                  <select
                    className="winner-cal-select"
                    value={calDay}
                    onChange={(e) => setCalDay(Number(e.target.value))}
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <label className="winner-cal-label">Meal</label>
                  <select
                    className="winner-cal-select"
                    value={calMeal}
                    onChange={(e) => setCalMeal(e.target.value as MealType)}
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m} value={m}>
                        {MEAL_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="winner-cal-picker-row">
                  <button
                    className="winner-cal-confirm-btn"
                    onClick={() => void handleAddToCalendar(winner)}
                    disabled={calStatus === 'saving'}
                  >
                    {calStatus === 'saving' ? 'Saving…' : 'Confirm'}
                  </button>
                  <button
                    className="winner-cal-cancel-btn"
                    onClick={() => {
                      setShowCalPicker(false);
                      setCalStatus('idle');
                      setConflictTitle(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {conflictTitle && (
                  <div className="winner-cal-conflict">
                    <p className="winner-cal-conflict-text">
                      <strong>{conflictTitle}</strong> is already scheduled here. Replace it?
                    </p>
                    <div className="winner-cal-picker-row">
                      <button
                        className="winner-cal-confirm-btn"
                        onClick={() => {
                          setConflictTitle(null);
                          void doSave(winner);
                        }}
                      >
                        Yes, replace
                      </button>
                      <button
                        className="winner-cal-cancel-btn"
                        onClick={() => setConflictTitle(null)}
                      >
                        Keep it
                      </button>
                    </div>
                  </div>
                )}
                {calStatus === 'error' && (
                  <p className="winner-cal-error">Failed to save. Please try again.</p>
                )}
              </div>
            )}
          </div>
        </div>
        <a href="#aichat" className="winner-generate-link">
          Still not satisfied? Generate a brand new recipe from scratch with AI →
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {aurora}
      <div
        className="unique-game-row"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingTop: '16px',
        }}
      >
        {([0, 1] as const).map((i) => (
          <div key={i} className="card-slot">
            <div
              className={`card-wrapper card-wrapper--game${fadingSlot === i ? ' card-fading' : ''}`}
            >
              {slots[i] && <Card {...slots[i]!} />}
            </div>
            <button
              className="choose-btn"
              onClick={() => handleChoose(i)}
              disabled={fadingSlot !== null}
            >
              Choose!
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Unique;
