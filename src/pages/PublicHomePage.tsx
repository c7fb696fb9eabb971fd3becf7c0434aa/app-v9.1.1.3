export function PublicHomePage() {
  return (
    <section className="home-panel" aria-labelledby="home-title">
      <h1 className="home-title" id="home-title">
        GreenDocs
      </h1>
      <p className="home-copy">
        Browse the public documentation workspace after signing in with GitHub.
      </p>
      <p className="status-message" role="status">
        Documentation is available to signed-in users.
      </p>
    </section>
  );
}
