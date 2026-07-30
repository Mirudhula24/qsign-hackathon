import { NavLink } from 'react-router-dom';
import { Atom, Bell, Settings } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/notarize', label: 'Notarize', end: false },
  { to: '/verify', label: 'Verify', end: false },
  { to: '/audit', label: 'Audit', end: false }
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo" aria-hidden="true">
          <Atom size={22} strokeWidth={1.8} />
        </span>
        <span className="navbar__titles">
          <span className="navbar__wordmark">QSIGN</span>
          <span className="navbar__tagline">Quantum-Certified Notarization</span>
        </span>
      </div>

      <nav className="navbar__nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `navbar__link${isActive ? ' navbar__link--active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="navbar__user">
        <button className="navbar__icon-btn" type="button" aria-label="Notifications">
          <Bell size={19} strokeWidth={1.8} />
        </button>
        <button className="navbar__icon-btn" type="button" aria-label="Settings">
          <Settings size={19} strokeWidth={1.8} />
        </button>
        <div className="navbar__profile">
          <span className="navbar__avatar" aria-hidden="true">QA</span>
          <span className="navbar__username">QSIGN Authority</span>
        </div>
      </div>
    </header>
  );
}
