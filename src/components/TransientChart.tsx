import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TransientResult } from '../engine/types';
import { SelectedPlot } from './PlotSelector';

interface TransientChartProps {
  data: TransientResult;
  selectedPlots: SelectedPlot[];
}

const TransientChart: React.FC<TransientChartProps> = ({ data, selectedPlots }) => {
  const chartData = useMemo(() => {
    return data.steps.map(step => {
      const entry: any = { time: step.time };
      
      selectedPlots.forEach(plot => {
        const key = `${plot.variable}(${plot.id})`;
        if (plot.variable === 'V') {
          entry[key] = step.results.voltageDrops[plot.id];
        } else {
          entry[key] = step.results.branchCurrents[plot.id];
        }
      });

      return entry;
    });
  }, [data, selectedPlots]);

  if (selectedPlots.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-12 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <Activity className="w-8 h-8 opacity-20" />
        </div>
        <p className="text-sm font-black uppercase tracking-widest">No Traces Selected</p>
        <p className="text-[10px] font-medium mt-2 max-w-[200px]">Use the Plot Manager to select components and variables to visualize.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white p-4 flex flex-col">
       <div className="flex-1 min-h-[400px]">
         <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                tick={{fontSize: 9, fontWeight: 'bold'}} 
                label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -10, fontSize: 9, fontWeight: 'black' }} 
              />
              <YAxis 
                tick={{fontSize: 9, fontWeight: 'bold'}}
                label={{ value: 'Value (V or A)', angle: -90, position: 'insideLeft', fontSize: 9, fontWeight: 'black' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
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
                  animationDuration={300}
                />
              ))}
            </LineChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
};

import { Activity } from 'lucide-react';
export default TransientChart;
