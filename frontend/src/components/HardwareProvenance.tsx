import { Cpu, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import type { HardwareResult } from '../types';

interface HardwareProvenanceProps {
  hw: HardwareResult | null;
}

export default function HardwareProvenance({ hw }: HardwareProvenanceProps) {
  if (!hw) {
    return <div className="card-shell"><p className="helper-text">Loading hardware provenance…</p></div>;
  }

  const isReal = hw.source === 'ibm_hardware' && hw.status === 'complete';
  const isDry = hw.source === 'simulator_dryrun';
  const jobUrl = hw.job_id && hw.job_id !== 'dry-run-local' ? `https://quantum.ibm.com/jobs/${hw.job_id}` : null;

  if (!isReal && !isDry) {
    const prior = hw.prior_hardware_job;
    return (
      <div className="hardware-panel hardware-panel--pending">
        <span className="hardware-panel__label"><Cpu size={16} strokeWidth={1.8} /> Real-hardware run pending</span>
        <p className="hardware-panel__note">
          {hw.note || 'Run backend/real_hardware.py --run with IBM Quantum credentials to populate this panel.'}
          {prior ? <> Prior job on <b>{prior.backend}</b> — <code>{prior.job_id}</code>.</> : null}
        </p>
      </div>
    );
  }

  return (
    <div className={`hardware-panel${isReal ? ' hardware-panel--real' : ' hardware-panel--dry'}`}>
      <div className="hardware-panel__head">
        <span className="hardware-panel__label">
          <Cpu size={16} strokeWidth={1.8} />
          {isReal ? 'Executed on IBM Quantum hardware' : 'Simulator dry-run — not real hardware'}
        </span>
        <span className={`status-pill ${hw.bell_violated ? 'status-pill--pass' : 'status-pill--fail'}`}>
          {hw.bell_violated ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
          {hw.bell_violated ? 'Bell violated' : 'No violation'}
        </span>
      </div>

      <div className="hardware-panel__score">
        {hw.chsh_value}
        <small> CHSH · classical bound 2.000 · Tsirelson {hw.quantum_maximum}</small>
      </div>

      <div className="hardware-panel__grid">
        <span>Backend</span><strong>{hw.backend}</strong>
        <span>Job ID</span>
        <strong>{jobUrl
          ? <a href={jobUrl} target="_blank" rel="noreferrer">{hw.job_id} <ExternalLink size={11} /></a>
          : hw.job_id}</strong>
        <span>Shots</span><strong>{hw.shots}</strong>
        <span>Timestamp</span><strong>{hw.timestamp}</strong>
      </div>

      <p className="hardware-panel__note">
        {isReal
          ? 'Measured on real, noisy quantum hardware — and still above the classical bound of 2.0. The job ID is public: anyone can verify this run on the IBM Quantum platform.'
          : 'These numbers are from a local simulator, shown so the panel is demoable. Run backend/real_hardware.py --run with IBM credentials to replace them with a genuine, verifiable IBM Quantum job.'}
      </p>
    </div>
  );
}
