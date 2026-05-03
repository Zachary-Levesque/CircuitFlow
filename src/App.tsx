import React, { useState, useEffect } from 'react';
import { Play, FileText, Activity, AlertCircle, Layout, Database, Edit3, Code } from 'lucide-react';
import { parseNetlist } from './engine/parser';
import { serializeCircuit } from './engine/parser/serializer';
import { solveDC } from './engine/solver';
import { SimulationResult, Circuit, Component } from './engine/types';
import { EXAMPLES } from './examples';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import SchematicEditor from './components/SchematicEditor';

const App: React.FC = () => {
  const [netlist, setNetlist] = useState(EXAMPLES[0].netlist);
  const [components, setComponents] = useState<Component[]>([]);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'visual' | 'code'>('code');

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

  const chartData = results ? Object.entries(results.nodeVoltages)
    .filter(([node]) => node !== '0')
    .map(([node, voltage]) => ({
      name: `Node ${node}`,
      voltage: parseFloat(voltage.toFixed(4))
    })) : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
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
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">LATEST BUILD</span>
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
        <div className="lg:col-span-7 space-y-6 overflow-auto">
          {results ? (
            <>
              {/* Visualization */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Layout className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-tight">Voltage Distribution</h2>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded">DC OPERATING POINT</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} label={{ value: 'Volts', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 700 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="voltage" radius={[6, 6, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.voltage >= 0 ? '#3b82f6' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                {/* Voltages Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Nodal Potentials</span>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase bg-slate-50/50 text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 font-black">Node Identifier</th>
                        <th className="px-5 py-3 font-black">Value (V)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(results.nodeVoltages).sort().map(([node, voltage]) => (
                        <tr key={node} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-5 py-3 font-bold text-slate-700">
                            {node === '0' ? <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">GROUND REFERENCE</span> : `NODE ${node}`}
                          </td>
                          <td className={`px-5 py-3 font-mono font-bold ${voltage === 0 ? 'text-slate-300' : 'text-blue-600'}`}>
                            {voltage.toFixed(6)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Currents Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Component Analysis</span>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase bg-slate-50/50 text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 font-black">ID</th>
                        <th className="px-5 py-3 font-black">ΔV (V)</th>
                        <th className="px-5 py-3 font-black">I (A)</th>
                        <th className="px-5 py-3 font-black">P (W)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(results.branchCurrents)
                        .filter(([id]) => !id.startsWith('W'))
                        .map(([id, current]) => (
                          <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3 font-black text-slate-500">{id}</td>
                            <td className="px-5 py-3 font-mono font-bold text-blue-600">
                              {results.voltageDrops[id]?.toFixed(4)}
                            </td>
                            <td className="px-5 py-3 font-mono font-bold text-emerald-600">
                              {current.toExponential(2)}
                            </td>
                            <td className="px-5 py-3 font-mono font-bold text-amber-600">
                              {results.powerDissipation[id]?.toExponential(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 p-6 rounded-full mb-6">
                <Activity className="w-16 h-16 opacity-20" />
              </div>
              <p className="text-xl font-black uppercase tracking-tighter text-slate-400">Engine Standby</p>
              <p className="text-sm font-medium mt-2">Initialize simulation to view analysis</p>
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
