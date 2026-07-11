/** Matches rides.enums.NigerianState - mobile's independent-driver ride
 * creation requires one of these exact values for origin_state/destination_state,
 * and RideSelector.retrieve_rides_by_filter matches passenger search against them. */
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
]

export const kVehicleMakeModels: Record<string, string[]> = {
  'Toyota': ['Avalon', 'Camry', 'Corolla', 'Highlander', 'RAV4', 'Sienna', 'Venza', 'Yaris'],
  'Honda': ['Accord', 'City', 'Civic', 'CR-V', 'Crosstour', 'Odyssey', 'Pilot'],
  'Benz': ['C-Class', 'E-Class', 'G-Class', 'GLE', 'GLK', 'M-Class', 'S-Class'],
  'Lexus': ['ES', 'GX', 'IS', 'LS', 'LX', 'NX', 'RX'],
  'Hyundai': ['Accent', 'Creta', 'Elantra', 'i10', 'Santa Fe', 'Sonata', 'Tucson'],
  'Kia': ['Cerato', 'Optima', 'Picanto', 'Rio', 'Sorento', 'Sportage'],
  'Nissan': ['Altima', 'Murano', 'Pathfinder', 'Sentra', 'Versa', 'Xterra'],
  'Ford': ['Edge', 'Escape', 'Explorer', 'Focus', 'Fusion', 'Ranger'],
  'Volkswagen': ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Touareg'],
  'Mitsubishi': ['ASX', 'L200', 'Lancer', 'Outlander', 'Pajero'],
};
