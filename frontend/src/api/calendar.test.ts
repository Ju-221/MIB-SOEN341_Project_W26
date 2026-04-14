import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCalendarMonthKey,
  getCalendarMonthWindow,
  fetchCalendarWindow,
  saveCalendarWindow,
  replaceMonthInCalendarWindow,
} from './calendar';

describe('calendar API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getCalendarMonthKey', () => {
    it('returns "January:2026" for Jan 2026', () => {
      expect(getCalendarMonthKey(new Date(2026, 0, 1))).toBe('January:2026');
    });

    it('returns "December:2025" for Dec 2025', () => {
      expect(getCalendarMonthKey(new Date(2025, 11, 15))).toBe('December:2025');
    });
  });

  describe('getCalendarMonthWindow', () => {
    it('returns 7 months centered on the given date', () => {
      const window = getCalendarMonthWindow(new Date(2026, 3, 1)); // April 2026
      expect(window).toHaveLength(7);
      // First should be January 2026
      expect(window[0].getMonth()).toBe(0);
      // Center should be April 2026
      expect(window[3].getMonth()).toBe(3);
      // Last should be July 2026
      expect(window[6].getMonth()).toBe(6);
    });
  });

  describe('fetchCalendarWindow', () => {
    it('returns empty window when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
      } as Response);

      const result = await fetchCalendarWindow('token', new Date(2026, 3, 1));
      expect(result.monthDates).toHaveLength(7);
      expect(result.monthKeys).toHaveLength(7);
    });

    it('returns hydrated window when fetch succeeds', async () => {
      const april2026Key = 'April:2026';
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          months: [april2026Key],
          days: [
            [
              {
                date: 1,
                meals: {
                  breakfast: { recipeId: 1, recipeTitle: 'Eggs' },
                  lunch: { recipeId: null, recipeTitle: null },
                  dinner: { recipeId: null, recipeTitle: null },
                  snack: { recipeId: null, recipeTitle: null },
                },
              },
            ],
          ],
        }),
      } as Response);

      const result = await fetchCalendarWindow('token', new Date(2026, 3, 1));
      const aprilKey = result.monthKeys.find((k) => k.startsWith('April'));
      expect(aprilKey).toBeDefined();
      const aprilData = result.monthData[aprilKey!];
      expect(aprilData[0].meals.breakfast.recipeTitle).toBe('Eggs');
    });

    it('handles empty response data gracefully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      const result = await fetchCalendarWindow('token', new Date(2026, 3, 1));
      expect(result.monthDates).toHaveLength(7);
    });
  });

  describe('saveCalendarWindow', () => {
    it('sends POST with correct payload', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

      const window = {
        monthDates: [new Date(2026, 3, 1)],
        monthKeys: ['April:2026'],
        monthData: {
          'April:2026': [
            {
              date: 1,
              meals: {
                breakfast: { recipeId: null, recipeTitle: null },
                lunch: { recipeId: null, recipeTitle: null },
                dinner: { recipeId: null, recipeTitle: null },
                snack: { recipeId: null, recipeTitle: null },
              },
            },
          ],
        },
      };

      await saveCalendarWindow('token', window);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/calendar',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
    });
  });

  describe('replaceMonthInCalendarWindow', () => {
    it('replaces the month data for the given date', () => {
      const window = {
        monthDates: [new Date(2026, 3, 1)],
        monthKeys: ['April:2026'],
        monthData: {
          'April:2026': [
            {
              date: 1,
              meals: {
                breakfast: { recipeId: null, recipeTitle: null },
                lunch: { recipeId: null, recipeTitle: null },
                dinner: { recipeId: null, recipeTitle: null },
                snack: { recipeId: null, recipeTitle: null },
              },
            },
          ],
        },
      };

      const newDays = [
        {
          date: 1,
          meals: {
            breakfast: { recipeId: 5, recipeTitle: 'Pancakes' },
            lunch: { recipeId: null, recipeTitle: null },
            dinner: { recipeId: null, recipeTitle: null },
            snack: { recipeId: null, recipeTitle: null },
          },
        },
      ];

      const result = replaceMonthInCalendarWindow(window, new Date(2026, 3, 1), newDays);
      expect(result.monthData['April:2026'][0].meals.breakfast.recipeTitle).toBe('Pancakes');
    });
  });
});
