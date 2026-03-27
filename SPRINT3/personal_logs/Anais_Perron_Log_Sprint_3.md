# Sprint 3 Contribution Log – Anais Perron

## Overview

This log documents my contributions to the MealMajor project during Sprint 3, focusing on the implementation of the AI Recipe Chat feature, the "Unique" recipe selection game, the Recipe Popup detail view, and various frontend polish and bug fixes.

---

## Contribution Summary

| Date       | Activity                                                                                      | Commit(s)           | Time spent (hours) |
|------------|-----------------------------------------------------------------------------------------------|---------------------|--------------------|
| 2026-03-05 | Improved sign-in page animation and added rotating plate visual asset                        | `386ba94`           | 2                  |
| 2026-03-15 | Fixed homepage animation timing                                                               | `3ce088b`           | 0.5                |
| 2026-03-16 | Built base for the Unique feature: routing, navbar entry, page scaffold                      | `15722fc`           | 2                  |
| 2026-03-19 | Designed and implemented the full Unique feature UI (flip cards, game logic, Aurora background) | `f69f618`         | 5                  |
| 2026-03-20 | Improved homepage animations and layout consistency     (SPRINT 4)                                      | `6d8f8c1`, `9f1d0ed`| 1.5                |
| 2026-03-23 | Added ingredient selection picker and filter modes (Common/Uncommon) to the Unique feature   | `9606c2c`           | 3                  |
| 2026-03-23 | Built the RecipePopup full-detail modal (ingredients, steps, tags, meta bar, hero image)     | `5844b6f`           | 4                  |
| 2026-03-25 | Wired AI chatbot to Gemini recipe generation endpoint; added recipe card display in chat     | `0e59cd6`, `9f7ec1b`| 4                  |
| 2026-03-25 | Connected Unique feature to actual user recipes from the database                            | `80a6d44`           | 2                  |
| 2026-03-25 | Fixed Aurora WebGL re-render bug triggered by every keystroke/click event                    | `9f7ec1b`           | 1                  |
| 2026-03-25 | Fixed tests for Aurora background component                                                   | `0381491`           | 0.5                |
| 2026-03-27 | Wired "Get Started" / "Details" button in Profile to open RecipePopup full-detail view       | `8215c7e`           | 1.5                |
| 2026-03-27 | Added Add-to-Calendar and Add-to-Profile actions in AIChat with conflict confirmation UI     | `116c109`           | 3                  |
| 2026-03-27 | Fixed frontend TypeScript / event handler bug in AIChat                                      | `116c109`           | 0.5                |
| 2026-03-27 | Fixed failing frontend test related to AIChat component                                       | `17f006d`           | 0.5                |

**Total: ~31.5 hours**

---

## Detailed Contributions

### AI Recipe Chat (`AIChat.tsx` / `AIChat.css`)

Built the full AI-powered recipe chat interface from scratch:

- Wired the chat to the existing `POST /api/recipes/generate` Gemini endpoint (previously the component called a non-existent `/api/chat` route)
- Recipes returned by the AI are displayed inline as `Card.tsx` flip cards within the chat thread
- Chat history is persisted in `sessionStorage` scoped to the current logged-in user (extracted from JWT), so navigating away and back does not reset the conversation
- Diagnosed and fixed a critical Aurora WebGL background bug: the inline `colorStops={[...]}` array was a new reference on every render, causing the WebGL context to tear down and rebuild on every keystroke or click — fixed by hoisting the array to a module-level constant
- Added **Add to Profile** action with checkmark animation (recipe is already saved by the generate endpoint)
- Added **Add to Calendar** action with a day/meal picker and full conflict detection: if the selected slot already has a recipe, a yellow confirmation box appears asking the user to confirm the replacement before overwriting
- Chat clears cleanly on logout (`sessionStorage` key removed in `handleLogout`)

### Unique Feature (`Unique.tsx` / `Unique.css` / `Card.tsx`)

Designed and implemented the interactive recipe selection game end-to-end:

- Game loop: two recipe cards shown side-by-side, user picks one, the rejected card is replaced from a shuffled pool until a winner emerges
- Ingredient filter picker with **Common** (all selected ingredients must be present) and **Uncommon** (at least one) modes
- Edge cases handled: 0 results → "No recipe found" screen with AI generation link; 1 result → immediate winner with confetti
- Winner screen with confetti animation, winner label, and **Add to Calendar** button with the same day/meal picker and conflict confirmation flow as AIChat
- Connected to real user recipes from the backend (filtered by `createdBy` from the JWT) instead of fake static data
- Fixed Aurora background re-render bug (same root cause as AIChat)

### Recipe Popup (`RecipePopup.tsx` / `RecipePopup.css`)

Built the full-detail recipe popup modal used across the app:

- Displays hero image, difficulty badge, time/cost meta bar, description, ingredients list, step-by-step instructions, and category/dietary/allergy tags
- Implemented using `ReactDOM.createPortal` to render at `document.body`, escaping CSS `perspective: 1000px` stacking contexts on flip cards that were trapping `position: fixed` descendants (the popup was rendering as a small rectangle inside the card)
- Closes on Escape key and on overlay click
- Responsive down to 540px

### Profile – Recipe Detail View (`CreateRecipe.tsx`)

- Wired the "Get Started" and "Details" buttons in the Profile recipe manager to open the RecipePopup with the full recipe details, matching the behaviour of "View details" in the Unique feature
- Fixed z-index layering so the popup renders above the profile modal close button

---

## Technical Notes

- **Aurora re-render bug**: `useEffect` in the Aurora WebGL component had `colorStops` in its dependency array. Passing an inline array literal (`colorStops={['#7cff67', ...]}`) creates a new array reference on every parent render, triggering a full WebGL teardown. Fix: hoist to a module-level `const AURORA_COLORS`.
- **Portal fix for RecipePopup**: CSS `transform` and `perspective` properties create a new stacking context, which prevents `position: fixed` from being relative to the viewport. `createPortal` moves the DOM node to `document.body`, escaping the context entirely.
- **Calendar conflict detection**: Before saving, the app fetches the full month state and inspects the target slot. If `slot.recipeId !== null && slot.recipeTitle` is set, the conflict UI is shown instead of saving immediately.
