import React from 'react';
import { Component, AnalysisMode } from '../engine/types';
import { Activity, Eye, EyeOff } from 'lucide-react';

export interface SelectedPlot {
  id: string;
  variable: 'V' | 'I';
  color: string;
}

interface PlotSelectorProps {
  components: Component[];
  selectedPlots: SelectedPlot[];
  onTogglePlot: (id: string, variable: 'V' | 'I') => void;
  analysisMode: AnalysisMode;
}

const PlotSelector: React.FC<PlotSelectorProps> = ({ components, selectedPlots, onTogglePlot, analysisMode }) => {
  const isSelected = (id: string, variable: 'V' | 'I') => 
    selectedPlots.some(p => p.id === id && p.variable === variable);

  const getPlotColor = (id: string, variable: 'V' | 'I') => {
    const plot = selectedPlots.find(p => p.id === id && p.variable === variable);
    return plot ? plot.color : '#cbd5e1';
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-64">
      <div className="p-4 border-b border-slate-100 flex items-center space-x-2">
        <Activity size={16} className="text-slate-500" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-700">Plot Manager</span>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {components.filter(c => c.type !== 'W').map((c, i) => (
          <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-500">{c.id}</span>
              <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{c.type}</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onTogglePlot(c.id, 'V')}
                className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-lg border transition-all ${
                  isSelected(c.id, 'V') 
                  ? 'bg-white border-slate-200 shadow-sm' 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-white/50'
                }`}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: isSelected(c.id, 'V') ? getPlotColor(c.id, 'V') : '#e2e8f0' }} 
                />
                <span className={`text-[9px] font-black uppercase ${isSelected(c.id, 'V') ? 'text-slate-700' : 'text-slate-400'}`}>Volt</span>
                {isSelected(c.id, 'V') ? <Eye size={10} /> : <EyeOff size={10} />}
              </button>

              <button
                onClick={() => onTogglePlot(c.id, 'I')}
                className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-lg border transition-all ${
                  isSelected(c.id, 'I') 
                  ? 'bg-white border-slate-200 shadow-sm' 
                  : 'bg-transparent border-transparent text-slate-400 hover:bg-white/50'
                }`}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: isSelected(c.id, 'I') ? getPlotColor(c.id, 'I') : '#e2e8f0' }} 
                />
                <span className={`text-[9px] font-black uppercase ${isSelected(c.id, 'I') ? 'text-slate-700' : 'text-slate-400'}`}>Curr</span>
                {isSelected(c.id, 'I') ? <Eye size={10} /> : <EyeOff size={10} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100">
         <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <p className="text-[9px] font-bold leading-relaxed">Select components to visualize their behavior over {analysisMode === 'AC' ? 'frequency' : 'time'}.</p>
         </div>
      </div>
    </div>
  );
};

export default PlotSelector;
