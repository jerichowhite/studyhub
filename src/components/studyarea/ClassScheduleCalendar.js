import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

// Expand recurring events into individual instances for the visible range
const expandRecurring = (rawEvents) => {
  const expanded = [];

  rawEvents.forEach((ev) => {
    if (!ev.recurring || !ev.recurrence?.daysOfWeek?.length) {
      expanded.push(ev);
      return;
    }

    const { daysOfWeek, endDate } = ev.recurrence;
    const windowStart = moment().subtract(4, 'weeks');
    const windowEnd = endDate ? moment(endDate) : moment().add(16, 'weeks');

    // Iterate days in window
    let cursor = windowStart.clone().startOf('week');
    while (cursor.isBefore(windowEnd)) {
      // moment day: 0=Sun,1=Mon,…  our daysOfWeek: 0=Mon,…,6=Sun
      const localDay = (cursor.day() + 6) % 7; // convert Sun=0 → Mon=0 scheme
      if (daysOfWeek.includes(localDay)) {
        const originalStart = moment(ev.start);
        const originalEnd   = moment(ev.end);
        const duration = originalEnd.diff(originalStart);

        const instanceStart = cursor.clone()
          .hours(originalStart.hours())
          .minutes(originalStart.minutes())
          .seconds(0);
        const instanceEnd = instanceStart.clone().add(duration);

        expanded.push({
          ...ev,
          id: `${ev.id}_${cursor.format('YYYYMMDD')}`,
          start: instanceStart.toDate(),
          end: instanceEnd.toDate(),
        });
      }
      cursor.add(1, 'day');
    }
  });

  return expanded;
};

const eventStyleGetter = (event) => ({
  style: {
    backgroundColor: event.color || '#3B82F6',
    borderRadius: '6px',
    opacity: 0.92,
    color: 'white',
    border: 'none',
    fontSize: '11px',
    padding: '2px 6px',
  },
});

const ClassScheduleCalendar = ({ events = [], onSelectEvent, onAddEvent }) => {
  const calendarEvents = useMemo(() => expandRecurring(events), [events]);

  // Show tooltip on hover for location/instructor
  const EventComponent = ({ event }) => (
    <div title={[event.location, event.instructor].filter(Boolean).join(' • ')}>
      <strong className="block truncate">{event.title}</strong>
      {event.location && <span className="opacity-80 text-[10px]">{event.location}</span>}
    </div>
  );

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-800">📅 Class Schedule</h3>
        <button
          onClick={onAddEvent}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden text-xs">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={(ev) => {
            // Pass back the original (non-expanded) event by stripping the instance suffix
            onSelectEvent && onSelectEvent(ev);
          }}
          onSelectSlot={(slot) => onAddEvent && onAddEvent(slot)}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{ event: EventComponent }}
          views={['week', 'day', 'agenda']}
          defaultView="week"
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
          step={30}
          timeslots={2}
          toolbar={true}
          popup
        />
      </div>
    </div>
  );
};

export default ClassScheduleCalendar;
