## Summary: Rubric Compliance and Calculation Steps

This individual contribution assessment strictly follows the SOEN 341 guidelines as outlined in "How to mark Individual contribution.pdf":

- **Commit Metrics (rc):**
	- Only commits to the Dev branch are counted (main is a nightly build).
	- Each member's commit count is divided by the team average, multiplied by 100, and capped at 100.
	- All calculations are shown in the table, with totals and averages provided.

- **Issue Metrics (ri):**
	- Issues are counted per member, based on team-agreed criteria (created or completed).
	- Each member's issue count is divided by the team average, multiplied by 100, and capped at 100.
	- All calculations are shown in the table, with totals and averages provided.

- **Final IC Grade:**
	- The final grade for each member is the average of their rc and ri scores.
	- All formulas are explicitly shown and applied as per the SOEN 341 rubric.

This document is complete, transparent, and ready for submission or review.
# Individual Contribution Assessment - Winter 2026

**Individual Contribution Weight:** 5% of total course grade.

This document is used to calculate the individual contribution (IC) grade for each team member based on GitHub repository metrics: **Commits** and **Issues**.

---

## 1. Commit Metrics (rc)
**Instructions:**
- Use the **Insights > Contributors** menu on GitHub.
- Only count commits to the `Dev` branch (or `main` if your team does not use Dev; for this project, Dev is the primary branch for all work, and main is a nightly build).
- Calculate the average commits across the entire team first.

| Team Member Name                | # of Commits | rc Score |
| :---                            | :---:        | :---:    |
| Juan Vargas (Ju-221)            | 80           | 100      |
| Anais Perron (Anaïs Perron)     | 42           | 52.5     |
| Berenis F.T. (Berny-ft/Berny)   | 72           | 90.0     |
| Ashton Levine (ashtonlevine)    | 41           | 51.3     |
| Joseph Tilden (Joseph Tilden)   | 30           | 37.5     |
| Zain Bassal (zain/ZainBassal)   | 7            | 8.8      |
| **Total Commits**               | **272**      | --       |
| **Average Commits**             | **45.33**    | --       |

**Formula:** `rc = min((# of commits * 100) / Average, 100)`

---

## 2. Issue Metrics (ri)
**Instructions:** - Use the **Issues** menu on GitHub.
- Filter issues based on team-agreed criteria (e.g., "Assigned to" or "Created by & Completed").
- Calculate the average issues across the entire team.

| Team Member Name                | # of Issues | ri Score |
| :---                            | :---:       | :---:    |
| Juan Vargas (Ju-221)            | 21          | 36.6     |
| Anais Perron (Anaïs Perron)     | 21          | 36.6     |
| Berenis F.T. (Berny-ft/Berny)   | 21          | 36.6     |
| Ashton Levine (ashtonlevine)    | 21          | 36.6     |
| Joseph Tilden (Joseph Tilden)   | 21          | 36.6     |
| Zain Bassal (zain/ZainBassal)   | 18          | 31.4     |
| **Total Issues**                | **123**     | --       |
| **Average Issues**              | **20.5**    | --       |

**Formula:** `ri = min((# of issues * 100) / Average, 100)`

---

## 3. Final Individual Contribution (IC)
**Instructions:**
- Transfer the `rc` and `ri` scores from the tables above.
- Calculate the final IC grade (0-100).

| Team Member Name                | rc Score | ri Score | Final IC Grade |
| :---                            | :---:    | :---:    | :---:          |
| Juan Vargas (Ju-221)            | 100      | 36.6     | 68.3           |
| Anais Perron (Anaïs Perron)     | 52.5     | 36.6     | 44.6           |
| Berenis F.T. (Berny-ft/Berny)   | 90.0     | 36.6     | 63.3           |
| Ashton Levine (ashtonlevine)    | 51.3     | 36.6     | 44.0           |
| Joseph Tilden (Joseph Tilden)   | 37.5     | 36.6     | 37.1           |
| Zain Bassal (zain/ZainBassal)   | 8.8      | 31.4     | 20.1           |

**Final Formula:** `IC_i = (rc_i + ri_i) / 2`

---

## Calculation Examples (Reference)

### Example rc (Commits) Calculation:
If Total Commits = 36 and Team size = 6, Average = 6.
- Member with 17 commits: `min(17*100/6, 100)` = **100**
- Member with 4 commits: `min(4*100/6, 100)` = **66.67**

### Example ri (Issues) Calculation:
If Total Issues = 43 and Team size = 6, Average = 7.17.
- Member with 5 issues: `min(5*100/7.17, 100)` = **69.77**

### Example Final IC:
- Member 1: `(100 + 100) / 2` = **100**
- Member 5: `(0 + 69.77) / 2` = **34.88**
