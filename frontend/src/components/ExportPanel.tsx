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
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
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
      <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-widest mb-3">Export</p>
      <div className="space-y-1.5">
        {EXPORTS.map((exp, i) => (
          <button
            key={exp.label}
            onClick={handlers[i]}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-surface-0 border border-surface-3/60 rounded-lg hover:border-accent-300 hover:bg-accent-50/30 transition-all group text-left"
          >
            <div className="w-8 h-8 rounded-md bg-surface-2 group-hover:bg-accent-100 flex items-center justify-center transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#536471" strokeWidth="1.5" strokeLinecap="round" className="group-hover:stroke-accent-600 transition-colors">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-ink group-hover:text-accent-700 transition-colors">
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
