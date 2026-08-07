export default function IconButton({ icon: Icon, label, onClick, size = 40 }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-pr-default text-pr-secondary bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer"
    >
      <Icon size={17} />
    </button>
  );
}
