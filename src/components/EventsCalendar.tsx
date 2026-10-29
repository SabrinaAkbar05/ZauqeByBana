'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ListFilter,
  MapPin,
  Users,
} from 'lucide-react';
import { dateLabel } from '@/lib/utils';
import { Status } from './UI';

export type EventEntry = {
  id: string;
  title: string;
  event_date: string;
  status: string;
  venue?: string;
  guest_count?: number;
};

export function EventsCalendar({ events }: { events: EventEntry[] }) {
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');

  const month = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return d;
  }, [offset]);

  const year = month.getFullYear();
  const m = month.getMonth();
  const currentMonthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;

  const start = (new Date(year, m, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, m + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((start + dayCount) / 7) * 7 },
    (_, i) => i - start + 1
  );

  // Group events by day for month grid
  const byDay = useMemo(() => {
    const map = new Map<number, EventEntry[]>();
    for (const event of events) {
      if (event.event_date.slice(0, 7) === currentMonthPrefix) {
        const day = Number(event.event_date.slice(8, 10));
        map.set(day, [...(map.get(day) || []), event]);
      }
    }
    return map;
  }, [events, currentMonthPrefix]);

  // Sorted events for this month (for agenda view)
  const monthEvents = useMemo(() => {
    return events
      .filter((e) => e.event_date.slice(0, 7) === currentMonthPrefix)
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [events, currentMonthPrefix]);

  return (
    <div className="calendar-component">
      {/* Calendar Toolbar */}
      <div className="calendar-toolbar">
        <div>
          <h3>
            {month.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="calendar-view-toggle" role="group" aria-label="Calendar view">
            <button
              type="button"
              className={`calendar-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Month Grid"
            >
              <CalendarIcon size={14} className="inline mr-1" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              className={`calendar-view-btn ${viewMode === 'agenda' ? 'active' : ''}`}
              onClick={() => setViewMode('agenda')}
              title="Agenda List"
            >
              <ListFilter size={14} className="inline mr-1" />
              <span>Agenda</span>
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="calendar-controls">
            <button
              type="button"
              onClick={() => setOffset(offset - 1)}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => setOffset(0)}>
              Today
            </button>
            <button
              type="button"
              onClick={() => setOffset(offset + 1)}
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 1. Grid View (Month Calendar) */}
      {viewMode === 'grid' && (
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="calendar-day-label">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              const within = day >= 1 && day <= dayCount;
              const evs = within ? byDay.get(day) || [] : [];
              return (
                <div
                  key={i}
                  className={`calendar-cell ${within ? '' : 'calendar-muted'}`}
                >
                  <span className="calendar-date">{within ? day : ''}</span>
                  {evs.slice(0, 2).map((e) => (
                    <Link
                      key={e.id}
                      className={`calendar-event cal-${e.status}`}
                      title={`${e.title} (${e.status})`}
                      href={`/events/${e.id}`}
                    >
                      {e.title}
                    </Link>
                  ))}
                  {evs.length > 2 && (
                    <small>+{evs.length - 2} more</small>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Agenda View (Optimized for Mobile & Quick Glance) */}
      {viewMode === 'agenda' && (
        <div className="calendar-agenda">
          {monthEvents.length === 0 ? (
            <div className="empty py-10">
              <p className="text-sub">No bookings scheduled for this month.</p>
            </div>
          ) : (
            monthEvents.map((e) => {
              const dayNum = e.event_date.slice(8, 10);
              const monthShort = month.toLocaleDateString('en-US', {
                month: 'short',
              });
              return (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="calendar-agenda-item"
                >
                  <div className="agenda-date-badge">
                    <span className="agenda-date-day">{dayNum}</span>
                    <span className="agenda-date-month">{monthShort}</span>
                  </div>

                  <div className="agenda-details">
                    <strong>{e.title}</strong>
                    <small>
                      {e.venue ? `Venue: ${e.venue}` : 'Venue TBA'}
                      {e.guest_count ? ` • ${e.guest_count} guests` : ''}
                    </small>
                  </div>

                  <div className="flex-shrink-0">
                    <Status value={e.status} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
