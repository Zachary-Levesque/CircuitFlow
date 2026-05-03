import React, { useState, useRef, useEffect } from 'react';
import { Component, ComponentType } from '../engine/types';

interface SchematicEditorProps {
  components: Component[];
  onAddComponent: (comp: Partial<Component>) => void;
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
  onRemoveComponent: (id: string) => void;
}

const GRID_SIZE = 40;

const SchematicEditor: React.FC<SchematicEditorProps> = ({ 
  components, 
  onAddComponent, 
  onUpdateComponent, 
  onRemoveComponent 
}) => {
  const [placing, setPlacing] = useState<{ type: ComponentType; start: { x: number; y: number } | null }>({ type: 'R', start: null });
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const getGridCoords = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / GRID_SIZE) * GRID_SIZE;
    const y = Math.round((e.clientY - rect.top) / GRID_SIZE) * GRID_SIZE;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getGridCoords(e);
    if (!placing.start) {
      setPlacing({ ...placing, start: coords });
    } else {
      // Complete placement
      const id = `${placing.type}${components.length + 1}`;
      const nodeA = `${coords.x/GRID_SIZE},${coords.y/GRID_SIZE}`;
      const nodeB = `${placing.start.x/GRID_SIZE},${placing.start.y/GRID_SIZE}`;
      
      onAddComponent({
        id,
        type: placing.type,
        nodeA,
        nodeB,
        value: placing.type === 'R' ? 1000 : 10,
        originalValue: placing.type === 'R' ? '1k' : '10',
        position: { x1: placing.start.x, y1: placing.start.y, x2: coords.x, y2: coords.y }
      });
      setPlacing({ ...placing, start: null });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoverPos(getGridCoords(e));
  };

  const renderComponent = (c: Component) => {
    if (!c.position) return null;
    const { x1, y1, x2, y2 } = c.position;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    return (
      <g key={c.id} className="group cursor-pointer" onClick={(e) => { e.stopPropagation(); }}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="2" />
        <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
          {c.type === 'R' && (
            <path d="M -15 0 L -10 0 L -7.5 -5 L -2.5 5 L 2.5 -5 L 7.5 5 L 10 0 L 15 0" fill="none" stroke="#2563eb" strokeWidth="3" />
          )}
          {c.type === 'V' && (
            <circle cx="0" cy="0" r="12" fill="white" stroke="#2563eb" strokeWidth="3" />
          )}
          {c.type === 'I' && (
             <g>
                <circle cx="0" cy="0" r="12" fill="white" stroke="#10b981" strokeWidth="3" />
                <path d="M -5 0 L 5 0 M 2 -3 L 5 0 L 2 3" fill="none" stroke="#10b981" strokeWidth="2" />
             </g>
          )}
        </g>
        <text x={midX} y={midY - 20} textAnchor="middle" className="text-[10px] font-bold fill-slate-500 uppercase">{c.id}</text>
        <text x={midX} y={midY + 25} textAnchor="middle" className="text-[10px] fill-slate-400">{c.originalValue}</text>
        
        {/* Delete button on hover */}
        <circle 
          cx={x2} cy={y2} r="6" 
          className="fill-red-500 opacity-0 group-hover:opacity-100 transition-opacity" 
          onClick={() => onRemoveComponent(c.id)}
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-white border-b border-slate-200 p-2 flex space-x-2">
        {(['R', 'V', 'I'] as ComponentType[]).map(t => (
          <button
            key={t}
            onClick={() => setPlacing({ type: t, start: null })}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${placing.type === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            + {t === 'R' ? 'Resistor' : t === 'V' ? 'Voltage Source' : 'Current Source'}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-slate-400 self-center uppercase font-bold tracking-widest px-2">
          {placing.start ? 'Click to place second terminal' : 'Click to place first terminal'}
        </span>
      </div>
      
      <div className="flex-1 relative overflow-auto bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-repeat">
        <svg 
          ref={svgRef}
          width="2000" 
          height="2000" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className="absolute top-0 left-0 touch-none"
        >
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              <circle cx="0" cy="0" r="1.5" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {components.map(renderComponent)}

          {/* Placement Preview */}
          {placing.start && (
            <g>
              <line x1={placing.start.x} y1={placing.start.y} x2={hoverPos.x} y2={hoverPos.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx={hoverPos.x} cy={hoverPos.y} r="4" fill="#3b82f6" />
            </g>
          )}

          {/* Hover highlight */}
          <circle cx={hoverPos.x} cy={hoverPos.y} r="3" fill="#94a3b8" className="pointer-events-none" />
        </svg>
      </div>
    </div>
  );
};

export default SchematicEditor;
