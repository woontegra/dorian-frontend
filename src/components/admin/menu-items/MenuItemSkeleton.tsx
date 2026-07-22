export function MenuItemSkeleton() {
  return (
    <div className="mi-skeleton" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="mi-skeleton__row" />
      ))}
    </div>
  );
}
