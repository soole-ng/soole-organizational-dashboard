/**
 * Which vehicles to put in front of a dispatcher first.
 *
 * Register Vehicle used to read from a hardcoded list of ten brands in
 * `constants.ts` - which named Mercedes-Benz "Benz", so a Sprinter added
 * from the dashboard and one added from a phone landed in the fleet list
 * under two different makes. The list now comes from the backend's
 * reference data, the same 94 brands and 851 models the mobile app sees.
 *
 * Ninety-four is a lot to open a dropdown on, so the common ones are
 * grouped at the top and the rest follow. Nothing is hidden: both groups
 * are in the same `<select>`, and a native select is type-ahead searchable,
 * so typing "vol" still reaches Volkswagen from the second group.
 *
 * Kept in step with `lib/src/core/utils/vehicle_shortlist.dart` in the
 * mobile app. The order is Nigerian market share, reviewed September 2026:
 * Toyota is roughly seventy per cent, and the commercial line - Hiace,
 * Sprinter, Urvan, Transit - is what actually carries paying passengers.
 */

/** How many are grouped as common before the rest. */
export const SHORT_LIST_LENGTH = 5

export const POPULAR_BRANDS: string[] = [
  'Toyota',
  'Honda',
  'Lexus',
  'Mercedes-Benz',
  'Hyundai',
  'Nissan',
  'Kia',
  'Ford',
  'Innoson',
  'Peugeot',
  'Volkswagen',
  'Mitsubishi',
]

export const POPULAR_MODELS: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'Hiace', 'Sienna', 'Highlander', 'Hilux', 'RAV4'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'City'],
  Lexus: ['RX 330', 'RX 350', 'ES 350', 'GX 460', 'LX 570'],
  'Mercedes-Benz': ['Sprinter', 'C-Class', 'E-Class', 'GLK', 'ML-Class'],
  Hyundai: ['Elantra', 'Sonata', 'Santa Fe', 'Tucson', 'Accent', 'H100'],
  Nissan: ['Urvan', 'NV350', 'Altima', 'Pathfinder', 'Sentra'],
  Kia: ['Rio', 'Optima', 'Sorento', 'Sportage', 'Picanto', 'Carnival'],
  Ford: ['Transit', 'Explorer', 'Edge', 'Escape', 'Focus'],
  Innoson: ['IVM Carrier', 'IVM 6490', 'IVM Shuttle', 'IVM G5', 'IVM Fox'],
  Peugeot: ['406', '307', '508', '301', '3008'],
  Volkswagen: ['Golf', 'Passat', 'Jetta', 'Transporter', 'Tiguan'],
  Mitsubishi: ['L300', 'Pajero', 'Lancer', 'Outlander', 'Canter'],
}

function shortlist(ranked: string[], available: string[], limit: number): string[] {
  // Keyed on what the server sent, so a name this file spells differently
  // cannot appear as a second entry, and the server's spelling is the one
  // submitted.
  const byFold = new Map(available.map(a => [a.toLowerCase(), a]))
  const out: string[] = []
  for (const name of ranked) {
    const match = byFold.get(name.toLowerCase())
    if (match && !out.includes(match)) out.push(match)
    if (out.length === limit) break
  }
  return out
}

/** The common brands, in ranked order, spelled the way `available` does. */
export function popularBrands(available: string[], limit = SHORT_LIST_LENGTH): string[] {
  return shortlist(POPULAR_BRANDS, available, limit)
}

/**
 * The common models for one brand.
 *
 * A brand with no ranking gets nothing rather than its first five
 * alphabetically - Toyota's first five that way are the 4Runner, Allion,
 * Alphard, Auris and Avalon, none of which anybody drives here, and a
 * "common" group that is not the common ones reads as a recommendation.
 */
export function popularModels(
  brand: string,
  available: string[],
  limit = SHORT_LIST_LENGTH,
): string[] {
  if (!brand) return []
  const key = Object.keys(POPULAR_MODELS).find(
    b => b.toLowerCase() === brand.toLowerCase(),
  )
  if (!key) return []
  return shortlist(POPULAR_MODELS[key], available, limit)
}

/** Everything in `available` that is not already in the common group. */
export function theRest(available: string[], common: string[]): string[] {
  return available.filter(a => !common.includes(a))
}
