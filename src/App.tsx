import React, { useState, useEffect } from 'react';
import { Play, FileText, Activity, AlertCircle, Edit3, Code, ArrowLeft, BarChart3, List } from 'lucide-react';
import { parseNetlist } from './engine/parser';
import { serializeCircuit } from './engine/parser/serializer';
import { solveDC, solveAC, solveTransient } from './engine/solver';
import { SimulationResult, Component, AnalysisMode, TransientResult, Circuit } from './engine/types';
import { EXAMPLES_BY_MODE } from './examples';
import SchematicEditor from './components/SchematicEditor';
import LandingPage from './components/LandingPage';
import FrequencySweepChart from './components/FrequencySweepChart';
import TransientChart from './components/TransientChart';
import PlotSelector, { SelectedPlot } from './components/PlotSelector';
import * as math from 'mathjs';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

function buildCircuitFromComponents(components: Component[]): Circuit {
  const nodes = new Set<string>();
  components.forEach((component) => {
    nodes.add(component.nodeA);
    nodes.add(component.nodeB);
    if (component.nodeC) nodes.add(component.nodeC);
  });

  return { components, nodes: Array.from(nodes) };
}

const App: React.FC = () => {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode | null>(null);
  const [netlist, setNetlist] = useState(EXAMPLES_BY_MODE.DC[0].netlist);
  const [components, setComponents] = useState<Component[]>([]);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [transientResults, setTransientResults] = useState<TransientResult | null>(null);
  const [selectedPlots, setSelectedPlots] = useState<SelectedPlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [frequency, setFrequency] = useState<number>(60);
  const [frequencyInput, setFrequencyInput] = useState<string>('60');
  const [sweepStartFreq, setSweepStartFreq] = useState<number>(1);
  const [sweepStartFreqInput, setSweepStartFreqInput] = useState<string>('1');
  const [sweepEndFreq, setSweepEndFreq] = useState<number>(1000000);
  const [sweepEndFreqInput, setSweepEndFreqInput] = useState<string>('1000000');
  const [tStop, setTStop] = useState<number>(0.1);
  const [tStopInput, setTStopInput] = useState<string>('0.1');
  const [tStep, setTStep] = useState<number>(0.001);
  const [tStepInput, setTStepInput] = useState<string>('0.001');

  const commitPositiveNumber = (
    rawValue: string,
    currentValue: number,
    setValue: React.Dispatch<React.SetStateAction<number>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = rawValue.trim();
    const nextValue = Number(trimmed);
    if (Number.isFinite(nextValue) && nextValue > 0) {
      setValue(nextValue);
      setInput(trimmed);
      return nextValue;
    }

    setInput(String(currentValue));
    return currentValue;
  };

  const applyTransientControls = () => {
    const nextStop = commitPositiveNumber(tStopInput, tStop, setTStop, setTStopInput);
    const nextStep = commitPositiveNumber(tStepInput, tStep, setTStep, setTStepInput);
    return { nextStop, nextStep };
  };

  const applyACControls = () => {
    const nextFrequency = commitPositiveNumber(frequencyInput, frequency, setFrequency, setFrequencyInput);
    const nextSweepStart = commitPositiveNumber(sweepStartFreqInput, sweepStartFreq, setSweepStartFreq, setSweepStartFreqInput);
    const nextSweepEnd = commitPositiveNumber(sweepEndFreqInput, sweepEndFreq, setSweepEndFreq, setSweepEndFreqInput);

    if (nextSweepStart > nextSweepEnd) {
      setSweepStartFreq(nextSweepEnd);
      setSweepStartFreqInput(String(nextSweepEnd));
      return { nextFrequency, nextSweepStart: nextSweepEnd, nextSweepEnd };
    }

    return { nextFrequency, nextSweepStart, nextSweepEnd };
  };

  const handleSimulate = () => {
    if (analysisMode === 'Transient') {
      applyTransientControls();
    } else if (analysisMode === 'AC') {
      applyACControls();
    }

    runSimulation();
  };

  const loadExample = (mode: AnalysisMode, exampleIndex: number) => {
    const example = EXAMPLES_BY_MODE[mode][exampleIndex];
    if (!example) return;

    setNetlist(example.netlist);
    const circuit = parseNetlist(example.netlist);
    setComponents(circuit.components);
    setResults(null);
    setTransientResults(null);
    setError(null);
    setSelectedPlots([]);
    setView(mode === 'DC' ? 'table' : 'chart');
    if (mode === 'Transient') {
      const res = solveTransient(circuit, { type: 'Transient', tStop, tStep });
      setTransientResults(res);
      setResults(res.steps[res.steps.length - 1]?.results ?? null);
      setError(null);
    } else if (mode === 'AC') {
      const res = solveAC(circuit, { type: 'AC', frequency });
      setResults(res);
      setError(res.error || null);
    } else {
      const res = solveDC(circuit);
      setResults(res);
      setError(res.error || null);
    }
  };

  useEffect(() => {
    if (analysisMode) {
      try {
        loadExample(analysisMode, 0);
      } catch (e) {}
    }
  }, [analysisMode]);

  const runSimulation = (currentNetlist: string = netlist) => {
    try {
      const circuit = parseNetlist(currentNetlist);
      setComponents(circuit.components);
      if (analysisMode === 'Transient') {
        const res = solveTransient(circuit, { type: 'Transient', tStop, tStep });
        setTransientResults(res);
        setResults(res.steps[res.steps.length - 1]?.results ?? null);
        setError(null);
      } else if (analysisMode === 'AC') {
        const res = solveAC(circuit, { type: 'AC', frequency });
        setResults(res);
        setError(res.error || null);
      } else {
        const res = solveDC(circuit);
        setResults(res);
        setError(res.error || null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during simulation');
      setResults(null);
    }
  };

  const handleTogglePlot = (id: string, variable: 'V' | 'I') => {
    setSelectedPlots(prev => {
      const exists = prev.find(p => p.id === id && p.variable === variable);
      if (exists) return prev.filter(p => !(p.id === id && p.variable === variable));
      return [...prev, { id, variable, color: COLORS[prev.length % COLORS.length] }];
    });
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
    setTransientResults(null);
    setSelectedPlots([]);
    setError(null);
  };

  useEffect(() => {
    if (analysisMode) runSimulation();
  }, [frequency, tStop, tStep]);

  if (!analysisMode) {
    return <LandingPage onSelectMode={setAnalysisMode} />;
  }

  const chartCircuit = buildCircuitFromComponents(components);
  const modeExamples = EXAMPLES_BY_MODE[analysisMode];

  const formatComplex = (val: any) => {
    if (typeof val === 'number') return val.toFixed(4);
    if (!val) return '0';
    const magnitude = math.abs(val) as number;
    const phase = (math.arg(val) as number) * 180 / Math.PI;
    return `${magnitude.toExponential(2)} ∠ ${phase.toFixed(1)}°`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => setAnalysisMode(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center space-x-2">
            <Activity className={`w-8 h-8 ${analysisMode === 'AC' ? 'text-emerald-600' : analysisMode === 'Transient' ? 'text-amber-600' : 'text-blue-600'}`} />
            <div><h1 className="text-xl font-bold tracking-tight">CircuitFlow</h1><p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{analysisMode} Analysis</p></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setMode('code')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'code' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Code</button>
            <button onClick={() => setMode('visual')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'visual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Visual</button>
          </div>
          {analysisMode === 'AC' && (
            <>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Freq</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={frequencyInput}
                  onChange={(e) => setFrequencyInput(e.target.value)}
                  onBlur={applyACControls}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyACControls(); }}
                  className="w-20 bg-transparent text-sm font-bold outline-none text-emerald-600"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase">Hz</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Start</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sweepStartFreqInput}
                  onChange={(e) => setSweepStartFreqInput(e.target.value)}
                  onBlur={applyACControls}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyACControls(); }}
                  className="w-20 bg-transparent text-sm font-bold outline-none text-emerald-600"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase">Hz</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">End</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={sweepEndFreqInput}
                  onChange={(e) => setSweepEndFreqInput(e.target.value)}
                  onBlur={applyACControls}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyACControls(); }}
                  className="w-20 bg-transparent text-sm font-bold outline-none text-emerald-600"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase">Hz</span>
              </div>
            </>
          )}
          {analysisMode === 'Transient' && (
            <>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Stop</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tStopInput}
                  onChange={(e) => setTStopInput(e.target.value)}
                  onBlur={applyTransientControls}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyTransientControls(); }}
                  className="w-20 bg-transparent text-sm font-bold outline-none text-amber-600"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase">s</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase">Step</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tStepInput}
                  onChange={(e) => setTStepInput(e.target.value)}
                  onBlur={applyTransientControls}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyTransientControls(); }}
                  className="w-20 bg-transparent text-sm font-bold outline-none text-amber-600"
                />
                <span className="text-[10px] font-black text-slate-400 uppercase">s</span>
              </div>
            </>
          )}
          <button onClick={handleSimulate} className={`${analysisMode === 'AC' ? 'bg-emerald-600' : analysisMode === 'Transient' ? 'bg-amber-600' : 'bg-blue-600'} text-white px-5 py-1.5 rounded-md flex items-center space-x-2 transition-all font-bold text-sm shadow-lg`}><Play className="w-4 h-4 fill-current" /><span>Simulate</span></button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] mx-auto w-full">
        <div className="lg:col-span-5 flex flex-col space-y-4 h-[750px]">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Built-In Circuits</p>
                <p className="text-xs text-slate-500">Load a starter circuit and modify it from there.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {modeExamples.map((example, index) => (
                <button
                  key={`${analysisMode}-${example.name}`}
                  onClick={() => loadExample(analysisMode, index)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-left hover:bg-slate-100 transition-colors"
                >
                  <span className="block text-[11px] font-black uppercase tracking-wide text-slate-700">{example.name}</span>
                </button>
              ))}
            </div>
          </div>
          {mode === 'code' ? (
            <textarea value={netlist} onChange={(e) => { setNetlist(e.target.value); try { setComponents(parseNetlist(e.target.value).components); } catch(e) {} }} className="flex-1 p-6 font-mono text-sm bg-slate-900 text-emerald-400 rounded-xl focus:outline-none resize-none shadow-inner" spellCheck={false} />
          ) : (
            <SchematicEditor components={components} onAddComponent={handleAddComponent} onRemoveComponent={handleRemoveComponent} onUpdateComponent={handleUpdateComponent} onClear={handleClear} mode={analysisMode} />
          )}
          {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm"><AlertCircle className="w-5 h-5 mt-0.5" /><div><h3 className="font-black text-xs uppercase tracking-wider">Fault</h3><p className="text-sm font-medium">{error}</p></div></div>}
        </div>

        <div className="lg:col-span-7 flex flex-col h-[750px] space-y-6 overflow-hidden">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-widest text-slate-700">Analysis Data</span>
              <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200">
                <button onClick={() => setView('table')} className={`p-1.5 rounded-md transition-all ${view === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4 h-4" /></button>
                {(analysisMode === 'AC' || analysisMode === 'Transient') && <button onClick={() => setView('chart')} className={`p-1.5 rounded-md transition-all ${view === 'chart' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><BarChart3 className="w-4 h-4" /></button>}
              </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-auto">
                {view === 'chart' ? (
                  analysisMode === 'AC' ? (
                    <FrequencySweepChart circuit={chartCircuit} selectedPlots={selectedPlots} startFreq={sweepStartFreq} endFreq={sweepEndFreq} steps={50} />
                  ) : transientResults ? (
                    <TransientChart data={transientResults} selectedPlots={selectedPlots} />
                  ) : null
                ) : results ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 sticky top-0 z-10 border-b border-slate-200"><tr><th className="px-6 py-4 font-black">Component</th><th className="px-6 py-4 font-black">Voltage Drop</th><th className="px-6 py-4 font-black">Current</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {components.filter((component) => component.type !== 'W').map((component) => (
                        <tr key={component.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-black text-slate-600">{component.id}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">{formatComplex(results.voltageDrops[component.id])}</td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600">{formatComplex(results.branchCurrents[component.id])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
              {(view === 'chart' && (analysisMode === 'AC' || analysisMode === 'Transient')) && (
                <PlotSelector components={components} selectedPlots={selectedPlots} onTogglePlot={handleTogglePlot} analysisMode={analysisMode} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
