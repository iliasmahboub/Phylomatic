import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface DropZoneProps {
  onFilesReady: (fwd: File, rev: File) => void;
  disabled: boolean;
}

export default function DropZone({ onFilesReady, disabled }: DropZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const ab1Files = accepted.filter((f) =>
        f.name.toLowerCase().endsWith(".ab1")
      );

      if (ab1Files.length === 0) {
        setError("Only .ab1 chromatogram files are accepted");
        return;
      }

      const combined = [...files, ...ab1Files].slice(0, 2);
      setFiles(combined);
      setError(null);

      if (combined.length === 2) {
        onFilesReady(combined[0], combined[1]);
      }
    },
    [files, onFilesReady]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/octet-stream": [".ab1"] },
    disabled,
    maxFiles: 2,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          disabled
            ? "border-surface-3 bg-surface-1 cursor-not-allowed opacity-50"
            : isDragActive
              ? "border-accent-400 bg-accent-50/40"
              : "border-surface-4 hover:border-accent-300 hover:bg-accent-50/20"
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-surface-2 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#536471" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        {isDragActive ? (
          <p className="text-accent-600 text-[14px] font-medium">Drop files here</p>
        ) : (
          <>
            <p className="text-ink text-[14px] font-medium">
              Drop .ab1 chromatogram files
            </p>
            <p className="text-ink-tertiary text-[13px] mt-0.5">
              Forward + reverse reads
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-[13px] mt-2.5">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div
              key={file.name}
              className="flex items-center justify-between bg-surface-1 border border-surface-3/60 rounded-lg px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-accent-50 border border-accent-200/50 flex items-center justify-center">
                  <span className="text-accent-600 text-2xs font-semibold">
                    {i === 0 ? "FW" : "RV"}
                  </span>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink leading-tight">{file.name}</p>
                  <p className="text-2xs text-ink-tertiary">{formatSize(file.size)}</p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => removeFile(i)}
                  className="text-ink-faint hover:text-red-400 transition-colors p-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {files.length < 2 && (
            <p className="text-amber-600 text-2xs font-medium pl-0.5">
              Waiting for {files.length === 0 ? "2 files" : "1 more file"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
