import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createCustomer } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Empty } from '@/components/UI';

export default async function Customers({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireUser();
  const { data: customers } = await db
    .from('customers')
    .select('id,full_name,phone,email,created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeading
        title="Client Portfolio"
        description="Maintain unified client profiles, contact histories, and event relationships."
      />
      <Alert searchParams={await searchParams} />

      <div className="two-col">
        {/* Registration Form */}
        <Card>
          <div className="card-header">
            <div>
              <h2>Register New Client</h2>
              <p>Add client details for event assignments and quotation generation</p>
            </div>
          </div>
          <form action={createCustomer} className="stack">
            <Field label="Client Full Name *">
              <input
                name="full_name"
                placeholder="e.g. Begum Ayesha Khan"
                required
                minLength={2}
              />
            </Field>

            <Field label="Phone Number *">
              <input
                name="phone"
                placeholder="+92 300 1234567"
                required
                minLength={6}
              />
            </Field>

            <Field label="Email Address">
              <input
                name="email"
                type="email"
                placeholder="client@luxuryevents.pk"
              />
            </Field>

            <Field label="Postal / City Address">
              <input name="address" placeholder="DHA Phase 6, Karachi" />
            </Field>

            <Field label="Client Preferences &amp; Notes">
              <textarea
                name="notes"
                rows={3}
                placeholder="Preferred catering tastes, signature floral preferences, family contacts..."
              />
            </Field>

            <button type="submit" className="btn btn-primary self-start">
              Save Client Profile
            </button>
          </form>
        </Card>

        {/* Directory List */}
        <Card>
          <div className="card-header">
            <div>
              <h2>Client Directory</h2>
              <p>{customers?.length || 0} registered client profiles</p>
            </div>
          </div>

          {customers?.length ? (
            <div className="directory">
              {customers.map((c) => (
                <Link
                  className="directory-item"
                  key={c.id}
                  href={`/customers/${c.id}`}
                >
                  <span className="avatar">
                    {(c.full_name || 'C')[0]?.toUpperCase()}
                  </span>
                  <div>
                    <strong>{c.full_name}</strong>
                    <small>
                      {c.phone} {c.email ? ` &bull; ${c.email}` : ''}
                    </small>
                  </div>
                  <span className="chevron">&rarr;</span>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="No clients registered"
              description="Register your first client to connect event bookings and quotations."
            />
          )}
        </Card>
      </div>
    </>
  );
}
