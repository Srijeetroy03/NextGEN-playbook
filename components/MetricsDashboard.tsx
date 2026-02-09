import React from 'react';
import { QualityMetric } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface MetricsDashboardProps {
  metrics: QualityMetric[];
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((m) => (
            <div key={m.name} className="bg-cyber-800/50 p-4 rounded border border-cyber-700 flex flex-col justify-between">
                <div>
                    <h4 className="text-gray-400 text-xs uppercase font-bold">{m.name}</h4>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-mono text-white">{m.score.toFixed(1)}%</span>
                        <span className={`text-xs font-mono mb-1 ${m.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {m.delta > 0 ? '+' : ''}{m.delta}%
                        </span>
                    </div>
                </div>
                <div className="h-1 w-full bg-cyber-900 mt-3 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${m.score > 90 ? 'bg-cyber-success' : m.score > 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${m.score}%` }}
                    />
                </div>
            </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-cyber-800/50 p-4 rounded border border-cyber-700 flex flex-col">
        <h4 className="text-gray-400 text-xs uppercase font-bold mb-4">QA Framework: Real-time Performance</h4>
        <div className="flex-1 min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ color: '#06b6d4' }}
                        cursor={{fill: '#334155', opacity: 0.2}}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {metrics.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.score > 90 ? '#10b981' : entry.score > 70 ? '#eab308' : '#ef4444'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
