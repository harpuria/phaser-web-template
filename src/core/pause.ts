export class PauseState {
  private reasons = new Set<string>();
  constructor(private onChange: (paused: boolean) => void) {}
  get paused() {
    return this.reasons.size > 0;
  }
  set(reason: string, active: boolean) {
    const before = this.paused;
    if (active) this.reasons.add(reason);
    else this.reasons.delete(reason);
    if (before !== this.paused) this.onChange(this.paused);
  }
}
