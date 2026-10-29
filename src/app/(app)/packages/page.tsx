import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { createPackage } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Empty } from '@/components/UI';
import { money } from '@/lib/utils';

export default async function Packages({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db, profile } = await requireUser();
  const { data: packages } = await db
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeading
        title="Curated Service Packages"
        description="Bespoke catering menus, luxury decor concepts, and event service packages."
      />
      <Alert searchParams={await searchParams} />

      {profile.role === 'owner' && (
        <Card>
          <div className="card-header">
            <div>
              <h2>Create Service Offering</h2>
              <p>Define reusable menu or decor packages for proposal planning</p>
            </div>
          </div>
          <form className="stack" action={createPackage}>
            <div className="form-grid cols-3">
              <Field label="Package Title *">
                <input
                  required
                  name="name"
                  placeholder="e.g. Signature Royal Wedding Feast"
                />
              </Field>

              <Field label="Discipline Category *">
                <select name="category">
                  {['catering', 'decoration', 'equipment', 'staffing', 'other'].map(
                    (c) => (
                      <option value={c} key={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Rate per Person / Unit (PKR) *">
                <input
                  required
                  name="price_per_person"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                />
              </Field>
            </div>

            <Field label="Inclusions &amp; Description">
              <textarea
                name="description"
                rows={2}
                placeholder="Dishes, live cooking setups, floral arrangements, cutlery specifications..."
              />
            </Field>

            <button className="btn btn-primary self-start">
              Add to Service Catalog
            </button>
          </form>
        </Card>
      )}

      <Card>
        <div className="card-header">
          <div>
            <h2>Service Catalog</h2>
            <p>{packages?.length || 0} curated offerings ready for proposals</p>
          </div>
        </div>

        {packages?.length ? (
          <div className="package-grid">
            {packages.map((p) => (
              <Link
                href={`/packages/${p.id}`}
                className="package-card"
                key={p.id}
              >
                <div className="package-icon">
                  <Sparkles size={18} />
                </div>
                <span className="eyebrow">{p.category}</span>
                <h3>{p.name}</h3>
                <p>{p.description || 'Custom service package'}</p>
                <strong>{money(p.price_per_person)}</strong>
                <small>
                  Per person / unit &bull; {p.active ? 'Active' : 'Archived'}
                </small>
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="No service packages yet"
            description="Add your signature catering or decor offerings to build a reusable catalog."
          />
        )}
      </Card>
    </>
  );
}
