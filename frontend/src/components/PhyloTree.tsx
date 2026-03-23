import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PhyloTreeProps {
  svg: string;
}

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2 rounded-md transition-colors"
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
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            Query
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-ink-tertiary" />
            Reference
          </span>
        </div>
      </div>

      <div className="border border-surface-3/60 rounded-xl overflow-hidden bg-surface-0">
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={5}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="flex items-center gap-0.5 px-2 py-1.5 bg-surface-1 border-b border-surface-3/60">
                <ToolBtn onClick={() => zoomIn()} title="Zoom in">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </ToolBtn>
                <ToolBtn onClick={() => zoomOut()} title="Zoom out">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </ToolBtn>
                <ToolBtn onClick={() => resetTransform()} title="Reset view">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </ToolBtn>
              </div>
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "450px" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div
                  className="w-full h-full flex items-center justify-center p-4"
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
