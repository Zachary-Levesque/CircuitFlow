import * as math from 'mathjs';

export type ComponentType = 'R' | 'V' | 'I' | 'W' | 'L' | 'C' | 'D' | 'Q';

export interface Component {
  id: string;
  type: ComponentType;
  nodeA: string;
  nodeB: string;
  nodeC?: string; // For 3-terminal components like transistors (Q)
  value: number;
  originalValue: string;
  position?: { x1: number; y1: number; x2: number; y2: number, x3?: number, y3?: number };
  phase?: number; // For AC sources
  beta?: number;  // For BJT Transistors
}

export interface Circuit {
  components: Component[];
  nodes: string[];
}

export type ComplexValue = number | math.Complex;

export interface SimulationResult {
  nodeVoltages: Record<string, ComplexValue>;
  branchCurrents: Record<string, ComplexValue>;
  voltageDrops: Record<string, ComplexValue>;
  powerDissipation: Record<string, ComplexValue>;
  error?: string;
}

export interface TransientStep {
  time: number;
  results: SimulationResult;
}

export interface TransientResult {
  steps: TransientStep[];
}

export type AnalysisMode = 'DC' | 'AC' | 'Transient';

export interface AnalysisOptions {
  type: AnalysisMode;
  frequency?: number;
  tStop?: number;
  tStep?: number;
}
