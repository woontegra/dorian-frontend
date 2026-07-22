export function ProductCategorySkeleton() {
  return (
    <div className="pc-skeleton" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="pc-skeleton__row" />
      ))}
    </div>
  );
}
