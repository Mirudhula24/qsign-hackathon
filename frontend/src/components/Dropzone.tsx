import { useId } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

interface DropzoneProps {
  label: string;
  hint: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
}

export default function Dropzone({ label, hint, file, onFileSelect, accept }: DropzoneProps) {
  const inputId = useId();

  return (
    <label className="dropzone" htmlFor={inputId}>
      <span className="dropzone__icon" aria-hidden="true">
        {file ? <FileText size={30} strokeWidth={1.6} /> : <UploadCloud size={30} strokeWidth={1.6} />}
      </span>
      <span className="dropzone__title">{label}</span>
      <span className="dropzone__hint">{hint}</span>
      <input id={inputId} type="file" accept={accept} onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)} />
      {file
        ? <span className="dropzone__file"><FileText size={13} /> {file.name}</span>
        : <span className="dropzone__placeholder">Click to upload or drag &amp; drop</span>}
    </label>
  );
}
