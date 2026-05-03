import { parseNetlist } from './parser';
import { solveDC } from './solver';
import { ComplexValue } from './types';

function toNumber(value: ComplexValue | undefined): number {
  return typeof value === 'number' ? value : NaN;
}

// Simple manual test script to verify core logic
function runTests() {
  console.log('Running CircuitFlow Engine Tests...');

  // Test 1: Simple Voltage Divider
  const netlist1 = `
    V1 1 0 10
    R1 1 2 1k
    R2 2 0 1k
  `;
  
  try {
    const circuit1 = parseNetlist(netlist1);
    const results1 = solveDC(circuit1);
    const node2Voltage = toNumber(results1.nodeVoltages['2']);
    const r1Current = toNumber(results1.branchCurrents['R1']);
    
    console.log('Test 1: Simple Voltage Divider');
    if (node2Voltage === 5) {
      console.log('✅ Node 2 voltage is 5V');
    } else {
      console.error('❌ Node 2 voltage expected 5V, got', results1.nodeVoltages['2']);
    }

    if (Math.abs(r1Current - 0.005) < 1e-6) {
      console.log('✅ R1 current is 5mA');
    } else {
      console.error('❌ R1 current expected 5mA, got', results1.branchCurrents['R1']);
    }
  } catch (e: any) {
    console.error('Test 1 failed with error:', e.message);
  }

  // Test 2: Error handling - Missing Ground
  const netlist2 = `
    V1 1 2 10
    R1 1 2 1k
  `;
  try {
    parseNetlist(netlist2);
    console.error('❌ Test 2: Should have thrown error for missing ground');
  } catch (e: any) {
    console.log('✅ Test 2: Successfully caught missing ground error:', e.message);
  }

  console.log('Tests completed.');
}

// In a real project, we would use Vitest or Jest.
// For now, this serves as documentation of testability.
export { runTests };
