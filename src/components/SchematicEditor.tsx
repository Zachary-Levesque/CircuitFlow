import React, { useState, useRef } from 'react';
import { Component, ComponentType, AnalysisMode } from '../engine/types';
import { Trash2, MousePointer2, Settings2, X, Check, RotateCw } from 'lucide-react';

interface SchematicEditorProps {
  components: Component[];
  onAddComponent: (comp: Partial<Component>) => void;
  onRemoveComponent: (id: string) => void;
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
  onClear: () => void;
  mode: AnalysisMode;
}

const GRID_SIZE = 40;
const GROUND_COORD = { x: 10, y: 10 };

const SchematicEditor: React.FC<SchematicEditorProps> = ({ 
  components, 
  onAddComponent, 
  onRemoveComponent,
  onUpdateComponent,
  onClear,
  mode
}) => {
  const [placing, setPlacing] = useState<{ type: ComponentType | 'SELECT'; start: { x: number; y: number } | null, stage: number }>({ type: 'SELECT', start: null, stage: 0 });
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<{ id: string, val: string, phase?: string, beta?: string } | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  const toNodeName = (x: number, y: number) => {
    const gx = x / GRID_SIZE;
    const gy = y / GRID_SIZE;
    if (gx === GROUND_COORD.x && gy === GROUND_COORD.y) return '0';
    return `${gx}_${gy}`;
  };

  const getGridCoords = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / GRID_SIZE) * GRID_SIZE;
    const y = Math.round((e.clientY - rect.top) / GRID_SIZE) * GRID_SIZE;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getGridCoords(e);
    
    if (placing.type === 'SELECT') {
      if (!selectedId) setSelectedId(null);
      return;
    }

    if (!placing.start) {
      setPlacing({ ...placing, start: coords, stage: 1 });
    } else {
      if (placing.type === 'Q') {
        if (placing.stage === 1) {
          // Second click for Transistor (Emitter)
          setPlacing({ ...placing, stage: 2, start: placing.start, extra: coords } as any);
        } else {
          // Third click for Transistor (Collector)
          const type = 'Q';
          const count = components.filter(c => c.type === type).length + 1;
          const id = `${type}${count}`;
          const nodeB = toNodeName(placing.start.x, placing.start.y); // Base
          const nodeE = toNodeName((placing as any).extra.x, (placing as any).extra.y); // Emitter
          const nodeC = toNodeName(coords.x, coords.y); // Collector
          
          onAddComponent({
            id, type, nodeA: nodeB, nodeB: nodeE, nodeC,
            value: 0, originalValue: 'NPN', beta: 100,
            position: { x1: placing.start.x, y1: placing.start.y, x2: (placing as any).extra.x, y2: (placing as any).extra.y, x3: coords.x, y3: coords.y }
          });
          setPlacing({ type: 'SELECT', start: null, stage: 0 });
        }
        return;
      }

      if (coords.x === placing.start.x && coords.y === placing.start.y) {
        setPlacing({ ...placing, start: null, stage: 0 });
        return;
      }
      
      const type = placing.type as ComponentType;
      const count = components.filter(c => c.type === type).length + 1;
      const id = `${type}${count}`;
      const nodeA = toNodeName(placing.start.x, placing.start.y);
      const nodeB = toNodeName(coords.x, coords.y);
      
      onAddComponent({
        id, type, nodeA, nodeB,
        value: type === 'R' ? 1000 : (type === 'W' ? 0 : (type === 'L' ? 0.001 : (type === 'C' ? 0.000001 : 10))),
        originalValue: type === 'R' ? '1k' : (type === 'W' ? '0' : (type === 'L' ? '1m' : (type === 'C' ? '1u' : '10'))),
        phase: (type === 'V' || type === 'I') ? 0 : undefined,
        position: { x1: placing.start.x, y1: placing.start.y, x2: coords.x, y2: coords.y }
      });
      setPlacing({ ...placing, start: null, stage: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoverPos(getGridCoords(e));
  };

  const openEditor = (c: Component) => {
    setSelectedId(c.id);
    setEditBuffer({ id: c.id, val: c.originalValue, phase: c.phase?.toString(), beta: c.beta?.toString() });
  };

  const saveEdits = () => {
    if (selectedId && editBuffer) {
      onUpdateComponent(selectedId, { 
        id: editBuffer.id, 
        originalValue: editBuffer.val,
        phase: editBuffer.phase ? parseFloat(editBuffer.phase) : undefined,
        beta: editBuffer.beta ? parseFloat(editBuffer.beta) : undefined
      });
      setSelectedId(null);
      setEditBuffer(null);
    }
  };

  const handleFlip = (c: Component) => {
    if (!c.position) return;
    onUpdateComponent(c.id, {
      nodeA: c.nodeB,
      nodeB: c.nodeA,
      position: {
        x1: c.position.x2,
        y1: c.position.y2,
        x2: c.position.x1,
        y2: c.position.y1
      }
    });
  };

  const selectedComponent = selectedId ? components.find((component) => component.id === selectedId) ?? null : null;
  const canFlipSelectedComponent = selectedComponent !== null && selectedComponent.type !== 'W' && selectedComponent.type !== 'Q';

  const renderComponent = (c: Component) => {
    if (!c.position) return null;
    const { x1, y1, x2, y2, x3, y3 } = c.position;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const isSelected = selectedId === c.id;

    return (
      <g 
        key={c.id} 
        className={`group cursor-pointer transition-opacity ${isSelected ? 'opacity-100' : 'hover:opacity-80'}`}
        onClick={(e) => { e.stopPropagation(); openEditor(c); }}
      >
        {isSelected && (
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="12" strokeOpacity="0.1" strokeLinecap="round" />
        )}

        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.type === 'W' ? (isSelected ? '#3b82f6' : '#64748b') : '#cbd5e1'} strokeWidth={c.type === 'W' ? '4' : '2'} />
        
        <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
          {c.type === 'R' && <path d="M -15 0 L -10 0 L -7.5 -5 L -2.5 5 L 2.5 -5 L 7.5 5 L 10 0 L 15 0" fill="none" stroke={isSelected ? '#3b82f6' : '#2563eb'} strokeWidth="3" />}
          {c.type === 'V' && <circle cx="0" cy="0" r="12" fill="white" stroke={isSelected ? '#3b82f6' : '#2563eb'} strokeWidth="3" />}
          {c.type === 'I' && (
             <g>
                <circle cx="0" cy="0" r="12" fill="white" stroke={isSelected ? '#3b82f6' : '#10b981'} strokeWidth="3" />
                <path d="M -5 0 L 5 0 M 2 -3 L 5 0 L 2 3" fill="none" stroke={isSelected ? '#3b82f6' : '#10b981'} strokeWidth="2" />
             </g>
          )}
          {c.type === 'L' && <path d="M -15 0 L -10 0 C -10 -8 -5 -8 -5 0 C -5 -8 0 -8 0 0 C 0 -8 5 -8 5 0 C 5 -8 10 -8 10 0 L 15 0" fill="none" stroke={isSelected ? '#3b82f6' : '#8b5cf6'} strokeWidth="3" />}
          {c.type === 'C' && (
             <g>
                <line x1="-15" y1="0" x2="-2" y2="0" stroke={isSelected ? '#3b82f6' : '#f59e0b'} strokeWidth="3" />
                <line x1="15" y1="0" x2="2" y2="0" stroke={isSelected ? '#3b82f6' : '#f59e0b'} strokeWidth="3" />
                <line x1="-2" y1="-10" x2="-2" y2="10" stroke={isSelected ? '#3b82f6' : '#f59e0b'} strokeWidth="3" />
                <line x1="2" y1="-10" x2="2" y2="10" stroke={isSelected ? '#3b82f6' : '#f59e0b'} strokeWidth="3" />
             </g>
          )}
          {c.type === 'D' && (
             <g>
                <line x1="-15" y1="0" x2="-8" y2="0" stroke={isSelected ? '#3b82f6' : '#ef4444'} strokeWidth="3" />
                <line x1="15" y1="0" x2="8" y2="0" stroke={isSelected ? '#3b82f6' : '#ef4444'} strokeWidth="3" />
                <path d="M -8 -8 L 8 0 L -8 8 Z" fill="white" stroke={isSelected ? '#3b82f6' : '#ef4444'} strokeWidth="3" />
                <line x1="8" y1="-8" x2="8" y2="8" stroke={isSelected ? '#3b82f6' : '#ef4444'} strokeWidth="3" />
             </g>
          )}
          {c.type === 'Q' && x3 !== undefined && y3 !== undefined && (
             <g transform={`rotate(${-angle})`}>
                <line x1={x1-midX} y1={y1-midY} x2={-10} y2={0} stroke={isSelected ? '#3b82f6' : '#6366f1'} strokeWidth="3" />
                <line x1={x2-midX} y1={y2-midY} x2={10} y2={10} stroke={isSelected ? '#3b82f6' : '#6366f1'} strokeWidth="3" />
                <line x1={x3-midX} y1={y3-midY} x2={10} y2={-10} stroke={isSelected ? '#3b82f6' : '#6366f1'} strokeWidth="3" />
                <line x1="-10" y1="-15" x2="-10" y2="15" stroke={isSelected ? '#3b82f6' : '#6366f1'} strokeWidth="5" />
                <path d="M 10 10 L 10 -10" stroke={isSelected ? '#3b82f6' : '#6366f1'} strokeWidth="3" />
                <circle cx="0" cy="0" r="20" fill="none" stroke={isSelected ? '#3b82f6' : '#6366f1'} strokeWidth="2" strokeDasharray="4 2" />
             </g>
          )}
          {c.type === 'W' && <circle cx="0" cy="0" r="4" fill={isSelected ? '#3b82f6' : '#64748b'} />}

          {c.type !== 'W' && c.type !== 'Q' && (
            <>
              <g transform={`translate(-25, -12) rotate(${-angle})`}>
                <text textAnchor="middle" dominantBaseline="middle" className="text-[14px] font-black fill-red-500">+</text>
              </g>
              <g transform={`translate(25, -12) rotate(${-angle})`}>
                <text textAnchor="middle" dominantBaseline="middle" className="text-[14px] font-black fill-slate-500">-</text>
              </g>
            </>
          )}
        </g>
        
        {c.type !== 'W' && (
          <g className="pointer-events-none">
            <text x={midX} y={midY - 20} textAnchor="middle" className={`text-[10px] font-black uppercase ${isSelected ? 'fill-blue-600' : 'fill-slate-500'}`}>{c.id}</text>
            <text x={midX} y={midY + 25} textAnchor="middle" className={`text-[10px] font-bold ${isSelected ? 'fill-blue-500' : 'fill-slate-400'}`}>{c.originalValue}{c.phase ? ` / ${c.phase}°` : ''}</text>
          </g>
        )}
      </g>
    );
  };

  const availableTypes: ComponentType[] = mode === 'DC' ? ['R', 'V', 'I', 'W'] : ['R', 'L', 'C', 'D', 'Q', 'V', 'I', 'W'];

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner relative">
      <div className="bg-white border-b border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex space-x-1">
          <button
            onClick={() => { setPlacing({ type: 'SELECT', start: null, stage: 0 }); setSelectedId(null); }}
            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all flex items-center space-x-1 ${placing.type === 'SELECT' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <MousePointer2 size={12} />
            <span>Select</span>
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
          {availableTypes.map(t => (
            <button
              key={t}
              onClick={() => { setPlacing({ type: t, start: null, stage: 0 }); setSelectedId(null); }}
              className={`px-2 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${placing.type === t ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={onClear} className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[10px] font-black uppercase transition-all"><Trash2 size={12} /></button>
      </div>
      
      <div className="flex-1 relative overflow-auto bg-slate-50">
        <svg 
          ref={svgRef} width="2000" height="2000" 
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          className={`absolute top-0 left-0 touch-none ${placing.type === 'SELECT' ? 'cursor-default' : 'cursor-crosshair'}`}
        >
          <defs><pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1.5" fill="#cbd5e1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" onClick={() => { setSelectedId(null); setEditBuffer(null); }} />
          <g transform={`translate(${GRID_SIZE*GROUND_COORD.x}, ${GRID_SIZE*GROUND_COORD.y})`}><circle r="8" fill="#10b981" fillOpacity="0.1" /><path d="M -8 0 L 8 0 M -5 3 L 5 3 M -2 6 L 2 6" stroke="#10b981" strokeWidth="2" /></g>
          {components.map(renderComponent)}
          {placing.start && (
            <g>
              <line x1={placing.start.x} y1={placing.start.y} x2={hoverPos.x} y2={hoverPos.y} stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
              {(placing as any).extra && <line x1={(placing as any).extra.x} y1={(placing as any).extra.y} x2={hoverPos.x} y2={hoverPos.y} stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />}
            </g>
          )}
        </svg>

        {selectedId && editBuffer && (
          <div className="absolute top-4 right-4 bg-white border border-slate-200 shadow-2xl rounded-xl p-4 w-64 animate-in slide-in-from-right-4 z-20">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase">Edit Component</span>
              <button onClick={() => setSelectedId(null)}><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={editBuffer.id} onChange={e => setEditBuffer({...editBuffer, id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold outline-none" />
              {!selectedId.startsWith('W') && !selectedId.startsWith('Q') && <input type="text" value={editBuffer.val} onChange={e => setEditBuffer({...editBuffer, val: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold outline-none" />}
              {selectedId.startsWith('Q') && <input type="text" placeholder="Beta" value={editBuffer.beta || ''} onChange={e => setEditBuffer({...editBuffer, beta: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold outline-none" />}
              <div className="flex gap-2 pt-2 border-t border-slate-100 flex-wrap">
                {canFlipSelectedComponent && selectedComponent && (
                  <button
                    onClick={() => handleFlip(selectedComponent)}
                    className="flex-1 min-w-[110px] bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                  >
                    <RotateCw size={12} />
                    <span>Flip</span>
                  </button>
                )}
                <button onClick={() => { onRemoveComponent(selectedId); setSelectedId(null); }} className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[10px] font-black uppercase"><Trash2 size={12} /></button>
                <button onClick={saveEdits} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchematicEditor;
