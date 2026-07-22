export function ProductsSkeleton() {
  return (
    <div className="products-skeleton" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="products-skeleton__row" />
      ))}
    </div>
  );
}
