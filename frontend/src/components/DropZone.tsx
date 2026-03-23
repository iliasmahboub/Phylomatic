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
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          disabled
            ? "border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-50"
            : isDragActive
              ? "border-teal-400 bg-teal-50/50 scale-[1.01]"
              : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/20"
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        {isDragActive ? (
          <p className="text-teal-600 font-medium">Drop your files here</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium">
              Drop .ab1 chromatogram files
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Forward + reverse reads &middot; 2 files required
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, i) => (
            <div
              key={file.name}
              className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <span className="text-teal-600 text-xs font-bold">
                    {i === 0 ? "F" : "R"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {files.length < 2 && (
            <p className="text-amber-500 text-xs flex items-center gap-1.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Waiting for {files.length === 0 ? "2 files" : "1 more file"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
