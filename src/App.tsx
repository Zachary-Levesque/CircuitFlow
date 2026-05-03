import React, { useState, useEffect } from 'react';
import { FileText, Activity, AlertCircle, Edit3, Code } from 'lucide-react';
import { parseNetlist } from './engine/parser';
import { serializeCircuit } from './engine/parser/serializer';
import { solveDC } from './engine/solver';
import { SimulationResult, Component } from './engine/types';
import { EXAMPLES } from './examples';
import SchematicEditor from './components/SchematicEditor';

const App: React.FC = () => {
  const [netlist, setNetlist] = useState(EXAMPLES[0].netlist);
  const [components, setComponents] = useState<Component[]>([]);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');

  // Initialize components on mount
  useEffect(() => {
    try {
      const circuit = parseNetlist(netlist);
      setComponents(circuit.components);
      runSimulation(netlist);
    } catch (e) {}
  }, []);

  const runSimulation = (currentNetlist: string = netlist) => {
    try {
      const circuit = parseNetlist(currentNetlist);
      const res = solveDC(circuit);
      if (res.error) {
        setError(res.error);
        setResults(null);
      } else {
        setResults(res);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during simulation');
      setResults(null);
    }
  };

  const handleAddComponent = (comp: Partial<Component>) => {
    const newComponents = [...components, comp as Component];
    setComponents(newComponents);
    const newNetlist = serializeCircuit(newComponents);
    setNetlist(newNetlist);
    runSimulation(newNetlist);
  };

  const handleUpdateComponent = (id: string, updates: Partial<Component>) => {
    const newComponents = components.map(c => c.id === id ? { ...c, ...updates } : c);
    setComponents(newComponents);
    const newNetlist = serializeCircuit(newComponents);
    setNetlist(newNetlist);
    runSimulation(newNetlist);
  };

  const handleRemoveComponent = (id: string) => {
    const newComponents = components.filter(c => c.id !== id);
    setComponents(newComponents);
    const newNetlist = serializeCircuit(newComponents);
    setNetlist(newNetlist);
    runSimulation(newNetlist);
  };

  const handleClear = () => {
    setComponents([]);
    setNetlist('* New Circuit\n');
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-10 gap-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">CircuitFlow</h1>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-nowrap">DC Analysis Live</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setEditorMode('code')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${editorMode === 'code' ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </button>
          <button 
            onClick={() => setEditorMode('visual')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${editorMode === 'visual' ? 'bg-white shadow-md text-blue-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Visual</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <select 
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-black text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none uppercase tracking-widest"
            onChange={(e) => {
              const ex = EXAMPLES.find(x => x.name === e.target.value);
              if (ex) {
                setNetlist(ex.netlist);
                const circuit = parseNetlist(ex.netlist);
                setComponents(circuit.components);
                runSimulation(ex.netlist);
              }
            }}
          >
            {EXAMPLES.map(ex => (
              <option key={ex.name} value={ex.name}>{ex.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Editor Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4 h-[700px]">
          {editorMode === 'code' ? (
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-700">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">SPICE Source</span>
                </div>
              </div>
              <textarea
                value={netlist}
                onChange={(e) => {
                  setNetlist(e.target.value);
                  try {
                    const c = parseNetlist(e.target.value);
                    setComponents(c.components);
                    runSimulation(e.target.value);
                  } catch(e) {}
                }}
                className="flex-1 p-6 font-mono text-sm bg-slate-900 text-emerald-400 focus:outline-none resize-none leading-relaxed selection:bg-emerald-900 selection:text-white"
                spellCheck={false}
              />
            </div>
          ) : (
            <SchematicEditor 
              components={components} 
              onAddComponent={handleAddComponent} 
              onRemoveComponent={handleRemoveComponent}
              onUpdateComponent={handleUpdateComponent}
              onClear={handleClear}
            />
          )}
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-r-2xl flex items-start space-x-3 shadow-md animate-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest mb-1">Engine Error</h3>
                <p className="text-sm font-medium leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col h-[700px]">
          {results ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
              <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-slate-700">Analysis Results</span>
                </div>
                <div className="text-[10px] font-black text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm uppercase tracking-tighter">
                  Real-Time Engine Sync
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-[11px] uppercase bg-slate-50/50 text-slate-400 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="px-8 py-5 font-black tracking-widest">ID</th>
                      <th className="px-8 py-5 font-black tracking-widest">Potential ΔV</th>
                      <th className="px-8 py-5 font-black tracking-widest">Current (I)</th>
                      <th className="px-8 py-5 font-black tracking-widest">Power (P)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(results.branchCurrents)
                      .filter(([id]) => !id.startsWith('W'))
                      .map(([id, current]) => (
                        <tr key={id} className="hover:bg-blue-50/50 transition-all group border-l-4 border-l-transparent hover:border-l-blue-600">
                          <td className="px-8 py-5 font-black text-slate-600 group-hover:text-blue-600 transition-colors">{id}</td>
                          <td className="px-8 py-5 font-mono font-bold text-slate-900">
                            {results.voltageDrops[id]?.toFixed(4)} <span className="text-[10px] text-slate-400 ml-1 font-black uppercase">V</span>
                          </td>
                          <td className="px-8 py-5 font-mono font-bold text-emerald-600">
                            {current.toExponential(2)} <span className="text-[10px] text-slate-400 ml-1 font-black uppercase">A</span>
                          </td>
                          <td className="px-8 py-5 font-mono font-bold text-amber-600">
                            {results.powerDissipation[id]?.toExponential(2)} <span className="text-[10px] text-slate-400 ml-1 font-black uppercase">W</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12">
              <div className="bg-slate-50 p-10 rounded-full mb-8 ring-8 ring-slate-50/50">
                <Activity className="w-20 h-20 opacity-20 text-blue-600" />
              </div>
              <p className="text-2xl font-black uppercase tracking-tighter text-slate-400 mb-2">Engine Idle</p>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Connect to ground node to begin analysis</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-[1600px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="font-black text-[10px] uppercase tracking-[0.3em]">MNA Engine: Operational</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
            CircuitFlow precision suite • Build 1.0.45
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
