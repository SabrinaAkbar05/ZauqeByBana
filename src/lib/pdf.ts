import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { dataClient } from '@/lib/firebase/data';
import { calcQuoteTotal, customerName } from '@/lib/utils';

// Official ZAUQÉ BY BANA luxury PDF palette
const ink = rgb(0.07, 0.07, 0.08); // Luxury Black
const muted = rgb(0.47, 0.45, 0.42); // Warm Charcoal Muted
const gold = rgb(0.79, 0.64, 0.42); // Antique Gold (#C9A46A)
const darkGold = rgb(0.58, 0.45, 0.26);
const rule = rgb(0.88, 0.85, 0.80); // Delicate Ivory Rule
const ivorySurface = rgb(0.97, 0.95, 0.92);

const clean = (value: unknown) => String(value ?? '').replace(/[^\x20-\x7E]/g, '-');
const fmt = (value: number | string) =>
  `PKR ${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function write(
  page: PDFPage,
  font: PDFFont,
  text: unknown,
  x: number,
  y: number,
  size = 10,
  color = ink
) {
  page.drawText(clean(text).slice(0, 110), { x, y, size, font, color });
}

function right(
  page: PDFPage,
  font: PDFFont,
  text: string,
  rightX: number,
  y: number,
  size = 10,
  color = ink
) {
  const t = clean(text);
  write(page, font, t, rightX - font.widthOfTextAtSize(t, size), y, size, color);
}

function line(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: 44, y },
    end: { x: 551, y },
    thickness: 1,
    color: rule,
  });
}

export async function generatePdf(
  kind: 'quote' | 'invoice',
  id: string
): Promise<Uint8Array> {
  const db = dataClient();
  const table = kind === 'quote' ? 'quotes' : 'invoices';
  const { data: record, error } = await db
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  if (error || !record) throw new Error('Document not found');
  const quoteId = kind === 'quote' ? id : record.quote_id;

  const [{ data: quote }, { data: items }, { data: event }, { data: business }] =
    await Promise.all([
      db.from('quotes').select('*').eq('id', quoteId).single(),
      db
        .from('quote_items')
        .select('category,description,quantity,unit_price')
        .eq('quote_id', quoteId),
      db
        .from('events')
        .select('title,event_date,venue,guest_count,customer_id')
        .eq('id', record.event_id)
        .single(),
      db.from('businesses').select('name,phone,email,address').limit(1).single(),
    ]);

  if (!quote || !event) throw new Error('Related event or quote missing');
  const { data: customer } = await db
    .from('customers')
    .select('full_name,phone,email')
    .eq('id', event.customer_id)
    .single();

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Load and embed official ZAUQÉ BY BANA logo
  let logoImage: any = null;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'zauqe-logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdf.embedPng(logoBytes);
    }
  } catch (logoErr) {
    console.warn('PDF logo load notice:', logoErr);
  }

  let page = pdf.addPage([595.28, 841.89]);
  let y = 785;

  function nextPage() {
    page = pdf.addPage([595.28, 841.89]);
    y = 793;
  }

  // Draw Top Letterhead with Logo
  if (logoImage) {
    page.drawImage(logoImage, {
      x: 44,
      y: y - 12,
      width: 58,
      height: 58,
    });
    write(page, bold, 'ZAUQÉ BY BANA', 114, y + 26, 17, darkGold);
    write(page, regular, 'Events • Catering • Experiences • EST. 1960s', 114, y + 13, 8.5, muted);
    write(page, regular, business?.address || 'Main Boulevard, Gulberg / DHA, Pakistan', 114, y + 1, 8.5, muted);
    write(
      page,
      regular,
      [business?.phone || '+92 300 0000000', business?.email || 'concierge@zauqe.com']
        .filter(Boolean)
        .join('  |  '),
      114,
      y - 11,
      8.5,
      muted
    );
  } else {
    write(page, bold, 'ZAUQÉ BY BANA', 44, y + 20, 19, darkGold);
    write(page, regular, 'Events • Catering • Experiences • EST. 1960s', 44, y + 6, 9, muted);
    write(page, regular, business?.address || '', 44, y - 6, 8.5, muted);
    write(
      page,
      regular,
      [business?.phone, business?.email].filter(Boolean).join('  |  '),
      44,
      y - 18,
      8.5,
      muted
    );
  }

  y -= 38;
  line(page, y);
  y -= 38;

  // Title Block
  write(
    page,
    bold,
    kind === 'quote' ? 'EVENT PROPOSAL & QUOTATION' : 'OFFICIAL EVENT INVOICE',
    44,
    y,
    18,
    ink
  );
  right(
    page,
    bold,
    kind === 'quote'
      ? `PROPOSAL #${id.slice(0, 8).toUpperCase()}`
      : record.invoice_no,
    548,
    y + 2,
    10,
    darkGold
  );

  y -= 22;
  write(
    page,
    regular,
    `Date Issued: ${new Date(
      kind === 'quote' ? quote.created_at : record.issued_at
    ).toLocaleDateString('en-GB')}`,
    44,
    y,
    8.5,
    muted
  );
  if (kind === 'invoice') {
    right(page, regular, `Payment Due: ${record.due_date || 'On receipt'}`, 548, y, 8.5, muted);
  }

  // Bill To & Event Details
  y -= 38;
  write(page, bold, 'CLIENT INFORMATION', 44, y, 9.5, darkGold);
  write(page, bold, 'EVENT SPECIFICATIONS', 314, y, 9.5, darkGold);

  y -= 18;
  write(page, bold, customer?.full_name || 'Client', 44, y, 11);
  write(page, bold, event.title, 314, y, 11);

  y -= 16;
  write(page, regular, customer?.phone || '', 44, y, 9);
  write(page, regular, `Scheduled Date: ${event.event_date}`, 314, y, 9);

  y -= 16;
  write(page, regular, customer?.email || '', 44, y, 8.5, muted);
  write(page, regular, `Guest Estimate: ${event.guest_count} Attendees`, 314, y, 9);

  y -= 16;
  write(page, regular, `Venue: ${event.venue}`, 314, y, 8.5, muted);

  // Line Items Table Header
  y -= 36;
  page.drawRectangle({
    x: 44,
    y: y - 8,
    width: 507,
    height: 28,
    color: ivorySurface,
  });

  write(page, bold, 'SERVICE DESCRIPTION', 54, y + 2, 8.5, darkGold);
  right(page, bold, 'QTY', 387, y + 2, 8.5, darkGold);
  right(page, bold, 'UNIT RATE', 475, y + 2, 8.5, darkGold);
  right(page, bold, 'AMOUNT', 542, y + 2, 8.5, darkGold);
  y -= 28;

  for (const item of items || []) {
    if (y < 130) {
      nextPage();
    }
    const desc = clean(item.description);
    let fragments = [desc];
    if (regular.widthOfTextAtSize(desc, 9) > 235) {
      let words = desc.split(' '),
        running = '',
        frags: string[] = [];
      for (const word of words) {
        if (regular.widthOfTextAtSize((running + ' ' + word).trim(), 9) > 235 && running) {
          frags.push(running);
          running = word;
        } else running = (running + ' ' + word).trim();
      }
      if (running) frags.push(running);
      fragments = frags;
    }

    write(page, bold, fragments[0] || '', 54, y, 9);
    for (let j = 1; j < fragments.length; j++) {
      y -= 13;
      write(page, regular, fragments[j], 54, y, 9);
    }
    write(page, regular, clean(item.category).toUpperCase(), 54, y - 12, 7.5, muted);
    right(page, regular, String(item.quantity), 387, y, 9);
    right(page, regular, fmt(item.unit_price), 475, y, 9);
    right(page, bold, fmt(Number(item.quantity) * Number(item.unit_price)), 542, y, 9);
    y -= 32;
    line(page, y + 7);
  }

  if (y < 200) nextPage();
  y -= 14;

  const subtotal = (items || []).reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const total = calcQuoteTotal(
    (items || []) as any,
    Number(quote.discount),
    Number(quote.tax_rate)
  );

  right(page, regular, 'Services Subtotal', 458, y, 9);
  right(page, bold, fmt(subtotal), 542, y, 9);
  y -= 20;

  right(page, regular, 'Courtesy Discount', 458, y, 9);
  right(page, regular, fmt(quote.discount), 542, y, 9);
  y -= 20;

  right(page, regular, `Applicable Tax (${Number(quote.tax_rate)}%)`, 458, y, 9);
  right(
    page,
    regular,
    fmt(((subtotal - Number(quote.discount)) * Number(quote.tax_rate)) / 100),
    542,
    y,
    9
  );
  y -= 26;

  page.drawRectangle({
    x: 318,
    y: y - 11,
    width: 233,
    height: 36,
    color: ivorySurface,
  });
  write(page, bold, 'GRAND TOTAL', 328, y + 1, 11, darkGold);
  right(page, bold, fmt(total), 541, y + 1, 11, darkGold);

  if (kind === 'invoice') {
    const { data: payments } = await db
      .from('payments')
      .select('amount')
      .eq('invoice_id', id);
    const paid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    y -= 38;
    right(page, regular, `Advances Remitted: ${fmt(paid)}`, 540, y, 9.5);
    y -= 18;
    right(page, bold, `Net Balance Due: ${fmt(Number(record.amount) - paid)}`, 540, y, 10, darkGold);
  }

  y -= 48;
  if (y < 65) nextPage();
  write(
    page,
    regular,
    clean(
      quote.notes ||
        'Thank you for entrusting ZAUQÉ BY BANA with your signature celebration. We look forward to creating an unforgettable experience.'
    ),
    44,
    y,
    8.5,
    muted
  );

  const pages = pdf.getPages();
  pages.forEach((pg, i) => {
    write(
      pg,
      regular,
      `${kind === 'quote' ? 'EVENT PROPOSAL' : 'EVENT INVOICE'}  |  ZAUQÉ BY BANA`,
      44,
      35,
      8,
      muted
    );
    right(pg, regular, `Page ${i + 1} of ${pages.length}`, 548, 35, 8, muted);
  });

  return pdf.save();
}
