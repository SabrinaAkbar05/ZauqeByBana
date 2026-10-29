'use client';

import { useState } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { createQuote } from '@/app/actions';
import { money } from '@/lib/utils';

type Line = {
  category: 'catering' | 'decoration' | 'equipment' | 'staffing' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
};

const newLine = (): Line => ({
  category: 'catering',
  description: '',
  quantity: 1,
  unit_price: 0,
});

export function QuoteBuilder({
  events,
  packages,
}: {
  events: { id: string; title: string; event_date: string }[];
  packages: {
    id: string;
    name: string;
    category: Line['category'];
    price_per_person: number;
  }[];
}) {
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  function update(index: number, patch: Partial<Line>) {
    setLines((old) =>
      old.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  const subtotal = lines.reduce(
    (s, l) => s + Number(l.quantity || 0) * Number(l.unit_price || 0),
    0
  );
  const total = Math.max(0, subtotal - discount) * (1 + tax / 100);

  return (
    <form action={createQuote} className="stack">
      <div className="form-grid">
        <label className="field">
          <span>Event Booking *</span>
          <select name="event_id" required>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} — {e.event_date}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Quotation Notes / Terms</span>
          <input
            name="notes"
            placeholder="Includes catering, bespoke floral styling, executive service..."
          />
        </label>
      </div>

      {packages.length > 0 && (
        <div className="catalog-add">
          <label className="field">
            <span>Add from Curated Catalog</span>
            <select
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
            >
              <option value="">Select a saved package...</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — {money(p.price_per_person)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!selectedPackage}
            onClick={() => {
              const p = packages.find((x) => x.id === selectedPackage);
              if (p) {
                setLines((old) => [
                  ...(old.length === 1 && !old[0].description ? [] : old),
                  {
                    category: p.category,
                    description: p.name,
                    quantity: 1,
                    unit_price: Number(p.price_per_person),
                  },
                ]);
                setSelectedPackage('');
              }
            }}
          >
            Add to Quote
          </button>
        </div>
      )}

      <div className="section-label">Itemized Services &amp; Inclusions</div>

      {lines.map((line, i) => {
        const lineTotal = Number(line.quantity || 0) * Number(line.unit_price || 0);
        return (
          <div className="quote-line" key={i}>
            <label className="field">
              <span>Category</span>
              <select
                value={line.category}
                onChange={(e) =>
                  update(i, { category: e.target.value as Line['category'] })
                }
              >
                {['catering', 'decoration', 'equipment', 'staffing', 'other'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="field line-description">
              <span>Description *</span>
              <input
                required
                minLength={2}
                value={line.description}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="e.g. Royal Mughlai Buffet / Stage Floral Decor"
              />
            </label>

            <div className="flex gap-2 w-full md:w-auto">
              <label className="field field-small flex-1">
                <span>Qty</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={line.quantity}
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                />
              </label>

              <label className="field field-small flex-1">
                <span>Unit Price (PKR)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={line.unit_price}
                  onChange={(e) =>
                    update(i, { unit_price: Number(e.target.value) })
                  }
                />
              </label>
            </div>

            <div className="flex items-center gap-3 self-end pb-1">
              <span className="text-xs font-semibold text-sub whitespace-nowrap min-w-[70px] text-right">
                {money(lineTotal)}
              </span>
              <button
                className="icon-btn danger"
                type="button"
                aria-label="Remove item"
                disabled={lines.length <= 1}
                onClick={() => setLines((old) => old.filter((_, j) => i !== j))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        );
      })}

      <button
        className="btn btn-ghost add-line"
        type="button"
        onClick={() => setLines((old) => [...old, newLine()])}
      >
        <Plus size={16} /> Add line item
      </button>

      <div className="quote-footer">
        <div className="form-grid compact">
          <label className="field">
            <span>Special Discount (PKR)</span>
            <input
              name="discount"
              type="number"
              min="0"
              max={subtotal}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Tax Rate (%)</span>
            <input
              name="tax_rate"
              type="number"
              min="0"
              max={100}
              step="0.01"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="quote-totals">
          <span>
            Services Subtotal <strong>{money(subtotal)}</strong>
          </span>
          <span>
            Discount Applied <strong>-{money(discount)}</strong>
          </span>
          <span>
            Applicable Tax <strong>{tax}%</strong>
          </span>
          <span className="grand-total">
            Total Quotation <strong>{money(total)}</strong>
          </span>
        </div>
      </div>

      <input type="hidden" name="items_json" value={JSON.stringify(lines)} />

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!events.length || total <= 0 || (subtotal > 0 && discount >= subtotal)}
      >
        <span>Generate &amp; Save Quotation</span>
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
