export interface Certificate {
  document_hash?: string;
  fingerprint?: string;
  sha256?: string;
  chsh_score?: number;
  timestamp?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface VerifyResult {
  overall: boolean;
  hash_match: boolean;
  bell_violated: boolean;
  signature_valid?: boolean;
  signature_match?: boolean;
  chsh_score?: number;
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