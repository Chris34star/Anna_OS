import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Scissors,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Appointment } from '../types';

export const AppointmentsView: React.FC = () => {
  const { appointments, addAppointment, updateAppointmentStatus, shop } = useStore();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New appointment form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+254 7');
  const [service, setService] = useState('Knotless Braids + Scalp Treatment');
  const [stylist, setStylist] = useState('Mercy Waweru');
  const [time, setTime] = useState('Today 17:00');
  const [duration, setDuration] = useState(90);
  const [price, setPrice] = useState(3000);

  const filtered = appointments.filter(
    (a) => filterStatus === 'all' || a.status === filterStatus
  );

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    addAppointment({
      customer_name: customerName.trim(),
      customer_phone: phone.trim(),
      service_name: service,
      stylist_name: stylist,
      appointment_time: time,
      duration_minutes: duration,
      price_kes: price,
      status: 'confirmed',
    });

    setShowAddModal(false);
    setCustomerName('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
              <Scissors className="w-3 h-3 text-purple-400" /> ADAPTIVE WORKSPACE
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-mono text-neutral-400">Salon &amp; Service Template</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Appointment Bookings &amp; Stylist Schedule
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Dynamic service schedule generated automatically when configured for Salon, Spa &amp; Services.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl w-fit">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          All ({appointments.length})
        </button>
        <button
          onClick={() => setFilterStatus('confirmed')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            filterStatus === 'confirmed'
              ? 'bg-purple-950/80 text-purple-300 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Confirmed
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            filterStatus === 'in_progress'
              ? 'bg-amber-950/80 text-amber-300 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            filterStatus === 'completed'
              ? 'bg-emerald-950/80 text-emerald-300 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Futuristic Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((apt) => {
          const isDone = apt.status === 'completed';
          const isInProgress = apt.status === 'in_progress';

          return (
            <div
              key={apt.id}
              className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col justify-between space-y-3 ${
                isDone
                  ? 'bg-neutral-900/50 border-neutral-800/60 opacity-60'
                  : isInProgress
                  ? 'bg-neutral-900 border-amber-500/50 shadow-md shadow-amber-900/10'
                  : 'bg-neutral-900 border-neutral-800 hover:border-purple-500/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-purple-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {apt.appointment_time}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isDone
                        ? 'bg-emerald-950 text-emerald-300'
                        : isInProgress
                        ? 'bg-amber-950 text-amber-300 animate-pulse'
                        : 'bg-purple-950 text-purple-300'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{apt.customer_name}</h4>
                  <p className="text-xs text-neutral-400 font-mono">{apt.customer_phone}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs">
                  <div className="text-neutral-200 font-medium">{apt.service_name}</div>
                  <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                    <span>Stylist: <strong className="text-neutral-300">{apt.stylist_name}</strong></span>
                    <span>{apt.duration_minutes} mins</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {shop.currency} {apt.price_kes.toLocaleString()}
                </span>

                <div className="flex items-center gap-1.5">
                  {!isDone && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Finish</span>
                    </button>
                  )}
                  {isInProgress && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                      className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                    >
                      Pause
                    </button>
                  )}
                  {!isInProgress && !isDone && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'in_progress')}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-950/80 border border-amber-800/50 rounded-lg cursor-pointer"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-400" /> Book Salon / Spa Client
            </h3>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wanjiku Kamau"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Service</label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Stylist / Specialist</label>
                  <input
                    type="text"
                    value={stylist}
                    onChange={(e) => setStylist(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Price (KES)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
