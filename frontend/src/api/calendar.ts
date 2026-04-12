import {
  buildEmptyMonth,
  normalizeCalendarDay,
  type CalendarDay,
} from '../components/Calendar/types';

const API = 'http://localhost:3000';
const MONTH_WINDOW_RADIUS = 3;

export interface CalendarWindowData {
  monthDates: Date[];
  monthKeys: string[];
  monthData: Record<string, CalendarDay[]>;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getCalendarMonthKey(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]}:${date.getFullYear()}`;
}

export function getCalendarMonthWindow(centerDate: Date): Date[] {
  return Array.from({ length: MONTH_WINDOW_RADIUS * 2 + 1 }, (_, index) => {
    const offset = index - MONTH_WINDOW_RADIUS;
    return new Date(centerDate.getFullYear(), centerDate.getMonth() + offset, 1);
  });
}

function buildEmptyCalendarWindow(centerDate: Date): CalendarWindowData {
  const monthDates = getCalendarMonthWindow(centerDate);
  const monthKeys = monthDates.map(getCalendarMonthKey);
  const monthData = Object.fromEntries(
    monthDates.map((date, index) => [
      monthKeys[index],
      buildEmptyMonth(date.getFullYear(), date.getMonth()),
    ])
  );

  return { monthDates, monthKeys, monthData };
}

function hydrateMonth(days: CalendarDay[] | undefined, monthDate: Date): CalendarDay[] {
  const fullMonth = buildEmptyMonth(monthDate.getFullYear(), monthDate.getMonth());

  for (const day of days ?? []) {
    const index = day.date - 1;
    if (index >= 0 && index < fullMonth.length) {
      fullMonth[index] = normalizeCalendarDay(day);
    }
  }

  return fullMonth;
}

export async function fetchCalendarWindow(
  token: string,
  centerDate: Date
): Promise<CalendarWindowData> {
  const emptyWindow = buildEmptyCalendarWindow(centerDate);
  const res = await fetch(
    `${API}/api/calendar?months=${encodeURIComponent(JSON.stringify(emptyWindow.monthKeys))}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    return emptyWindow;
  }

  const data = (await res.json()) as { months?: string[]; days?: CalendarDay[][] };
  const returnedMonths = data.months ?? [];
  const returnedDays = data.days ?? [];

  const monthData = { ...emptyWindow.monthData };
  returnedMonths.forEach((monthKey, index) => {
    const matchingDate = emptyWindow.monthDates.find(
      (date) => getCalendarMonthKey(date).toUpperCase() === monthKey.toUpperCase()
    );
    if (!matchingDate) return;
    monthData[getCalendarMonthKey(matchingDate)] = hydrateMonth(returnedDays[index], matchingDate);
  });

  return {
    monthDates: emptyWindow.monthDates,
    monthKeys: emptyWindow.monthKeys,
    monthData,
  };
}

export async function saveCalendarWindow(
  token: string,
  calendarWindow: CalendarWindowData
): Promise<void> {
  await fetch(`${API}/api/calendar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      months: calendarWindow.monthKeys,
      days: calendarWindow.monthKeys.map((monthKey) =>
        calendarWindow.monthData[monthKey].map(normalizeCalendarDay)
      ),
    }),
  });
}

export function replaceMonthInCalendarWindow(
  calendarWindow: CalendarWindowData,
  targetDate: Date,
  days: CalendarDay[]
): CalendarWindowData {
  const monthKey = getCalendarMonthKey(targetDate);
  return {
    ...calendarWindow,
    monthData: {
      ...calendarWindow.monthData,
      [monthKey]: days.map(normalizeCalendarDay),
    },
  };
}
