import { useState } from 'react';
import Header from '@/components/Header';
import MaidBookingForm from '@/components/MaidBookingForm';
import ClutterPickupForm from '@/components/ClutterPickupForm';
import Dashboard from '@/components/Dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';

type Tab = 'maid' | 'clutter' | 'dashboard';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('maid');
  const { maidBookings, clutterPickups, loading, error, refetch } = useDashboardData();

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="px-4 sm:px-6 py-6 pb-20">
        {activeTab === 'maid' && <MaidBookingForm />}
        {activeTab === 'clutter' && <ClutterPickupForm />}
        {activeTab === 'dashboard' && (
          <Dashboard
            maidBookings={maidBookings}
            clutterPickups={clutterPickups}
            loading={loading}
            error={error}
            onRefresh={refetch}
          />
        )}
      </main>

      <footer className="border-t border-green-100 bg-white/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-sm font-semibold text-green-700">Sughar</p>
          <p className="text-xs text-gray-400 mt-1">
            Home Management & Recycling — Made for a greener Pakistan
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
