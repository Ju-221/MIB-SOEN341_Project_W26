#Ashton Levine Time Contribution Sheet Sprint 2

| Date | Activity | Issue | Time Spent (hours) |
| --- | --- | --- | --- |
| 2026-02-22 | clean up git repository by removing old branches. | Task 5.5 | 0.75 |
| 2026-02-24 | Created filter for recipes. Users can now filter recipes based on various parameters such as:
- the difficulty
- the title
- ingredients
- cooking time
- cost
- ingredients
- dietary tags
- goals/attributes
- allergies (filter out) | Task 6.4 | 3.0 |
| 2026-02-24 | Added search bar for recipes. | Task 6.3 | 1.0 |


## Implemented Features (Additional Detail)

- Added a new **Filter Recipes** panel above the recipe grid.
- Added text search across recipe title, name, description, tags/categories, ingredients, steps, and difficulty.
- Added ingredient filter using comma-separated ingredient keywords.

**Numeric filters added for:**
- Max prep time  
- Max cook time  
- Max total time  
- Max cost  

**Tag-based filters added for:**
- Difficulty (single-select)  
- Dietary tags  
- Goals/attributes  
- Allergies/intolerances (exclusion filter: hides matching recipes)

- Added **Clear Filters** action and a live “Showing X of Y” count.
- Switched rendering from `recipes` to `filteredRecipes`.
- Added an empty state message when no recipes match filters.

**Helper logic added for:**
- Text normalization  
- Numeric parsing  
- Deriving ingredient names and step text  
- Computing display cost from ingredient costs or fallback estimated cost  
- Deriving recipe difficulty from categories/difficulty field  

- Updated CSS with full styling for the filter panel, responsive layout, and input/empty-state polish.
- Expanded initial sample recipe data to multiple realistic recipes with richer tags/ingredients so filters can be demonstrated.
