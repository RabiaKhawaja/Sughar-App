export interface MaidBooking {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  service_type: string;
  rooms: number;
  bathrooms: number;
  hours: number;
  frequency: string;
  date: string;
  time_slot: string;
  total_price: number;
  status: string;
  created_at: string;
}

export interface ClutterCategory {
  name: string;
  quantity: number;
  estimated_value: number;
}

export interface ClutterPickup {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  categories: ClutterCategory[];
  pickup_date: string;
  pickup_slot: string;
  total_value: number;
  ai_summary: string | null;
  co2_saved_kg: number;
  items_count: number;
  status: string;
  created_at: string;
}

export interface EcoValuation {
  total_value_pkr: number;
  co2_saved_kg: number;
  water_saved_liters: number;
  energy_saved_kwh: number;
  trees_equivalent: number;
  landfill_diverted_kg: number;
  eco_summary: string;
  valuation_breakdown: Array<{
    item: string;
    value_pkr: number;
    note: string;
  }>;
  recommendations: string[];
}
