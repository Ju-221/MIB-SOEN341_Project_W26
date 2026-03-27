# Juan Vargas Time Contribution Sheet Sprint 3

| Date | Activity | Issue | Time Spent (hours) |
| --- | --- | --- | --- |
| 2026-03-27 | Built the Recipe Game (Unique) feature with tournament-style card picker, phases, and confetti animations. | Task 10.5 | 4.0 |
| 2026-03-27 | Refactored intro and picker phases with new card layout and updated styles. | Task 10.5 | 1.5 |
| 2026-03-27 | Merged feature/unique branch into Dev, resolving conflicts. | Task 10.5 | 0.5 |

---

## Implemented Features (Additional Detail)

- Built the full Recipe Game ("Unique") feature from scratch:
  - Created a multi-phase tournament flow (intro, picker, game, no-results) for users to pick meals interactively.
  - Implemented animated card components with flip and selection effects.
  - Added an Aurora animated background component for visual appeal.
  - Integrated confetti animations on winner selection.
  - Connected the feature to the backend recipe API to fetch user recipes dynamically.

- Created supporting components and assets:
  - `Unique.tsx` / `Unique.css` — main game logic and layout.
  - `Card.tsx` / `Card.css` — interactive recipe card component.
  - `Background.tsx` — Aurora animated background effect.
  - `fakeRecipes.ts` — fallback recipe data for demo/testing.

- Refactored intro and picker phases with an improved card layout and cleaner styles for better usability.

- Integrated the Unique feature into the app navigation via `Navbar.tsx` and `App.tsx` routing.
