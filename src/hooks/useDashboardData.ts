import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { MaidBooking, ClutterPickup } from '@/types';

export function useDashboardData() {
  const [maidBookings, setMaidBookings] = useState<MaidBooking[]>([]);
  const [clutterPickups, setClutterPickups] = useState<ClutterPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [maidRes, clutterRes] = await Promise.all([
        supabase.from('maid_bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('clutter_pickups').select('*').order('created_at', { ascending: false }),
      ]);

      if (maidRes.error) throw maidRes.error;
      if (clutterRes.error) throw clutterRes.error;

      setMaidBookings(maidRes.data || []);
      setClutterPickups(clutterRes.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { maidBookings, clutterPickups, loading, error, refetch: fetchData };
}
