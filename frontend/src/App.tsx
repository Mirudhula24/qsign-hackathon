import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Notarize from './pages/Notarize';
import Verify from './pages/Verify';
import AuditLog from './pages/AuditLog';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notarize" element={<Notarize />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
