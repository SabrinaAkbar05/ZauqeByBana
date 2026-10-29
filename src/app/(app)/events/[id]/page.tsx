import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Banknote, CreditCard, TrendingUp } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { updateEvent } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Status } from '@/components/UI';
import { money, customerName } from '@/lib/utils';

export default async function EventDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { db, profile } = await requireUser();
  const { data: e } = await db
    .from('events')
    .select('*,customers(full_name,phone,email)')
    .eq('id', id)
    .maybeSingle();

  if (!e) notFound();

  let billed = 0,
    paid = 0,
    expense = 0;
  if (profile.role === 'owner') {
    const [{ data: inv }, { data: ex }] = await Promise.all([
      db.from('invoices').select('id,amount,status').eq('event_id', id),
      db.from('expenses').select('amount').eq('event_id', id),
    ]);
    const activeInv = (inv || []).filter((i) => i.status !== 'void');
    const invIds = activeInv.map((i) => i.id);
    billed = activeInv.reduce((s, i) => s + Number(i.amount), 0);
    expense = (ex || []).reduce((s, x) => s + Number(x.amount), 0);
    if (invIds.length) {
      const { data: payments } = await db
        .from('payments')
        .select('amount')
        .in('invoice_id', invIds);
      paid = (payments || []).reduce((s, x) => s + Number(x.amount), 0);
    }
  }

  return (
    <>
      <PageHeading
        title={e.title}
        description={`${e.event_type} &bull; ${customerName(e.customers)}`}
        action={
          <Link href="/events" className="btn btn-ghost">
            <ArrowLeft size={16} /> <span>Back to All Events</span>
          </Link>
        }
      />
      <Alert searchParams={await searchParams} />

      {profile.role === 'owner' && (
        <div className="metric-grid three">
          <div className="metric-card">
            <span className="metric-label">
              Total Invoiced <Banknote size={18} />
            </span>
            <strong className="metric-currency">{money(billed)}</strong>
            <small>Active invoice billings</small>
          </div>
          <div className="metric-card">
            <span className="metric-label">
              Collected Payments <CreditCard size={18} />
            </span>
            <strong className="metric-currency">{money(paid)}</strong>
            <small>Client advances received</small>
          </div>
          <div className="metric-card">
            <span className="metric-label">
              Estimated Gross Margin <TrendingUp size={18} />
            </span>
            <strong className="metric-currency">{money(billed - expense)}</strong>
            <small>Net after vendor expenses</small>
          </div>
        </div>
      )}

      <div className="two-col">
        <Card>
          <h2>Manage Event Specifications</h2>
          <form action={updateEvent} className="stack spaced">
            <input type="hidden" name="id" value={id} />
            <div className="form-grid">
              <Field label="Event Title">
                <input name="title" required defaultValue={e.title} />
              </Field>
              <Field label="Occasion / Type">
                <input name="event_type" required defaultValue={e.event_type} />
              </Field>
              <Field label="Event Date">
                <input
                  name="event_date"
                  type="date"
                  required
                  defaultValue={e.event_date}
                />
              </Field>
              <Field label="Guest Count">
                <input
                  name="guest_count"
                  type="number"
                  min={1}
                  required
                  defaultValue={e.guest_count}
                />
              </Field>
              <Field label="Start Time">
                <input
                  name="start_time"
                  type="time"
                  defaultValue={e.start_time || ''}
                />
              </Field>
              <Field label="End Time">
                <input
                  name="end_time"
                  type="time"
                  defaultValue={e.end_time || ''}
                />
              </Field>
              <Field label="Venue Location">
                <input name="venue" required defaultValue={e.venue} />
              </Field>
              <Field label="Event Status">
                <select name="status" defaultValue={e.status}>
                  {[
                    'inquiry',
                    'quoted',
                    'confirmed',
                    'in_progress',
                    'completed',
                    'cancelled',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Executive Notes &amp; Special Arrangements">
              <textarea name="notes" rows={4} defaultValue={e.notes || ''} />
            </Field>
            <button className="btn btn-primary self-start">
              Save Event Updates
            </button>
          </form>
        </Card>

        <Card>
          <h2>Event Dossier</h2>
          <div className="detail-list">
            <div>
              <span>Client</span>
              <strong>{customerName(e.customers)}</strong>
            </div>
            <div>
              <span>Guest Estimate</span>
              <strong>{e.guest_count} attendees</strong>
            </div>
            <div>
              <span>Venue</span>
              <strong>{e.venue}</strong>
            </div>
            <div>
              <span>Current Status</span>
              <Status value={e.status} />
            </div>
          </div>

          <div className="section-label">Production Workflow</div>
          <p className="subtle text-xs leading-relaxed">
            Generate itemized proposals, lock in catering menus, issue formal invoices,
            and monitor vendor disbursements.
          </p>

          {profile.role === 'owner' && (
            <div className="quick-links mt-4">
              <Link href="/quotes">Manage Quotations &amp; Proposals &rarr;</Link>
              <Link href="/invoices">Invoices &amp; Balances &rarr;</Link>
              <Link href="/expenses">Record Vendor Expenses &rarr;</Link>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
