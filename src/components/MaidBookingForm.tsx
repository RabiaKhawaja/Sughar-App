import { useState, useMemo } from 'react';
import {
  Sparkles, Brush, Utensils, Shirt, CookingPot, ShowerHead,
  Calendar, Clock, MapPin, User, Phone, Check, Loader2, ShieldCheck, Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  SERVICE_TYPES, FREQUENCIES, TIME_SLOTS, MAID_AREAS, computeMaidPrice,
} from '@/lib/constants';
import type { MaidBooking } from '@/types';

const ICON_MAP: Record<string, typeof Sparkles> = {
  Sparkles, Brush, Utensils, Shirt, CookingPot, ShowerHead,
};

interface BookingSuccess {
  id: string;
  price: number;
}

export default function MaidBookingForm() {
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    address: '',
    area: MAID_AREAS[0],
    service_type: 'regular',
    rooms: 2,
    bathrooms: 1,
    hours: 4,
    frequency: 'one_time',
    date: '',
    time_slot: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<BookingSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  const price = useMemo(
    () => computeMaidPrice(form.service_type, form.rooms, form.bathrooms, form.hours, form.frequency),
    [form.service_type, form.rooms, form.bathrooms, form.hours, form.frequency]
  );

  const priceBreakdown = useMemo(() => {
    const service = SERVICE_TYPES.find((s) => s.id === form.service_type);
    const freq = FREQUENCIES.find((f) => f.id === form.frequency);
    return {
      base: service?.basePrice ?? 0,
      rooms: form.rooms * 80,
      bathrooms: form.bathrooms * 100,
      hours: form.hours * 50,
      multiplier: freq?.multiplier ?? 1.0,
      multiplierLabel: freq?.label ?? 'One Time',
    };
  }, [form.service_type, form.rooms, form.bathrooms, form.hours, form.frequency]);

  const update = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('maid_bookings')
        .insert({
          customer_name: form.customer_name,
          phone: form.phone,
          address: `${form.address}, ${form.area}`,
          service_type: form.service_type,
          rooms: form.rooms,
          bathrooms: form.bathrooms,
          hours: form.hours,
          frequency: form.frequency,
          date: form.date,
          time_slot: form.time_slot,
          total_price: price,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess({ id: data.id, price });
      setForm({
        customer_name: '', phone: '', address: '', area: MAID_AREAS[0],
        service_type: 'regular', rooms: 2, bathrooms: 1, hours: 4,
        frequency: 'one_time', date: '', time_slot: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit booking');
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
        <h2 className="text-2xl font-extrabold text-green-800 mb-2">Booking Confirmed!</h2>
        <p className="text-green-600 mb-6">
          Your maid service has been booked. Our verified maid will arrive at the scheduled time.
        </p>
        <div className="bg-green-50 rounded-2xl p-6 mb-6">
          <p className="text-sm text-green-600 mb-1">Booking Total</p>
          <p className="text-3xl font-extrabold text-green-800">Rs. {success.price.toLocaleString()}</p>
          <p className="text-xs text-green-500 mt-2">Reference: {success.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <button
          onClick={() => setSuccess(null)}
          className="px-6 py-3 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-800 transition-colors shadow-lg shadow-green-600/20"
        >
          Book Another Service
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-green-800 mb-1">Book a Verified Maid</h2>
        <p className="text-green-600 text-sm">
          Background-checked, trained and rated professionals at your service
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          {/* Service Type Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
            <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Select Service Type
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICE_TYPES.map((service) => {
                const Icon = ICON_MAP[service.icon] || Sparkles;
                const active = form.service_type === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => update('service_type', service.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? 'border-green-600 bg-green-50 shadow-md shadow-green-600/10 scale-[1.02]'
                        : 'border-gray-100 hover:border-green-200 hover:bg-green-50/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${active ? 'text-green-700' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold text-center ${active ? 'text-green-800' : 'text-gray-600'}`}>
                      {service.label}
                    </span>
                    <span className="text-[10px] text-green-500 font-medium">Rs. {service.basePrice}+</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
            <h3 className="font-bold text-green-800 mb-4">Service Details</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <CounterInput
                label="Rooms"
                value={form.rooms}
                min={0}
                max={10}
                onChange={(v) => update('rooms', v)}
              />
              <CounterInput
                label="Bathrooms"
                value={form.bathrooms}
                min={0}
                max={5}
                onChange={(v) => update('bathrooms', v)}
              />
              <CounterInput
                label="Hours"
                value={form.hours}
                min={2}
                max={12}
                onChange={(v) => update('hours', v)}
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold text-green-700 mb-2 block">Frequency</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FREQUENCIES.map((freq) => {
                  const active = form.frequency === freq.id;
                  return (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => update('frequency', freq.id)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                        active
                          ? 'border-green-600 bg-green-50 text-green-800'
                          : 'border-gray-100 text-gray-600 hover:border-green-200'
                      }`}
                    >
                      {freq.label}
                      {freq.multiplier < 1.0 && (
                        <span className="block text-[10px] text-green-500 font-medium">
                          {Math.round((1 - freq.multiplier) * 100)}% off
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contact & Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
            <h3 className="font-bold text-green-800 mb-4">Contact & Schedule</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextInput
                icon={<User className="w-4 h-4" />}
                label="Full Name"
                value={form.customer_name}
                onChange={(v) => update('customer_name', v)}
                required
                placeholder="e.g. Ayesha Khan"
              />
              <TextInput
                icon={<Phone className="w-4 h-4" />}
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(v) => update('phone', v)}
                required
                placeholder="03XX-XXXXXXX"
              />
              <TextInput
                icon={<MapPin className="w-4 h-4" />}
                label="Street Address"
                value={form.address}
                onChange={(v) => update('address', v)}
                required
                placeholder="House #, Street, Block"
              />
              <div>
                <label className="text-sm font-semibold text-green-700 mb-1.5 block">Area</label>
                <select
                  value={form.area}
                  onChange={(e) => update('area', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none text-sm font-medium text-gray-700 bg-white transition-colors"
                >
                  {MAID_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Service Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => update('date', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none text-sm font-medium text-gray-700 bg-white transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Time Slot
                </label>
                <select
                  value={form.time_slot}
                  onChange={(e) => update('time_slot', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:outline-none text-sm font-medium text-gray-700 bg-white transition-colors"
                >
                  <option value="">Select a time slot</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-green-700 text-white rounded-2xl font-bold text-lg hover:bg-green-800 transition-all shadow-lg shadow-green-600/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Confirming Booking...</>
            ) : (
              <>Confirm Booking — Rs. {price.toLocaleString()}</>
            )}
          </button>
        </form>

        {/* Pricing Sidebar */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="bg-gradient-to-br from-green-700 to-green-900 rounded-2xl shadow-xl shadow-green-900/20 p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold">Price Breakdown</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              <PriceRow label="Base service" value={priceBreakdown.base} />
              <PriceRow label={`${form.rooms} room(s) × Rs. 80`} value={priceBreakdown.rooms} />
              <PriceRow label={`${form.bathrooms} bathroom(s) × Rs. 100`} value={priceBreakdown.bathrooms} />
              <PriceRow label={`${form.hours} hours × Rs. 50`} value={priceBreakdown.hours} />
              {priceBreakdown.multiplier < 1.0 && (
                <PriceRow
                  label={`${priceBreakdown.multiplierLabel} discount`}
                  value={-Math.round((priceBreakdown.base + priceBreakdown.rooms + priceBreakdown.bathrooms + priceBreakdown.hours) * (1 - priceBreakdown.multiplier))}
                  isDiscount
                />
              )}
            </div>
            <div className="border-t border-white/20 mt-4 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold opacity-90">Total</span>
                <span className="text-3xl font-extrabold">Rs. {price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-green-200 border-2 border-white flex items-center justify-center">
                    <User className="w-4 h-4 text-green-700" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 font-medium">4.9/5 from 2,300+ bookings</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-600" /> Background-verified maids</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-600" /> Satisfaction guaranteed</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-green-600" /> Eco-friendly cleaning products</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ label, value, isDiscount }: { label: string; value: number; isDiscount?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="opacity-80">{label}</span>
      <span className={`font-semibold ${isDiscount ? 'text-amber-300' : ''}`}>
        {isDiscount ? '-' : ''}Rs. {Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
}

function CounterInput({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold text-green-700 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-xl border-2 border-gray-100 text-green-700 font-bold text-lg hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center"
        >
          −
        </button>
        <div className="flex-1 text-center py-2 rounded-xl bg-green-50 font-bold text-green-800 text-lg">
          {value}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-xl border-2 border-gray-100 text-green-700 font-bold text-lg hover:border-green-400 hover:bg-green-50 transition-colors flex items-center justify-center"
        >
          +
        </button>
      </div>
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
