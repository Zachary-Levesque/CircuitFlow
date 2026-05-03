import React, { useState, useRef } from 'react';
import { Component, ComponentType } from '../engine/types';
import { Trash2, MousePointer2, Settings2, X, Check } from 'lucide-react';

interface SchematicEditorProps {
  components: Component[];
  onAddComponent: (comp: Partial<Component>) => void;
  onRemoveComponent: (id: string) => void;
  onUpdateComponent: (id: string, updates: Partial<Component>) => void;
  onClear: () => void;
}

const GRID_SIZE = 40;
const GROUND_COORD = { x: 10, y: 10 };

const SchematicEditor: React.FC<SchematicEditorProps> = ({ 
  components, 
  onAddComponent, 
  onRemoveComponent,
  onUpdateComponent,
  onClear
}) => {
  const [placing, setPlacing] = useState<{ type: ComponentType | 'SELECT'; start: { x: number; y: number } | null }>({ type: 'SELECT', start: null });
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<{ id: string, val: string } | null>(null);
  
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
      // De-select if clicking empty space
      if (!selectedId) setSelectedId(null);
      return;
    }

    if (!placing.start) {
      setPlacing({ ...placing, start: coords });
    } else {
      if (coords.x === placing.start.x && coords.y === placing.start.y) {
        setPlacing({ ...placing, start: null });
        return;
      }
      
      const type = placing.type as ComponentType;
      const count = components.filter(c => c.type === type).length + 1;
      const id = `${type}${count}`;
      const nodeA = toNodeName(placing.start.x, placing.start.y);
      const nodeB = toNodeName(coords.x, coords.y);
      
      onAddComponent({
        id,
        type,
        nodeA,
        nodeB,
        value: type === 'R' ? 1000 : (type === 'W' ? 0 : 10),
        originalValue: type === 'R' ? '1k' : (type === 'W' ? '0' : '10'),
        position: { x1: placing.start.x, y1: placing.start.y, x2: coords.x, y2: coords.y }
      });
      setPlacing({ ...placing, start: null });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoverPos(getGridCoords(e));
  };

  const openEditor = (c: Component) => {
    setSelectedId(c.id);
    setEditBuffer({ id: c.id, val: c.originalValue });
  };

  const saveEdits = () => {
    if (selectedId && editBuffer) {
      onUpdateComponent(selectedId, { id: editBuffer.id, originalValue: editBuffer.val });
      setSelectedId(null);
      setEditBuffer(null);
    }
  };

  const renderComponent = (c: Component) => {
    if (!c.position) return null;
    const { x1, y1, x2, y2 } = c.position;
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
        {/* Selection Highlight */}
        {isSelected && (
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3b82f6" strokeWidth="12" strokeOpacity="0.1" strokeLinecap="round" />
        )}

        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.type === 'W' ? (isSelected ? '#3b82f6' : '#64748b') : '#cbd5e1'} strokeWidth={c.type === 'W' ? '4' : '2'} />
        
        <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
          {c.type === 'R' && (
            <path d="M -15 0 L -10 0 L -7.5 -5 L -2.5 5 L 2.5 -5 L 7.5 5 L 10 0 L 15 0" fill="none" stroke={isSelected ? '#3b82f6' : '#2563eb'} strokeWidth="3" />
          )}
          {c.type === 'V' && (
            <circle cx="0" cy="0" r="12" fill="white" stroke={isSelected ? '#3b82f6' : '#2563eb'} strokeWidth="3" />
          )}
          {c.type === 'I' && (
             <g>
                <circle cx="0" cy="0" r="12" fill="white" stroke={isSelected ? '#3b82f6' : '#10b981'} strokeWidth="3" />
                <path d="M -5 0 L 5 0 M 2 -3 L 5 0 L 2 3" fill="none" stroke={isSelected ? '#3b82f6' : '#10b981'} strokeWidth="2" />
             </g>
          )}
          {c.type === 'W' && (
             <circle cx="0" cy="0" r="4" fill={isSelected ? '#3b82f6' : '#64748b'} />
          )}
        </g>
        
        {c.type !== 'W' && (
          <g className="pointer-events-none">
            <text x={midX} y={midY - 20} textAnchor="middle" className={`text-[10px] font-black uppercase ${isSelected ? 'fill-blue-600' : 'fill-slate-500'}`}>{c.id}</text>
            <text x={midX} y={midY + 25} textAnchor="middle" className={`text-[10px] font-bold ${isSelected ? 'fill-blue-500' : 'fill-slate-400'}`}>{c.originalValue}</text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner relative">
      <div className="bg-white border-b border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex space-x-1">
          <button
            onClick={() => { setPlacing({ type: 'SELECT', start: null }); setSelectedId(null); }}
            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all flex items-center space-x-1 ${placing.type === 'SELECT' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <MousePointer2 size={12} />
            <span>Select</span>
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
          {(['R', 'V', 'I', 'W'] as ComponentType[]).map(t => (
            <button
              key={t}
              onClick={() => { setPlacing({ type: t, start: null }); setSelectedId(null); }}
              className={`px-2 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${placing.type === t ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {t === 'R' ? 'Res' : t === 'V' ? 'Volt' : t === 'I' ? 'Curr' : 'Wire'}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={onClear}
            className="flex items-center space-x-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-[10px] font-black uppercase transition-all"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative overflow-auto bg-slate-50 scrollbar-hide">
        <svg 
          ref={svgRef}
          width="2000" 
          height="2000" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          className={`absolute top-0 left-0 touch-none ${placing.type === 'SELECT' ? 'cursor-default' : 'cursor-crosshair'}`}
        >
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
              <circle cx="0" cy="0" r="1.5" fill="#cbd5e1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" onClick={() => { setSelectedId(null); setEditBuffer(null); }} />
          
          <g transform={`translate(${GRID_SIZE*GROUND_COORD.x}, ${GRID_SIZE*GROUND_COORD.y})`}>
            <circle r="8" fill="#10b981" fillOpacity="0.1" />
            <path d="M -8 0 L 8 0 M -5 3 L 5 3 M -2 6 L 2 6" stroke="#10b981" strokeWidth="2" />
            <text y="-12" textAnchor="middle" className="text-[9px] font-black fill-emerald-600 uppercase tracking-tighter">GROUND (0)</text>
          </g>

          {components.map(renderComponent)}

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

          {placing.type !== 'SELECT' && (
            <circle cx={hoverPos.x} cy={hoverPos.y} r="3" fill="#3b82f6" className="pointer-events-none opacity-50" />
          )}
        </svg>

        {/* Property Editor Overlay */}
        {selectedId && editBuffer && (
          <div className="absolute top-4 right-4 bg-white border border-slate-200 shadow-2xl rounded-xl p-4 w-64 animate-in slide-in-from-right-4 z-20">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-slate-800">
                <Settings2 size={16} />
                <span className="text-xs font-black uppercase">Edit Component</span>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Identifier</label>
                <input 
                  type="text" 
                  value={editBuffer.id} 
                  onChange={e => setEditBuffer({...editBuffer, id: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              {!selectedId.startsWith('W') && (
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Value (Units supported)</label>
                  <input 
                    type="text" 
                    value={editBuffer.val} 
                    onChange={e => setEditBuffer({...editBuffer, val: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-2 border-t border-slate-100">
                <button 
                  onClick={() => { onRemoveComponent(selectedId); setSelectedId(null); }}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[10px] font-black uppercase transition-all"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
                <button 
                  onClick={saveEdits}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-[10px] font-black uppercase transition-all"
                >
                  <Check size={12} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchematicEditor;
