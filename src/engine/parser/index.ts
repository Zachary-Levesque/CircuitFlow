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
    if (!line || line.startsWith('*') || line.startsWith('#')) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 4) continue;

    const id = parts[0];
    const typeChar = id[0].toUpperCase();
    const nodeA = parts[1];
    const nodeB = parts[2];
    const valueStr = parts[3];

    let type: ComponentType;
    if (typeChar === 'R') type = 'R';
    else if (typeChar === 'V') type = 'V';
    else if (typeChar === 'I') type = 'I';
    else continue;

    const value = parseValue(valueStr);

    components.push({
      id,
      type,
      nodeA,
      nodeB,
      value,
      originalValue: valueStr
    });

    nodesSet.add(nodeA);
    nodesSet.add(nodeB);
  }

  return {
    components,
    nodes: Array.from(nodesSet)
  };
}
