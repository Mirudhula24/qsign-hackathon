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
    correlation_curve?: Array<{ angle: number; value: number }>;
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

export interface ForensicVerdict {
  verdict: string;
  model: string | null;
}

export interface HardwareResult {
  status?: string;
  source?: string | null;
  backend?: string;
  job_id?: string;
  chsh_value?: number;
  bell_violated?: boolean;
  classical_bound?: number;
  quantum_maximum?: number;
  shots?: number;
  timestamp?: string;
  note?: string;
  correlators?: Record<string, number>;
  prior_hardware_job?: { job_id?: string; backend?: string; note?: string };
}

export interface CorrelationPoint {
  delta_deg: number;
  measured: number;
  quantum_theory: number;
  classical: number;
}

export interface CorrelationData {
  curve: CorrelationPoint[];
  chsh_value: number;
  classical_bound: number;
  quantum_maximum: number;
  chsh_angles_deg: number[];
}
