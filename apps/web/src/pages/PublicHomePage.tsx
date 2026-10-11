export function PublicHomePage() {
  return (
    <section className="home-panel" aria-labelledby="home-title">
      <h1 className="home-title" id="home-title">
        GreenDocs
      </h1>
      <p className="home-copy">Git-backed documentation workspace.</p>
      <p className="status-message" role="status">
        No published pages are available yet.
      </p>
    </section>
  );
}
