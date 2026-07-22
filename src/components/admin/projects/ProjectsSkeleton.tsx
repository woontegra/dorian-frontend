export function ProjectsSkeleton() {
  return (
    <div className="projects-skeleton" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="projects-skeleton__row" />
      ))}
    </div>
  );
}
