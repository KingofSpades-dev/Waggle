import { describe, it, expect } from 'vitest';
import { streamManager, computeStreamHealth } from '@/lib/streamManager';

describe('Epic 4: Stream Honesty, Waktu Alami & Health Status State Machine', () => {
  it('Test Case 1.4.1 (Block Timestamp Integrity): Broadcast events include valid timestamps and structure', () => {
    const snapshot = streamManager.getSnapshot();
    expect(snapshot).toBeDefined();
    expect(snapshot.events).toBeInstanceOf(Array);
    expect(snapshot.events.length).toBeGreaterThan(0);

    for (const evt of snapshot.events.slice(0, 5)) {
      expect(evt.timestamp).toBeDefined();
      expect(evt.chain_key).toMatch(/sol|base|bnb|rh|arc/);
      expect(evt.venue_name).toBeTruthy();
      expect(evt.event_type).toBeTruthy();
    }
  });

  it('Test Case 1.4.2 (Health Status State Machine): Evaluates ONLINE, DEGRADED, OFFLINE based on threshold elapsed minutes', () => {
    const now = Date.now();

    // 1. Last activity 3 minutes ago -> ONLINE (<= 10m)
    const threeMinAgo = now - (3 * 60 * 1000);
    expect(computeStreamHealth(threeMinAgo, now)).toBe('ONLINE');

    // 2. Last activity 10 minutes ago (boundary) -> ONLINE (<= 10m)
    const tenMinAgo = now - (10 * 60 * 1000);
    expect(computeStreamHealth(tenMinAgo, now)).toBe('ONLINE');

    // 3. Last activity 15 minutes ago -> DEGRADED (10m - 30m)
    const fifteenMinAgo = now - (15 * 60 * 1000);
    expect(computeStreamHealth(fifteenMinAgo, now)).toBe('DEGRADED');

    // 4. Last activity 30 minutes ago (boundary) -> DEGRADED (<= 30m)
    const thirtyMinAgo = now - (30 * 60 * 1000);
    expect(computeStreamHealth(thirtyMinAgo, now)).toBe('DEGRADED');

    // 5. Last activity 35 minutes ago -> OFFLINE (> 30m)
    const thirtyFiveMinAgo = now - (35 * 60 * 1000);
    expect(computeStreamHealth(thirtyFiveMinAgo, now)).toBe('OFFLINE');

    // 6. Last activity 2 hours ago -> OFFLINE
    const twoHoursAgo = now - (120 * 60 * 1000);
    expect(computeStreamHealth(twoHoursAgo, now)).toBe('OFFLINE');
  });

  it('Test Case 1.4.2b (Collector Snapshot Health): Collector status reflects active health state', () => {
    const snapshot = streamManager.getSnapshot();
    expect(snapshot.collectors).toBeInstanceOf(Array);
    expect(snapshot.collectors.length).toBe(5);

    for (const collector of snapshot.collectors) {
      expect(['ONLINE', 'DEGRADED', 'OFFLINE']).toContain(collector.health_status);
      expect(collector.status).toBe('active');
    }
  });
});
