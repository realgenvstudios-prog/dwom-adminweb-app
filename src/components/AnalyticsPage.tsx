import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import analyticsService from '../services/analyticsService';
import type { EventCount } from '../services/analyticsService';
import NotesTrackingTab from './analytics/NotesTrackingTab';
import { logger } from '../utils/logger';

type RangeOption = 7 | 30 | 90;

// The funnel steps we always want a card for, even at zero — the other
// events (anything not in this list) still show up in the chart/table below.
const FUNNEL_EVENTS: Array<{ name: string; label: string; accent: string }> = [
  { name: 'screen_viewed', label: 'Screen Views', accent: 'border-blue-600 text-blue-600' },
  { name: 'search_performed', label: 'Searches', accent: 'border-indigo-600 text-indigo-600' },
  { name: 'cart_item_added', label: 'Cart Adds', accent: 'border-purple-600 text-purple-600' },
  { name: 'checkout_started', label: 'Checkouts Started', accent: 'border-amber-600 text-amber-600' },
  { name: 'order_placed', label: 'Orders Placed', accent: 'border-green-600 text-green-600' },
  { name: 'payment_succeeded', label: 'Payments Succeeded', accent: 'border-emerald-600 text-emerald-600' },
];

const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'notes'>('overview');
  const [events, setEvents] = useState<EventCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeOption>(7);

  const fetchSummary = useCallback(async (days: RangeOption) => {
    try {
      setLoading(true);
      const to = new Date();
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
      const data = await analyticsService.getSummary(from, to);
      setEvents(data);
    } catch (error) {
      logger.error('Failed to fetch analytics summary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(range);
  }, [range, fetchSummary]);

  const countFor = (name: string) => events.find((e) => e.name === name)?.count ?? 0;
  const totalEvents = events.reduce((sum, e) => sum + e.count, 0);

  const knownNames = new Set(FUNNEL_EVENTS.map((f) => f.name));
  const otherEvents = events.filter((e) => !knownNames.has(e.name)).sort((a, b) => b.count - a.count);

  const chartData = events
    .map((e) => ({ name: e.name, count: e.count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-600">Product usage across the mobile app, from the event tracking pipeline</p>
        </div>
        {activeTab === 'overview' && (
          <div className="flex gap-2">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  range === opt.value
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 flex gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeTab === 'notes' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Notes & Search
        </button>
      </div>

      {activeTab === 'notes' && <NotesTrackingTab />}

      {activeTab === 'overview' && (
      <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : totalEvents === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">No events recorded yet</p>
          <p className="text-gray-600 max-w-md mx-auto">
            The tracking pipeline is live, but no activity has come in for this range yet. Mobile
            events start flowing once the app update reaches real devices (an EAS Update or new
            build); backend events (orders, payments) appear as soon as the next real transaction happens.
          </p>
        </div>
      ) : (
        <>
          {/* Funnel step cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {FUNNEL_EVENTS.map((step) => (
              <div key={step.name} className={`bg-white rounded-lg shadow p-6 border-l-4 ${step.accent.split(' ')[0]}`}>
                <p className="text-gray-600 text-sm">{step.label}</p>
                <p className={`text-3xl font-bold ${step.accent.split(' ')[1]}`}>
                  {countFor(step.name).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* All events chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="font-semibold text-gray-800 mb-4">Event counts, this range</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(value: number | undefined) => value ? value.toLocaleString() : '0'} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Everything else, as a table */}
          {otherEvents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="font-semibold text-gray-800 px-6 py-4 border-b border-gray-100">
                Other events
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium">Event name</th>
                    <th className="px-6 py-3 font-medium text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {otherEvents.map((e) => (
                    <tr key={e.name}>
                      <td className="px-6 py-3 text-gray-700">{e.name}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">{e.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
};

export default AnalyticsPage;
