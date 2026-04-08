# Sprint 3 Contribution Log – Berenis Fopa Tsamo

## Overview

This log documents my contributions to the MealMajor project during Sprint 3, focusing on the AI recipe generation feature using the Gemini API, the calendar meal planning backend, and subsequent bug fixes and refinements.

---

## Contribution Summary

| Date       | Activity                                                                                   | Commit(s)           | Time spent (hours) |
|------------|--------------------------------------------------------------------------------------------|---------------------|-------------------|
| 2026-03-08 | Constrained recipe ingredient selection to a predefined list                               | `fd038ce`           | 1.5               |
| 2026-03-08 | Implemented AI recipe generation endpoint using Gemini API                                 | `8e21a1e`           | 2.0               |
| 2026-03-11 | Designed and implemented the calendar feature backend (schema, controller, routes)         | `13dd8fa`, `d7e0b0b`| 3.0               |
| 2026-03-24 | Removed ingredient validation check for normal recipe creation                             | `ab4a865`           | 0.5               |
| 2026-03-24 | Fixed calendar bugs in controller and frontend Calendar component                          | `3d74503`, `3ca8f52`| 1.5               |

---

## Detailed Contributions

### 1. Predefined Ingredient List for Recipe Creation (Mar 8, 2026)

**Commit:** `fd038ce`

- **Refactored `express/controllers/recipesController.ts`** to constrain ingredient input for recipe creation to a predefined list
- Extended the recipe type definitions in `express/types/index.ts` to accommodate the new ingredient structure
- This approach ensures data consistency and makes ingredient-based filtering and suggestions more reliable across the app

---

### 2. AI Recipe Generation Endpoint using Gemini (Mar 8, 2026)

**Commit:** `8e21a1e`

- **Added a `generateRecipe` endpoint** in `express/controllers/recipesController.ts` that calls the Google Gemini API to generate a complete recipe based on a user-supplied prompt
- Integrated the `@google/generative-ai` package (`package.json` / `package-lock.json`)
- Registered a new `POST /api/recipes/generate` route in `express/routes/recipes.ts`
- Updated `express/server.ts` to support the new Gemini-powered route

Key decisions:
- Used Gemini's `generateContent` method with a structured prompt to produce recipe JSON (title, ingredients, steps, etc.)
- Parsed and validated the Gemini response before saving to the database to prevent malformed entries

---

### 3. Calendar Meal Planner Feature – Backend (Mar 11, 2026)

**Commits:** `13dd8fa`, `d7e0b0b` (merge PR #68 – Calendar+AI)

- **Designed the `calendars` table** in `express/db/schema.ts` to store monthly meal plans linked to users, with daily entries (breakfast, lunch, dinner)
- Created a new Drizzle migration (`express/drizzle/meta/0001_snapshot.json`, `_journal.json`) and applied it to the database
- **Implemented `express/controllers/calendarController.ts`** with endpoints to:
  - Retrieve a user's calendar for a given month/year
  - Create or replace a calendar entry (upsert)
- Created `express/routes/calendar.ts` and registered the routes in `express/server.ts`
- Added calendar-related TypeScript types to `express/types/index.ts`

---

### 4. Removed Ingredient Validation for Normal Recipe Creation (Mar 24, 2026)

**Commit:** `ab4a865`

- Removed the strict ingredient validation check in `express/controllers/recipesController.ts` that was blocking normal (non-AI) recipe creation
- This fix allowed users to create recipes freely without being gated by the predefined ingredient list constraint, separating the validation concern between AI-generated and user-created recipes

---

### 5. Calendar Bug Fixes – Backend & Frontend (Mar 24, 2026)

**Commits:** `3d74503`, `3ca8f52` (merge PR #73 – Calendar Feature Closes #69)

- **Refactored `express/controllers/calendarController.ts`**: simplified controller logic, fixed edge cases in the upsert behaviour, and improved error handling
- **Fixed `frontend/src/components/Calendar/Calendar.tsx`**: resolved bugs in the calendar display and meal assignment logic, including issues with weekly data binding and UI state management
- Merged the complete Calendar feature branch into Dev, bringing in:
  - Full `Calendar.tsx` component with CSS (`Calendar.css`)
  - Supporting `types.ts` for calendar data structures
  - `LoadingScreen` component (`LoadingScreen.tsx`, `LoadingScreen.css`)
  - Navbar updates to link to the calendar view

---

## Technical Skills Applied

- **Backend Development**: Express.js, Node.js, REST API design
- **Database**: Drizzle ORM, SQLite, schema migrations with Drizzle Kit
- **AI Integration**: Google Gemini API (`@google/generative-ai`), prompt engineering, response parsing
- **Authentication**: JWT-based user context for calendar ownership
- **Frontend**: React (TSX), component debugging and state management
- **TypeScript**: Type definitions, interface extensions
- **AI-Assisted Development**: Used Gemini for architecture discussions, debugging assistance, and code review

---

## Total Time Spent: ~8.5 hours

---

## Summary

During Sprint 3, I delivered the AI-powered recipe generation endpoint using the Gemini API, designed and implemented the full calendar meal planner backend (schema, controller, routes, migrations), and resolved follow-up bugs in both the calendar controller and the frontend Calendar component. I also refined the recipe ingredient handling by separating the predefined-list constraint from normal user-facing recipe creation.
