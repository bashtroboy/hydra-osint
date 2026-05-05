import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/map', label: 'Map' },
    { path: '/entities', label: 'Entities' },
    { path: '/events', label: 'Events' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/sources', label: 'Sources' },
  ];

  return (
    <header className="header">
      <div className="header-brand">
        <h1>HYDRA</h1>
        <span className="badge">Demo</span>
      </div>
      <nav className="header-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <a
          href="http://localhost:3000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="api-docs-link"
        >
          API Docs
        </a>
      </div>
    </header>
  );
}
