# Sprint 2 Contribution Log – Berenis Fopa Tsamo

## Overview

This log documents my contributions to the MealMajor project during Sprint 2, focusing on the design and implementation of the Recipe data model and its full REST API on the Express.js backend.

---

## Contribution Summary

| Date       | Activity                                                                 | Commit(s)           | Time spent (hours) |
|------------|--------------------------------------------------------------------------|---------------------|-------------------|
| 2026-02-21 | Designed and implemented the Recipe schema (Drizzle ORM + SQLite)        | `63878a9`           | 0.5               |
| 2026-02-21 | Implemented Recipe CRUD controller with image upload (multer)            | `63878a9`, `dbab6dd`| 1.5               |
| 2026-02-21 | Added JWT-based ownership checks to update and delete routes             | `dbab6dd`           | 0.5               |
| 2026-02-21 | Created recipe routes and registered them in the Express server          | `dbab6dd`           | 0.5               |
| 2026-02-24 | Migrated Express backend from JavaScript to TypeScript; added `dietPrefs` and `allergies` fields to recipe schema | `afbbdd2` | 3.0 |
| 2026-02-25 | Added `difficulty` tag field to recipe schema and types; fixed miscellaneous bugs | `c2b5e2c` | 1.0 |

---

## Detailed Contributions

### 1. Recipe Schema Design (Feb 21, 2026)

- **Designed the `recipes` table** in `express/db/schema.js` using Drizzle ORM
- Evaluated multiple approaches (separate relational tables vs. JSON fields) and chose **JSON text fields** for `ingredients`, `steps`, and `categories` to keep the schema simple and efficient for a recipe browsing use case
- Added a `createdBy` foreign key referencing `users.id` to support ownership-based authorization
- Ran `npm run db:push` to apply the schema changes to the SQLite database via Drizzle Kit
- Added `real` column type import to support decimal `estimatedCost` values

### 2. Recipe REST API – Controller (Feb 21, 2026)

- **Implemented all five CRUD handlers** in `express/controllers/recipesController.js`:
  - `getAllRecipes` — returns all recipes with optional `?title=` search filter
  - `getRecipeById` — returns a single recipe by ID
  - `createRecipe` — inserts a new recipe, handles image upload, saves `createdBy` from JWT
  - `updateRecipe` — updates recipe fields and/or replaces hero image, enforces ownership
  - `deleteRecipe` — deletes record and associated image file from disk, enforces ownership
- Configured **multer** for multipart image uploads, storing files in `express/uploads/`
- Images are renamed to `{recipeId}.ext` post-insert to permanently link the file to the recipe
- Old images are deleted from disk on update or delete to avoid orphaned files
- Implemented a `parseRecipe` helper to deserialize JSON string fields back into arrays before sending API responses

### 3. Ownership / Authorization (Feb 21, 2026)

- Integrated the existing `verifyToken` JWT middleware (`middleware/auth.js`) into the protected recipe routes
- `updateRecipe` and `deleteRecipe` compare `req.user.id` (from decoded JWT) against `recipe.createdBy` and return `403 Unauthorized` if they don't match
- Public `GET` routes remain accessible without authentication

### 4. Recipe Routes & Server Registration (Feb 21, 2026)

- Created `express/routes/recipes.js` with the following structure:

  | Method | Route | Auth |
  |--------|-------|------|
  | GET    | `/api/recipes`     | Public |
  | GET    | `/api/recipes/:id` | Public |
  | POST   | `/api/recipes`     | `verifyToken` required |
  | PUT    | `/api/recipes/:id` | `verifyToken` required |
  | DELETE | `/api/recipes/:id` | `verifyToken` required |

- Updated `express/server.js` to register recipe routes and serve uploaded images statically under `/uploads`
- Verified all endpoints using Postman with JWT authentication

---

## Technical Skills Applied

- **Backend Development**: Express.js, Node.js, REST API design
- **Database**: Drizzle ORM, SQLite, schema migration with Drizzle Kit
- **Authentication**: JWT verification, middleware chaining, ownership-based access control
- **File Handling**: Multipart uploads with multer, file renaming and deletion with Node.js `fs` module
- **API Design**: CRUD pattern, query parameter filtering, proper HTTP status codes
- **AI-Assisted Development**: Used Gemini for architecture discussions, debugging assistance, and code review

---

## Total Time Spent: ~7.0 hours

---

## Contributions

### 1. Recipe Schema Design (Drizzle ORM + SQLite)

**Date:** 2026-02-21

Designed and implemented the `recipes` table in `express/db/schema.js` using Drizzle ORM. After researching and discussing different approaches (separate tables vs. JSON fields), chose to store `ingredients`, `steps`, and `categories` as JSON text fields for simplicity and performance — appropriate for a recipe browsing app where full recipe records are always fetched at once.

**Fields added:**
- `id`, `title`, `description`, `prepTime`, `cookTime`, `estimatedCost`, `heroImage`, `createdBy` (FK → users), `ingredients` (JSON), `steps` (JSON), `categories` (JSON), `createdAt`

Ran `npm run db:push` to apply the schema to the SQLite database via Drizzle Kit.

---

### 2. Recipe REST API – Controller (`recipesController.js`)

**Date:** 2026-02-21

Implemented all five CRUD handlers in `express/controllers/recipesController.js`:

| Handler | Description |
|---|---|
| `getAllRecipes` | Returns all recipes; supports `?title=` query param for search |
| `getRecipeById` | Returns a single recipe by ID |
| `createRecipe` | Creates a recipe, handles image upload, stores `createdBy` from JWT |
| `updateRecipe` | Updates recipe fields and/or replaces hero image; enforces ownership |
| `deleteRecipe` | Deletes recipe and its hero image file; enforces ownership |

Key implementation decisions:
- Used **multer** for multipart image uploads, saving files to `express/uploads/`
- Images are renamed to `{recipeId}.ext` after insert so filename is permanently linked to the recipe
- Old image files are deleted from disk when a recipe is updated or deleted
- JSON fields (`ingredients`, `steps`, `categories`) are parsed back into arrays before sending responses via a `parseRecipe` helper

---

### 3. Ownership / Authorization

**Date:** 2026-02-21

Added ownership checks to `updateRecipe` and `deleteRecipe` using the existing `verifyToken` JWT middleware (`middleware/auth.js`). The middleware decodes the token and populates `req.user`, allowing the controller to compare `req.user.id` against `recipe.createdBy` and reject unauthorized requests with a `403`.

---

### 4. Recipe Routes (`routes/recipes.js`)

**Date:** 2026-02-21

Created `express/routes/recipes.js` with the following route structure:

| Method | Route | Auth |
|---|---|---|
| GET | `/api/recipes` | Public |
| GET | `/api/recipes/:id` | Public |
| POST | `/api/recipes` | `verifyToken` required |
| PUT | `/api/recipes/:id` | `verifyToken` required |
| DELETE | `/api/recipes/:id` | `verifyToken` required |

---

### 5. Server Registration & Static File Serving

**Date:** 2026-02-21

Updated `express/server.js` to:
- Register recipe routes under `/api/recipes`
- Serve uploaded hero images statically under `/uploads` using `express.static`

---

### 6. TypeScript Migration of Express Backend (`afbbdd2`)

**Date:** 2026-02-24

Migrated the entire Express backend from JavaScript to TypeScript:
- Renamed all `.js` files to `.ts` (`server`, `schema`, `index`, `auth` middleware, `authController`, `routes/auth`, `routes/recipes`)
- Installed TypeScript and related packages: `typescript`, `ts-node`, `@types/node`, `@types/express`, `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/multer`
- Created `tsconfig.json` with appropriate compiler options for a Node.js backend
- Added `express/types/express.d.ts` to extend Express `Request` interface with `user` property (used by JWT middleware)
- Extended the recipe schema (`express/db/schema.ts`) to include `dietPrefs` and `allergies` fields as JSON text columns

---

### 7. Difficulty Tags & Bug Fixes (`c2b5e2c`)

**Date:** 2026-02-25

- Added a `difficulty` field to the `recipes` table in `express/db/schema.ts`
- Added the `difficulty` field to the TypeScript types in `express/types/index.ts`
- Fixed miscellaneous bugs discovered during the TypeScript migration

---

## Summary

Delivered a fully functional Recipe backend including database schema, REST API (CRUD), image upload/management, and JWT-based ownership protection. All endpoints were tested using Postman. Subsequently migrated the entire Express backend to TypeScript, extended the recipe model with `dietPrefs`, `allergies`, and `difficulty` fields, and resolved related bugs.