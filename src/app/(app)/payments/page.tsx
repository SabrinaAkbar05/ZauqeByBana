import { CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { requireOwner } from '@/lib/auth';
import { createPayment } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Empty } from '@/components/UI';
import { money, dateLabel } from '@/lib/utils';

export default async function Payments({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireOwner();
  const [{ data: invoices }, { data: payments }] = await Promise.all([
    db
      .from('invoices')
      .select('id,invoice_no,amount,status,events(title)')
      .neq('status', 'void')
      .order('issued_at', { ascending: false }),
    db
      .from('payments')
      .select(
        'id,invoice_id,amount,method,reference,paid_at,invoices(invoice_no)'
      )
      .order('created_at', { ascending: false }),
  ]);

  const balances = (
    (invoices || []) as Array<{
      id: string;
      invoice_no: string;
      amount: number | string;
      status: string;
      events?: any;
    }>
  ).map((i) => ({
    ...i,
    paid: (payments || [])
      .filter((p) => p.invoice_id === i.id)
      .reduce((s, p) => s + Number(p.amount), 0),
  }));

  const outstanding = balances.filter(
    (i) => Number(i.amount) - i.paid > 0.005
  );

  return (
    <>
      <PageHeading
        title="Client Remittances &amp; Advances"
        description="Record booking advances, installments, and reconciled receipts against invoices."
      />
      <Alert searchParams={await searchParams} />

      {/* Financial Metrics */}
      <div className="metric-grid three">
        <div className="metric-card">
          <span className="metric-label">
            Total Collected <CreditCard size={18} />
          </span>
          <strong className="metric-currency">
            {money((payments || []).reduce((s, p) => s + Number(p.amount), 0))}
          </strong>
          <small>Verified client remittances</small>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            Total Outstanding <Banknote size={18} />
          </span>
          <strong className="metric-currency">
            {money(
              balances.reduce((s, i) => s + Number(i.amount) - i.paid, 0)
            )}
          </strong>
          <small>Receivables to be collected</small>
        </div>

        <div className="metric-card">
          <span className="metric-label">
            Open Invoices <AlertCircle size={18} />
          </span>
          <strong>{outstanding.length}</strong>
          <small>Invoices awaiting full settlement</small>
        </div>
      </div>

      {/* Record Payment */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Record Client Payment</h2>
            <p>Each transaction updates the respective invoice status and outstanding balance</p>
          </div>
        </div>

        {outstanding.length ? (
          <form action={createPayment} className="stack">
            <div className="form-grid cols-3">
              <Field label="Target Invoice *">
                <select name="invoice_id" required>
                  {outstanding.map((i) => {
                    const event = Array.isArray(i.events)
                      ? i.events[0]
                      : i.events;
                    return (
                      <option key={i.id} value={i.id}>
                        {i.invoice_no} &bull; {event?.title} ({money(Number(i.amount) - i.paid)} due)
                      </option>
                    );
                  })}
                </select>
              </Field>

              <Field label="Amount Paid (PKR) *">
                <input
                  name="amount"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                />
              </Field>

              <Field label="Payment Date *">
                <input
                  name="paid_at"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </Field>

              <Field label="Remittance Channel">
                <select name="method">
                  <option>Bank Wire / Online Transfer</option>
                  <option>Cash Receipt</option>
                  <option>Company Cheque</option>
                  <option>Debit / Credit Card</option>
                  <option>Other Remittance</option>
                </select>
              </Field>

              <Field label="Transaction / Receipt Ref">
                <input
                  name="reference"
                  placeholder="e.g. Bank slip # / Cheque #"
                />
              </Field>

              <Field label="Internal Notes">
                <input
                  name="notes"
                  placeholder="Advance payment, second installment..."
                />
              </Field>
            </div>

            <button className="btn btn-primary self-start">
              Confirm &amp; Record Payment
            </button>
          </form>
        ) : (
          <div className="info-line">
            All issued invoices are currently settled in full.
          </div>
        )}
      </Card>

      {/* Payment History Table */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Payment Ledger</h2>
            <p>Immutable audit trail of customer receipts</p>
          </div>
        </div>

        {payments?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice Ref</th>
                  <th>Payment Date</th>
                  <th>Channel</th>
                  <th>Reference</th>
                  <th>Amount Remitted</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const i = Array.isArray(p.invoices)
                    ? p.invoices[0]
                    : p.invoices;
                  return (
                    <tr key={p.id}>
                      <td className="strong">{i?.invoice_no || 'Invoice'}</td>
                      <td>{dateLabel(p.paid_at)}</td>
                      <td>{p.method}</td>
                      <td>{p.reference || '&mdash;'}</td>
                      <td className="strong">{money(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No payments recorded"
            description="Record your first payment receipt against an issued invoice."
          />
        )}
      </Card>
    </>
  );
}
