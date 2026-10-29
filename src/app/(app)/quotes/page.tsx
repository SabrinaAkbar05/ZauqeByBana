import Link from 'next/link';
import { FileDown } from 'lucide-react';
import { requireOwner } from '@/lib/auth';
import { changeQuoteStatus } from '@/app/actions';
import { QuoteBuilder } from '@/components/QuoteBuilder';
import { PageHeading, Card, Alert, Empty, Status } from '@/components/UI';
import { money, dateLabel, calcQuoteTotal } from '@/lib/utils';

export default async function Quotes({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireOwner();
  const [{ data: events }, { data: quotes }, { data: packages }] =
    await Promise.all([
      db
        .from('events')
        .select('id,title,event_date')
        .neq('status', 'cancelled')
        .order('event_date', { ascending: false }),
      db
        .from('quotes')
        .select(
          'id,event_id,status,discount,tax_rate,created_at,events(title),quote_items(description,quantity,unit_price,category)'
        )
        .order('created_at', { ascending: false }),
      db
        .from('packages')
        .select('id,name,category,price_per_person')
        .eq('active', true)
        .order('name'),
    ]);

  return (
    <>
      <PageHeading
        title="Event Proposals &amp; Quotations"
        description="Craft itemized luxury proposals for bespoke catering, decor, and event production."
      />
      <Alert searchParams={await searchParams} />

      {/* Proposal Builder */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Quotation Generator</h2>
            <p>
              Assemble catering, decor, and equipment line items. Instantly export as an executive PDF.
            </p>
          </div>
        </div>
        {events?.length ? (
          <QuoteBuilder
            events={events as any}
            packages={(packages || []) as any}
          />
        ) : (
          <div className="info-line">
            Please create an <Link href="/events">event booking</Link> before generating a quotation proposal.
          </div>
        )}
      </Card>

      {/* Saved Proposals Table */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Proposal Register</h2>
            <p>{quotes?.length || 0} proposals generated</p>
          </div>
        </div>

        {quotes?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event Booking</th>
                  <th>Created</th>
                  <th>Items</th>
                  <th>Grand Total</th>
                  <th>Stage</th>
                  <th>Change Stage</th>
                  <th>Executive PDF</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const lines = q.quote_items || [];
                  const total = calcQuoteTotal(
                    lines,
                    Number(q.discount),
                    Number(q.tax_rate)
                  );
                  const event = Array.isArray(q.events)
                    ? q.events[0]
                    : q.events;
                  return (
                    <tr key={q.id}>
                      <td className="strong">{event?.title || 'Event Booking'}</td>
                      <td>{dateLabel(q.created_at)}</td>
                      <td>{lines.length} items</td>
                      <td className="strong">{money(total)}</td>
                      <td>
                        <Status value={q.status} />
                      </td>
                      <td>
                        <form action={changeQuoteStatus} className="inline-form">
                          <input type="hidden" name="id" value={q.id} />
                          <select
                            aria-label="Quote status"
                            name="status"
                            defaultValue={q.status}
                          >
                            {['draft', 'sent', 'accepted', 'rejected'].map(
                              (s) => (
                                <option key={s} value={s}>
                                  {s.toUpperCase()}
                                </option>
                              )
                            )}
                          </select>
                          <button className="btn btn-small" type="submit">
                            Save
                          </button>
                        </form>
                      </td>
                      <td>
                        <a
                          className="text-link"
                          href={`/api/quotes/${q.id}/pdf`}
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
            title="No proposals recorded"
            description="Use the builder above to generate a client proposal."
          />
        )}
      </Card>
    </>
  );
}
