import React from 'react';
import { Activity, Zap, Waves, ArrowRight, Github, Info, Edit3 } from 'lucide-react';

interface WelcomePageProps {
  onSelectMode: (mode: 'dc' | 'ac') => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
        <div className="bg-blue-600 p-4 rounded-3xl shadow-2xl shadow-blue-200 mb-8 animate-in zoom-in duration-500">
          <Activity className="w-16 h-16 text-white" />
        </div>
        
        <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4">
          Circuit<span className="text-blue-600">Flow</span>
        </h1>
        
        <p className="text-xl text-slate-500 font-medium max-w-2xl mb-12 leading-relaxed">
          A production-grade, real-time circuit simulation suite built with <span className="text-slate-900 font-bold">Modified Nodal Analysis</span>. 
          Design, analyze, and visualize complex electrical networks with precision and speed.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* DC Analysis Option */}
          <button 
            onClick={() => onSelectMode('dc')}
            className="group relative bg-white border-2 border-slate-100 p-8 rounded-3xl text-left transition-all hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1"
          >
            <div className="bg-amber-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Zap className="w-8 h-8 text-amber-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">DC Analysis</h3>
            <p className="text-slate-500 font-medium mb-6">Compute static node voltages, branch currents, and power dissipation for steady-state circuits.</p>
            <div className="flex items-center text-blue-600 font-bold text-sm uppercase tracking-widest">
              <span>Launch Solver</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>

          {/* AC Analysis Option */}
          <button 
            onClick={() => onSelectMode('ac')}
            className="group relative bg-white border-2 border-slate-100 p-8 rounded-3xl text-left transition-all hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1"
          >
            <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Waves className="w-8 h-8 text-indigo-600 group-hover:text-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">AC Analysis</h3>
            <p className="text-slate-500 font-medium mb-6">Frequency response, phasor analysis, and Bode plots for reactive components. <span className="text-[10px] font-black bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 ml-1 uppercase">Coming Soon</span></p>
            <div className="flex items-center text-indigo-600 font-bold text-sm uppercase tracking-widest">
              <span>Explore Engine</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-12 text-left w-full border-t border-slate-200 pt-16">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-black uppercase tracking-widest text-xs">MNA Solver</h4>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Uses Modified Nodal Analysis to solve large-scale linear systems with high numerical stability.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900">
              <Edit3 className="w-4 h-4 text-blue-600" />
            </div>
            <h4 className="font-black uppercase tracking-widest text-xs">Hybrid Editor</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Toggle between a professional SPICE-like code editor and an interactive visual schematic builder.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900">
              <Activity className="w-4 h-4 text-blue-600" />
              <h4 className="font-black uppercase tracking-widest text-xs">Real-Time</h4>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Instant simulation updates as you modify component values or connections in the workspace.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 flex items-center justify-center border-t border-slate-200 bg-white">
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-900 transition-colors font-bold text-sm uppercase tracking-widest"
        >
          <Github className="w-5 h-5" />
          <span>CircuitFlow Open Source</span>
        </a>
      </footer>
    </div>
  );
};

export default WelcomePage;
