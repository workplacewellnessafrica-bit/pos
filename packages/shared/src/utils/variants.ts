import type { VariantWithOptions } from '../types/index.js';

/**
 * Build a short human-readable label for a variant.
 * e.g. "Red / Large" or "Cotton / Blue / XL"
 */
export function buildVariantLabel(variant: VariantWithOptions): string {
  return variant.options
    .sort((a, b) => a.groupId.localeCompare(b.groupId))
    .map(o => o.value)
    .join(' / ');
}

/**
 * Generate all Cartesian product combinations from variant groups.
 * Input: [['Red','Blue'], ['S','M','L']]
 * Output: [['Red','S'],['Red','M'],['Red','L'],['Blue','S'],...]
 */
export function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  if (!first) return [[]];
  const restCombinations = cartesianProduct(rest);
  return first.flatMap(item => restCombinations.map(combo => [item, ...combo]));
}

/**
 * Given variant groups (each with option values), generate all variant
 * combination descriptors for the variant matrix.
 */
export function generateVariantCombinations(
  groups: Array<{ id: string; name: string; optionValues: Array<{ id: string; value: string }> }>
): Array<Array<{ groupId: string; groupName: string; valueId: string; value: string }>> {
  if (groups.length === 0) return [];

  const optionSets = groups.map(g =>
    g.optionValues.map(ov => ({
      groupId: g.id,
      groupName: g.name,
      valueId: ov.id,
      value: ov.value,
    }))
  );

  return cartesianProduct(optionSets);
}

/**
 * Get the display image for a variant — uses variant image if available,
 * falls back to product image.
 */
export function getVariantImage(
  variantImages: string[],
  productImages: string[],
): string | undefined {
  return variantImages[0] ?? productImages[0];
}

/**
 * Auto-generate a SKU from product name + variant options.
 * e.g. TSHRT-RED-LG
 */
export function autoGenerateSku(
  productName: string,
  optionValues: string[],
): string {
  const prefix = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
  const suffix = optionValues
    .map(v => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3))
    .join('-');
  return suffix ? `${prefix}-${suffix}` : prefix;
}
