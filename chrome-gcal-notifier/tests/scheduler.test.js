// tests/scheduler.test.js
const Scheduler = require('../src/scheduler');

const baseSettings = { notifyBefore: [10, 30] };

describe('Scheduler.computePendingAlarms', () => {
  it('creates alarms for each notifyBefore window that fits', () => {
    const now = 1000000;
    const events = [{ id: 'e1', title: 'Meeting', startTime: now + 20 * 60 * 1000, notifiedAt: [] }];
    const alarms = Scheduler.computePendingAlarms(events, baseSettings, now);
    expect(alarms).toHaveLength(1); // only 10-min alarm fits (30-min would be in the past)
    expect(alarms[0].name).toBe('event_e1_10before');
    expect(alarms[0].minutesBefore).toBe(10);
  });

  it('skips alarms that are in the past', () => {
    const now = 1000000;
    const events = [{ id: 'e1', title: 'Meeting', startTime: now + 5 * 60 * 1000, notifiedAt: [] }];
    const alarms = Scheduler.computePendingAlarms(events, baseSettings, now);
    expect(alarms).toHaveLength(0);
  });

  it('skips alarms already notified', () => {
    const now = 1000000;
    const events = [{
      id: 'e1', title: 'Meeting',
      startTime: now + 20 * 60 * 1000,
      notifiedAt: [10],
    }];
    const alarms = Scheduler.computePendingAlarms(events, baseSettings, now);
    expect(alarms).toHaveLength(0);
  });
});

describe('Scheduler.parseAlarmName', () => {
  it('parses valid alarm name', () => {
    expect(Scheduler.parseAlarmName('event_e1_10before')).toEqual({ eventId: 'e1', minutesBefore: 10 });
  });

  it('returns null for non-event alarms', () => {
    expect(Scheduler.parseAlarmName('daily_digest')).toBeNull();
  });

  it('handles event IDs with underscores', () => {
    const result = Scheduler.parseAlarmName('event_abc_xyz_30before');
    expect(result).toEqual({ eventId: 'abc_xyz', minutesBefore: 30 });
  });
});
