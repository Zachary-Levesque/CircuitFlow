import React from 'react';
import { Zap, Activity, ChevronRight, Binary, Cpu, Clock } from 'lucide-react';
import { AnalysisMode } from '../engine/types';

interface LandingPageProps {
  onSelectMode: (mode: AnalysisMode) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-6xl w-full z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl mb-6 ring-1 ring-blue-500/20">
            <Activity className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
            Circuit<span className="text-blue-500">Flow</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium max-w-lg mx-auto leading-relaxed">
            Professional-grade circuit simulation for the modern engineer. 
            Choose your simulation environment to begin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* DC Mode Card */}
          <button 
            onClick={() => onSelectMode('DC')}
            className="group relative bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:border-blue-500/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <Binary className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">DC Analysis</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Steady-state simulation for resistive networks and power sources. 
                Perfect for basic electronics.
              </p>
              <div className="flex items-center text-blue-400 text-xs font-black uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                Enter <ChevronRight className="ml-2 w-4 h-4" />
              </div>
            </div>
          </button>

          {/* Transient Mode Card */}
          <button 
            onClick={() => onSelectMode('Transient')}
            className="group relative bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:border-amber-500/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)] overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Transient</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Time-domain analysis. Visualize voltage and current evolution in caps, inductors, and diodes.
              </p>
              <div className="flex items-center text-amber-400 text-xs font-black uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                Enter <ChevronRight className="ml-2 w-4 h-4" />
              </div>
            </div>
          </button>

          {/* AC Mode Card */}
          <button 
            onClick={() => onSelectMode('AC')}
            className="group relative bg-slate-800/50 border border-slate-700 p-8 rounded-3xl hover:border-emerald-500/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">AC Analysis</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Frequency-domain simulation with phasors and magnitude/phase response.
              </p>
              <div className="flex items-center text-emerald-400 text-xs font-black uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                Enter <ChevronRight className="ml-2 w-4 h-4" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
