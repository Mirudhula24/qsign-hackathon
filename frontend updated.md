# QSIGN Frontend — Build Spec (Direction B: "Interference")

Reference doc for building the React frontend to match the agreed design direction and the Figma Make mockup. Stack: React + Vite + Tailwind, backend at `http://127.0.0.1:8000`.

## Design tokens

```css
--bg: #FAF8F5;            /* paper-white */
--ink: #2E1A47;            /* deep violet — headings & text */
--ink-secondary: #6B5D75;
--accent: #7C3AED;         /* electric violet */
--success: #0F766E;        /* teal */
--success-bg: #E4F3F1;
--danger: #B4234A;         /* wine-red */
--danger-bg: #FBE9EE;
--border: #E7E1DB;
--row-alt: #F2EEE8;
```

**Fonts:** Serif (Fraunces / Source Serif 4) for headings, Inter/system-ui for body, monospace (JetBrains Mono or Courier New) for every hash, timestamp, CHSH value, job ID — no exceptions.

## Signature element — Interference pattern

One reusable `<InterferencePattern />` SVG component, two-source concentric-ring interference:

- **Decorative mode** (nav bar, page background): two fixed off-canvas source points, 10-14 rings each, opacity ~0.02-0.15 fading outward, static, ~4-6% overall opacity.
- **Reactive mode** (behind the certificate's CHSH readout only): source A tracks the CHSH value's position, source B sits fixed at the 2.0 boundary. Distance between them shrinks as CHSH exceeds 2.0 (tight, dense overlapping fringes = strong violation); stays wide/flat when it doesn't cross. Animate the tightening over ~400-600ms when a certificate is first issued.
- This is the only animation in the app besides a 150ms opacity fade on tab/page switches. No hover glows, no other motion.

## Layout notes

- The certificate result renders in a tall, double-ruled-border container (two 1px lines ~3px apart) — proportioned like a physical document, not a dashboard card. Max-width ~560px, generous padding.
- Everything else (dropzones, buttons, audit table) stays as plain, quiet cards so the certificate stands out.

## Pages

### 1. Notarize
1. Three use-case cards (Government Registries / Court Evidence / Medical Records) — quiet serif micro-headings
2. Dropzone
3. "Issue Certificate" button (`--ink` background)
4. On success → certificate document containing:
   - CHSH readout (large mono number + boundary bar + reactive interference pattern)
   - Correlation curve chart (Recharts, violet line, wine-red dashed threshold)
   - Details table (document, timestamp, hash, circuit, backend, bell_violated)
   - Download button
   - IBM hardware badge (teal-bordered callout)

### 2. Verify
1. Two dropzones (document + certificate JSON) → Verify button
2. Result with three check rows (hash match / bell violated / signature valid), pass/fail banner, plain-language physics explainer on failure

### 3. Audit Log
- Table: Time / Document / CHSH Score / Status
- CHSH values colored teal (>2.0) or wine-red (≤2.0)
- Refresh button, footer note explaining the 2.0 threshold

## Component checklist

```
src/
  api.js
  index.css
  App.jsx
  components/
    Navbar.jsx
    InterferencePattern.jsx
    Dropzone.jsx
    CertificateDocument.jsx
    ChshReadout.jsx
    CorrelationChart.jsx
    CertificateDetailsTable.jsx
    IBMBadge.jsx
    VerifyResult.jsx
    AuditTable.jsx
  pages/
    NotarizePage.jsx
    VerifyPage.jsx
    AuditPage.jsx
```

## Backend contract

```
POST /notarize   multipart/form-data: file
  → { certificate: { document_hash, timestamp, quantum_proof: { circuit, chsh_value, classical_bound, quantum_maximum, bell_violated, backend, shots, angles, correlation_curve }, signature } }

POST /verify     multipart/form-data: file, certificate (json)
  → { verification: { overall, hash_match, bell_violated, signature_valid, chsh_value }, verdict }

GET /audit
  → { notarizations: [{ timestamp, filename, chsh_value, status }] }
```

## Interaction discipline

- Only two animated moments total: 150ms fade on switches, 400-600ms interference-tightening on certificate issue.
- Two accents max: violet (active/valid) + wine-red (danger), teal for success — don't let the palette creep.
- All technical values monospace, always.
