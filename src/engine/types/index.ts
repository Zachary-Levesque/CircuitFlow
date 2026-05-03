export type ComponentType = 'R' | 'V' | 'I' | 'W';

export interface Component {
  id: string;
  type: ComponentType;
  nodeA: string;
  nodeB: string;
  value: number;
  originalValue: string;
  position?: { x1: number; y1: number; x2: number; y2: number };
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
