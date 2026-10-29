import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireOwner } from '@/lib/auth';
import { updatePackage } from '@/app/actions';
import { PageHeading, Card, Field, Alert } from '@/components/UI';

export default async function PackageDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { id } = await params;
  const { db } = await requireOwner();
  const { data: p } = await db
    .from('packages')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!p) notFound();

  return (
    <>
      <PageHeading
        title={p.name}
        description="Refine package details, per-unit pricing, or archive this offering."
        action={
          <Link href="/packages" className="btn btn-ghost">
            <ArrowLeft size={16} /> <span>Back to Catalog</span>
          </Link>
        }
      />
      <Alert searchParams={await searchParams} />

      <Card className="narrow-card">
        <form action={updatePackage} className="stack">
          <input type="hidden" name="id" value={id} />

          <Field label="Package Title">
            <input name="name" required defaultValue={p.name} />
          </Field>

          <Field label="Discipline Category">
            <select name="category" defaultValue={p.category}>
              {['catering', 'decoration', 'equipment', 'staffing', 'other'].map(
                (c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                )
              )}
            </select>
          </Field>

          <Field label="Price per Person / Unit (PKR)">
            <input
              name="price_per_person"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={p.price_per_person}
            />
          </Field>

          <Field label="Detailed Inclusions &amp; Specifications">
            <textarea
              name="description"
              rows={4}
              defaultValue={p.description || ''}
            />
          </Field>

          <Field label="Catalog Availability">
            <select name="active" defaultValue={String(p.active)}>
              <option value="true">Active — Available for Proposals</option>
              <option value="false">Archived — Hidden from Catalog</option>
            </select>
          </Field>

          <button className="btn btn-primary self-start">
            Save Package Updates
          </button>
        </form>
      </Card>
    </>
  );
}
