import { GoogleGenAI } from "@google/genai";
import { AgentRole, NetworkNode, NetworkLink, QualityMetric } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const modelId = 'gemini-2.5-flash';

interface SimulationResponse {
  logs: string[];
  nodes?: NetworkNode[];
  links?: NetworkLink[];
  metricsUpdate?: Partial<QualityMetric>[];
  analysis: string;
}

const generateFallbackResponse = (
    agent: AgentRole, 
    context: string,
    currentNodes: NetworkNode[], 
    currentMetrics: QualityMetric[]
): SimulationResponse => {
  const logs: string[] = [];
  let nodes: NetworkNode[] = [];
  let links: NetworkLink[] = [];
  let metricsUpdate: Partial<QualityMetric>[] = currentMetrics.map(m => ({ ...m, delta: 0 }));

  switch (agent) {
    case AgentRole.SELF_HEALING:
        // Target specifically unhealthy nodes
        const brokenNodes = currentNodes.filter(n => n.status !== 'healthy');
        if (brokenNodes.length > 0) {
            brokenNodes.forEach(n => {
                nodes.push({ ...n, status: 'healthy' });
                logs.push(`Healed device: ${n.name} (Status: Operational)`);
            });
            const healMetric = metricsUpdate.find(m => m.name === 'Auto-Healing Rate');
            if (healMetric) healMetric.score = Math.min(100, (healMetric.score || 0) + 10);
        } else {
            logs.push("No remediation required. System health is nominal.");
        }
        break;

    case AgentRole.TOPOLOGY:
        // Connect the 4 hardcoded nodes if links are missing
        if (currentNodes.length >= 2) {
            logs.push("Optimizing mesh topology connections.");
            links.push({ source: 'n1', target: 'n2', bandwidth: '10Gbps', latency: 2 });
            links.push({ source: 'n1', target: 'n3', bandwidth: '10Gbps', latency: 5 });
        }
        break;
    
    case AgentRole.RECONCILIATION:
        logs.push("Verified inventory integrity.");
        break;

    case AgentRole.SUPERVISOR:
        logs.push("Maintaining system equilibrium.");
        break;
  }

  return { logs, nodes, links, metricsUpdate, analysis: "Simulated execution mode." };
};

export const runAgentSimulation = async (
  agent: AgentRole,
  context: string,
  currentNodes: NetworkNode[],
  currentMetrics: QualityMetric[]
): Promise<SimulationResponse> => {
  const systemInstruction = `
    You are the ${agent} agent.
    If Self-Healing: Locate any nodes in the list with status 'warning' or 'critical' and return them with status 'healthy'.
    If Discovery: Do not duplicate IDs. 
    Current State: ${JSON.stringify(currentNodes.map(n => ({id: n.id, status: n.status})))}
    
    OUTPUT FORMAT: JSON only.
    {
      "logs": ["action taken"],
      "nodes": [{"id": "existing-id", "status": "healthy"}],
      "metricsUpdate": [{"name": "Network Uptime", "score": 98}]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: context,
      config: { systemInstruction, responseMimeType: "application/json" }
    });

    const text = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(text) as SimulationResponse;
  } catch (error) {
    return generateFallbackResponse(agent, context, currentNodes, currentMetrics);
  }
};