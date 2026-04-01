declare module "@phylocanvas/phylocanvas.gl" {
  interface PhylocanvasProps {
    source: string;
    type?: "rc" | "cr" | "rd" | "dg" | "hr";
    interactive?: boolean;
    showLabels?: boolean;
    showLeafLabels?: boolean;
    showInternalLabels?: boolean;
    nodeSize?: number;
    nodeShape?: "circle" | "square" | "triangle" | "diamond" | "cross" | "star";
    padding?: number;
    fontFamily?: string;
    fontSize?: number;
    fontColour?: string;
    strokeColour?: string;
    strokeWidth?: number;
    lineWidth?: number;
    fillColour?: string;
    highlightColour?: string;
    selectedColour?: string;
    haloRadius?: number;
    haloWidth?: number;
    alignLabels?: boolean;
    blocks?: boolean;
    size?: { width: number; height: number };
    styles?: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
  }

  export default class PhylocanvasGL {
    constructor(container: HTMLElement | null, props?: PhylocanvasProps);
    setProps(props: Partial<PhylocanvasProps>): void;
    setSource(source: string): void;
    selectNode(id: string): void;
    getSelectedIds(): string[];
    getBranchIds(): string[];
    getLeafIds(): string[];
    exportSVG(): string;
    exportPNG(): Promise<Blob>;
    fitInPanel(): void;
    destroy(): void;
    props: PhylocanvasProps;
    view: unknown;
  }
}
