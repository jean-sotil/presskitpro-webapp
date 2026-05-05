export default function Loading() {
  return (
    <div className="grid min-h-[100dvh] gap-8 px-6 py-12 md:grid-cols-[14rem_1fr_1fr] md:px-12">
      <div className="h-[70vh] animate-pulse bg-surface" />
      <div className="h-[70vh] animate-pulse bg-surface" />
      <div className="h-[70vh] animate-pulse bg-surface" />
    </div>
  );
}
