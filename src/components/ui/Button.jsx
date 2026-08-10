const VARIANTS = {
  primary: "bg-pr-accent text-white hover:bg-pr-accent-hover",
  secondary: "bg-pr-subtle text-pr-primary hover:bg-pr-border-default",
  ghost: "bg-transparent text-pr-secondary hover:bg-pr-subtle hover:text-pr-primary",
  danger: "bg-pr-danger text-white hover:opacity-90",
};

export default function Button({ variant = "primary", icon: Icon, children, onClick, type = "button", disabled, className = "", ...rest }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-pr-default text-sm font-semibold transition-[background-color,transform] cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pr-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-pr-page ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
