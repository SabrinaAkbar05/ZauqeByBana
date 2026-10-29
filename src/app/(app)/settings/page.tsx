import { requireOwner } from '@/lib/auth';
import { updateBusiness } from '@/app/actions';
import { PageHeading, Card, Field, Alert } from '@/components/UI';
import { BrandLogo } from '@/components/BrandLogo';

export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireOwner();
  const { data: business } = await db
    .from('businesses')
    .select('*')
    .limit(1)
    .single();

  return (
    <>
      <PageHeading
        title="Enterprise Brand &amp; Company Settings"
        description="Configure corporate information, official headers, and document identifiers for client-facing exports."
      />
      <Alert searchParams={await searchParams} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="card-header">
              <div>
                <h2>Company Identity &amp; Letterhead</h2>
                <p>These official credentials will be rendered on generated PDF proposals and invoices</p>
              </div>
            </div>

            <form action={updateBusiness} className="stack">
              <Field label="Brand / Registered Business Name *">
                <input
                  name="name"
                  defaultValue={business?.name || 'ZAUQÉ BY BANA'}
                  required
                />
              </Field>

              <div className="form-grid">
                <Field label="Direct Inquiries Telephone">
                  <input
                    name="phone"
                    defaultValue={business?.phone || '+92 300 0000000'}
                    placeholder="+92 300 1234567"
                  />
                </Field>

                <Field label="Official Corporate Email">
                  <input
                    name="email"
                    type="email"
                    defaultValue={business?.email || 'concierge@zauqe.com'}
                    placeholder="concierge@zauqe.com"
                  />
                </Field>
              </div>

              <Field label="Boutique &amp; Kitchen Atelier Address">
                <textarea
                  name="address"
                  rows={3}
                  defaultValue={
                    business?.address || 'Main Boulevard, Gulberg / DHA, Pakistan'
                  }
                />
              </Field>

              <div className="info-line">
                Base Operating Currency: <strong>PKR (Pakistani Rupee)</strong>.
              </div>

              <button type="submit" className="btn btn-primary self-start">
                Save Corporate Profile
              </button>
            </form>
          </Card>
        </div>

        {/* Brand Showcase Card */}
        <div>
          <Card className="bg-[#0B0B0C] text-white border-[rgba(201,164,106,0.25)]">
            <div className="flex flex-col items-center text-center p-4">
              <BrandLogo size="lg" showText={true} tagline={true} />

              <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)] w-full text-left text-xs text-[#A8A29A] space-y-2">
                <div className="flex justify-between">
                  <span>Brand Identity:</span>
                  <strong className="text-white">ZAUQÉ BY BANA</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tagline:</span>
                  <strong className="text-[#C9A46A]">Events &bull; Catering &bull; Experiences</strong>
                </div>
                <div className="flex justify-between">
                  <span>Heritage:</span>
                  <strong className="text-white">EST. 1960s</strong>
                </div>
                <div className="flex justify-between">
                  <span>Emblem Assets:</span>
                  <strong className="text-white">/public/zauqe-logo.png</strong>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
