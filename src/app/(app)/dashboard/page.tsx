import Link from 'next/link';
import {
  CalendarDays,
  Users,
  ArrowUpRight,
  Banknote,
  CreditCard,
  Plus,
  ArrowRight,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { PageHeading, Card, Empty, Status } from '@/components/UI';
import { ChartBars } from '@/components/ChartBars';
import { money, dateLabel, customerName } from '@/lib/utils';

export default async function Dashboard() {
  const { db, profile } = await requireUser();
  const isOwner = profile.role === 'owner';
  const [{ data: events }, { count: customerCount }] = await Promise.all([
    db
      .from('events')
      .select('id,title,event_date,guest_count,status,venue,customers(full_name)')
      .order('event_date', { ascending: true }),
    db.from('customers').select('*', { head: true, count: 'exact' }),
  ]);

  const allEvents = events || [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = allEvents.filter(
    (e) => e.event_date >= today && !['completed', 'cancelled'].includes(e.status)
  );

  let contractRevenue = 0,
    received = 0,
    expenses = 0,
    outstanding = 0;
  let monthly: { month: string; value: number }[] = [];

  if (isOwner) {
    const [{ data: inv }, { data: pay }, { data: ex }] = await Promise.all([
      db.from('invoices').select('id,amount,issued_at,status'),
      db.from('payments').select('amount'),
      db.from('expenses').select('amount'),
    ]);
    contractRevenue = (inv || [])
      .filter((i) => i.status !== 'void')
      .reduce((s, i) => s + Number(i.amount), 0);
    received = (pay || []).reduce((s, p) => s + Number(p.amount), 0);
    expenses = (ex || []).reduce((s, x) => s + Number(x.amount), 0);
    outstanding = Math.max(0, contractRevenue - received);

    const periods = Array.from({ length: 6 }, (_, offset) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 5 + offset);
      const year = d.getFullYear(),
        month = d.getMonth();
      return {
        month: d.toLocaleString('en-US', { month: 'short' }),
        value: (inv || [])
          .filter(
            (i) =>
              i.status !== 'void' &&
              new Date(i.issued_at).getFullYear() === year &&
              new Date(i.issued_at).getMonth() === month
          )
          .reduce((s, i) => s + Number(i.amount), 0),
      };
    });
    monthly = periods;
  }

  const firstName = (profile.full_name || 'there').split(' ')[0];

  return (
    <>
      <PageHeading
        title={`Welcome, ${firstName}`}
        description="ZAUQÉ BY BANA Executive Overview — Bookings, catering operations & financial health."
        action={
          <Link href="/events" className="btn btn-primary">
            <Plus size={17} /> <span>New Event Booking</span>
          </Link>
        }
      />

      {/* KPI Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <span className="metric-label">
            Upcoming Bookings <CalendarDays size={18} />
          </span>
          <strong>{upcoming.length}</strong>
          <small>Scheduled events ahead</small>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            Client Portfolio <Users size={18} />
          </span>
          <strong>{customerCount || 0}</strong>
          <small>Registered client accounts</small>
        </div>

        {isOwner ? (
          <>
            <div className="metric-card">
              <span className="metric-label">
                Contract Invoiced <Banknote size={18} />
              </span>
              <strong className="metric-currency">
                {money(contractRevenue)}
              </strong>
              <small>Total issued invoice billing</small>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                Pending Collection <CreditCard size={18} />
              </span>
              <strong className="metric-currency">
                {money(outstanding)}
              </strong>
              <small>Outstanding client balance</small>
            </div>
          </>
        ) : (
          <>
            <div className="metric-card">
              <span className="metric-label">
                Confirmed Events <Sparkles size={18} />
              </span>
              <strong>
                {allEvents.filter((e) => e.status === 'confirmed').length}
              </strong>
              <small>Ready for execution</small>
            </div>

            <div className="metric-card">
              <span className="metric-label">
                Completed Experiences <ArrowUpRight size={18} />
              </span>
              <strong>
                {allEvents.filter((e) => e.status === 'completed').length}
              </strong>
              <small>Delivered successfully</small>
            </div>
          </>
        )}
      </div>

      {/* Analytics & Quick Actions */}
      <div className="dashboard-grid">
        <Card>
          <div className="card-header">
            <div>
              <h2>{isOwner ? 'Revenue Trend' : 'Event Operations Pipeline'}</h2>
              <p>
                {isOwner
                  ? 'Monthly issued invoice performance'
                  : 'Active event status breakdown'}
              </p>
            </div>
            <span className="eyebrow">
              {isOwner ? 'PAST 6 MONTHS' : 'PRODUCTION'}
            </span>
          </div>

          {isOwner ? (
            <ChartBars data={monthly} />
          ) : (
            <div className="pipeline">
              {['inquiry', 'quoted', 'confirmed', 'in_progress', 'completed'].map(
                (s) => (
                  <div key={s}>
                    <span>{s.replace('_', ' ')}</span>
                    <strong>{allEvents.filter((e) => e.status === s).length}</strong>
                  </div>
                )
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-header">
            <div>
              <h2>Executive Actions</h2>
              <p>Quick access to core operations</p>
            </div>
          </div>

          <div className="quick-links">
            <Link href="/customers">
              <Users size={17} /> Add New Client <ArrowRight size={16} />
            </Link>
            <Link href="/events">
              <CalendarDays size={17} /> Create Event Booking <ArrowRight size={16} />
            </Link>
            {isOwner && (
              <>
                <Link href="/quotes">
                  <Banknote size={17} /> Build Proposal / Quote <ArrowRight size={16} />
                </Link>
                <Link href="/expenses">
                  <Wallet size={17} /> Record Vendor Expense <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>

          {isOwner && (
            <div className="financial-snapshot">
              <span>
                Net Margin Estimate <small>(invoiced – expenses)</small>
              </span>
              <strong>{money(contractRevenue - expenses)}</strong>
              <span className="subtle">
                Collected advances &amp; payments: {money(received)}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming Bookings Table */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Upcoming Event Bookings</h2>
            <p>Next scheduled experiences across Pakistan</p>
          </div>
          <Link className="text-link" href="/events">
            Full event register <ArrowUpRight size={15} />
          </Link>
        </div>

        {upcoming.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event &amp; Occasion</th>
                  <th>Client</th>
                  <th>Event Date</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.slice(0, 6).map((e) => (
                  <tr key={e.id}>
                    <td className="strong">{e.title}</td>
                    <td>{customerName(e.customers)}</td>
                    <td>{dateLabel(e.event_date)}</td>
                    <td>{e.guest_count}</td>
                    <td>
                      <Status value={e.status} />
                    </td>
                    <td>
                      <Link href={`/events/${e.id}`} className="text-link">
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No upcoming event bookings"
            description="Create your first booking to begin tracking logistics, catering, and billing."
            href="/events"
            label="Schedule an event"
          />
        )}
      </Card>
    </>
  );
}
