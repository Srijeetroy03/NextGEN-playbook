import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  AgentRole, 
  WorkflowType, 
  LogEntry, 
  NetworkNode, 
  NetworkLink, 
  QualityMetric, 
  SimulationState 
} from './types';
import { AGENT_CONFIGS, WORKFLOWS, INITIAL_METRICS } from './constants';
import { runAgentSimulation } from './services/geminiService';
import TopologyGraph from './components/TopologyGraph';
import TerminalLog from './components/TerminalLog';
import MetricsDashboard from './components/MetricsDashboard';
import { RotateCcw, Activity, PlayCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'default' | 'topology' | 'log';

// Hardcoded initial state
const INITIAL_NODES: NetworkNode[] = [
  { id: 'n1', name: 'Core-Router-01', type: 'switch', status: 'healthy', ip: '10.0.0.1', group: 1 },
  { id: 'n2', name: 'App-Server-01', type: 'server', status: 'healthy', ip: '10.0.0.10', group: 1 },
  { id: 'n3', name: 'App-Server-02', type: 'server', status: 'warning', ip: '10.0.0.11', group: 1 }, // Intentionally Yellow
  { id: 'n4', name: 'DB-Cluster-01', type: 'server', status: 'healthy', ip: '10.0.0.20', group: 1 },
];

const INITIAL_LINKS: NetworkLink[] = [
  { source: 'n1', target: 'n2', bandwidth: '10Gbps', latency: 2 },
  { source: 'n1', target: 'n3', bandwidth: '10Gbps', latency: 15 },
  { source: 'n1', target: 'n4', bandwidth: '40Gbps', latency: 1 },
];

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    nodes: INITIAL_NODES,
    links: INITIAL_LINKS,
    logs: [],
    metrics: INITIAL_METRICS,
    activeAgent: null,
    isProcessing: false,
  });

  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('default');
  
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
        if (graphContainerRef.current) {
            setGraphDimensions({
                width: graphContainerRef.current.offsetWidth,
                height: graphContainerRef.current.offsetHeight
            });
        }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (graphContainerRef.current) {
        const timer = setTimeout(() => {
            setGraphDimensions({
                width: graphContainerRef.current?.offsetWidth || 0,
                height: graphContainerRef.current?.offsetHeight || 0
            });
        }, 0);
        return () => clearTimeout(timer);
    }
  }, [viewMode]);

  const addLog = (agent: AgentRole, message: string, type: LogEntry['type'] = 'info') => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, { id: uuidv4(), timestamp: Date.now(), agent, message, type }]
    }));
  };

  const executeAgentStep = async (agentRole: AgentRole, context: string) => {
    setState(prev => ({ ...prev, activeAgent: agentRole }));
    addLog(agentRole, "Analyzing network segment...", 'info');

    try {
      const result = await runAgentSimulation(agentRole, context, state.nodes, state.metrics);
      result.logs.forEach(log => addLog(agentRole, log, 'info'));

      setState(prev => {
        const newNodesFromAgent = result.nodes || [];
        const existingNodesMap = new Map(prev.nodes.map(n => [n.id, n]));
        const existingNodeNamesMap = new Map(prev.nodes.map(n => [n.name, n.id]));

        newNodesFromAgent.forEach(newNode => {
            const existing = existingNodesMap.get(newNode.id);
            if (existing) {
                existingNodesMap.set(newNode.id, { 
                    ...existing, 
                    ...newNode, 
                    // @ts-ignore
                    x: existing.x, y: existing.y, fx: existing.fx, fy: existing.fy
                });
            } else {
                existingNodesMap.set(newNode.id, newNode);
                existingNodeNamesMap.set(newNode.name, newNode.id);
            }
        });

        const uniqueNodes = Array.from(existingNodesMap.values());
        const newLinksFromAgent = result.links || [];
        const combinedLinks = [...prev.links, ...newLinksFromAgent];
        const validLinksMap = new Map();

        combinedLinks.forEach(link => {
            const getLinkId = (item: any) => (typeof item === 'object' && item !== null && 'id' in item) ? item.id : item;
            let sourceId = getLinkId(link.source);
            let targetId = getLinkId(link.target);

            if (!existingNodesMap.has(sourceId) && existingNodeNamesMap.has(sourceId)) sourceId = existingNodeNamesMap.get(sourceId);
            if (!existingNodesMap.has(targetId) && existingNodeNamesMap.has(targetId)) targetId = existingNodeNamesMap.get(targetId);

            if (existingNodesMap.has(sourceId) && existingNodesMap.has(targetId)) {
                const key = `${sourceId}-${targetId}`;
                if (!validLinksMap.has(key)) {
                    validLinksMap.set(key, { ...link, source: sourceId, target: targetId });
                }
            }
        });

        let nextMetrics = [...prev.metrics];
        if (result.metricsUpdate) {
            result.metricsUpdate.forEach(update => {
                const idx = nextMetrics.findIndex(m => m.name === update.name);
                if (idx > -1 && update.score !== undefined) {
                    nextMetrics[idx] = { ...nextMetrics[idx], ...update };
                }
            });
        }

        return { ...prev, nodes: uniqueNodes, links: Array.from(validLinksMap.values()), metrics: nextMetrics };
      });
      
      addLog(agentRole, "Sequence phase complete.", 'success');
    } catch (error) {
      addLog(agentRole, "Execution interrupted.", 'error');
    }
  };

  const runWorkflow = useCallback(async (workflowId: string) => {
    if (state.isProcessing) return;
    
    const workflow = WORKFLOWS.find(w => w.id === workflowId);
    if (!workflow) return;

    setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        // We preserve initial nodes for discovery to build upon
        nodes: workflowId === 'wf1' ? INITIAL_NODES : prev.nodes, 
        links: workflowId === 'wf1' ? INITIAL_LINKS : prev.links 
    }));
    
    setActiveWorkflow(workflowId);
    addLog(AgentRole.SUPERVISOR, `Starting: ${workflow.name}`, 'warning');

    // Custom Discovery Logic: Show existing, then add unhealthy
    if (workflow.steps.includes(AgentRole.DISCOVERY)) {
        addLog(AgentRole.DISCOVERY, "Scanning existing infrastructure...", 'info');
        await new Promise(r => setTimeout(r, 2000)); // Show existing graph first

        const unhealthyId = `extra-${Date.now()}`;
        const unhealthyNode: NetworkNode = {
            id: unhealthyId,
            name: 'Shadow-IoT-Gateway',
            type: 'endpoint',
            status: 'critical', // New unhealthy node
            ip: '192.168.1.99',
            group: 1
        };

        setState(prev => ({
            ...prev,
            nodes: [...prev.nodes, unhealthyNode],
            links: [...prev.links, { source: 'n1', target: unhealthyId, bandwidth: '100Mbps', latency: 150 }]
        }));
        addLog(AgentRole.DISCOVERY, "Alert: Detected unauthorized critical node.", 'error');
        await new Promise(r => setTimeout(r, 1500));
    }

    for (const agent of workflow.steps) {
      if (agent === AgentRole.DISCOVERY) continue; // Already handled custom above

      const context = `Workflow: ${workflow.name}. Stabilize network and address nodes with warning/critical status.`;
      await executeAgentStep(agent, context);
      await new Promise(r => setTimeout(r, 1000));
    }

    addLog(AgentRole.SUPERVISOR, "Orchestration complete.", 'success');
    setState(prev => ({ ...prev, isProcessing: false, activeAgent: null }));
    setActiveWorkflow(null);
  }, [state.isProcessing, state.nodes, state.metrics]);


  return (
    <div className="flex flex-col h-screen bg-[#050b14] text-slate-200 overflow-hidden font-sans">
      <header className="h-14 border-b border-cyber-800 bg-cyber-900/50 backdrop-blur flex items-center px-6 justify-between z-20">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Activity className="text-white" size={20} />
            </div>
            <div>
                <h1 className="text-lg font-bold text-white">NetNexus</h1>
                <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">Agentic Orchestrator</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-cyber-800 px-3 py-1 rounded-full border border-cyber-700">
                <div className={`w-2 h-2 rounded-full ${state.isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                {state.isProcessing ? 'SYSTEM ACTIVE' : 'SYSTEM IDLE'}
            </div>
            <button 
                onClick={() => setState(prev => ({ ...prev, nodes: INITIAL_NODES, links: INITIAL_LINKS, logs: [], metrics: INITIAL_METRICS }))}
                className="p-2 hover:bg-cyber-800 rounded transition-colors text-gray-400 hover:text-white"
            >
                <RotateCcw size={18} />
            </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`w-80 border-r border-cyber-800 bg-cyber-900/30 flex flex-col z-10 transition-all duration-300 ${viewMode !== 'default' ? '-ml-80 opacity-0' : ''}`}>
            <div className="p-4 border-b border-cyber-800">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Orchestration Scenarios</h2>
                <div className="space-y-2">
                    {WORKFLOWS.map(wf => (
                        <button
                            key={wf.id}
                            onClick={() => runWorkflow(wf.id)}
                            disabled={state.isProcessing}
                            className={`w-full text-left p-3 rounded border transition-all duration-200 ${activeWorkflow === wf.id ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-cyber-800/40 border-cyber-700 text-gray-300'}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm">{wf.name}</span>
                                {activeWorkflow === wf.id && <Activity size={14} className="animate-spin" />}
                            </div>
                            <p className="text-[10px] opacity-70">{wf.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">Agent Swarm</h2>
                <div className="space-y-3 pb-8">
                    {Object.values(AgentRole).map(role => {
                        const config = AGENT_CONFIGS[role];
                        if (!config) return null;
                        const isActive = state.activeAgent === role;
                        const Icon = config.icon;
                        return (
                            <div key={role} className={`p-3 rounded-lg border transition-all duration-300 ${isActive ? `${config.bg} ${config.borderColor}` : 'bg-cyber-800/20 border-cyber-800/40'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${isActive ? `bg-black/30 ${config.color}` : 'text-gray-500'}`}><Icon size={20} /></div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>{role}</h3>
                                        <p className="text-[10px] text-gray-600 truncate">{isActive ? "PROCESSING..." : config.description}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#020408] relative">
            {viewMode === 'default' && (
                <div className="h-1/3 border-b border-cyber-800 p-4">
                    <MetricsDashboard metrics={state.metrics} />
                </div>
            )}
            <div className="flex-1 flex min-h-0">
                {(viewMode === 'default' || viewMode === 'topology') && (
                    <div className="flex-1 p-4 relative" ref={graphContainerRef}>
                        <TopologyGraph 
                            nodes={state.nodes} 
                            links={state.links} 
                            width={graphDimensions.width}
                            height={graphDimensions.height}
                            isMaximized={viewMode === 'topology'}
                            onToggleMaximize={() => setViewMode(prev => prev === 'topology' ? 'default' : 'topology')}
                        />
                    </div>
                )}
                {(viewMode === 'default' || viewMode === 'log') && (
                    <div className={`${viewMode === 'log' ? 'w-full h-full p-4' : 'w-1/3 border-l border-cyber-800'}`}>
                        <TerminalLog 
                            logs={state.logs} 
                            activeAgent={state.activeAgent} 
                            isMaximized={viewMode === 'log'}
                            onToggleMaximize={() => setViewMode(prev => prev === 'log' ? 'default' : 'log')}
                        />
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;