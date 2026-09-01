import { Sparkles, Recycle, LayoutDashboard, Leaf } from 'lucide-react';

type Tab = 'maid' | 'clutter' | 'dashboard';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: Array<{ id: Tab; label: string; icon: typeof Sparkles }> = [
  { id: 'maid', label: 'Book Maid', icon: Sparkles },
  { id: 'clutter', label: 'Clutter Pickup', icon: Recycle },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-green-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-md shadow-green-600/20">
              <Leaf className="w-5 h-5 text-cream" style={{ color: '#FAF6EF' }} />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-green-800 leading-none tracking-tight">
                Sughar
              </h1>
              <p className="text-[10px] text-green-600 font-medium tracking-wide">
                Home Management & Recycling
              </p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-1 bg-green-50/60 rounded-full p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    active
                      ? 'bg-green-700 text-white shadow-md shadow-green-600/30'
                      : 'text-green-700 hover:bg-green-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <nav className="sm:hidden flex items-center justify-around pb-2 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300 flex-1 ${
                  active
                    ? 'bg-green-700 text-white shadow-md shadow-green-600/30'
                    : 'text-green-700 hover:bg-green-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
