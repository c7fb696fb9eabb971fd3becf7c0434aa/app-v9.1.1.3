import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../config';

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
        Sign in to open the documentation home.
      </p>
      <Link className="action-button action-button-primary" to={APP_ROUTES.login}>
        Sign in with GitHub
      </Link>
    </section>
  );
}
