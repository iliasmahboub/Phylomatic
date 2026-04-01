import { Download } from "lucide-react";

interface ExportPanelProps {
  newick: string;
  svg: string;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPNG(svgString: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "phylomatic_tree.png";
      a.click();
      URL.revokeObjectURL(pngUrl);
    }, "image/png");

    URL.revokeObjectURL(url);
  };

  img.src = url;
}

const EXPORTS = [
  { label: "Newick", ext: ".nwk", desc: "Tree format" },
  { label: "SVG", ext: ".svg", desc: "Vector graphic" },
  { label: "PNG", ext: ".png", desc: "Raster image (2x)" },
];

export default function ExportPanel({ newick, svg }: ExportPanelProps) {
  const handlers = [
    () => downloadFile(newick, "tree.nwk", "text/plain"),
    () => downloadFile(svg, "phylomatic_tree.svg", "image/svg+xml"),
    () => downloadPNG(svg),
  ];

  return (
    <div>
      <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-[0.12em] mb-3">Export</p>
      <div className="space-y-1.5">
        {EXPORTS.map((exp, i) => (
          <button
            key={exp.label}
            onClick={handlers[i]}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-surface-base border border-ghost rounded-lg hover:border-accent/30 hover:bg-accent-subtle transition-all group text-left"
          >
            <div className="w-8 h-8 rounded-md bg-surface-elevated group-hover:bg-accent-dim flex items-center justify-center transition-colors">
              <Download size={14} className="text-ink-tertiary group-hover:text-accent transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-ink group-hover:text-accent transition-colors">
                {exp.label}
              </p>
              <p className="text-2xs text-ink-tertiary">{exp.desc}</p>
            </div>
            <span className="text-2xs text-ink-faint font-mono">{exp.ext}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
