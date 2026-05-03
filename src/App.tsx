import React, { useState, useEffect } from 'react';
import { Play, FileText, Activity, AlertCircle, Edit3, Code } from 'lucide-react';
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
  const [mode, setMode] = useState<'visual' | 'code'>('visual');

  useEffect(() => {
    try {
      const circuit = parseNetlist(netlist);
      setComponents(circuit.components);
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

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">CircuitFlow</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">MNA Simulation Suite</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button 
            onClick={() => setMode('code')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'code' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Code className="w-4 h-4" />
            <span>Code View</span>
          </button>
          <button 
            onClick={() => setMode('visual')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'visual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Visual Editor</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <select 
            className="bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
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
              <option key={ex.name} value={ex.name}>{ex.name}</option>
            ))}
          </select>
          <button 
            onClick={() => runSimulation()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-md flex items-center space-x-2 transition-all font-bold text-sm shadow-lg shadow-blue-200 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Simulate</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        {/* Editor Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-4 h-[700px]">
          {mode === 'code' ? (
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-700">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Netlist (SPICE)</span>
                </div>
              </div>
              <textarea
                value={netlist}
                onChange={(e) => {
                  setNetlist(e.target.value);
                  try {
                    const c = parseNetlist(e.target.value);
                    setComponents(c.components);
                  } catch(e) {}
                }}
                className="flex-1 p-6 font-mono text-sm bg-slate-900 text-emerald-400 focus:outline-none resize-none leading-relaxed"
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
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider">Engine Fault</h3>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 flex flex-col h-[700px]">
          {results ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-black uppercase tracking-widest text-slate-700">Component Analysis</span>
                </div>
                <div className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  DC OPERATING POINT
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-black">ID</th>
                      <th className="px-6 py-4 font-black">Voltage (V)</th>
                      <th className="px-6 py-4 font-black">Current (A)</th>
                      <th className="px-6 py-4 font-black">Power (W)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(results.branchCurrents)
                      .filter(([id]) => !id.startsWith('W'))
                      .map(([id, current]) => (
                        <tr key={id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4 font-black text-slate-600 group-hover:text-blue-600 transition-colors">{id}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">
                            {results.voltageDrops[id]?.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600">
                            {current.toExponential(2)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-600">
                            {results.powerDissipation[id]?.toExponential(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-white rounded-xl border-2 border-dashed border-slate-200 p-12">
              <div className="bg-slate-50 p-8 rounded-full mb-6 ring-8 ring-slate-50/50">
                <Activity className="w-16 h-16 opacity-20" />
              </div>
              <p className="text-xl font-black uppercase tracking-tighter text-slate-400">Analysis Pending</p>
              <p className="text-sm font-medium mt-2 text-slate-400">Configure your circuit and click simulate</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-slate-400">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-black text-[10px] uppercase tracking-[0.2em]">Engine Status: Operational</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest">
            Experimental Modified Nodal Analysis Engine • v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
