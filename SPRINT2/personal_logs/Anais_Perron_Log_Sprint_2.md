# Sprint 2 Contribution Log – Anais Perron

## Overview

This log documents my contributions to the MealMajor project during Sprint 2, focusing on the design and implementation of the Recipe management UI 

---

## Contribution Summary

| Date       | Activity                                                                 | Commit(s)           | Time spent (hours) |
|------------|--------------------------------------------------------------------------|---------------------|-------------------|
| 2026-02-16 | Adding metting minutes         |`current`| 0.25               |
| 2026-02-21 | Designed and implemented the recipe management UI for creating, deleting, and adding recipes via the profile page        | `3ddedbd `  `c9aac08 `       | 5.5               |
| 2026-02-22 | Fixed frontend bugs, keeping the frontend consistent with the backend          | `3e937a7`, `e1b8bfa`| 2               |
The contribution below is reserved for sprint 3 due to incompletion, but has been done in advance
| 2026-02-21 | Adding animation + improving ui of the homepage        |`in local`| 4               |
| 2026-02-26 |   Adding animation + improving ui of the sign in page      | `in local`         | 5               |





---

## Detailed Contributions
# Overview

 - This file implements the main Recipe Management System using a React + TypeScript architecture. It supports:

 - Full CRUD operations (Create, Read, Update, Delete)

 - Advanced multi-criteria filtering

 - Dynamic form handling for ingredients and steps

 - Image upload with preview

 - Tag-based categorization (including custom tags)

 - Modal-driven UI for create/edit/view/delete flows

 - Cost and time calculations


# UX Enhancements

Implemented:

- Live ingredient count

- Live cost total

- Filter result counter

- Clear filter button

- Expand/collapse filters

- Placeholder fallbacks

- Conditional rendering for empty states



# FutureImprovements

Potential improvements:

- Split into smaller components (Form, Filters, Card, Modal)

- Add form validation library (e.g., Zod or React Hook Form)

- Add image compression before base64 encoding

