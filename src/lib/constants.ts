export const SERVICE_TYPES = [
  { id: 'regular', label: 'Regular Cleaning', basePrice: 350, icon: 'Sparkles' },
  { id: 'deep_clean', label: 'Deep Clean', basePrice: 600, icon: 'Brush' },
  { id: 'dishwashing', label: 'Dishwashing', basePrice: 250, icon: 'Utensils' },
  { id: 'laundry', label: 'Laundry & Ironing', basePrice: 300, icon: 'Shirt' },
  { id: 'kitchen', label: 'Kitchen Cleaning', basePrice: 450, icon: 'CookingPot' },
  { id: 'bathroom', label: 'Bathroom Cleaning', basePrice: 400, icon: 'ShowerHead' },
];

export const FREQUENCIES = [
  { id: 'one_time', label: 'One Time', multiplier: 1.0 },
  { id: 'weekly', label: 'Weekly', multiplier: 0.85 },
  { id: 'bi_weekly', label: 'Bi-Weekly', multiplier: 0.90 },
  { id: 'monthly', label: 'Monthly', multiplier: 0.95 },
];

export const TIME_SLOTS = [
  '8:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
];

export const CLUTTER_CATEGORIES = [
  {
    id: 'Old Clothes',
    label: 'Old Clothes',
    icon: 'Shirt',
    unitValue: 35,
    color: 'emerald',
    description: 'Repurposed as industrial rags or donated',
  },
  {
    id: 'Books',
    label: 'Books',
    icon: 'BookOpen',
    unitValue: 50,
    color: 'amber',
    description: 'Paper fibers reused 5-7 times',
  },
  {
    id: 'Furniture',
    label: 'Furniture',
    icon: 'Sofa',
    unitValue: 2000,
    color: 'orange',
    description: 'Wood & metal components recovered',
  },
  {
    id: 'E-Waste',
    label: 'E-Waste',
    icon: 'Monitor',
    unitValue: 600,
    color: 'teal',
    description: 'Valuable metals like copper & gold',
  },
];

export const MAID_AREAS = [
  'Gulberg', 'DHA', 'Clifton', 'Bahria Town', 'Model Town',
  'Johar Town', 'Faisal Town', 'Garden Town', 'Wapda Town', 'Other',
];

export function computeMaidPrice(
  serviceType: string,
  rooms: number,
  bathrooms: number,
  hours: number,
  frequency: string
): number {
  const service = SERVICE_TYPES.find((s) => s.id === serviceType);
  const freq = FREQUENCIES.find((f) => f.id === frequency);
  if (!service) return 0;

  const base = service.basePrice;
  const roomCost = rooms * 80;
  const bathroomCost = bathrooms * 100;
  const hourCost = hours * 50;
  const subtotal = base + roomCost + bathroomCost + hourCost;
  const multiplier = freq?.multiplier ?? 1.0;

  return Math.round(subtotal * multiplier);
}
