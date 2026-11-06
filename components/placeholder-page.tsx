export default function PlaceholderPage({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {note ?? "This screen is still being built. The shared app shell, auth and data layer are in place."}
      </p>
    </section>
  );
}
