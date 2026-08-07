export default function Input({ label, prefix, error, helper, className = "", ...inputProps }) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pr-secondary text-sm pointer-events-none">{prefix}</span>}
        <input
          {...inputProps}
          className={`w-full bg-pr-subtle border border-pr-border-default rounded-pr-default py-2.5 text-sm text-pr-primary placeholder:text-pr-tertiary focus:outline-none focus:ring-2 focus:ring-pr-accent/30 focus:border-pr-accent transition-colors ${prefix ? "pl-7 pr-3" : "px-3"}`}
        />
      </div>
      {error && <p className="text-xs text-pr-danger mt-1">{error}</p>}
      {!error && helper && <p className="text-xs text-pr-tertiary mt-1">{helper}</p>}
    </div>
  );
}
