import { FileDown } from 'lucide-react';
import { requireOwner } from '@/lib/auth';
import { createInvoice } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Empty, Status } from '@/components/UI';
import { money, dateLabel } from '@/lib/utils';

export default async function Invoices({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireOwner();
  const [{ data: quotes }, { data: invoices }] = await Promise.all([
    db
      .from('quotes')
      .select('id,status,events(title)')
      .eq('status', 'accepted'),
    db
      .from('invoices')
      .select(
        'id,invoice_no,amount,due_date,status,issued_at,quote_id,events(title)'
      )
      .order('issued_at', { ascending: false }),
  ]);

  const invoicedIds = new Set((invoices || []).map((i) => i.quote_id));
  const eligible = (quotes || []).filter((q) => !invoicedIds.has(q.id));

  return (
    <>
      <PageHeading
        title="Client Invoices &amp; Billing"
        description="Issue formal invoices from approved proposals, establish due dates, and track balances."
      />
      <Alert searchParams={await searchParams} />

      {/* Invoice Generator */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Issue Formal Invoice</h2>
            <p>
              Invoices are generated strictly from accepted proposals to maintain audit integrity.
            </p>
          </div>
        </div>

        {eligible.length ? (
          <form action={createInvoice} className="form-grid align-end">
            <Field label="Accepted Client Proposal *">
              <select name="quote_id" required>
                {eligible.map((q) => {
                  const event = Array.isArray(q.events)
                    ? q.events[0]
                    : q.events;
                  return (
                    <option value={q.id} key={q.id}>
                      {event?.title || 'Event'} &bull; Proposal #{q.id.slice(0, 8).toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field label="Payment Due Date">
              <input type="date" name="due_date" />
            </Field>

            <button className="btn btn-primary">
              Issue Official Invoice
            </button>
          </form>
        ) : (
          <p className="info-line">
            No unbilled accepted proposals. Transition a proposal to &ldquo;Accepted&rdquo; in Quotations to issue an invoice.
          </p>
        )}
      </Card>

      {/* Invoices Table */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Invoice Register</h2>
            <p>{invoices?.length || 0} formal invoices issued</p>
          </div>
        </div>

        {invoices?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Event Booking</th>
                  <th>Date Issued</th>
                  <th>Due Date</th>
                  <th>Total Billed</th>
                  <th>Payment Status</th>
                  <th>Executive PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => {
                  const event = Array.isArray(i.events)
                    ? i.events[0]
                    : i.events;
                  return (
                    <tr key={i.id}>
                      <td className="strong">{i.invoice_no}</td>
                      <td>{event?.title || 'Event Booking'}</td>
                      <td>{dateLabel(i.issued_at)}</td>
                      <td>{dateLabel(i.due_date)}</td>
                      <td className="strong">{money(i.amount)}</td>
                      <td>
                        <Status value={i.status} />
                      </td>
                      <td>
                        <a
                          className="text-link"
                          href={`/api/invoices/${i.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileDown size={14} /> <span>Export PDF</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No invoices issued yet"
            description="Convert an accepted quotation into an official invoice to record client payments."
          />
        )}
      </Card>
    </>
  );
}
