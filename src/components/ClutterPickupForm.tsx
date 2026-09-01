import { useState, useMemo } from 'react';
import {
  Recycle, Shirt, BookOpen, Sofa, Monitor, Plus, Minus, Trash2,
  Calendar, Clock, MapPin, User, Phone, Sparkles, Loader2, Check,
  Leaf, Droplets, Zap, TreePine, Trash, TrendingUp, Lightbulb,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  CLUTTER_CATEGORIES, TIME_SLOTS, MAID_AREAS,
} from '@/lib/constants';
import type { EcoValuation, ClutterCategory } from '@/types';

const ICON_MAP: Record<string, typeof Recycle> = {
  Shirt, BookOpen, Sofa, Monitor,
};

interface SelectedCategory {
  id: string;
  label: string;
  quantity: number;
}

interface PickupSuccess {
  id: string;
  totalValue: number;
  co2Saved: number;
  summary: string;
}

export default function ClutterPickupForm() {
  const [selected, setSelected] = useState<SelectedCategory[]>([]);
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    area: MAID_AREAS[0],
    pickup_date: '',
    pickup_slot: '',
  });
  const [valuation, setValuation] = useState<EcoValuation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<PickupSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (catId: string, catLabel: string) => {
    setSelected((prev) => {
      const exists = prev.find((c) => c.id === catId);
      if (exists) {
        return prev.filter((c) => c.id !== catId);
      }
      return [...prev, { id: catId, label: catLabel, quantity: 1 }];
    });
    setValuation(null);
  };

  const updateQuantity = (catId: string, delta: number) => {
    setSelected((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c
      )
    );
    setValuation(null);
  };

  const totalItems = useMemo(() => selected.reduce((sum, c) => sum + c.quantity, 0), [selected]);

  const estimateValue = useMemo(() => {
    return selected.reduce((sum, c) => {
      const cat = CLUTTER_CATEGORIES.find((cat) => cat.id === c.id);
      return sum + (cat?.unitValue ?? 0) * c.quantity;
    }, 0);
  }, [selected]);

  const getEcoValuation = async () => {
    if (selected.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    setValuation(null);

    try {
      const items = selected.map((c) => ({ name: c.id, quantity: c.quantity }));
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eco-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ items }),
        }
      );

      if (!response.ok) {
        throw new Error(`AI assistant error (${response.status})`);
      }

      const data = await response.json();
      if (data.error && !data.total_value_pkr) {
        throw new Error(data.error);
      }

      setValuation(data as EcoValuation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get AI valuation');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const categories: ClutterCategory[] = selected.map((c) => {
        const cat = CLUTTER_CATEGORIES.find((cat) => cat.id === c.id);
        return {
          name: c.id,
          quantity: c.quantity,
          estimated_value: (cat?.unitValue ?? 0) * c.quantity,
        };
      });

      const totalValue = valuation?.total_value_pkr ?? estimateValue;
      const co2Saved = valuation?.co2_saved_kg ?? 0;

      const { data, error: insertError } = await supabase
        .from('clutter_pickups')
        .insert({
          customer_name: form.customer_name,
          phone: form.phone,
          address: `${form.address}, ${form.area}`,
          categories: categories as unknown as Record<string, unknown>[],
          pickup_date: form.pickup_date,
          pickup_slot: form.pickup_slot,
          total_value: totalValue,
          ai_summary: valuation?.eco_summary ?? null,
          co2_saved_kg: co2Saved,
          items_count: totalItems,
          status: 'scheduled',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess({
        id: data.id,
        totalValue,
        co2Saved,
        summary: valuation?.eco_summary ?? 'Your pickup has been scheduled.',
      });
      setSelected([]);
      setValuation(null);
      setForm({
        customer_name: '', phone: '', address: '', area: MAID_AREAS[0],
        pickup_date: '', pickup_slot: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule pickup');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="animate-scale-in max-w-2xl mx-auto bg-white rounded-3xl shadow-xl shadow-green-900/5 border border-green-100 p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-700" />
        </div>
        <h2 className="text-2xl font-extrabold text-green-800 mb-2">Pickup Scheduled!</h2>
        <p className="text-green-600 mb-6 text-sm leading-relaxed">{success.summary}</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-2xl p-5">
            <p className="text-xs text-green-600 mb-1">Est. Value</p>
            <p className="text-2xl font-extrabold text-green-800">Rs. {success.totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-5">
            <p className="text-xs text-amber-600 mb-1">CO₂ Saved</p>
            <p className="text-2xl font-extrabold text-amber-700">{success.co2Saved} kg</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-6">Reference: {success.id.slice(0, 8).toUpperCase()}</p>
        <button
          onClick={() => setSuccess(null)}
          className="px-6 py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors shadow-lg shadow-green-600/20"
        >
          Schedule Another Pickup
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-green-800 mb-1">Clutter Pickup</h2>
        <p className="text-green-600 text-sm">
          Turn your unwanted items into value — schedule a doorstep recycling pickup
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Category Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
            <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
              <Recycle className="w-4 h-4" /> Select Clutter Categories
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {CLUTTER_CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Recycle;
                const isSelected = selected.some((c) => c.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id, cat.label)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-green-600 bg-green-50 shadow-md shadow-green-600/10'
                        : 'border-gray-100 hover:border-green-200 hover:bg-green-50/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{cat.description}</p>
                      <p className="text-[11px] text-green-500 font-semibold mt-1">
                        ~Rs. {cat.unitValue}/item
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Adjusters */}
          {selected.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 animate-slide-up">
              <h3 className="font-bold text-green-800 mb-4">Item Quantities</h3>
              <div className="space-y-3">
                {selected.map((cat) => {
                  const catInfo = CLUTTER_CATEGORIES.find((c) => c.id === cat.id);
                  return (
                    <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-green-50/60">
                      <span className="flex-1 font-semibold text-sm text-green-800">{cat.label}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(cat.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-green-200 text-green-700 font-bold hover:bg-green-100 transition-colors flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-bold text-green-800">{cat.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(cat.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-green-200 text-green-700 font-bold hover:bg-green-100 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold text-green-600 w-20 text-right">
                        Rs. {((catInfo?.unitValue ?? 0) * cat.quantity).toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id, cat.label)}
                        className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* AI Assistant Button */}
              <button
                type="button"
                onClick={getEcoValuation}
                disabled={aiLoading}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> AI Analyzing Your Items...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Get AI Eco & Valuation Estimate</>
                )}
              </button>
              {aiError && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">{aiError}</p>
              )}
            </div>
          )}

          {/* AI Valuation Results */}
          {valuation && (
            <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl shadow-xl shadow-green-900/20 p-6 text-white animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold">AI Eco & Valuation Report</h3>
              </div>

              <p className="text-sm opacity-90 leading-relaxed mb-5 bg-white/10 rounded-xl p-4">
                {valuation.eco_summary}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Est. Value"
                  value={`Rs. ${valuation.total_value_pkr.toLocaleString()}`}
                  highlight
                />
                <StatCard
                  icon={<Leaf className="w-4 h-4" />}
                  label="CO₂ Saved"
                  value={`${valuation.co2_saved_kg} kg`}
                />
                <StatCard
                  icon={<Droplets className="w-4 h-4" />}
                  label="Water Saved"
                  value={`${valuation.water_saved_liters.toLocaleString()} L`}
                />
                <StatCard
                  icon={<Zap className="w-4 h-4" />}
                  label="Energy Saved"
                  value={`${valuation.energy_saved_kwh} kWh`}
                />
                <StatCard
                  icon={<TreePine className="w-4 h-4" />}
                  label="Trees Equiv."
                  value={`${valuation.trees_equivalent}`}
                />
                <StatCard
                  icon={<Trash className="w-4 h-4" />}
                  label="Landfill Diverted"
                  value={`${valuation.landfill_diverted_kg} kg`}
                />
              </div>

              {/* Breakdown */}
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold opacity-80 mb-3">VALUATION BREAKDOWN</p>
                <div className="space-y-2">
                  {valuation.valuation_breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between items-start text-sm">
                      <div>
                        <span className="font-semibold">{item.item}</span>
                        <p className="text-[11px] opacity-70">{item.note}</p>
                      </div>
                      <span className="font-bold">Rs. {item.value_pkr.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-xs font-semibold opacity-80 mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> RECOMMENDATIONS
                </p>
                <ul className="space-y-1.5">
                  {valuation.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 opacity-90">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Contact & Schedule */}
          {selected.length > 0 && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 animate-slide-up">
              <h3 className="font-bold text-green-800 mb-4">Pickup Details</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput icon={<User className="w-4 h-4" />} label="Full Name" value={form.customer_name} onChange={(v) => update('customer_name', v)} required placeholder="e.g. Bilal Ahmed" />
                <TextInput icon={<Phone className="w-4 h-4" />} label="Phone Number" type="tel" value={form.phone} onChange={(v) => update('phone', v)} required placeholder="03XX-XXXXXXX" />
                <TextInput icon={<MapPin className="w-4 h-4" />} label="Street Address" value={form.address} onChange={(v) => update('address', v)} required placeholder="House #, Street, Block" />
                <div>
                  <label className="text-sm font-semibold text-green-700 mb-1.5 block">Area</label>
                  <select value={form.area} onChange={(e) => update('area', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none text-sm font-medium text-gray-700 bg-white transition-colors">
                    {MAID_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Pickup Date
                  </label>
                  <input type="date" value={form.pickup_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => update('pickup_date', e.target.value)} required
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none text-sm font-medium text-gray-700 bg-white transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Pickup Slot
                  </label>
                  <select value={form.pickup_slot} onChange={(e) => update('pickup_slot', e.target.value)} required
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none text-sm font-medium text-gray-700 bg-white transition-colors">
                    <option value="">Select a time slot</option>
                    {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full mt-5 py-4 bg-green-700 text-white rounded-2xl font-bold text-lg hover:bg-green-800 transition-all shadow-lg shadow-green-600/25 disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Scheduling Pickup...</>
                ) : (
                  <>Schedule Pickup — {totalItems} item{totalItems !== 1 ? 's' : ''}</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6">
            <h3 className="font-bold text-green-800 mb-4">Pickup Summary</h3>
            {selected.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <Recycle className="w-7 h-7 text-green-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  Select categories to begin
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {selected.map((cat) => {
                    const catInfo = CLUTTER_CATEGORIES.find((c) => c.id === cat.id);
                    return (
                      <div key={cat.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{cat.quantity}× {cat.label}</span>
                        <span className="font-semibold text-green-700">
                          Rs. {((catInfo?.unitValue ?? 0) * cat.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-green-800">Est. Total</span>
                  <span className="text-2xl font-extrabold text-green-800">
                    Rs. {(valuation?.total_value_pkr ?? estimateValue).toLocaleString()}
                  </span>
                </div>
                {valuation && (
                  <div className="mt-3 bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-600">CO₂ Savings</p>
                    <p className="text-lg font-bold text-green-700">{valuation.co2_saved_kg} kg</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-amber-800 text-sm">Why Recycle?</h3>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Pakistan generates over 30 million tons of waste annually. By recycling,
              you divert waste from landfills, save energy, and earn money for items
              you no longer need.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, highlight,
}: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-amber-400/20 border border-amber-300/30' : 'bg-white/10'}`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-80">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
}

function TextInput({
  icon, label, value, onChange, required, placeholder, type = 'text',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none text-sm font-medium text-gray-700 bg-white transition-colors"
      />
    </div>
  );
}
