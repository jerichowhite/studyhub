import { checkClassReminders } from './notificationService';

// ── Class reminder background service ────────────────────────────────────────
// Start this once per user session (e.g. when schedule loads in StudyArea).
// Checks every 60 seconds whether any class is starting within 15 minutes.
// Duplicate-prevention is handled inside checkClassReminders via a module-level Set.

let _intervalId = null;

export const startClassReminderService = (userId, getSchedule) => {
  stopClassReminderService(); // clear any previous interval

  // Run once immediately, then on each tick
  const tick = async () => {
    const schedule = typeof getSchedule === 'function' ? getSchedule() : getSchedule;
    if (!schedule?.length) return;
    await checkClassReminders(userId, schedule);
  };

  tick();
  _intervalId = setInterval(tick, 60 * 1000);
};

export const stopClassReminderService = () => {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
};
