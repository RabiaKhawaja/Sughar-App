import { useMemo } from 'react';
import {
  Sparkles, Recycle, TrendingUp, Leaf, Clock, CheckCircle2,
  Calendar, Trash2, Phone, MapPin, Package, RefreshCw,
} from 'lucide-react';
import type { MaidBooking, ClutterPickup } from '@/types';

interface DashboardProps {
  maidBookings: MaidBooking[];
  clutterPickups: ClutterPickup[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const SERVICE_LABELS: Record<string, string> = {
  regular: 'Regular Cleaning',
  deep_clean: 'Deep Clean',
  dishwashing: 'Dishwashing',
  laundry: 'Laundry & Ironing',
  kitchen: 'Kitchen Cleaning',
  bathroom: 'Bathroom Cleaning',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-purple-100 text-purple-700',
  processed: 'bg-green-100 text-green-700',
};

export default function Dashboard({
  maidBookings, clutterPickups, loading, error, onRefresh,
}: DashboardProps) {
  const stats = useMemo(() => {
    const totalMaidRevenue = maidBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
    const totalRecycleValue = clutterPickups.reduce((sum, p) => sum + Number(p.total_value), 0);
    const totalCO2 = clutterPickups.reduce((sum, p) => sum + Number(p.co2_saved_kg), 0);
    const totalItems = clutterPickups.reduce((sum, p) => sum + p.items_count, 0);
    const completedMaid = maidBookings.filter((b) => b.status === 'completed').length;
    const pendingMaid = maidBookings.filter((b) => b.status === 'pending').length;
    const scheduledPickups = clutterPickups.filter((p) => p.status === 'scheduled').length;

    const maidByService: Record<string, number> = {};
    maidBookings.forEach((b) => {
      maidByService[b.service_type] = (maidByService[b.service_type] || 0) + 1;
    });

    const clutterByCategory: Record<string, number> = {};
    clutterPickups.forEach((p) => {
      const cats = p.categories as unknown as Array<{ name: string; quantity: number }>;
      if (Array.isArray(cats)) {
        cats.forEach((c) => {
          clutterByCategory[c.name] = (clutterByCategory[c.name] || 0) + c.quantity;
        });
      }
    });

    return {
      totalMaidRevenue, totalRecycleValue, totalCO2, totalItems,
      completedMaid, pendingMaid, scheduledPickups,
      maidByService, clutterByCategory,
      totalMaidBookings: maidBookings.length,
      totalPickups: clutterPickups.length,
    };
  }, [maidBookings, clutterPickups]);

  const maxServiceCount = Math.max(...Object.values(stats.maidByService), 1);
  const maxCategoryCount = Math.max(...Object.values(stats.clutterByCategory), 1);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={onRefresh} className="px-4 py-2 bg-green-700 text-white rounded-xl font-semibold">
          Retry
        </button>
      </div>
    );
  }

  const isEmpty = stats.totalMaidBookings === 0 && stats.totalPickups === 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-green-800 mb-1">Dashboard</h2>
          <p className="text-green-600 text-sm">Track your bookings, pickups, and environmental impact</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-white border border-green-100 text-green-700 hover:bg-green-50 transition-colors shadow-sm"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Maid Bookings"
          value={stats.totalMaidBookings.toString()}
          sublabel={`${stats.pendingMaid} pending`}
          color="green"
        />
        <StatCard
          icon={<Recycle className="w-5 h-5" />}
          label="Pickups Scheduled"
          value={stats.totalPickups.toString()}
          sublabel={`${stats.scheduledPickups} upcoming`}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Recycling Value"
          value={`Rs. ${stats.totalRecycleValue.toLocaleString()}`}
          sublabel={`${stats.totalItems} items`}
          color="amber"
        />
        <StatCard
          icon={<Leaf className="w-5 h-5" />}
          label="CO₂ Saved"
          value={`${stats.totalCO2.toFixed(1)} kg`}
          sublabel="Environmental impact"
          color="emerald"
        />
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-green-300" />
          </div>
          <h3 className="font-bold text-green-800 mb-1">No bookings yet</h3>
          <p className="text-sm text-gray-500">
            Start by booking a maid or scheduling a clutter pickup — your stats will appear here.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Service Distribution Chart */}
          {Object.keys(stats.maidByService).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
              <h3 className="font-bold text-green-800 mb-4">Maid Services by Type</h3>
              <div className="space-y-3">
                {Object.entries(stats.maidByService)
                  .sort((a, b) => b[1] - a[1])
                  .map(([service, count]) => (
                    <div key={service}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">
                          {SERVICE_LABELS[service] || service}
                        </span>
                        <span className="font-bold text-green-700">{count}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-green-50 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-700 rounded-full transition-all duration-700"
                          style={{ width: `${(count / maxServiceCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Clutter Category Chart */}
          {Object.keys(stats.clutterByCategory).length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
              <h3 className="font-bold text-green-800 mb-4">Recycled Items by Category</h3>
              <div className="space-y-3">
                {Object.entries(stats.clutterByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{category}</span>
                        <span className="font-bold text-amber-600">{count} items</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-amber-50 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                          style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Maid Bookings */}
      {maidBookings.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Recent Maid Bookings
          </h3>
          <div className="space-y-2">
            {maidBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-green-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {SERVICE_LABELS[booking.service_type] || booking.service_type}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.time_slot}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-700 text-sm">Rs. {Number(booking.total_price).toLocaleString()}</p>
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Clutter Pickups */}
      {clutterPickups.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
            <Recycle className="w-4 h-4" /> Recent Clutter Pickups
          </h3>
          <div className="space-y-2">
            {clutterPickups.slice(0, 5).map((pickup) => {
              const cats = pickup.categories as unknown as Array<{ name: string; quantity: number }>;
              return (
                <div key={pickup.id} className="bg-white rounded-xl shadow-sm border border-green-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Recycle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {Array.isArray(cats) && cats.map((c, i) => (
                          <span key={i} className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {c.quantity}× {c.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{pickup.pickup_date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pickup.pickup_slot}</span>
                        {pickup.co2_saved_kg > 0 && (
                          <span className="flex items-center gap-1 text-green-500">
                            <Leaf className="w-3 h-3" />{Number(pickup.co2_saved_kg).toFixed(1)} kg CO₂
                          </span>
                        )}
                      </div>
                      {pickup.ai_summary && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{pickup.ai_summary}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-amber-600 text-sm">Rs. {Number(pickup.total_value).toLocaleString()}</p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${STATUS_COLORS[pickup.status] || 'bg-gray-100 text-gray-600'}`}>
                        {pickup.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, sublabel, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: 'green' | 'blue' | 'amber' | 'emerald';
}) {
  const colorMap = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-gray-800">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>
    </div>
  );
}
