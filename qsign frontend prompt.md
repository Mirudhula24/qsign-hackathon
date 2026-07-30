

## Context

I'm building the frontend for QSIGN, a quantum-certified document notarization system, for a hackathon submission. The backend is already complete and running at `http://127.0.0.1:8000` with these endpoints:

- `POST /notarize` — multipart file upload → returns a JSON certificate including a CHSH (Bell inequality) score around 2.83
- `POST /verify` — multipart upload of a document + a certificate JSON file → returns a JSON result with `overall` (bool), `hash_match` (bool), `bell_violated` (bool), and the CHSH score
- `GET /health` — returns 200 if the server is up

**Do not create, modify, or assume the existence of any backend files.** Only work within the frontend project. Treat the backend purely as an external HTTP API to call via `fetch`.

## Tech stack

- React + TypeScript + Vite
- Plain CSS (CSS variables for theming, no Tailwind, no CSS-in-JS libraries) — keep it lightweight
- React Router for the 3 pages
- No backend framework code, no server files — this is a pure SPA that calls the API over `fetch`

## Project structure to generate

```
frontend/
  src/
    main.tsx
    App.tsx
    api/
      client.ts        # fetch wrapper for /notarize, /verify, /health
    types/
      index.ts          # Certificate, VerifyResult, AuditRow types
    components/
      Navbar.tsx
      FileDropzone.tsx
      QuantumScoreCard.tsx
      ResultCard.tsx
      StatusSteps.tsx
    pages/
      Notarize.tsx
      Verify.tsx
      AuditLog.tsx
    styles/
      variables.css      # design tokens as CSS custom properties
      global.css
  index.html
  vite.config.ts
  package.json
  tsconfig.json
```

## Design system — follow this exactly, do not improvise colors or add gradients/neon

**Philosophy:** this should look like it was designed by someone who didn't need to impress anyone — like a bank, hospital, or court interface. Calm, institutional, plain. No gradients, no glow, no neon, no shadows beyond one subtle card shadow. The physics/science is the impressive part; the UI should get out of the way.

### Color tokens (put these in `styles/variables.css` as CSS custom properties)

```css
:root {
  --bg: #F4F6F9;
  --card-bg: #FFFFFF;
  --navy: #0D1B3E;
  --accent: #1A56A0;
  --success: #1A7A4A;
  --danger: #9B1C2E;
  --text-primary: #1A1A2E;
  --text-secondary: #4A5568;
  --border: #D1D5DB;
  --muted-bg: #EFF2F7;
}
```

### Typography

- Font: Inter (import from Google Fonts or system-ui fallback)
- Headings: font-weight 600 (never 700 except the "QSIGN" wordmark in the navbar)
- Body: 14px, line-height 1.6
- No all-caps except small uppercase labels (e.g. "DOCUMENT FINGERPRINT")
- No letter-spacing tricks
- Every numeric science value (2.83, 1.74, 2.0, hash values) rendered in a monospace font (e.g. `JetBrains Mono`, `ui-monospace` fallback)

### Global rules

- No gradients anywhere
- Only shadow allowed: `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` on cards
- No animations/transitions except a 150ms opacity fade on tab switches
- No icons except a simple document icon on file chips — text-first UI
- Border radius: 6–8px max
- Generous whitespace
- The "forged certificate" fail state should feel like a court rejection notice — serious and final, not an alarming warning siren. No big red X icons, no dramatic flashing.

## Navbar

- White background, 1px bottom border `--border`
- Left: "QSIGN" in navy, weight 700, 18px, plus tagline "Quantum-Certified Notarization" in muted grey next to it
- Right: nav links (Notarize / Verify / Audit Log) in muted grey text, active link in navy with a bottom border indicator
- No icons
- Height: 56px

## Page 1 — Notarize (`pages/Notarize.tsx`)

- Title "Notarize a Document" (navy, 22px, weight 600)
- Subtitle: "Your document will receive a quantum-certified signature, verified against the Bell-CHSH inequality."
- `FileDropzone` component: white card, 1px dashed border, 8px radius, "Click to upload or drag and drop", subtext "Any file format accepted". After upload, show a filename chip with file size in a muted-background pill.
- On submit, call `POST /notarize` with the file as multipart form data via `api/client.ts`.
- Show a loading state while waiting for the response (simple text like "Generating certificate…", no spinner animation beyond a subtle fade).
- "DOCUMENT FINGERPRINT" label (small uppercase muted) + truncated SHA-256 hash in monospace, from the API response.
- `QuantumScoreCard`: white card with a 3px accent-blue left border. Label "QUANTUM ORIGIN SCORE" (small, muted, uppercase). Large navy monospace number (the CHSH score from the API, e.g. 2.83). Below it: "Classical systems cannot exceed 2.0 — verified by Bell-CHSH inequality." A thin horizontal bar: grey track, navy fill proportional to score/4.0, thin red tick at the 2.0 mark. Labels below: "0", "Classical bound: 2.0" (red, centered under tick), "4.0".
- `StatusSteps`: numbered list (not dots) — "1. Document fingerprint computed", "2. Bell-CHSH circuit run", "3. Certificate assembled" — each with a grey checkmark once complete.
- Button: "Issue Certificate" — navy background, white text, 6px radius, full width, no shadow.
- After success, show a "Download Certificate" action that saves the returned certificate JSON as a `.json` file (use a Blob + anchor download, no backend involvement needed).

## Page 2 — Verify (`pages/Verify.tsx`)

- Title "Verify a Certificate", subtitle explaining the three checks (fingerprint, quantum origin score, cryptographic signature).
- Two plain-text tab chips (no pill shapes): "Standard Verification" and "Test with Forged Certificate". 150ms opacity fade on switch.
- Each tab has two upload areas side by side: "Original Document" and "QSIGN Certificate (.json)".
- On submit, call `POST /verify` with both files.
- `ResultCard`:
  - If `overall === true`: white card, 3px dark-green left border, title "Document Verified" (green, 18px), subtitle "All three checks passed successfully."
  - If `overall === false`: white card, 3px dark-red left border, title "Certificate Rejected" (red, 18px), subtitle should reflect which check failed (e.g. "Quantum origin check failed" if `bell_violated`).
- Three check rows in a simple table layout, each colored green or red based on the actual API response fields (`hash_match`, `bell_violated`, signature validity) — do not hardcode pass/fail, read it from the response.
- On fail specifically for the quantum check, show a small "key insight" box (white card, 1px border, 3px red left border, 13px muted dark text): explain in plain language that this certificate wasn't produced on quantum hardware because its CHSH score falls below the classical bound of 2.0, making forgery physically detectable rather than just computationally hard. Keep this factual and legal-finding in tone — no exclamation points, no drama.
- Footer note under the result: certificate timestamp from the response data, in muted grey.

## Page 3 — Audit Log (`pages/AuditLog.tsx`)

- Title "Audit Log", subtitle "A record of all notarizations performed in this session."
- Simple table, white background, 1px row borders, no zebra striping.
- Columns: Time, Document, CHSH Score, Status.
- For the hackathon demo, hardcode 4 rows as mock data (clearly commented `// TODO: replace with real session history if time allows`):
  - 09:14:22 | property_deed.pdf | 2.8411 | Verified
  - 09:45:11 | will_testament.pdf | 2.8372 | Verified
  - 10:02:33 | land_title.pdf | 2.8298 | Verified
  - 10:18:45 | fake_cert_attempt.pdf | 1.74 | Rejected
- CHSH values in monospace, colored green if ≥2.0 else red — plain colored text, no badges.
- Footer note: "CHSH scores above 2.0 indicate quantum-certified randomness. Classical systems are physically bounded below 2.0."

## API client (`api/client.ts`)

- Base URL as a constant: `const API_BASE = "http://127.0.0.1:8000"`.
- `notarize(file: File): Promise<Certificate>` — POSTs multipart form data to `/notarize`.
- `verify(document: File, certificate: File): Promise<VerifyResult>` — POSTs multipart form data (both files) to `/verify`.
- `checkHealth(): Promise<boolean>` — GETs `/health`.
- Wrap all calls in try/catch; on network failure show a plain inline message like "Could not reach the QSIGN server — make sure the backend is running on port 8000." (styled like normal body text, no alarming red banner).

## Explicit constraints

- Do not touch, create, or reference anything outside the `frontend/` folder.
- Do not invent backend logic client-side (e.g. don't fake-compute a CHSH score in the frontend) — always read real values from the API response so the demo reflects the actual backend behavior.
- Keep components small and readable; this needs to be demoable and debuggable quickly under time pressure.
- Favor plain CSS files per component/page over one giant global stylesheet, but centralize the color/font tokens in `variables.css`.

Please scaffold the project structure above, then implement each file, starting with `api/client.ts` and `types/index.ts`, then the shared components, then the three pages, then wire up routing in `App.tsx`.
