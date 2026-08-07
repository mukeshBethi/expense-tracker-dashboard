import { useState } from "react";

export default function Switch({ checked, onChange, defaultChecked = false }) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const value = isControlled ? checked : internalChecked;

  function toggle() {
    const next = !value;
    if (isControlled) onChange?.(next);
    else setInternalChecked(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={toggle}
      className={`relative inline-flex w-11 h-6 rounded-pr-pill transition-colors cursor-pointer ${value ? "bg-pr-accent" : "bg-pr-border-strong"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
