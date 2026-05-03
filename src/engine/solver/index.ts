import * as math from 'mathjs';
import { Circuit, SimulationResult, Component, AnalysisOptions, ComplexValue, TransientResult, TransientStep } from '../types';

// Constants for non-linear models
const VT = 0.02585; // Thermal voltage at room temp
const IS = 1e-12;    // Saturation current
const G_MIN = 1e-12; // Minimum conductance for numerical stability

function getVoltageDifference(nodeVoltages: Record<string, ComplexValue>, component: Component) {
  const vA = nodeVoltages[component.nodeA] ?? 0;
  const vB = nodeVoltages[component.nodeB] ?? 0;
  return math.subtract(vA, vB) as ComplexValue;
}

function solveNonLinear(
  circuit: Circuit, 
  prevNodeVoltages: Record<string, number> = {},
  options?: { tStep?: number, companionModels?: Record<string, { g: number, i: number }> }
): SimulationResult {
  const { components, nodes } = circuit;
  const nonGroundNodes = nodes.filter(n => n !== '0').sort();
  const n = nonGroundNodes.length;
  
  const vSources = components.filter(c => c.type === 'V' || c.type === 'W');
  const m = vSources.length;
  const size = n + m;

  let currentVoltages = { ...prevNodeVoltages };
  // Initialize with zeros if empty
  nodes.forEach(node => { if (!(node in currentVoltages)) currentVoltages[node] = 0; });

  let iteration = 0;
  const maxIterations = 100;
  const tolerance = 1e-6;

  while (iteration < maxIterations) {
    const A = math.zeros(size, size) as math.Matrix;
    const Z = math.zeros(size, 1) as math.Matrix;
    const getNodeIdx = (node: string) => nonGroundNodes.indexOf(node);

    components.forEach(c => {
      const idxA = getNodeIdx(c.nodeA);
      const idxB = getNodeIdx(c.nodeB);
      
      if (c.type === 'R') {
        const g = 1 / c.value;
        if (idxA !== -1) A.set([idxA, idxA], (A.get([idxA, idxA]) as number) + g);
        if (idxB !== -1) A.set([idxB, idxB], (A.get([idxB, idxB]) as number) + g);
        if (idxA !== -1 && idxB !== -1) {
          A.set([idxA, idxB], (A.get([idxA, idxB]) as number) - g);
          A.set([idxB, idxA], (A.get([idxB, idxA]) as number) - g);
        }
      } else if (c.type === 'I') {
        if (idxA !== -1) Z.set([idxA, 0], (Z.get([idxA, 0]) as number) - c.value);
        if (idxB !== -1) Z.set([idxB, 0], (Z.get([idxB, 0]) as number) + c.value);
      } else if (c.type === 'D') {
        // Diode: NodeA = Anode, NodeB = Cathode
        const vA = currentVoltages[c.nodeA] || 0;
        const vB = currentVoltages[c.nodeB] || 0;
        const vd = vA - vB;
        
        // Newton-Raphson for Diode
        // Id = Is * (exp(Vd/Vt) - 1)
        // gd = dId/dVd = (Is/Vt) * exp(Vd/Vt)
        // Ieq = Id - gd * Vd
        const expTerm = Math.exp(Math.min(vd / VT, 40)); // Cap exp for stability
        const gd = (IS / VT) * expTerm + G_MIN;
        const id = IS * (expTerm - 1);
        const ieq = id - gd * vd;

        if (idxA !== -1) {
          A.set([idxA, idxA], (A.get([idxA, idxA]) as number) + gd);
          Z.set([idxA, 0], (Z.get([idxA, 0]) as number) - ieq);
        }
        if (idxB !== -1) {
          A.set([idxB, idxB], (A.get([idxB, idxB]) as number) + gd);
          Z.set([idxB, 0], (Z.get([idxB, 0]) as number) + ieq);
        }
        if (idxA !== -1 && idxB !== -1) {
          A.set([idxA, idxB], (A.get([idxA, idxB]) as number) - gd);
          A.set([idxB, idxA], (A.get([idxB, idxA]) as number) - gd);
        }
      } else if (c.type === 'Q') {
        // Simplified BJT (NPN): NodeA=Base, NodeB=Emitter, NodeC=Collector
        const idxC = getNodeIdx(c.nodeC || '');
        const vB_val = currentVoltages[c.nodeA] || 0;
        const vE_val = currentVoltages[c.nodeB] || 0;
        const vC_val = currentVoltages[c.nodeC || ''] || 0;
        
        const vbe = vB_val - vE_val;
        const beta = c.beta || 100;

        // Base-Emitter Diode
        const expTerm = Math.exp(Math.min(vbe / VT, 40));
        const gbe = (IS / VT) * expTerm + G_MIN;
        const ib = IS * (expTerm - 1);
        const ieq_b = ib - gbe * vbe;

        // Ic = beta * Ib
        // This is a voltage-controlled current source
        if (idxA !== -1) {
          A.set([idxA, idxA], (A.get([idxA, idxA]) as number) + gbe);
          Z.set([idxA, 0], (Z.get([idxA, 0]) as number) - ieq_b);
        }
        if (idxB !== -1) {
          A.set([idxB, idxB], (A.get([idxB, idxB]) as number) + gbe);
          Z.set([idxB, 0], (Z.get([idxB, 0]) as number) + ieq_b);
        }
        if (idxA !== -1 && idxB !== -1) {
          A.set([idxA, idxB], (A.get([idxA, idxB]) as number) - gbe);
          A.set([idxB, idxA], (A.get([idxB, idxA]) as number) - gbe);
        }

        // Controlled source Ic from C to E
        const ic = beta * ib;
        // Ic = beta * (gbe * (vB - vE) + ieq_b)
        // Ic = (beta*gbe)*vB - (beta*gbe)*vE + beta*ieq_b
        const g_ctrl = beta * gbe;
        const i_ctrl = beta * ieq_b;

        if (idxC !== -1) {
           if (idxA !== -1) A.set([idxC, idxA], (A.get([idxC, idxA]) as number) + g_ctrl);
           if (idxB !== -1) A.set([idxC, idxB], (A.get([idxC, idxB]) as number) - g_ctrl);
           Z.set([idxC, 0], (Z.get([idxC, 0]) as number) - i_ctrl);
        }
        if (idxB !== -1) {
           if (idxA !== -1) A.set([idxB, idxA], (A.get([idxB, idxA]) as number) - g_ctrl);
           if (idxB !== -1) A.set([idxB, idxB], (A.get([idxB, idxB]) as number) + g_ctrl);
           Z.set([idxB, 0], (Z.get([idxB, 0]) as number) + i_ctrl);
        }
      } else if (options?.companionModels?.[c.id]) {
        const { g, i } = options.companionModels[c.id];
        if (idxA !== -1) A.set([idxA, idxA], (A.get([idxA, idxA]) as number) + g);
        if (idxB !== -1) A.set([idxB, idxB], (A.get([idxB, idxB]) as number) + g);
        if (idxA !== -1 && idxB !== -1) {
          A.set([idxA, idxB], (A.get([idxA, idxB]) as number) - g);
          A.set([idxB, idxA], (A.get([idxB, idxA]) as number) - g);
        }
        if (idxA !== -1) Z.set([idxA, 0], (Z.get([idxA, 0]) as number) - i);
        if (idxB !== -1) Z.set([idxB, 0], (Z.get([idxB, 0]) as number) + i);
      }
    });

    vSources.forEach((vSrc, i) => {
      const idxA = getNodeIdx(vSrc.nodeA);
      const idxB = getNodeIdx(vSrc.nodeB);
      const row = n + i;
      if (idxA !== -1) { A.set([idxA, row], 1); A.set([row, idxA], 1); }
      if (idxB !== -1) { A.set([idxB, row], -1); A.set([row, idxB], -1); }
      Z.set([row, 0], vSrc.value);
    });

    try {
      const X = math.lusolve(A, Z) as math.Matrix;
      const nextVoltages: Record<string, number> = { '0': 0 };
      let maxDiff = 0;
      nonGroundNodes.forEach((node, i) => {
        const v = X.get([i, 0]) as number;
        nextVoltages[node] = v;
        maxDiff = Math.max(maxDiff, Math.abs(v - currentVoltages[node]));
      });

      if (maxDiff < tolerance) {
        // Converged
        const branchCurrents: Record<string, number> = {};
        const voltageDrops: Record<string, number> = {};
        const powerDissipation: Record<string, number> = {};
        components.forEach(c => {
          const vA = nextVoltages[c.nodeA] || 0;
          const vB = nextVoltages[c.nodeB] || 0;
          const vDiff = vA - vB;
          voltageDrops[c.id] = vDiff;
          if (c.type === 'R') branchCurrents[c.id] = vDiff / c.value;
          else if (options?.companionModels?.[c.id]) {
            const { g, i } = options.companionModels[c.id];
            branchCurrents[c.id] = g * vDiff + i;
          } else if (c.type === 'I') branchCurrents[c.id] = c.value;
          else if (c.type === 'V' || c.type === 'W') {
            const vIdx = vSources.findIndex(v => v.id === c.id);
            branchCurrents[c.id] = X.get([n + vIdx, 0]) as number;
          }
          // Simplified for others...
        });
        return { nodeVoltages: nextVoltages, branchCurrents, voltageDrops, powerDissipation };
      }
      currentVoltages = nextVoltages;
      iteration++;
    } catch (e) {
      break;
    }
  }

  return { nodeVoltages: {}, branchCurrents: {}, voltageDrops: {}, powerDissipation: {}, error: 'Convergence failed' };
}

export function solveDC(circuit: Circuit): SimulationResult {
  return solveNonLinear(circuit);
}

export function solveAC(circuit: Circuit, options: AnalysisOptions): SimulationResult {
  const { components, nodes } = circuit;
  const freq = options.frequency || 60;
  const omega = 2 * Math.PI * freq;
  const nonGroundNodes = nodes.filter(n => n !== '0').sort();
  const n = nonGroundNodes.length;
  const vSources = components.filter(c => c.type === 'V' || c.type === 'W');
  const m = vSources.length;
  const size = n + m;
  if (size === 0) return { nodeVoltages: {}, branchCurrents: {}, voltageDrops: {}, powerDissipation: {}, error: 'Empty circuit' };

  const A = math.zeros(size, size) as math.Matrix;
  const Z = math.zeros(size, 1) as math.Matrix;
  const getNodeIdx = (node: string) => nonGroundNodes.indexOf(node);

  components.forEach(c => {
    const idxA = getNodeIdx(c.nodeA);
    const idxB = getNodeIdx(c.nodeB);
    let admittance: math.Complex | number = 0;
    if (c.type === 'R') admittance = 1 / c.value;
    else if (c.type === 'L') admittance = math.divide(1, math.complex(0, omega * c.value)) as math.Complex;
    else if (c.type === 'C') admittance = math.complex(0, omega * c.value);
    else if (c.type === 'I') {
      const complexVal = math.multiply(c.value, math.exp(math.complex(0, (c.phase || 0) * Math.PI / 180))) as math.Complex;
      if (idxA !== -1) Z.set([idxA, 0], math.subtract(Z.get([idxA, 0]), complexVal));
      if (idxB !== -1) Z.set([idxB, 0], math.add(Z.get([idxB, 0]), complexVal));
      return;
    }

    if (c.type === 'R' || c.type === 'L' || c.type === 'C') {
      if (idxA !== -1) A.set([idxA, idxA], math.add(A.get([idxA, idxA]), admittance));
      if (idxB !== -1) A.set([idxB, idxB], math.add(A.get([idxB, idxB]), admittance));
      if (idxA !== -1 && idxB !== -1) {
        A.set([idxA, idxB], math.subtract(A.get([idxA, idxB]), admittance));
        A.set([idxB, idxA], math.subtract(A.get([idxB, idxA]), admittance));
      }
    }
  });

  vSources.forEach((vSrc, i) => {
    const idxA = getNodeIdx(vSrc.nodeA);
    const idxB = getNodeIdx(vSrc.nodeB);
    const row = n + i;
    const complexVal = vSrc.type === 'V' 
      ? math.multiply(vSrc.value, math.exp(math.complex(0, (vSrc.phase || 0) * Math.PI / 180))) as math.Complex
      : 0;
    if (idxA !== -1) { A.set([idxA, row], 1); A.set([row, idxA], 1); }
    if (idxB !== -1) { A.set([idxB, row], -1); A.set([row, idxB], -1); }
    Z.set([row, 0], complexVal);
  });

  try {
    const X = math.lusolve(A, Z) as math.Matrix;
    const nodeVoltages: Record<string, ComplexValue> = { '0': 0 };
    nonGroundNodes.forEach((node, i) => { nodeVoltages[node] = X.get([i, 0]) as math.Complex; });
    const branchCurrents: Record<string, ComplexValue> = {};
    const voltageDrops: Record<string, ComplexValue> = {};
    const powerDissipation: Record<string, ComplexValue> = {};
    components.forEach(c => {
      const vDiff = getVoltageDifference(nodeVoltages, c);
      voltageDrops[c.id] = vDiff;
      if (c.type === 'R') branchCurrents[c.id] = math.divide(vDiff, c.value) as math.Complex;
      else if (c.type === 'L') branchCurrents[c.id] = math.divide(vDiff, math.complex(0, omega * c.value)) as math.Complex;
      else if (c.type === 'C') branchCurrents[c.id] = math.multiply(math.complex(0, omega * c.value), vDiff) as math.Complex;
      else if (c.type === 'I') {
        branchCurrents[c.id] = math.multiply(c.value, math.exp(math.complex(0, (c.phase || 0) * Math.PI / 180))) as math.Complex;
      } else if (c.type === 'V' || c.type === 'W') {
        const vIdx = vSources.findIndex(v => v.id === c.id);
        branchCurrents[c.id] = X.get([n + vIdx, 0]) as math.Complex;
      }
    });
    return { nodeVoltages, branchCurrents, voltageDrops, powerDissipation };
  } catch (err: any) {
    return { nodeVoltages: {}, branchCurrents: {}, voltageDrops: {}, powerDissipation: {}, error: 'Solver error: ' + err.message };
  }
}

export function solveTransient(circuit: Circuit, options: AnalysisOptions): TransientResult {
  const steps: TransientStep[] = [];
  const tStop = options.tStop || 0.1;
  const tStep = options.tStep || 0.001;
  let currentTime = 0;

  let currentVoltages: Record<string, number> = {};
  let currentCurrents: Record<string, number> = {};
  
  // Initial DC solution
  const dcRes = solveDC(circuit);
  currentVoltages = Object.fromEntries(Object.entries(dcRes.nodeVoltages).map(([n, v]) => [n, v as number]));
  currentCurrents = Object.fromEntries(Object.entries(dcRes.branchCurrents).map(([n, i]) => [n, i as number]));

  steps.push({ time: 0, results: dcRes });

  while (currentTime < tStop) {
    currentTime += tStep;
    
    // Companion models for Backward Euler
    const companionModels: Record<string, { g: number, i: number }> = {};
    circuit.components.forEach(c => {
      if (c.type === 'C') {
        const vPrev = (currentVoltages[c.nodeA] || 0) - (currentVoltages[c.nodeB] || 0);
        const g = c.value / tStep;
        const i = -g * vPrev;
        companionModels[c.id] = { g, i };
      } else if (c.type === 'L') {
        const iPrev = currentCurrents[c.id] || 0;
        const g = tStep / c.value;
        const i = iPrev;
        companionModels[c.id] = { g, i };
      }
    });

    const stepRes = solveNonLinear(circuit, currentVoltages, { tStep, companionModels });
    if (stepRes.error) break;

    steps.push({ time: currentTime, results: stepRes });
    currentVoltages = Object.fromEntries(Object.entries(stepRes.nodeVoltages).map(([n, v]) => [n, v as number]));
    currentCurrents = Object.fromEntries(Object.entries(stepRes.branchCurrents).map(([n, i]) => [n, i as number]));
  }

  return { steps };
}
