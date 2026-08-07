export default function Select({ label, value, onChange, options, className = "" }) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-pr-subtle border border-pr-border-default rounded-pr-default px-3 py-2.5 text-sm text-pr-primary focus:outline-none focus:ring-2 focus:ring-pr-accent/30 focus:border-pr-accent transition-colors cursor-pointer"
      >
        {options.map(opt => {
          const optValue = typeof opt === "object" ? opt.value : opt;
          const optLabel = typeof opt === "object" ? opt.label : opt;
          return <option key={optValue} value={optValue}>{optLabel}</option>;
        })}
      </select>
    </div>
  );
}
