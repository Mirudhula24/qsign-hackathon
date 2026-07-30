import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/notarize', label: 'Notarize' },
  { to: '/verify', label: 'Verify' },
  { to: '/audit', label: 'Audit Log' }
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo" aria-hidden="true">
          <svg viewBox="0 0 30 18" width="20" height="14" fill="none"
               stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="10" cy="9" r="6" />
            <circle cx="20" cy="9" r="6" />
          </svg>
        </span>
        <span className="navbar__wordmark">QSIGN</span>
        <span className="navbar__badge">Quantum Certified</span>
      </div>
      <nav className="navbar__nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}