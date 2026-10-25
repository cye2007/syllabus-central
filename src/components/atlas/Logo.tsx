export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18M3 12h18" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
      </div>
      {!compact && <span className="font-display text-xl">SyllaView</span>}
    </div>
  );
}
