import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText } from "lucide-react";

interface DropZoneProps {
  onFilesReady: (fwd: File, rev: File) => void;
  disabled: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
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

  return (
    <div>
      <div
        {...getRootProps()}
        className={`relative border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          disabled
            ? "border-ghost bg-surface-base cursor-not-allowed opacity-40"
            : isDragActive
              ? "border-accent bg-accent-subtle"
              : "border-ink-faint/30 hover:border-accent/50 hover:bg-accent-subtle"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center transition-colors ${
          isDragActive ? "bg-accent-dim" : "bg-surface-elevated"
        }`}>
          <Upload size={18} className={isDragActive ? "text-accent" : "text-ink-tertiary"} />
        </div>
        {isDragActive ? (
          <p className="text-accent text-[14px] font-medium">Drop files here</p>
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
        <p className="text-danger text-[13px] mt-2.5">{error}</p>
      )}

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {files.map((file, i) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between bg-surface-base border border-ghost rounded-lg px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-accent-dim flex items-center justify-center">
                    <FileText size={13} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink leading-tight">{file.name}</p>
                    <p className="text-2xs text-ink-tertiary">{formatSize(file.size)}</p>
                  </div>
                </div>
                {!disabled && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="text-ink-faint hover:text-danger transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            ))}
            {files.length < 2 && (
              <p className="text-amber text-2xs font-medium pl-0.5">
                Waiting for {files.length === 0 ? "2 files" : "1 more file"}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
