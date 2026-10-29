import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createEvent } from '@/app/actions';
import { PageHeading, Card, Field, Alert, Empty, Status } from '@/components/UI';
import { dateLabel, customerName } from '@/lib/utils';
import { EventsCalendar } from '@/components/EventsCalendar';

export default async function Events({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { db } = await requireUser();
  const [{ data: events }, { data: customers }] = await Promise.all([
    db
      .from('events')
      .select(
        'id,title,event_type,event_date,venue,guest_count,status,customers(full_name)'
      )
      .order('event_date', { ascending: false }),
    db.from('customers').select('id,full_name').order('full_name'),
  ]);

  return (
    <>
      <PageHeading
        title="Event Bookings &amp; Experiences"
        description="Oversee every signature gathering, from initial consultation to flawless execution."
      />
      <Alert searchParams={await searchParams} />

      {/* Booking Form */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Schedule New Event Booking</h2>
            <p>Assign client, venue, guest estimates, and schedule specifications</p>
          </div>
        </div>

        {customers?.length ? (
          <form action={createEvent} className="stack">
            <div className="form-grid cols-3">
              <Field label="Client Profile *">
                <select name="customer_id" required>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Event Title *">
                <input
                  name="title"
                  required
                  placeholder="e.g. Royal Barat Reception"
                />
              </Field>

              <Field label="Event Type *">
                <select name="event_type">
                  <option>Wedding</option>
                  <option>Valima</option>
                  <option>Mehndi</option>
                  <option>Qawwali Night</option>
                  <option>Corporate Gala</option>
                  <option>Birthday</option>
                  <option>Private Soiree</option>
                  <option>Other Experience</option>
                </select>
              </Field>

              <Field label="Event Date *">
                <input type="date" name="event_date" required />
              </Field>

              <Field label="Venue / Location *">
                <input
                  name="venue"
                  required
                  placeholder="e.g. Banquet Hall, Farmhouse, Private Residence"
                />
              </Field>

              <Field label="Estimated Guests *">
                <input
                  name="guest_count"
                  type="number"
                  min="1"
                  required
                  placeholder="500"
                />
              </Field>

              <Field label="Start Time">
                <input name="start_time" type="time" />
              </Field>

              <Field label="End Time">
                <input name="end_time" type="time" />
              </Field>

              <Field label="Bespoke Instructions">
                <input
                  name="notes"
                  placeholder="Catering preferences, live stations, floral aesthetics..."
                />
              </Field>
            </div>

            <button type="submit" className="btn btn-primary self-start">
              Confirm &amp; Create Booking
            </button>
          </form>
        ) : (
          <div className="info-line">
            Please register a <Link href="/customers">client</Link> before scheduling an event booking.
          </div>
        )}
      </Card>

      {/* Interactive Calendar with Month Grid & Mobile Agenda */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Master Booking Calendar</h2>
            <p>Real-time visual schedule across months with agenda list view for mobile</p>
          </div>
        </div>
        <EventsCalendar
          events={(events || []).map((e) => ({
            id: e.id,
            title: e.title,
            event_date: e.event_date,
            status: e.status,
            venue: e.venue,
            guest_count: e.guest_count,
          }))}
        />
      </Card>

      {/* Full Event Table */}
      <Card>
        <div className="card-header">
          <div>
            <h2>Event Register</h2>
            <p>{events?.length || 0} total bookings across all stages</p>
          </div>
        </div>

        {events?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Occasion &amp; Title</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.title}</strong>
                      <small className="table-sub">{e.event_type}</small>
                    </td>
                    <td>{customerName(e.customers)}</td>
                    <td>{dateLabel(e.event_date)}</td>
                    <td>{e.venue}</td>
                    <td>{e.guest_count}</td>
                    <td>
                      <Status value={e.status} />
                    </td>
                    <td>
                      <Link className="text-link" href={`/events/${e.id}`}>
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No event records found"
            description="Register a client and create your first booking to start planning."
          />
        )}
      </Card>
    </>
  );
}
