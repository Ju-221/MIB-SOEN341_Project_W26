/*# The following file was generated with the assistance of Claude.
#Prompt:  Create a test suite for the allergies normalization function using Vitest. Cover non-array inputs, non-string items in the array, unknown labels, alias resolution, canonical labels, and deduplication.
# I, Anais Perron reviewed, modified, and tested the code to ensure correctness.
*/
import { describe, it, expect } from 'vitest';
import { normalizeAllergyLabels } from './allergies';

describe('normalizeAllergyLabels', () => {
  // ── Non-array inputs (covers the !Array.isArray branch) ───────────────────
  it('returns [] for null', () => {
    expect(normalizeAllergyLabels(null)).toEqual([]);
  });

  it('returns [] for a plain string', () => {
    expect(normalizeAllergyLabels('Peanuts')).toEqual([]);
  });

  it('returns [] for a number', () => {
    expect(normalizeAllergyLabels(42)).toEqual([]);
  });

  it('returns [] for a plain object', () => {
    expect(normalizeAllergyLabels({ allergy: 'Peanuts' })).toEqual([]);
  });

  it('returns [] for undefined', () => {
    expect(normalizeAllergyLabels(undefined)).toEqual([]);
  });

  // ── Non-string items inside an array (covers typeof !== 'string' branch) ──
  it('skips numeric entries in the array', () => {
    expect(normalizeAllergyLabels([1, 42])).toEqual([]);
  });

  it('skips null entries in the array', () => {
    expect(normalizeAllergyLabels([null, undefined])).toEqual([]);
  });

  it('skips boolean entries in the array', () => {
    expect(normalizeAllergyLabels([true, false])).toEqual([]);
  });

  it('skips object entries in the array', () => {
    expect(normalizeAllergyLabels([{ name: 'Peanuts' }])).toEqual([]);
  });

  // ── Unknown labels are filtered out (covers includes → false branch) ──────
  it('filters out completely unknown allergy strings', () => {
    expect(normalizeAllergyLabels(['NotARealAllergy', 'FakeFood'])).toEqual([]);
  });

  it('filters out a string that is close but not an alias', () => {
    // 'lobster' sounds like an allergy but has no alias entry
    expect(normalizeAllergyLabels(['lobster'])).toEqual([]);
  });

  // ── Alias resolution (covers ALLERGY_ALIASES[key] ?? allergy path) ────────
  it('resolves "milk" to "Dairy"', () => {
    expect(normalizeAllergyLabels(['milk'])).toEqual(['Dairy']);
  });

  it('resolves "treeNuts" to "Nuts"', () => {
    expect(normalizeAllergyLabels(['treeNuts'])).toEqual(['Nuts']);
  });

  it('resolves "crustaceans" to "Shellfish"', () => {
    expect(normalizeAllergyLabels(['crustaceans'])).toEqual(['Shellfish']);
  });

  it('resolves "crustacean" (singular) to "Shellfish"', () => {
    expect(normalizeAllergyLabels(['crustacean'])).toEqual(['Shellfish']);
  });

  it('resolves "lactose" to "Lactose Intolerance"', () => {
    expect(normalizeAllergyLabels(['lactose'])).toEqual(['Lactose Intolerance']);
  });

  it('resolves "sulphites" to "Sulfites"', () => {
    expect(normalizeAllergyLabels(['sulphites'])).toEqual(['Sulfites']);
  });

  it('resolves "egg" (singular) to "Eggs"', () => {
    expect(normalizeAllergyLabels(['egg'])).toEqual(['Eggs']);
  });

  // ── Canonical labels pass through as-is ───────────────────────────────────
  it('keeps canonical "Peanuts" unchanged', () => {
    expect(normalizeAllergyLabels(['Peanuts'])).toContain('Peanuts');
  });

  it('keeps canonical "Eggs" unchanged', () => {
    expect(normalizeAllergyLabels(['Eggs'])).toContain('Eggs');
  });

  // ── Deduplication (covers [...new Set(normalized)]) ───────────────────────
  it('deduplicates entries that resolve to the same canonical label', () => {
    expect(normalizeAllergyLabels(['milk', 'Dairy', 'DAIRY'])).toEqual(['Dairy']);
  });

  it('deduplicates when both alias and canonical form are given', () => {
    expect(normalizeAllergyLabels(['peanuts', 'Peanuts', 'peanut'])).toEqual(['Peanuts']);
  });

  // ── Mixed input ───────────────────────────────────────────────────────────
  it('handles mixed valid, alias, unknown, and non-string entries', () => {
    const result = normalizeAllergyLabels(['Peanuts', 'milk', 'NotReal', 42, null]);
    expect(result).toContain('Peanuts');
    expect(result).toContain('Dairy');
    expect(result).not.toContain('NotReal');
    expect(result).toHaveLength(2);
  });

  it('returns [] for an empty array', () => {
    expect(normalizeAllergyLabels([])).toEqual([]);
  });
});
