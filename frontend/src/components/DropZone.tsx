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
        setError("Only .ab1 files are accepted");
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
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
            : isDragActive
              ? "border-teal bg-emerald-50"
              : "border-gray-300 hover:border-teal hover:bg-emerald-50/30"
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">🧬</div>
        {isDragActive ? (
          <p className="text-teal font-medium">Drop your .ab1 files here</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium">
              Drag & drop your .ab1 chromatogram files
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Forward + reverse reads (2 files required)
            </p>
          </>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, i) => (
            <div
              key={file.name}
              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
            >
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatSize(file.size)}
                </span>
              </div>
              {!disabled && (
                <button
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {files.length < 2 && (
            <p className="text-amber-600 text-sm">
              Need 1 more file (forward + reverse)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
