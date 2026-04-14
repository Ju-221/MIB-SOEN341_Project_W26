# Sprint 4 Contribution Log – Berenis Fopa Tsamo

## Overview

This log documents my contributions to the MealMajor project during Sprint 4, focusing on the new Recipes page, homepage UI overhaul, profile page fixes, comprehensive backend & frontend testing, code quality/SonarQube hardening, and global styling polish.

---

## Contribution Summary

| Date       | Activity                                                                                      | Commit(s)                            | Time spent (hours) |
|------------|-----------------------------------------------------------------------------------------------|--------------------------------------|-------------------|
| 2026-04-07 | Built the full Recipes page component (filtering, ownership controls, image loading)          | `78e2c4d`                            | 1.5               |
| 2026-04-07 | Redesigned and rebuilt the Homepage UI (layout, copy, responsiveness)                        | `cddb2ce`                            | 1.0               |
| 2026-04-07 | Fixed auth middleware edge case (token validation)                                            | `f280097`                            | 0.25              |
| 2026-04-12 | Restored full Recipes page with filtering and ownership controls after merge conflicts        | `ec6ffb3`                            | 0.5               |
| 2026-04-12 | Fixed image loading in Recipe cards                                                           | `9679897`, `210b276`                 | 0.25              |
| 2026-04-12 | Fixed tournament (Unique) recipe card layout and AIChat CSS                                  | `ab0cfb2`, `64586d4`                 | 0.25              |
| 2026-04-12 | Removed unused Navbar icon                                                                    | `a95c714`                            | 0.25              |
| 2026-04-12 | Fixed Calendar TypeScript types to match current DB schema (added snack meal type)           | `985352d`                            | 0.25              |
| 2026-04-12 | Fixed the Profile page (backend endpoint + frontend refactor)                                 | `36fee9a`                            | 1.0               |
| 2026-04-12 | Fixed eye-emoji password toggle on Sign In & Sign Up                                         | `fa34a32`                            | 0.25              |
| 2026-04-12 | Homepage font legibility improvement                                                          | `42f6a23`                            | 0.25              |
| 2026-04-12 | Global consistent styling pass across Auth, Calendar, Profile, Recipes, and index.css        | `a185553`                            | 0.5               |
| 2026-04-12 | Added comprehensive backend test suite (auth, recipes, user, calendar, preferences)          | `c332baf`                            | 0.75              |
| 2026-04-12 | General code formatting (Auth, Profile components)                                            | `f34628a`                            | 0.25              |
| 2026-04-12 | Updated and cleaned up frontend tests (Profile.test.tsx)                                     | `1e3db69`                            | 0.25              |
| 2026-04-12 | Fixed frontend ESLint violations in Profile component                                         | `deb16f1`                            | 0.25              |
| 2026-04-12 | Removed dead/unused code across backend and types                                             | `0694e8c`                            | 0.25              |
| 2026-04-12 | Extended backend & frontend test coverage (calendar, signup, recipes, user tests)            | `14e9b66`                            | 0.5               |
| 2026-04-12 | Fixed Prettier formatting on new test files and recipes API                                  | `7e76a56`                            | 0.25              |
| 2026-04-12 | Hardened security strings for SonarQube (auth controller, middleware, test helpers)          | `4b9c16c`                            | 0.25              |

---

## Detailed Contributions

### 1. New Recipes Page – Full Build (Apr 7, 2026)

**Commit:** `78e2c4d`

- **Created `frontend/src/components/Recipes/Recipes.tsx`** (693 lines) from scratch: full recipe browsing experience with search, category filtering, and ownership controls (edit/delete only for recipe owner)
- **Created `frontend/src/components/Recipes/Recipes.css`** (627 lines): the full visual design for the recipes listing page
- Integrated the page into `frontend/src/App.tsx` routing and added the corresponding link to `Navbar.tsx`
- Updated `frontend/src/hooks/useHashNavigation.ts` to support the new route

---

### 2. Homepage UI Redesign (Apr 7, 2026)

**Commit:** `cddb2ce`

- **Rebuilt `frontend/src/components/Homepage/Homepage.tsx`** with a new layout, clearer value proposition, and improved call-to-action structure
- **Overhauled `frontend/src/components/Homepage/Homepage.css`** (reduced bloat, refined spacing, improved responsiveness)
- Also made minor tweaks to `Recipes.tsx` for consistency with the new homepage aesthetic

---

### 3. Auth Middleware Fix (Apr 7, 2026)

**Commit:** `f280097`

- Fixed an edge case in `express/middleware/auth.ts` that caused token validation to fail silently in certain request flows

---

### 4. Recipes Page – Restore & Polish (Apr 12, 2026)

**Commits:** `ec6ffb3`, `9679897`, `210b276`

- **Restored the full Recipes page** after merge conflicts stripped away filtering and ownership controls (`ec6ffb3`)
- **Fixed image loading** in recipe cards — corrected the image URL resolution path so uploaded hero images render correctly (`9679897`)
- **Fixed card and image loading polish**: updated `Card.tsx` and `Card.css` in the Unique tournament component for consistent card sizing; fixed AIChat CSS (`AIChat.css`) padding and layout (`210b276`)

---

### 5. Tournament (Unique) Layout Fixes (Apr 12, 2026)

**Commits:** `ab0cfb2`, `64586d4`

- **Fixed the tournament recipe card layout** in `Unique/Card.css` and added missing AIChat panel styles in `AIChat.css` (`ab0cfb2`)
- **Fixed the tournament top-bar layout** — corrected CSS alignment in `Unique.css` (`64586d4`)

---

### 6. Calendar TypeScript Types – Schema Sync (Apr 12, 2026)

**Commit:** `985352d`

- Updated `express/types/index.ts` to replace the stale `Calendar` interface (which used `month`/`year` fields) with the actual schema using `months`/`days` JSON blobs
- Added new TypeScript types: `MealType`, `MealSlot`, `DayMeals`, `CalendarDay` — including the new **snack** meal type added in Sprint 4

---

### 7. Profile Page Fix – Backend & Frontend (Apr 12, 2026)

**Commit:** `36fee9a`

- **Backend**: Added missing endpoints in `express/controllers/userController.ts` (profile update, dietary preferences), registered new routes in `express/routes/user.ts`, and connected them in `express/server.ts`; updated DB schema in `express/db/schema.ts`
- **Frontend**: Refactored `frontend/src/components/Profile/Profile.tsx` to use the new endpoints and cleaned up `Profile.css`

---

### 8. Sign In / Sign Up UI Polish (Apr 12, 2026)

**Commits:** `fa34a32`, `f34628a`, `a185553`

- Fixed the password visibility toggle (eye emoji) on both `SignIn.tsx` and `SignUp.tsx` to work correctly (`fa34a32`)
- General formatting improvements in Auth components: updated `SignIn.css`, `SignUp.css`, `SignIn.tsx`, `SignUp.tsx`, and `Profile.tsx` (`f34628a`)
- Applied a **global consistent styling pass** across `SignIn.css`, `SignUp.css`, `Calendar.css`, `Profile.css`, `Recipes.css`, `RecipesPage.css`, and `index.css` to unify spacing, color variables, and responsive breakpoints (`a185553`)

---

### 9. Homepage Font & Icon Cleanup (Apr 12, 2026)

**Commits:** `42f6a23`, `a95c714`

- Swapped the homepage font for a more legible typeface (`42f6a23`)
- Removed a Navbar icon that was causing visual noise (`a95c714`)

---

### 10. Backend Test Suite – Full Coverage (Apr 12, 2026)

**Commits:** `c332baf`, `14e9b66`, `7e76a56`, `4b9c16c`, `f34628a`

- **Created the entire backend test infrastructure** (`c332baf`):
  - `express/__tests__/setup.ts` — test DB initialization and teardown
  - `express/__tests__/helpers.ts` — shared test utilities
  - `express/__tests__/auth.test.ts` — authentication endpoint tests (register, login, token refresh)
  - `express/__tests__/recipes.test.ts` — recipe CRUD tests (156 lines)
  - `express/__tests__/preferences.test.ts` — dietary preferences tests
  - `express/__tests__/user.test.ts` — user profile tests
  - `express/app.ts` — extracted Express app for testability
  - `express/vitest.config.ts` — Vitest config for backend
  - Updated `.github/workflows/test-backend.yml` to run the new suite on CI
- **Extended test coverage** (`14e9b66`):
  - Added `express/__tests__/calendar.test.ts` (197 lines) for calendar endpoints
  - Extended `auth.test.ts`, `recipes.test.ts`, and `user.test.ts` with additional scenarios
  - Added `frontend/src/components/Auth/SignUp.test.tsx` (270 lines)
  - Rebuilt `frontend/src/components/Profile/Profile.test.tsx` (64 lines)
  - Added `frontend/src/components/Recipes/Recipes.test.tsx` (277 lines)
- Fixed Prettier formatting on all new test files (`7e76a56`)
- Hardened security-sensitive strings in `authController.ts` and `auth.ts` middleware for SonarQube compliance (`4b9c16c`)

---

### 11. Code Quality – Dead Code Removal & Lint Fixes (Apr 12, 2026)

**Commits:** `0694e8c`, `deb16f1`, `1e3db69`

- Removed dead/unused code across `calendarController.ts`, `recipesController.ts`, `db/schema.ts`, `auth.ts`, `types/index.ts`, and `errorHelpers.ts` (`0694e8c`)
- Fixed ESLint violations in `Profile.tsx` (`deb16f1`)
- Removed obsolete test assertions in `Profile.test.tsx` (`1e3db69`)

---

## Technical Skills Applied

- **Frontend Development**: React (TSX), component architecture, CSS design systems, responsive layout
- **Backend Development**: Express.js, Node.js, REST API, Drizzle ORM, schema design
- **Testing**: Vitest, Supertest, unit & integration tests for both frontend and backend
- **Code Quality**: ESLint, Prettier, SonarQube compliance, dead code elimination
- **TypeScript**: Type definitions, interface design, schema-to-type alignment
- **CI/CD**: GitHub Actions workflow updates for automated backend testing
- **AI-Assisted Development**: Used Cursor/Gemini for architecture discussions and code review

---

## Total Time Spent: 7 hours

---

## Summary

During Sprint 4, I delivered the full **Recipes page** built from scratch (search, filters, ownership controls), overhauled the **Homepage UI**, fixed the **Profile page** end-to-end (new backend endpoints + frontend refactor), resolved **image loading** and **tournament card layout** issues, synced **Calendar TypeScript types** with the updated schema, applied a **global styling consistency pass**, and built the entire **backend test suite** with 700+ lines of integration tests covering auth, recipes, user, calendar, and preferences endpoints. I also added extensive frontend tests and hardened the codebase for SonarQube compliance.
