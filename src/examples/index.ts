export const EXAMPLES = [
  {
    name: 'Simple Voltage Divider',
    netlist: `* Simple Voltage Divider
V1 1 0 10
R1 1 2 1k
R2 2 0 1k`
  },
  {
    name: 'Bridge Circuit',
    netlist: `* Bridge Circuit
V1 1 0 12
R1 1 2 2k
R2 1 3 4k
R3 2 3 1k
R4 2 0 3k
R5 3 0 5k`
  },
  {
    name: 'Multiple Sources',
    netlist: `* Multiple Sources
V1 1 0 10
I1 0 2 2m
R1 1 2 1k
R2 2 0 500`
  }
];
