export type ComponentType = 'R' | 'V' | 'I';

export interface Component {
  id: string;
  type: ComponentType;
  nodeA: string;
  nodeB: string;
  value: number;
  originalValue: string; // To keep track of units like 1k, 1u
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
