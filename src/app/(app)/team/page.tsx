import { requireOwner } from '@/lib/auth';
import { createStaff, setStaffStatus } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Empty, Status } from '@/components/UI';

export default async function Team({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireOwner();
  const { data: profiles } = await db
    .from('profiles')
    .select('id,email,full_name,role,status,created_at')
    .order('created_at', { ascending: true });

  return (
    <>
      <PageHeading
        title="Executive Team &amp; Access Governance"
        description="Provision staff credentials, manage roles, and safeguard proprietary financial data."
      />
      <Alert searchParams={await searchParams} />

      {/* Create Staff */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Provision Staff Account</h2>
            <p>Assign credentials to authorized event coordinators and banquet staff</p>
          </div>
        </div>

        <form action={createStaff} className="form-grid align-end">
          <Field label="Staff Member Name *">
            <input
              name="full_name"
              minLength={2}
              required
              placeholder="e.g. Bilal Ahmed"
            />
          </Field>

          <Field label="Corporate Email *">
            <input
              name="email"
              type="email"
              required
              placeholder="staff@zauqe.com"
            />
          </Field>

          <Field label="Temporary Password *">
            <input
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
              placeholder="At least 12 characters"
            />
          </Field>

          <button className="btn btn-primary">
            Provision Account
          </button>
        </form>

        <p className="hint mt-3">
          Staff accounts have role-based restrictions: they can manage client dossiers and bookings,
          but cannot inspect contract profits, quotes, payments, or owner settings.
        </p>
      </Card>

      {/* Members Directory */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Authorized Workspace Personnel</h2>
            <p>{profiles?.length || 0} active team members</p>
          </div>
        </div>

        {profiles?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Governance Role</th>
                  <th>Account Status</th>
                  <th>Access Control</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="strong">{p.full_name || 'Unnamed Personnel'}</td>
                    <td>{p.email}</td>
                    <td className="capitalize font-medium">{p.role}</td>
                    <td>
                      <Status value={p.status} />
                    </td>
                    <td>
                      {p.role === 'staff' ? (
                        <form action={setStaffStatus} className="inline-form">
                          <input type="hidden" name="id" value={p.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={p.status === 'active' ? 'disabled' : 'active'}
                          />
                          <button className="btn btn-small" type="submit">
                            {p.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </form>
                      ) : (
                        <span className="subtle text-xs font-semibold uppercase tracking-wider text-[#C9A46A]">
                          Principal Owner
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No team members found" />
        )}
      </Card>
    </>
  );
}
