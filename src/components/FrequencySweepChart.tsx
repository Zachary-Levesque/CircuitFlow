import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Circuit } from '../engine/types';
import { solveAC } from '../engine/solver';
import * as math from 'mathjs';
import { SelectedPlot } from './PlotSelector';

interface FrequencySweepChartProps {
  circuit: Circuit;
  selectedPlots: SelectedPlot[];
  startFreq: number;
  endFreq: number;
  steps: number;
}

const FrequencySweepChart: React.FC<FrequencySweepChartProps> = ({ circuit, selectedPlots, startFreq, endFreq, steps }) => {
  const data = useMemo(() => {
    if (circuit.components.length === 0 || selectedPlots.length === 0) return [];
    
    const results = [];
    const logStart = Math.log10(startFreq);
    const logEnd = Math.log10(endFreq);
    const stepSize = (logEnd - logStart) / (steps - 1);

    for (let i = 0; i < steps; i++) {
      const freq = Math.pow(10, logStart + i * stepSize);
      const res = solveAC(circuit, { type: 'AC', frequency: freq });
      
      const entry: any = { freq: freq.toExponential(1) };
      
      selectedPlots.forEach(plot => {
        const key = `${plot.variable}(${plot.id})`;
        const val = plot.variable === 'V' 
          ? res.voltageDrops[plot.id] 
          : res.branchCurrents[plot.id];
        
        entry[key] = typeof val === 'number' ? val : math.abs(val as math.Complex);
      });

      results.push(entry);
    }
    return results;
  }, [circuit, selectedPlots, startFreq, endFreq, steps]);

  if (selectedPlots.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-12 text-center">
        <p className="text-sm font-black uppercase tracking-widest">Select Traces to plot frequency response</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white p-4 flex flex-col">
       <div className="flex-1 min-h-[400px]">
         <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="freq" 
                tick={{fontSize: 9, fontWeight: 'bold'}} 
                label={{ value: 'Frequency (Hz)', position: 'insideBottomRight', offset: -10, fontSize: 9, fontWeight: 'black' }}
              />
              <YAxis 
                tick={{fontSize: 9, fontWeight: 'bold'}}
                label={{ value: 'Magnitude', angle: -90, position: 'insideLeft', fontSize: 9, fontWeight: 'black' }}
              />
              <Tooltip contentStyle={{ fontSize: '10px', fontWeight: 'bold', borderRadius: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', paddingTop: '20px' }} />
              {selectedPlots.map((plot) => (
                <Line 
                  key={`${plot.id}-${plot.variable}`}
                  name={`${plot.variable}(${plot.id})`}
                  type="monotone" 
                  dataKey={`${plot.variable}(${plot.id})`} 
                  stroke={plot.color} 
                  strokeWidth={3}
                  dot={false}
                />
              ))}
            </LineChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
};

export default FrequencySweepChart;
