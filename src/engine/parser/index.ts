import { Circuit, Component, ComponentType } from '../types';

const UNIT_MAP: Record<string, number> = {
  'p': 1e-12,
  'n': 1e-9,
  'u': 1e-6,
  'm': 1e-3,
  'k': 1e3,
  'meg': 1e6,
  'g': 1e9,
};

function parseValue(valStr: string): number {
  if (!valStr) return 0;
  const match = valStr.match(/^([\d.]+)([a-zA-Z]*)$/);
  if (!match) return parseFloat(valStr);

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  if (UNIT_MAP[unit]) {
    return value * UNIT_MAP[unit];
  }
  return value;
}

export function parseNetlist(netlist: string): Circuit {
  const lines = netlist.split('\n');
  const components: Component[] = [];
  const nodesSet = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('*')) continue;

    if (line.startsWith('# pos')) {
      const parts = line.split(/\s+/);
      const id = parts[2];
      const comp = components.find(c => c.id === id);
      if (comp) {
        comp.position = {
          x1: parseFloat(parts[3]),
          y1: parseFloat(parts[4]),
          x2: parseFloat(parts[5]),
          y2: parseFloat(parts[6]),
          x3: parts[7] ? parseFloat(parts[7]) : undefined,
          y3: parts[8] ? parseFloat(parts[8]) : undefined
        };
      }
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 3) continue;

    const id = parts[0];
    const typeChar = id[0].toUpperCase();
    const nodeA = parts[1];
    const nodeB = parts[2];
    
    let type: ComponentType;
    if (typeChar === 'R') type = 'R';
    else if (typeChar === 'V') type = 'V';
    else if (typeChar === 'I') type = 'I';
    else if (typeChar === 'W') type = 'W';
    else if (typeChar === 'L') type = 'L';
    else if (typeChar === 'C') type = 'C';
    else if (typeChar === 'D') type = 'D';
    else if (typeChar === 'Q') type = 'Q';
    else continue;

    let nodeC: string | undefined;
    let valIdx = 3;

    if (type === 'Q') {
      nodeC = parts[3];
      valIdx = 4;
    }

    const valueStr = parts[valIdx] || '0';
    const extraStr = parts[valIdx + 1] || '0';

    const value = type === 'W' ? 0 : parseValue(valueStr);
    const extra = parseValue(extraStr);
    
    components.push({
      id,
      type,
      nodeA,
      nodeB,
      nodeC,
      value,
      originalValue: valueStr,
      phase: (type === 'V' || type === 'I') ? extra : undefined,
      beta: (type === 'Q') ? extra : undefined
    });

    nodesSet.add(nodeA);
    nodesSet.add(nodeB);
    if (nodeC) nodesSet.add(nodeC);
  }

  return { components, nodes: Array.from(nodesSet) };
}
