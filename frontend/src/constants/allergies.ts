export const ALLERGY_OPTIONS = [
  'Nuts',
  'Peanuts',
  'Dairy',
  'Eggs',
  'Wheat',
  'Gluten',
  'Shellfish',
  'Fish',
  'Soy',
  'Sesame',
  'Mustard',
  'Lactose Intolerance',
  'Sulfites',
] as const;

export const ALLERGY_FIELD_TO_OPTION: Record<string, string> = {
  treeNuts: 'Nuts',
  peanuts: 'Peanuts',
  milk: 'Dairy',
  eggs: 'Eggs',
  wheat: 'Wheat',
  glutenIntolerance: 'Gluten',
  crustaceans: 'Shellfish',
  fish: 'Fish',
  soy: 'Soy',
  sesame: 'Sesame',
  mustard: 'Mustard',
  lactoseIntolerance: 'Lactose Intolerance',
};

const ALLERGY_ALIASES: Record<string, string> = {
  nuts: 'Nuts',
  treenuts: 'Nuts',
  tree_nuts: 'Nuts',
  'tree-nuts': 'Nuts',
  peanuts: 'Peanuts',
  peanut: 'Peanuts',
  dairy: 'Dairy',
  milk: 'Dairy',
  eggs: 'Eggs',
  egg: 'Eggs',
  wheat: 'Wheat',
  gluten: 'Gluten',
  shellfish: 'Shellfish',
  crustaceans: 'Shellfish',
  crustacean: 'Shellfish',
  fish: 'Fish',
  soy: 'Soy',
  sesame: 'Sesame',
  mustard: 'Mustard',
  lactose: 'Lactose Intolerance',
  lactoseintolerance: 'Lactose Intolerance',
  sulfites: 'Sulfites',
  sulphites: 'Sulfites',
};

export function normalizeAllergyLabels(allergies: unknown): string[] {
  if (!Array.isArray(allergies)) return [];

  const normalized = allergies.flatMap((allergy) => {
    if (typeof allergy !== 'string') return [];
    const key = allergy.toLowerCase().replaceAll(/[^a-z0-9_-]/g, '');
    const label = ALLERGY_ALIASES[key] ?? allergy;
    return (ALLERGY_OPTIONS as readonly string[]).includes(label) ? [label] : [];
  });

  return [...new Set(normalized)];
}
