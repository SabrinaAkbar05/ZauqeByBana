import { Wallet, Receipt, Link2 } from 'lucide-react';
import { requireOwner } from '@/lib/auth';
import { createExpense } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Empty } from '@/components/UI';
import { money, dateLabel } from '@/lib/utils';

export default async function Expenses({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireOwner();
  const [{ data: events }, { data: expenses }] = await Promise.all([
    db
      .from('events')
      .select('id,title,event_date')
      .order('event_date', { ascending: false }),
    db
      .from('expenses')
      .select(
        'id,event_id,description,category,vendor_name,amount,incurred_at,events(title)'
      )
      .order('incurred_at', { ascending: false }),
  ]);

  return (
    <>
      <PageHeading
        title="Vendor Disbursements &amp; Expenses"
        description="Monitor raw materials, artisan floral, decor rentals, staffing, and logistical costs per event."
      />
      <Alert searchParams={await searchParams} />

      {/* Expense Metrics */}
      <div className="metric-grid three">
        <div className="metric-card">
          <span className="metric-label">
            Total Incurred Expenses <Wallet size={18} />
          </span>
          <strong className="metric-currency">
            {money((expenses || []).reduce((s, e) => s + Number(e.amount), 0))}
          </strong>
          <small>Disbursements across all functions</small>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            Expense Line Items <Receipt size={18} />
          </span>
          <strong>{expenses?.length || 0}</strong>
          <small>Recorded vendor vouchers</small>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            Linked Event Bookings <Link2 size={18} />
          </span>
          <strong>{new Set((expenses || []).map((e) => e.event_id)).size}</strong>
          <small>Events with cost accounting</small>
        </div>
      </div>

      {/* Record Expense */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Record Vendor Disbursement</h2>
            <p>Assign direct costs to calculate accurate event gross margins</p>
          </div>
        </div>

        {events?.length ? (
          <form action={createExpense} className="stack">
            <div className="form-grid cols-3">
              <Field label="Associated Event Booking *">
                <select name="event_id" required>
                  {events.map((e) => (
                    <option value={e.id} key={e.id}>
                      {e.title} — {e.event_date}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Cost Category *">
                <select name="category">
                  {[
                    'food',
                    'decoration',
                    'labor',
                    'transport',
                    'rental',
                    'other',
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Amount (PKR) *">
                <input
                  name="amount"
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                />
              </Field>

              <Field label="Disbursement Description *">
                <input
                  name="description"
                  required
                  placeholder="e.g. Fresh imported orchids / Mutton procurement / Sound gear"
                />
              </Field>

              <Field label="Vendor / Contractor">
                <input name="vendor_name" placeholder="Supplier or vendor name" />
              </Field>

              <Field label="Expense Date *">
                <input
                  name="incurred_at"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </Field>
            </div>

            <button type="submit" className="btn btn-primary self-start">
              Record Expense Entry
            </button>
          </form>
        ) : (
          <p className="info-line">
            Please create an event before logging its operational expenses.
          </p>
        )}
      </Card>

      {/* Expense Register */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Expense Ledger</h2>
            <p>Full cost accounting across all active and completed events</p>
          </div>
        </div>

        {expenses?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Vendor</th>
                  <th>Date Incurred</th>
                  <th>Cost Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => {
                  const event = Array.isArray(e.events)
                    ? e.events[0]
                    : e.events;
                  return (
                    <tr key={e.id}>
                      <td className="strong">{e.description}</td>
                      <td>{event?.title || 'Event Booking'}</td>
                      <td className="capitalize">{e.category}</td>
                      <td>{e.vendor_name || '&mdash;'}</td>
                      <td>{dateLabel(e.incurred_at)}</td>
                      <td className="strong">{money(e.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No expenses recorded"
            description="Log ingredient, decor, and operational costs to monitor your true profitability."
          />
        )}
      </Card>
    </>
  );
}
