export interface GasMonitorConfig {
  publisherAddress: `0x${string}`;
  dailyAttestationsCount: number;
  avgGasCostPerTxEth: number;
  minimumRunwayDays: number;
  discordWebhookUrl?: string;
  telegramWebhookUrl?: string;
}

export interface GasStatus {
  currentBalanceEth: number;
  dailyBurnEth: number;
  runwayDays: number;
  isRunwayCritical: boolean;
  alertDispatched: boolean;
  lastAlertTimestamp?: number;
}

export class GasMonitor {
  private config: GasMonitorConfig;
  private lastAlertTimestamp: number = 0;
  private alertCooldownMs: number = 6 * 60 * 60 * 1000; // 6 hours deduplication

  constructor(config?: Partial<GasMonitorConfig>) {
    this.config = {
      publisherAddress: (process.env.WAGGLE_PUBLISHER_ADDRESS || "0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a") as `0x${string}`,
      dailyAttestationsCount: 24, // 1 attestation per hour
      avgGasCostPerTxEth: 0.00005, // Arbitrum Nitro L2 calldata cost (~$0.13)
      minimumRunwayDays: 14,
      ...config
    };
  }

  /**
   * Calculates runway days from current balance.
   */
  public calculateRunway(balanceEth: number): { dailyBurn: number; runwayDays: number; isCritical: boolean } {
    const dailyBurn = this.config.dailyAttestationsCount * this.config.avgGasCostPerTxEth;
    const runwayDays = dailyBurn > 0 ? balanceEth / dailyBurn : 999;
    const isCritical = runwayDays < this.config.minimumRunwayDays;

    return {
      dailyBurn,
      runwayDays,
      isCritical
    };
  }

  /**
   * Evaluates publisher gas balance and dispatches operational alert if threshold is breached.
   */
  public async evaluateBalance(
    balanceEth: number,
    webhookDispatcher?: (msg: string) => Promise<boolean>
  ): Promise<GasStatus> {
    const { dailyBurn, runwayDays, isCritical } = this.calculateRunway(balanceEth);
    let alertDispatched = false;

    if (isCritical) {
      const now = Date.now();
      const canAlert = now - this.lastAlertTimestamp > this.alertCooldownMs;

      if (canAlert) {
        const alertMessage = `⚠️ [OPERATIONAL GAS ALERT] Publisher wallet (${this.config.publisherAddress}) runway is ${runwayDays.toFixed(1)} days (Threshold: ${this.config.minimumRunwayDays} days). Current balance: ${balanceEth} ETH. Please top up from operational treasury.`;

        if (webhookDispatcher) {
          await webhookDispatcher(alertMessage);
        }

        this.lastAlertTimestamp = now;
        alertDispatched = true;
      }
    }

    return {
      currentBalanceEth: balanceEth,
      dailyBurnEth: dailyBurn,
      runwayDays,
      isRunwayCritical: isCritical,
      alertDispatched,
      lastAlertTimestamp: this.lastAlertTimestamp || undefined
    };
  }
}

export const gasMonitor = new GasMonitor();
