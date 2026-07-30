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
        <span className="navbar__wordmark">QSIGN</span>
        <span className="navbar__tagline">Quantum-Certified Notarization</span>
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