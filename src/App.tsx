import React, { useState, useEffect } from 'react';
import { Play, FileText, Activity, AlertCircle, Layout, Database } from 'lucide-react';
import { parseNetlist } from './engine/parser';
import { solveDC } from './engine/solver';
import { SimulationResult, Circuit } from './engine/types';
import { EXAMPLES } from './examples';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [netlist, setNetlist] = useState(EXAMPLES[0].netlist);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = () => {
    try {
      const circuit = parseNetlist(netlist);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">CircuitFlow</h1>
            <p className="text-xs text-slate-500 font-medium">Real-time Nodal Analysis Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            className="bg-slate-100 border-none rounded-md px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const ex = EXAMPLES.find(x => x.name === e.target.value);
              if (ex) setNetlist(ex.netlist);
            }}
          >
            {EXAMPLES.map(ex => (
              <option key={ex.name} value={ex.name}>{ex.name}</option>
            ))}
          </select>
          <button 
            onClick={runSimulation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md flex items-center space-x-2 transition-colors font-semibold text-sm shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run Simulation</span>
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        {/* Editor Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Netlist Editor</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">SPICE Syntax</span>
            </div>
            <textarea
              value={netlist}
              onChange={(e) => setNetlist(e.target.value)}
              className="flex-1 p-4 font-mono text-sm bg-slate-900 text-slate-300 focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Simulation Error</h3>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-6">
          {results && (
            <>
              {/* Visualization */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Layout className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Node Voltages Visualization</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="voltage" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.voltage >= 0 ? '#2563eb' : '#dc2626'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voltages Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Node Voltages</span>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-bold">Node</th>
                        <th className="px-4 py-2 font-bold">Voltage (V)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(results.nodeVoltages).sort().map(([node, voltage]) => (
                        <tr key={node} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{node === '0' ? '0 (GND)' : node}</td>
                          <td className={`px-4 py-2.5 font-mono ${voltage === 0 ? 'text-slate-400' : 'text-blue-600'}`}>
                            {voltage.toFixed(4)} V
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Currents Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center space-x-2">
                    <Database className="w-4 h-4 text-slate-700" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-700">Branch Currents</span>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-bold">Component</th>
                        <th className="px-4 py-2 font-bold">Current (A)</th>
                        <th className="px-4 py-2 font-bold">Power (W)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(results.branchCurrents).map(([id, current]) => (
                        <tr key={id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium">{id}</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-600">
                            {current.toExponential(3)} A
                          </td>
                          <td className="px-4 py-2.5 font-mono text-amber-600">
                            {results.powerDissipation[id]?.toExponential(3)} W
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!results && !error && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Ready to simulate</p>
              <p className="text-sm">Click "Run Simulation" to see results</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 opacity-60">
            <Activity className="w-5 h-5" />
            <span className="font-bold text-sm tracking-tight">CircuitFlow v1.0.0</span>
          </div>
          <div className="text-slate-500 text-xs">
            Built with React, TypeScript, and Nodal Analysis Engineering
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
