export const EXAMPLES = [
  {
    name: 'Simple Voltage Divider',
    netlist: `* Simple Voltage Divider
V1 10_10 10_6 10
R1 10_6 14_6 1k
R2 14_6 14_10 1k
W1 14_10 10_10

# pos V1 400 400 400 240
# pos R1 400 240 560 240
# pos R2 560 240 560 400
# pos W1 560 400 400 400`
  },
  {
    name: 'Parallel Circuit',
    netlist: `* Parallel Resistors
V1 10_10 10_6 12
W1 10_6 14_6
R1 14_6 14_10 2k
W2 14_6 18_6
R2 18_6 18_10 2k
W3 18_10 14_10
W4 14_10 10_10

# pos V1 400 400 400 240
# pos W1 400 240 560 240
# pos R1 560 240 560 400
# pos W2 560 240 720 240
# pos R2 720 240 720 400
# pos W3 720 400 560 400
# pos W4 560 400 400 400`
  },
  {
    name: 'Bridge Circuit',
    netlist: `* Bridge Network
V1 10_10 10_6 12
W1 10_6 14_6
R1 14_6 18_4 2k
R2 14_6 18_8 2k
R3 18_4 22_6 1k
R4 18_8 22_6 1k
R5 18_4 18_8 500
W2 22_6 22_10
W3 22_10 10_10

# pos V1 400 400 400 240
# pos W1 400 240 560 240
# pos R1 560 240 720 160
# pos R2 560 240 720 320
# pos R3 720 160 880 240
# pos R4 720 320 880 240
# pos R5 720 160 720 320
# pos W2 880 240 880 400
# pos W3 880 400 400 400`
  }
];
