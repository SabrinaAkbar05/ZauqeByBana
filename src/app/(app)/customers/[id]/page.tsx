import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { updateCustomer } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Status } from '@/components/UI';
import { dateLabel } from '@/lib/utils';

export default async function CustomerDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { db } = await requireUser();
  const [{ data: c }, { data: events }] = await Promise.all([
    db.from('customers').select('*').eq('id', id).maybeSingle(),
    db
      .from('events')
      .select('id,title,event_date,status')
      .eq('customer_id', id)
      .order('event_date', { ascending: false }),
  ]);

  if (!c) notFound();

  return (
    <>
      <PageHeading
        title={c.full_name}
        description="Client dossier and booking history"
        action={
          <Link href="/customers" className="btn btn-ghost">
            <ArrowLeft size={16} /> <span>Back to Clients</span>
          </Link>
        }
      />
      <Alert searchParams={await searchParams} />

      <div className="two-col">
        <Card>
          <h2>Client Profile Details</h2>
          <form action={updateCustomer} className="stack spaced">
            <input type="hidden" name="id" value={id} />
            <Field label="Full Name">
              <input name="full_name" required defaultValue={c.full_name} />
            </Field>
            <Field label="Phone Contact">
              <input name="phone" required defaultValue={c.phone} />
            </Field>
            <Field label="Email Address">
              <input name="email" type="email" defaultValue={c.email || ''} />
            </Field>
            <Field label="Primary Address">
              <input name="address" defaultValue={c.address || ''} />
            </Field>
            <Field label="Client Notes &amp; Special Directives">
              <textarea name="notes" rows={4} defaultValue={c.notes || ''} />
            </Field>
            <button type="submit" className="btn btn-primary self-start">
              Update Client Information
            </button>
          </form>
        </Card>

        <Card>
          <h2>Associated Bookings</h2>
          <div className="directory spaced">
            {events?.length ? (
              events.map((e) => (
                <Link
                  href={`/events/${e.id}`}
                  key={e.id}
                  className="directory-item"
                >
                  <div>
                    <strong>{e.title}</strong>
                    <small>{dateLabel(e.event_date)}</small>
                  </div>
                  <Status value={e.status} />
                </Link>
              ))
            ) : (
              <p className="subtle text-xs">
                No event bookings currently registered for this client.
              </p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
