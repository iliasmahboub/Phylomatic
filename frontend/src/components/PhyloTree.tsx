import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface PhyloTreeProps {
  svg: string;
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-surface-elevated rounded-md transition-colors"
    >
      {children}
    </button>
  );
}

export default function PhyloTree({ svg }: PhyloTreeProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] font-semibold text-ink">Phylogenetic Tree</p>
        <div className="flex items-center gap-4 text-2xs text-ink-tertiary font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent shadow-glow" />
            Query
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ink-tertiary" />
            Reference
          </span>
        </div>
      </div>

      <div className="border border-ghost rounded-xl overflow-hidden bg-surface-base">
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={5}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="flex items-center gap-0.5 px-2 py-1.5 bg-surface-void/50 border-b border-ghost">
                <ToolBtn onClick={() => zoomIn()} title="Zoom in">
                  <ZoomIn size={14} />
                </ToolBtn>
                <ToolBtn onClick={() => zoomOut()} title="Zoom out">
                  <ZoomOut size={14} />
                </ToolBtn>
                <ToolBtn onClick={() => resetTransform()} title="Reset view">
                  <RotateCcw size={14} />
                </ToolBtn>
              </div>
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "450px" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div
                  className="w-full h-full flex items-center justify-center p-4 [&_svg]:max-w-full [&_svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
      <p className="text-2xs text-ink-faint mt-2 text-center">
        Scroll to zoom &middot; Drag to pan
      </p>
    </div>
  );
}
