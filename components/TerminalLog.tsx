import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentRole } from '../types';
import { Terminal, Maximize2, Minimize2 } from 'lucide-react';
import { AGENT_CONFIGS } from '../constants';

interface TerminalLogProps {
  logs: LogEntry[];
  activeAgent: AgentRole | null;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs, activeAgent, isMaximized, onToggleMaximize }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#0c0c0c] border border-cyber-700 rounded-lg flex flex-col h-full font-mono text-xs overflow-hidden shadow-inner">
      <div className="bg-cyber-800 p-2 border-b border-cyber-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Terminal size={14} className="text-gray-400" />
            <span className="text-gray-300 font-bold tracking-wide">SYSTEM.LOG</span>
        </div>
        <div className="flex items-center gap-2">
            {activeAgent && (
                <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-cyber-700 animate-pulse mr-2">
                    <div className={`w-2 h-2 rounded-full ${AGENT_CONFIGS[activeAgent].color.replace('text', 'bg')}`}></div>
                    <span className={`${AGENT_CONFIGS[activeAgent].color}`}>EXECUTING: {activeAgent}</span>
                </div>
            )}
            <button 
                onClick={onToggleMaximize}
                className="p-1 hover:bg-cyber-700 rounded text-gray-400 hover:text-white transition-colors"
                title={isMaximized ? "Minimize View" : "Maximize View"}
            >
                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {logs.length === 0 && (
            <div className="text-gray-600 italic text-center mt-10">System Ready. Awaiting Workflow Initiation...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
            <span className="text-gray-600 min-w-[80px]">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
            </span>
            <div className="flex-1">
                <span className={`font-bold mr-2 ${AGENT_CONFIGS[log.agent]?.color || 'text-white'}`}>
                    [{log.agent.split(' ')[0].toUpperCase()}]
                </span>
                <span className={
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'warning' ? 'text-yellow-500' :
                    log.type === 'success' ? 'text-green-500' :
                    'text-gray-300'
                }>
                    {log.message}
                </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalLog;