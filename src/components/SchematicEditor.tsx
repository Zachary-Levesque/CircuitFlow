import React, { useState, useRef, useEffect } from 'react';
import { Component, ComponentType } from '../engine/types';
import { Trash2, MousePointer2 } from 'lucide-react';

interface SchematicEditorProps {
  components: Component[];
  onAddComponent: (comp: Partial<Component>) => void;
  onRemoveComponent: (id: string) => void;
  onClear: () => void;
}

const GRID_SIZE = 40;

const SchematicEditor: React.FC<SchematicEditorProps> = ({ 
  components, 
  onAddComponent, 
  onRemoveComponent,
  onClear
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
      if (coords.x === placing.start.x && coords.y === placing.start.y) {
        setPlacing({ ...placing, start: null });
        return;
      }
      
      const count = components.filter(c => c.type === placing.type).length + 1;
      const id = `${placing.type}${count}`;
      const nodeA = `${placing.start.x/GRID_SIZE}_${placing.start.y/GRID_SIZE}`;
      const nodeB = `${coords.x/GRID_SIZE}_${coords.y/GRID_SIZE}`;
      
      onAddComponent({
        id,
        type: placing.type,
        nodeA,
        nodeB,
        value: placing.type === 'R' ? 1000 : (placing.type === 'W' ? 0 : 10),
        originalValue: placing.type === 'R' ? '1k' : (placing.type === 'W' ? '0' : '10'),
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
      <g key={c.id} className="group cursor-pointer">
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.type === 'W' ? '#64748b' : '#cbd5e1'} strokeWidth={c.type === 'W' ? '4' : '2'} />
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
          {c.type === 'W' && (
             <circle cx="0" cy="0" r="4" fill="#64748b" />
          )}
        </g>
        {c.type !== 'W' && (
          <>
            <text x={midX} y={midY - 20} textAnchor="middle" className="text-[10px] font-bold fill-slate-500 uppercase">{c.id}</text>
            <text x={midX} y={midY + 25} textAnchor="middle" className="text-[10px] fill-slate-400">{c.originalValue}</text>
          </>
        )}
        
        {/* Clickable delete zone */}
        <circle 
          cx={midX} cy={midY} r="15" 
          className="fill-red-500 opacity-0 group-hover:opacity-20 transition-opacity" 
          onClick={(e) => { e.stopPropagation(); onRemoveComponent(c.id); }}
        />
        <Trash2 
          x={midX - 8} y={midY - 8} size={16} 
          className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
      <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between">
        <div className="flex space-x-2">
          {(['R', 'V', 'I', 'W'] as ComponentType[]).map(t => (
            <button
              key={t}
              onClick={() => setPlacing({ type: t, start: null })}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${placing.type === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {t === 'R' ? 'Resistor' : t === 'V' ? 'Voltage' : t === 'I' ? 'Current' : 'Wire'}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
            <MousePointer2 size={14} className={placing.start ? 'animate-pulse' : ''} />
            <span className="text-[10px] font-black uppercase tracking-tight">
              {placing.start ? 'Select End Point' : 'Select Start Point'}
            </span>
          </div>
          <button 
            onClick={onClear}
            className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
          >
            <Trash2 size={14} />
            <span>Clear All</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-auto bg-slate-50">
        <svg 
          ref={svgRef}
          width="2000" 
          height="2000" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className="absolute top-0 left-0 touch-none cursor-crosshair"
        >
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              <circle cx="0" cy="0" r="1.5" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Ground Marker */}
          <g transform={`translate(${GRID_SIZE*10}, ${GRID_SIZE*10})`}>
            <path d="M -10 0 L 10 0 M -7 4 L 7 4 M -3 8 L 3 8" stroke="#94a3b8" strokeWidth="2" />
            <text y="-10" textAnchor="middle" className="text-[10px] font-black fill-slate-400">GND (0)</text>
          </g>

          {components.map(renderComponent)}

          {/* Placement Preview */}
          {placing.start && (
            <g>
              <line 
                x1={placing.start.x} y1={placing.start.y} 
                x2={hoverPos.x} y2={hoverPos.y} 
                stroke="#3b82f6" strokeWidth={placing.type === 'W' ? '4' : '2'} 
                strokeDasharray="4 4" 
              />
              <circle cx={hoverPos.x} cy={hoverPos.y} r="4" fill="#3b82f6" />
            </g>
          )}

          {/* Hover highlight */}
          <circle cx={hoverPos.x} cy={hoverPos.y} r="3" fill="#3b82f6" className="pointer-events-none opacity-50" />
        </svg>
      </div>
    </div>
  );
};

export default SchematicEditor;
