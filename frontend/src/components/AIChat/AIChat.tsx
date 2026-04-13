import React, { useState, useEffect, useRef } from 'react';
import Aurora from '../Unique/Background';
import Card from '../Unique/Card';
import {
  MEAL_TYPES,
  MEAL_LABELS,
  buildEmptyMonth,
  emptyMeals,
  type MealType,
  type CalendarDay,
} from '../Calendar/types';
import {
  fetchCalendarWindow,
  saveCalendarWindow,
  replaceMonthInCalendarWindow,
  getCalendarMonthKey,
} from '../../api/calendar';
import './AIChat.css';

const API = 'http://localhost:3000';
const AURORA_COLORS = ['#7cff67', '#B19EEF', '#5227FF'];

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface GeneratedRecipe {
  id: number;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedCost: number;
  heroImage: string | null;
  categories: string[];
  ingredients: Ingredient[];
  steps: string[];
  dietaryPreferences?: string[];
  allergies?: string[];
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

type MessageContent =
  | { kind: 'user'; text: string }
  | { kind: 'model'; text: string }
  | { kind: 'recipe'; recipe: GeneratedRecipe };

type Message = MessageContent & { id: string };

const INITIAL_MESSAGE: Message = {
  id: 'initial-message',
  kind: 'model',
  text: "Hey there! I'm your AI recipe chef. Tell me what ingredients you have, any dietary preferences, or just the kind of dish you're in the mood for — and I'll whip up a brand new recipe just for you!",
};

// ── Session storage helpers ────────────────────────────────

const STORAGE_KEY = 'aichat_messages';
let nextMessageId = 0;

function createMessageId(): string {
  nextMessageId += 1;
  return `message-${Date.now()}-${nextMessageId}`;
}

function createMessage(message: MessageContent): Message {
  return { id: createMessageId(), ...message };
}

function normalizeMessage(message: Message | MessageContent, index: number): Message {
  if ('id' in message && typeof message.id === 'string' && message.id.trim()) {
    return message;
  }

  return { id: `legacy-message-${index}-${createMessageId()}`, ...message };
}

function getUserId(): number | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1])) as { id?: number };
    return payload.id ?? null;
  } catch {
    return null;
  }
}

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_MESSAGE];
    const { userId, messages } = JSON.parse(raw) as {
      userId: number | null;
      messages: Array<Message | MessageContent>;
    };
    if (userId !== getUserId()) return [INITIAL_MESSAGE];
    return messages.map((message, index) => normalizeMessage(message, index));
  } catch {
    return [INITIAL_MESSAGE];
  }
}

function persistMessages(messages: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: getUserId(), messages }));
  } catch {
    /* quota exceeded — silent */
  }
}

// ── Calendar helpers ───────────────────────────────────────

async function fetchCalendarDays(token: string): Promise<CalendarDay[]> {
  const today = new Date();
  const centerDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const calWindow = await fetchCalendarWindow(token, centerDate);
  const monthKey = getCalendarMonthKey(centerDate);
  return calWindow.monthData[monthKey] ?? buildEmptyMonth(today.getFullYear(), today.getMonth());
}

async function saveCalendarDays(days: CalendarDay[], token: string): Promise<void> {
  const today = new Date();
  const centerDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const calWindow = await fetchCalendarWindow(token, centerDate);
  const updatedWindow = replaceMonthInCalendarWindow(calWindow, centerDate, days);
  await saveCalendarWindow(token, updatedWindow);
}

// ── RecipeMessage ──────────────────────────────────────────

interface RecipeMessageProps {
  recipe: GeneratedRecipe;
}

const RecipeMessage: React.FC<RecipeMessageProps> = ({ recipe }) => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const [profileAdded, setProfileAdded] = useState(false);
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [calDay, setCalDay] = useState(today.getDate());
  const [calMeal, setCalMeal] = useState<MealType>('lunch');
  const [calStatus, setCalStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [conflictTitle, setConflictTitle] = useState<string | null>(null);

  const handleAddToProfile = () => {
    // Recipe is already saved in DB by the generate endpoint — just show confirmation
    setProfileAdded(true);
  };

  const doSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setCalStatus('saving');
    try {
      const days = await fetchCalendarDays(token);

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

      await saveCalendarDays(updated, token);
      setCalStatus('saved');
      setTimeout(() => {
        setShowCalPicker(false);
        window.location.hash = '#calendar';
      }, 800);
    } catch {
      setCalStatus('error');
    }
  };

  const handleAddToCalendar = async () => {
    if (calStatus === 'saving') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const days = await fetchCalendarDays(token);
    const slot = days.find((d) => d.date === calDay)?.meals[calMeal];
    if (slot?.recipeId !== null && slot?.recipeTitle) {
      setConflictTitle(slot.recipeTitle);
      return;
    }
    await doSave();
  };

  return (
    <div className="aichat-card-row">
      <div className="aichat-card-wrapper">
        <div className="aichat-card-container">
          <Card
            {...recipe}
            ingredients={recipe.ingredients.map((ing) => ({
              name: ing.name,
              amount: String(ing.amount),
              unit: ing.unit,
            }))}
          />
        </div>

        <div className="aichat-card-actions">
          {/* Add to Profile */}
          <button
            className={`aichat-action-btn${profileAdded ? ' aichat-action-btn--done' : ''}`}
            onClick={handleAddToProfile}
            disabled={profileAdded}
          >
            {profileAdded ? (
              <>
                <span className="aichat-check-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                Saved to profile
              </>
            ) : (
              'Add to profile'
            )}
          </button>

          {/* Add to Calendar */}
          {!showCalPicker && calStatus !== 'saved' && (
            <button className="aichat-action-btn" onClick={() => setShowCalPicker(true)}>
              Add to calendar
            </button>
          )}
          {calStatus === 'saved' && !showCalPicker && (
            <button className="aichat-action-btn aichat-action-btn--done" disabled>
              <span className="aichat-check-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              Added to calendar
            </button>
          )}
        </div>

        {showCalPicker && calStatus !== 'saved' && (
          <div className="aichat-cal-picker">
            <div className="aichat-cal-picker-row">
              <label className="aichat-cal-label">Day</label>
              <select
                className="aichat-cal-select"
                value={calDay}
                onChange={(e) => setCalDay(Number(e.target.value))}
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <label className="aichat-cal-label">Meal</label>
              <select
                className="aichat-cal-select"
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

            <div className="aichat-cal-picker-row">
              <button
                className="aichat-cal-confirm-btn"
                onClick={handleAddToCalendar}
                disabled={calStatus === 'saving'}
              >
                {calStatus === 'saving' ? 'Saving…' : 'Confirm'}
              </button>
              <button
                className="aichat-cal-cancel-btn"
                onClick={() => {
                  setShowCalPicker(false);
                  setCalStatus('idle');
                }}
              >
                Cancel
              </button>
            </div>

            {conflictTitle && (
              <div className="aichat-cal-conflict">
                <p className="aichat-cal-conflict-text">
                  <strong>{conflictTitle}</strong> is already scheduled here. Replace it?
                </p>
                <div className="aichat-cal-picker-row">
                  <button
                    className="aichat-cal-confirm-btn"
                    onClick={() => {
                      setConflictTitle(null);
                      void doSave();
                    }}
                  >
                    Yes, replace
                  </button>
                  <button className="aichat-cal-cancel-btn" onClick={() => setConflictTitle(null)}>
                    Keep it
                  </button>
                </div>
              </div>
            )}
            {calStatus === 'error' && (
              <p className="aichat-cal-error">Failed to save. Please try again.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── AIChat ─────────────────────────────────────────────────

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, createMessage({ kind: 'user', text })]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/recipes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!response.ok) {
        const err = (await response.json()) as GenerateRecipeErrorResponse;
        const logDetails = {
          status: response.status,
          type: err.details?.type,
          statusCode: err.details?.statusCode,
          code: err.details?.code,
          message: err.details?.message ?? err.message,
        };
        console.error(`AI recipe generation failed\n${JSON.stringify(logDetails, null, 2)}`);
        throw new Error(err.message ?? 'Failed to generate recipe');
      }

      const recipe = (await response.json()) as GeneratedRecipe;
      setMessages((prev) => [...prev, createMessage({ kind: 'recipe', recipe })]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again!';
      setMessages((prev) => [...prev, createMessage({ kind: 'model', text: msg })]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Aurora colorStops={AURORA_COLORS} blend={0.5} amplitude={1.5} speed={0.5} />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <div className="aichat-header">
          <p className="aichat-title">✦ AI Recipe Chef</p>
          <button
            className="aichat-clear-btn"
            onClick={() => {
              setMessages([INITIAL_MESSAGE]);
              persistMessages([INITIAL_MESSAGE]);
            }}
          >
            Clear
          </button>
        </div>

        <div className="aichat-messages">
          {messages.map((msg) => {
            if (msg.kind === 'recipe') {
              return <RecipeMessage key={msg.id} recipe={msg.recipe} />;
            }
            return (
              <div key={msg.id} className={`aichat-bubble-row aichat-bubble-row--${msg.kind}`}>
                <div className={`aichat-bubble aichat-bubble--${msg.kind}`}>{msg.text}</div>
              </div>
            );
          })}

          {loading && (
            <div className="aichat-bubble-row aichat-bubble-row--model">
              <div className="aichat-bubble aichat-bubble--model aichat-bubble--typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="aichat-input-row">
          <textarea
            className="aichat-input"
            placeholder="Describe what you're craving or list your ingredients..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="aichat-send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
