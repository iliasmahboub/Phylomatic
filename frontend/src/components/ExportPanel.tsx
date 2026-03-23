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
  {
    label: "Newick",
    desc: "Tree format (.nwk)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    label: "SVG",
    desc: "Vector graphic",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    label: "PNG",
    desc: "Raster image (2x)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

export default function ExportPanel({ newick, svg }: ExportPanelProps) {
  const handlers = [
    () => downloadFile(newick, "tree.nwk", "text/plain"),
    () => downloadFile(svg, "phylomatic_tree.svg", "image/svg+xml"),
    () => downloadPNG(svg),
  ];

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-4">Export</h3>
      <div className="space-y-2">
        {EXPORTS.map((exp, i) => (
          <button
            key={exp.label}
            onClick={handlers[i]}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-teal-200 hover:bg-teal-50/30 transition-all group text-left"
          >
            <div className="text-gray-400 group-hover:text-teal-500 transition-colors">
              {exp.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 group-hover:text-teal-700 transition-colors">
                {exp.label}
              </p>
              <p className="text-[11px] text-gray-400">{exp.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
