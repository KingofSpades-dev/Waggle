import { describe, it, expect, vi } from "vitest";
import { GasMonitor } from "@/workers/gasMonitor";

describe("Epic 13: Operational Gas Monitoring & Alerting (TASK-4.2.3)", () => {
  it("Test Case 4.2.3a: Computes daily runway correctly based on Nitro L2 gas estimates", () => {
    const monitor = new GasMonitor({
      dailyAttestationsCount: 24,
      avgGasCostPerTxEth: 0.00005, // 24 * 0.00005 = 0.0012 ETH/day
      minimumRunwayDays: 14 // 14 * 0.0012 = 0.0168 ETH threshold
    });

    // 0.05 ETH gives ~41.6 days runway (Healthy)
    const healthy = monitor.calculateRunway(0.05);
    expect(healthy.runwayDays).toBeCloseTo(41.66, 1);
    expect(healthy.isCritical).toBe(false);

    // 0.01 ETH gives ~8.3 days runway (Critical: < 14 days)
    const critical = monitor.calculateRunway(0.01);
    expect(critical.runwayDays).toBeCloseTo(8.33, 1);
    expect(critical.isCritical).toBe(true);
  });

  it("Test Case 4.2.3b: Dispatches webhook alert when runway is below 14-day threshold", async () => {
    const monitor = new GasMonitor({
      minimumRunwayDays: 14
    });

    const mockDispatcher = vi.fn().mockResolvedValue(true);

    const status = await monitor.evaluateBalance(0.005, mockDispatcher);
    expect(status.isRunwayCritical).toBe(true);
    expect(status.alertDispatched).toBe(true);
    expect(mockDispatcher).toHaveBeenCalledOnce();
    expect(mockDispatcher.mock.calls[0][0]).toContain("[OPERATIONAL GAS ALERT]");
  });

  it("Test Case 4.2.3c: Deduplicates alerts within cooldown period", async () => {
    const monitor = new GasMonitor({
      minimumRunwayDays: 14
    });

    const mockDispatcher = vi.fn().mockResolvedValue(true);

    // First alert dispatches
    const firstStatus = await monitor.evaluateBalance(0.005, mockDispatcher);
    expect(firstStatus.alertDispatched).toBe(true);
    expect(mockDispatcher).toHaveBeenCalledTimes(1);

    // Second check within cooldown does not spam webhook
    const secondStatus = await monitor.evaluateBalance(0.004, mockDispatcher);
    expect(secondStatus.isRunwayCritical).toBe(true);
    expect(secondStatus.alertDispatched).toBe(false);
    expect(mockDispatcher).toHaveBeenCalledTimes(1);
  });
});
