export default function ComingSoonPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-pr-tertiary">{title}</p>
      <p className="text-pr-secondary text-sm">This page is being rebuilt in the new design — coming shortly.</p>
    </div>
  );
}
