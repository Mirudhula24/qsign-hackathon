export interface Certificate {
  document_hash?: string;
  fingerprint?: string;
  sha256?: string;
  chsh_score?: number;
  timestamp?: string;
  created_at?: string;
  // backend includes nested `quantum_proof` and `signature` fields
  quantum_proof?: {
    chsh_value?: number;
    bell_violated?: boolean;
    classical_bound?: number;
    quantum_maximum?: number;
    backend?: string;
    shots?: number;
  };
  signature?: {
    scheme?: string;
    payload_hash?: string;
  };
  [key: string]: unknown;
}

export interface VerifyResult {
  overall: boolean;
  hash_match: boolean;
  bell_violated: boolean;
  signature_valid?: boolean;
  signature_match?: boolean;
  chsh_value?: number;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface AuditRow {
  time: string;
  document: string;
  chshScore: number;
  status: 'Verified' | 'Rejected';
}
