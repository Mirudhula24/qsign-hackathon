import { useId } from 'react';

interface FileDropzoneProps {
  label: string;
  subtext: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = size / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function FileDropzone({ label, subtext, file, onFileSelect, accept }: FileDropzoneProps) {
  const inputId = useId();

  return (
    <div className="dropzone-card">
      <label className="dropzone-card__label" htmlFor={inputId}>
        <span className="dropzone-card__title">{label}</span>
        <span className="dropzone-card__prompt">Click to upload or drag and drop</span>
        <span className="dropzone-card__subtext">{subtext}</span>
      </label>
      <input
        id={inputId}
        className="dropzone-card__input"
        type="file"
        accept={accept}
        onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="file-chip" aria-live="polite">
          <span className="file-chip__icon">▣</span>
          <span className="file-chip__name">{file.name}</span>
          <span className="file-chip__size">{formatBytes(file.size)}</span>
        </div>
      ) : null}
    </div>
  );
}