export function MediaSkeleton() {
  return (
    <div className="media-grid media-grid--skeleton" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="media-grid-card media-grid-card--skeleton">
          <div className="media-grid-card__preview" />
          <div className="media-grid-card__meta">
            <div className="media-skeleton-line media-skeleton-line--title" />
            <div className="media-skeleton-line media-skeleton-line--meta" />
          </div>
        </div>
      ))}
    </div>
  );
}
