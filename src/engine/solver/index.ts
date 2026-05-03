import * as math from 'mathjs';
import { Circuit, SimulationResult, Component } from '../types';

export function solveDC(circuit: Circuit): SimulationResult {
  const { components, nodes } = circuit;
  
  // Ground node is '0'
  const nonGroundNodes = nodes.filter(n => n !== '0').sort();
  const nodeToIndex = new Set(nonGroundNodes);
  const n = nonGroundNodes.length;
  
  const voltageSources = components.filter(c => c.type === 'V');
  const m = voltageSources.length;
  
  if (!nodes.includes('0')) {
    return { 
      nodeVoltages: {}, 
      branchCurrents: {}, 
      powerDissipation: {}, 
      error: 'Missing ground node (0)' 
    };
  }

  // Size of MNA matrix is (n + m) x (n + m)
  const size = n + m;
  if (size === 0) {
    return { nodeVoltages: {}, branchCurrents: {}, powerDissipation: {}, error: 'Empty circuit' };
  }

  const A = math.zeros(size, size) as math.Matrix;
  const Z = math.zeros(size, 1) as math.Matrix;

  const getNodeIdx = (node: string) => nonGroundNodes.indexOf(node);

  // Fill G matrix (conductance)
  components.forEach(c => {
    if (c.type === 'R') {
      const idxA = getNodeIdx(c.nodeA);
      const idxB = getNodeIdx(c.nodeB);
      const g = 1 / c.value;

      if (idxA !== -1) {
        A.set([idxA, idxA], (A.get([idxA, idxA]) as number) + g);
      }
      if (idxB !== -1) {
        A.set([idxB, idxB], (A.get([idxB, idxB]) as number) + g);
      }
      if (idxA !== -1 && idxB !== -1) {
        A.set([idxA, idxB], (A.get([idxA, idxB]) as number) - g);
        A.set([idxB, idxA], (A.get([idxB, idxA]) as number) - g);
      }
    } else if (c.type === 'I') {
      const idxA = getNodeIdx(c.nodeA);
      const idxB = getNodeIdx(c.nodeB);
      // Current flows from A to B? 
      // In KCL: sum of currents leaving node = 0
      // Current source I from A to B means I leaves A and enters B.
      if (idxA !== -1) {
        Z.set([idxA, 0], (Z.get([idxA, 0]) as number) - c.value);
      }
      if (idxB !== -1) {
        Z.set([idxB, 0], (Z.get([idxB, 0]) as number) + c.value);
      }
    }
  });

  // Fill B, C, D matrices for voltage sources
  voltageSources.forEach((vSrc, i) => {
    const idxA = getNodeIdx(vSrc.nodeA);
    const idxB = getNodeIdx(vSrc.nodeB);
    const row = n + i;

    if (idxA !== -1) {
      A.set([idxA, row], 1);
      A.set([row, idxA], 1);
    }
    if (idxB !== -1) {
      A.set([idxB, row], -1);
      A.set([row, idxB], -1);
    }
    
    Z.set([row, 0], vSrc.value);
  });

  try {
    // Solve A * X = Z
    const X = math.lusolve(A, Z) as math.Matrix;
    
    const nodeVoltages: Record<string, number> = { '0': 0 };
    nonGroundNodes.forEach((node, i) => {
      nodeVoltages[node] = X.get([i, 0]) as number;
    });

    const branchCurrents: Record<string, number> = {};
    const powerDissipation: Record<string, number> = {};

    components.forEach(c => {
      const vA = nodeVoltages[c.nodeA] || 0;
      const vB = nodeVoltages[c.nodeB] || 0;
      const vDiff = vA - vB;

      if (c.type === 'R') {
        const current = vDiff / c.value;
        branchCurrents[c.id] = current;
        powerDissipation[c.id] = current * vDiff;
      } else if (c.type === 'V') {
        const vIdx = voltageSources.findIndex(v => v.id === c.id);
        const current = X.get([n + vIdx, 0]) as number;
        branchCurrents[c.id] = current;
        powerDissipation[c.id] = -current * c.value;
      } else if (c.type === 'I') {
        branchCurrents[c.id] = c.value;
        powerDissipation[c.id] = -c.value * vDiff;
      }
    });

    return {
      nodeVoltages,
      branchCurrents,
      powerDissipation
    };
  } catch (err: any) {
    let errorMessage = 'Matrix calculation error.';
    if (err.message && err.message.includes('Singular matrix')) {
      errorMessage = 'Singular matrix detected. This usually means your circuit has floating nodes (not connected to ground) or a loop of ideal voltage sources.';
    }
    return {
      nodeVoltages: {},
      branchCurrents: {},
      powerDissipation: {},
      error: errorMessage
    };
  }
}
