import { useState } from 'react';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
];

const EVENT_TYPES = [
  { value: 'class',          label: '📖 Class',           color: '#3B82F6' },
  { value: 'study',          label: '📚 Study Session',    color: '#10B981' },
  { value: 'exam',           label: '📝 Exam',             color: '#EF4444' },
  { value: 'assignment_due', label: '📌 Assignment Due',   color: '#F59E0B' },
  { value: 'other',          label: '📅 Other',            color: '#8B5CF6' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (n) => String(n).padStart(2, '0');

const toTimeString = (date) =>
  date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : '';

const AddEventModal = ({ initialSlot, existingEvent, onSave, onDelete, onClose }) => {
  const isEdit = !!existingEvent;

  const [title, setTitle]           = useState(existingEvent?.title || '');
  const [type, setType]             = useState(existingEvent?.type || 'class');
  const [date, setDate]             = useState(
    existingEvent?.start
      ? existingEvent.start.toISOString().slice(0, 10)
      : (initialSlot?.start ? initialSlot.start.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
  );
  const [startTime, setStartTime]   = useState(
    existingEvent?.start ? toTimeString(existingEvent.start) : (initialSlot?.start ? toTimeString(initialSlot.start) : '09:00')
  );
  const [endTime, setEndTime]       = useState(
    existingEvent?.end ? toTimeString(existingEvent.end) : (initialSlot?.end ? toTimeString(initialSlot.end) : '10:00')
  );
  const [location, setLocation]     = useState(existingEvent?.location || '');
  const [instructor, setInstructor] = useState(existingEvent?.instructor || '');
  const [notes, setNotes]           = useState(existingEvent?.notes || '');
  const [color, setColor]           = useState(existingEvent?.color || '#3B82F6');
  const [recurring, setRecurring]   = useState(existingEvent?.recurring || false);
  const [recurDays, setRecurDays]   = useState(existingEvent?.recurrence?.daysOfWeek || []);
  const [semesterEnd, setSemesterEnd] = useState(existingEvent?.recurrence?.endDate?.slice?.(0,10) || '');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const toggleDay = (idx) =>
    setRecurDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );

  const handleSave = async () => {
    if (!title.trim()) { setError('Please enter a title.'); return; }
    if (!startTime || !endTime) { setError('Please set start and end times.'); return; }
    if (recurring && recurDays.length === 0) { setError('Select at least one day for recurring events.'); return; }

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const baseDate = new Date(date);

    const start = new Date(baseDate);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(baseDate);
    end.setHours(eh, em, 0, 0);

    if (end <= start) { setError('End time must be after start time.'); return; }

    setSaving(true);
    setError('');

    await onSave({
      id: existingEvent?.id,
      title: title.trim(),
      type,
      color,
      start,
      end,
      location: location.trim(),
      instructor: instructor.trim(),
      notes: notes.trim(),
      recurring,
      recurrence: recurring
        ? { frequency: 'weekly', daysOfWeek: recurDays, endDate: semesterEnd || null }
        : null,
    });

    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Event' : '+ New Event'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CSC 411 – Net-Centric Computing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setType(t.value); setColor(t.color); }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
                    type === t.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <label className="text-xs font-semibold text-gray-600 block mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 block mb-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Recurring (weekly)</span>
            </label>
            {recurring && (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-1 rounded text-xs font-medium border transition ${
                        recurDays.includes(i)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Semester end date</label>
                  <input
                    type="date"
                    value={semesterEnd}
                    onChange={(e) => setSemesterEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Instructor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room 301"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Instructor</label>
              <input
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Prof. Eze"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any extra details..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          {isEdit && (
            <button
              onClick={() => onDelete(existingEvent.id)}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;
