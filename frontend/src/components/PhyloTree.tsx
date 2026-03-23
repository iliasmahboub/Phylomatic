import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface PhyloTreeProps {
  svg: string;
}

export default function PhyloTree({ svg }: PhyloTreeProps) {
  return (
    <div className="w-full">
      <h3 className="font-semibold text-gray-800 mb-4">Phylogenetic Tree</h3>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="flex gap-2 p-2 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={() => zoomIn()}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zoom In
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zoom Out
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "500px" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Scroll to zoom, drag to pan. Query sequence shown in teal.
      </p>
    </div>
  );
}
