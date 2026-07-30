"""
Unified interface over the signature schemes QSIGN compares.

Classical baselines (the strong, standard incumbents used by PKI / DocuSign /
TLS today) versus the post-quantum scheme QSIGN actually ships. Every scheme
exposes the same keygen/sign/verify surface plus metadata, so the benchmark
suite can treat them uniformly.

Why these baselines were selected:
  - RSA-2048 / RSA-3072  : the most widely deployed signature scheme on Earth.
  - ECDSA P-256          : the modern default for TLS, mobile, and blockchains.
  - Ed25519              : the fastest, most modern classical curve signature.
  - ML-DSA-65 (Dilithium): the NIST post-quantum standard (FIPS 204) QSIGN uses.

All classical implementations come from `cryptography` (OpenSSL-backed, C-optimized
and constant-time) — i.e. best-in-class production implementations, not toy code.
ML-DSA-65 comes from `dilithium-py` (pure-Python reference of the NIST standard).
"""

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec, ed25519, padding
from dilithium_py.ml_dsa import ML_DSA_65


def _der_pub(pubkey):
    return pubkey.public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )


# --- RSA ---------------------------------------------------------------------
def _rsa_factory(bits):
    def keygen():
        sk = rsa.generate_private_key(public_exponent=65537, key_size=bits)
        return sk, sk.public_key()

    def sign(sk, msg):
        return sk.sign(
            msg,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                        salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )

    def verify(pk, msg, sig):
        try:
            pk.verify(sig, msg,
                      padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                                  salt_length=padding.PSS.MAX_LENGTH),
                      hashes.SHA256())
            return True
        except Exception:
            return False

    return keygen, sign, verify, _der_pub


# --- ECDSA P-256 -------------------------------------------------------------
def _ecdsa_factory():
    def keygen():
        sk = ec.generate_private_key(ec.SECP256R1())
        return sk, sk.public_key()

    def sign(sk, msg):
        return sk.sign(msg, ec.ECDSA(hashes.SHA256()))

    def verify(pk, msg, sig):
        try:
            pk.verify(sig, msg, ec.ECDSA(hashes.SHA256()))
            return True
        except Exception:
            return False

    return keygen, sign, verify, _der_pub


# --- Ed25519 -----------------------------------------------------------------
def _ed25519_factory():
    def keygen():
        sk = ed25519.Ed25519PrivateKey.generate()
        return sk, sk.public_key()

    def sign(sk, msg):
        return sk.sign(msg)

    def verify(pk, msg, sig):
        try:
            pk.verify(sig, msg)
            return True
        except Exception:
            return False

    def pub_bytes(pk):
        return pk.public_bytes(serialization.Encoding.Raw,
                               serialization.PublicFormat.Raw)

    return keygen, sign, verify, pub_bytes


# --- ML-DSA-65 (post-quantum) ------------------------------------------------
def _mldsa_factory():
    def keygen():
        pk, sk = ML_DSA_65.keygen()
        return sk, pk

    def sign(sk, msg):
        return ML_DSA_65.sign(sk, msg)

    def verify(pk, msg, sig):
        return bool(ML_DSA_65.verify(pk, msg, sig))

    def pub_bytes(pk):
        return pk

    return keygen, sign, verify, pub_bytes


# name -> {keygen, sign, verify, pub_bytes, category, classical_bits,
#          quantum_bits, quantum_vulnerable}
def build_schemes():
    schemes = {}

    def add(name, factory, category, cbits, qbits, qvuln):
        kg, sg, vf, pb = factory
        schemes[name] = dict(keygen=kg, sign=sg, verify=vf, pub_bytes=pb,
                             category=category, classical_bits=cbits,
                             quantum_bits=qbits, quantum_vulnerable=qvuln)

    # classical_bits: classical security level; quantum_bits: security once a
    # large fault-tolerant quantum computer runs Shor/Grover.
    add("RSA-2048",  _rsa_factory(2048), "classical", 112, 0,   True)
    add("RSA-3072",  _rsa_factory(3072), "classical", 128, 0,   True)
    add("ECDSA-P256", _ecdsa_factory(),  "classical", 128, 0,   True)
    add("Ed25519",   _ed25519_factory(), "classical", 128, 0,   True)
    add("ML-DSA-65", _mldsa_factory(),   "post-quantum", 192, 192, False)
    return schemes
