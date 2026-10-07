interface RetryPlan {
  attempt: number;
  delay: number;
}

export class PlaybackRetry {
  private attempts = 0;
  private plan?: RetryPlan;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private stableTimer?: ReturnType<typeof setTimeout>;
  private disposed = false;

  constructor(private readonly retry: () => void) {}

  schedule(): RetryPlan | undefined {
    if (this.disposed) return;
    if (this.plan) return this.plan;
    clearTimeout(this.stableTimer);
    this.stableTimer = undefined;
    if (this.attempts >= 3) return;
    const plan = { attempt: ++this.attempts, delay: 3000 * 2 ** (this.attempts - 1) };
    this.plan = plan;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      this.plan = undefined;
      this.retry();
    }, plan.delay);
    return plan;
  }

  ready() {
    if (this.disposed) return;
    this.cancel();
    // 短暂进入就绪状态不重置额度，避免反复断流造成无限重试。
    this.stableTimer = setTimeout(() => {
      this.attempts = 0;
      this.stableTimer = undefined;
    }, 30000);
  }

  reset() {
    this.cancel();
    this.attempts = 0;
  }

  cancel() {
    clearTimeout(this.retryTimer);
    clearTimeout(this.stableTimer);
    this.retryTimer = undefined;
    this.stableTimer = undefined;
    this.plan = undefined;
  }

  dispose() {
    this.cancel();
    this.disposed = true;
  }
}
