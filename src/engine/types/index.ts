export type ComponentType = 'R' | 'V' | 'I';

export interface Component {
  id: string;
  type: ComponentType;
  nodeA: string;
  nodeB: string;
  value: number;
  originalValue: string;
  position?: { x1: number; y1: number; x2: number; y2: number }; // Coordinates for visual rendering
}

export interface Circuit {
  components: Component[];
  nodes: string[];
}

export interface SimulationResult {
  nodeVoltages: Record<string, number>;
  branchCurrents: Record<string, number>;
  powerDissipation: Record<string, number>;
  error?: string;
}

export interface AnalysisOptions {
  type: 'DC' | 'AC' | 'Transient';
}
