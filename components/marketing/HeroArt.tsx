const MEMBERS = ['AK', 'MO', 'TS', 'JN'];

export default function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary-soft via-surface-2 to-accent/10"
      />
      <div
        aria-hidden="true"
        className="absolute -right-10 top-10 h-40 w-40 rounded-full border border-line-strong/50"
      />
      <div
        aria-hidden="true"
        className="absolute -right-16 top-4 h-56 w-56 rounded-full border border-line/60"
      />

      <div className="relative rounded-3xl border border-line bg-surface p-5 shadow-xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Circle overview
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
              Cycle 3 of 8
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-safe-soft px-2.5 py-1 text-xs font-semibold text-safe-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-safe" />
            On track
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <dt className="text-xs text-muted">Pot this cycle</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight text-ink">
              $4,000
            </dd>
          </div>
          <div className="rounded-2xl border border-line bg-surface-2 p-3.5">
            <dt className="text-xs text-muted">Members paid</dt>
            <dd className="mt-1 text-xl font-semibold tracking-tight text-ink">
              6 <span className="text-sm font-normal text-muted">of 8</span>
            </dd>
          </div>
        </dl>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink">75% collected</span>
            <span className="text-muted">$1,000 to go</span>
          </div>
          <div
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface-3"
            role="img"
            aria-label="75 percent of this cycle's pot collected"
          >
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-accent" />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-accent/30 bg-primary-soft/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Next payout
            </span>
            <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-surface">
              You&apos;re next
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-surface">
              AK
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                Amara K. · $5,000
              </p>
              <p className="text-xs text-muted">Due when the pot is full</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex -space-x-2" aria-hidden="true">
            {MEMBERS.map((initials) => (
              <span
                key={initials}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-3 text-[10px] font-semibold text-muted"
              >
                {initials}
              </span>
            ))}
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface-2 text-[10px] font-semibold text-muted">
              +4
            </span>
          </div>
          <span className="text-xs text-muted">Monthly · $500 each</span>
        </div>
      </div>

      <div className="absolute -left-4 bottom-10 hidden rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur sm:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Trust score
        </p>
        <p className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">
          742
          <span className="ml-1.5 text-xs font-medium text-safe-ink">+18</span>
        </p>
      </div>
    </div>
  );
}
