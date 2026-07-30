"""
Render a QSIGN certificate as a professional, self-contained verification PDF
with a scannable QR code.

QR design (for reliable scanning + deeper verification): the QR encodes a
COMPACT verification token — the document hash, CHSH value, issuer fingerprint,
signature scheme, timestamp, and a verify URL. It deliberately omits the 3 KB
post-quantum signature (which would bloat the QR and hurt scan reliability); the
full signature lives in the JSON certificate. Scanning the QR gives a verifier
everything needed to look the document up and confirm its quantum proof and
issuer, and the URL opens QSIGN's verifier.
"""

import io
import json
import qrcode

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
)

NAVY = colors.HexColor("#0D1B3E")
BLUE = colors.HexColor("#1A56A0")
GREY = colors.HexColor("#8A909A")
LIGHT = colors.HexColor("#F4F6F9")


def build_qr_token(cert, verify_url):
    qp = cert.get("quantum_proof", {})
    sig = cert.get("signature", {})
    token = {
        "hash": cert.get("document_hash"),
        "chsh": qp.get("chsh_value"),
        "backend": qp.get("backend"),
        "issuer": sig.get("issuer"),
        "scheme": sig.get("scheme"),
        "ts": cert.get("timestamp"),
        "verify": verify_url,
    }
    return json.dumps(token, separators=(",", ":"))


def _qr_image(data):
    qr = qrcode.QRCode(
        version=None,                                   # auto-fit
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # ~15% recovery
        box_size=8, border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def build_certificate_pdf(cert, verification=None, verify_url="http://127.0.0.1:5173"):
    qp = cert.get("quantum_proof", {})
    sig = cert.get("signature", {})
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Title"], textColor=NAVY, fontSize=22, spaceAfter=2)
    sub = ParagraphStyle("sub", parent=styles["Normal"], textColor=GREY, fontSize=10, spaceAfter=10)
    hd = ParagraphStyle("hd", parent=styles["Heading3"], textColor=BLUE, fontSize=11, spaceBefore=8, spaceAfter=4)
    body = ParagraphStyle("body", parent=styles["Normal"], fontSize=9.5, leading=14)
    mono = ParagraphStyle("mono", parent=styles["Normal"], fontName="Courier", fontSize=8.5, leading=12)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=18 * mm, bottomMargin=16 * mm,
                            title="QSIGN Certificate of Quantum Notarization")
    story = []

    story.append(Paragraph("QSIGN", h1))
    story.append(Paragraph("Certificate of Quantum-Certified Notarization", sub))

    verdict = None
    if verification is not None:
        verdict = "AUTHENTIC" if verification.get("overall") else "NOT VERIFIED"
    banner_color = colors.HexColor("#1A7A4A") if verdict == "AUTHENTIC" else NAVY
    if verdict:
        story.append(Table([[Paragraph(f"<b>Verification: {verdict}</b>",
                     ParagraphStyle("v", parent=body, textColor=colors.white, fontSize=12))]],
                     colWidths=[170 * mm],
                     style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), banner_color),
                                       ("LEFTPADDING", (0, 0), (-1, -1), 10),
                                       ("TOPPADDING", (0, 0), (-1, -1), 8),
                                       ("BOTTOMPADDING", (0, 0), (-1, -1), 8)])))
        story.append(Spacer(1, 8))

    def kv(rows):
        t = Table([[Paragraph(f"<b>{k}</b>", body), Paragraph(v, mono if m else body)]
                   for k, v, m in rows], colWidths=[45 * mm, 125 * mm])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#EEF0F3")),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        return t

    story.append(Paragraph("Document", hd))
    story.append(kv([
        ("Document hash (SHA-256)", cert.get("document_hash", ""), True),
        ("Timestamp (UTC)", cert.get("timestamp", ""), True),
    ]))

    story.append(Paragraph("Quantum proof of origin (Bell–CHSH)", hd))
    story.append(kv([
        ("CHSH value", f"{qp.get('chsh_value')}  (classical bound 2.0 · Tsirelson {qp.get('quantum_maximum')})", False),
        ("Bell inequality violated", "Yes" if qp.get("bell_violated") else "No", False),
        ("Quantum backend", str(qp.get("backend")), False),
        ("Shots", str(qp.get("shots")), False),
        ("Document-bound circuit", "Yes — angles derived from document hash" if qp.get("document_bound") else "No", False),
    ]))

    story.append(Paragraph("Cryptographic seal", hd))
    story.append(kv([
        ("Signature scheme", str(sig.get("scheme")), False),
        ("Post-quantum", "Yes (NIST FIPS 204)" if str(sig.get("scheme", "")).startswith("ML-DSA") else "—", False),
        ("Issuer (QSIGN authority)", str(sig.get("issuer")), True),
    ]))

    if verification is not None:
        checks = [
            ("Document fingerprint", verification.get("hash_match")),
            ("Quantum origin (CHSH > 2.0)", verification.get("bell_violated")),
            ("Document-bound circuit", verification.get("document_bound")),
            ("Post-quantum signature", verification.get("signature_valid")),
            ("Trusted issuer", verification.get("issuer_trusted")),
        ]
        story.append(Paragraph("Verification checks", hd))
        rows = [[Paragraph(f"{'PASS' if v else ('—' if v is None else 'FAIL')}",
                 ParagraphStyle("c", parent=body,
                 textColor=colors.HexColor("#1A7A4A") if v else (GREY if v is None else colors.HexColor("#9B1C2E")))),
                 Paragraph(name, body)] for name, v in checks]
        t = Table(rows, colWidths=[20 * mm, 150 * mm])
        t.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
        story.append(t)

    # QR block
    token = build_qr_token(cert, verify_url)
    qr_img = Image(_qr_image(token), width=34 * mm, height=34 * mm)
    qr_cap = Paragraph(
        "Scan to verify. The code carries the document hash, CHSH value, issuer "
        "fingerprint, signature scheme and timestamp, plus the QSIGN verifier URL.",
        ParagraphStyle("qc", parent=body, fontSize=8.5, textColor=GREY))
    story.append(Spacer(1, 10))
    story.append(Table([[qr_img, qr_cap]], colWidths=[40 * mm, 130 * mm],
                       style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                         ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                                         ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E6EC")),
                                         ("LEFTPADDING", (0, 0), (-1, -1), 8),
                                         ("TOPPADDING", (0, 0), (-1, -1), 8),
                                         ("BOTTOMPADDING", (0, 0), (-1, -1), 8)])))

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "QSIGN certifies the integrity and quantum origin of the document identified above. "
        "It attests to the file's authenticity and its issuing authority — not to the truth "
        "of the document's contents. Verify at any time by presenting the original file and "
        "its JSON certificate to the QSIGN verifier.",
        ParagraphStyle("foot", parent=body, fontSize=8, textColor=GREY)))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()
