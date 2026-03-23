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

export default function ExportPanel({ newick, svg }: ExportPanelProps) {
  return (
    <div className="w-full">
      <h3 className="font-semibold text-gray-800 mb-4">Export</h3>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => downloadFile(newick, "tree.nwk", "text/plain")}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Download Newick
        </button>
        <button
          onClick={() => downloadFile(svg, "phylomatic_tree.svg", "image/svg+xml")}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Download SVG
        </button>
        <button
          onClick={() => downloadPNG(svg)}
          className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
