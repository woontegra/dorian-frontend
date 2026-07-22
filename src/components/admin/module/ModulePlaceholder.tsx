type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <section className="admin-module-placeholder" aria-labelledby="module-placeholder-title">
      <header className="admin-page-header">
        <h2 id="module-placeholder-title" className="admin-page-heading">
          {title}
        </h2>
        <p className="admin-page-description">{description}</p>
      </header>

      <div className="admin-module-placeholder-card">
        <p className="admin-module-placeholder-notice">
          Bu modül sonraki adımlarda hazırlanacaktır.
        </p>
      </div>
    </section>
  );
}
