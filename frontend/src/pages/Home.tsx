import { Link } from 'react-router-dom';
import { Atom, ShieldCheck, KeyRound, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  { icon: Atom, title: 'Bell Certified', text: 'Every certificate is sealed by a Bell–CHSH inequality test — a proof of quantum origin no classical system can fake.' },
  { icon: ShieldCheck, title: 'Tamper Proof', text: 'Any change to the document or its certificate is detected instantly by an independent integrity check.' },
  { icon: KeyRound, title: 'Post-Quantum Secure', text: 'Signed with NIST ML-DSA-65, so certificates stay valid well into the quantum era.' }
];

export default function Home() {
  return (
    <section className="page page--wide">
      <div className="hero">
        <div>
          <span className="hero__eyebrow"><Sparkles size={14} /> Quantum-Certified Notarization</span>
          <h1 className="hero__title">Quantum Proof.<br />Legal Trust.</h1>
          <p className="hero__desc">
            QSIGN issues tamper-evident certificates whose authenticity is rooted in the laws of
            physics — verified on real IBM quantum hardware and sealed with post-quantum cryptography.
          </p>

          <div className="hero__features">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="hero__feature">
                <span className="hero__feature-icon"><Icon size={20} strokeWidth={1.8} /></span>
                <div>
                  <h4>{title}</h4>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hero__cta">
            <Link to="/notarize" className="button button--primary">Get Started <ArrowRight size={16} /></Link>
            <Link to="/verify" className="button button--secondary">Verify a document</Link>
          </div>
        </div>

        <aside className="cert-preview" aria-label="Certificate preview">
          <div className="cert-preview__head">
            <h3>Quantum Notarization<br />Certificate</h3>
            <span className="cert-preview__ref">QSIGN-CERT-2026</span>
          </div>
          <div className="cert-preview__score">2.8284<small> / CHSH</small></div>
          <div className="cert-preview__meta">
            <span>CLASSICAL BOUND — 2.0000</span>
            <span>BACKEND — ibm_marrakesh</span>
            <span>SIGNATURE — ML-DSA-65</span>
          </div>
          <div className="cert-preview__foot">
            <span className="status-pill status-pill--pass"><ShieldCheck size={13} /> Bell violated</span>
            <span className="cert-seal">
              <span className="cert-seal__mark">Q</span>
              <span className="cert-seal__sub">QUANTUM · SEALED</span>
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
