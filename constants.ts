import { AgentRole, WorkflowType, QualityMetric } from './types';
import { 
  ShieldCheck, 
  Network, 
  Share2, 
  Database, 
  Activity, 
  LayoutDashboard,
  Cpu,
  Zap
} from 'lucide-react';

export const AGENT_CONFIGS = {
  [AgentRole.SUPERVISOR]: {
    icon: ShieldCheck,
    description: 'Orchestrates workflow execution and delegates tasks.',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-400',
    bg: 'bg-yellow-400/10'
  },
  [AgentRole.DISCOVERY]: {
    icon: Network,
    description: 'Scans multi-protocol layers to identify assets.',
    color: 'text-blue-400',
    borderColor: 'border-blue-400',
    bg: 'bg-blue-400/10'
  },
  [AgentRole.TOPOLOGY]: {
    icon: Share2,
    description: 'Maps hierarchical relationships and dependencies.',
    color: 'text-purple-400',
    borderColor: 'border-purple-400',
    bg: 'bg-purple-400/10'
  },
  [AgentRole.RECONCILIATION]: {
    icon: Database,
    description: 'Validates inventory against authorized records.',
    color: 'text-green-400',
    borderColor: 'border-green-400',
    bg: 'bg-green-400/10'
  },
  [AgentRole.ANOMALY]: {
    icon: Activity,
    description: 'Detects deviations and calculates risk scores.',
    color: 'text-red-400',
    borderColor: 'border-red-400',
    bg: 'bg-red-400/10'
  },
  [AgentRole.VISUALIZATION]: {
    icon: LayoutDashboard,
    description: 'Synthesizes data into interactive insights.',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-400',
    bg: 'bg-cyan-400/10'
  },
  [AgentRole.SELF_HEALING]: {
    icon: Zap,
    description: 'Executes autonomous remediation and auto-scaling events.',
    color: 'text-orange-400',
    borderColor: 'border-orange-400',
    bg: 'bg-orange-400/10'
  }
};

// Explicit render order to ensure all agents appear in the UI
export const AGENT_LIST = [
  AgentRole.SUPERVISOR,
  AgentRole.DISCOVERY,
  AgentRole.TOPOLOGY,
  AgentRole.RECONCILIATION,
  AgentRole.ANOMALY,
  AgentRole.VISUALIZATION,
  AgentRole.SELF_HEALING
];

export const WORKFLOWS = [
  {
    id: 'wf1',
    name: WorkflowType.FULL_AUDIT,
    description: 'End-to-end discovery, mapping, and validation cycle.',
    steps: [AgentRole.SUPERVISOR, AgentRole.DISCOVERY, AgentRole.TOPOLOGY, AgentRole.RECONCILIATION, AgentRole.VISUALIZATION]
  },
  {
    id: 'wf2',
    name: WorkflowType.INCIDENT_RESPONSE,
    description: 'Rapid anomaly detection and isolation protocol.',
    steps: [AgentRole.ANOMALY, AgentRole.TOPOLOGY, AgentRole.SUPERVISOR]
  },
  {
    id: 'wf3',
    name: WorkflowType.COMPLIANCE_CHECK,
    description: 'Inventory validation and unauthorized device check.',
    steps: [AgentRole.RECONCILIATION, AgentRole.ANOMALY, AgentRole.VISUALIZATION]
  },
  {
    id: 'wf4',
    name: WorkflowType.CAPACITY_PLANNING,
    description: 'Self-healing trigger and resource expansion analysis.',
    // Sequence: Start -> Stress Test -> Heal/Scale -> Connect -> Verify
    steps: [AgentRole.SUPERVISOR, AgentRole.ANOMALY, AgentRole.SELF_HEALING, AgentRole.TOPOLOGY, AgentRole.SUPERVISOR]
  }
];

export const INITIAL_METRICS: QualityMetric[] = [
  { name: 'Network Uptime', score: 99.98, delta: 0.01, status: 'good' },
  { name: 'Inventory Accuracy', score: 94.5, delta: -1.2, status: 'average' },
  { name: 'Threat Resolution', score: 98.2, delta: 2.4, status: 'good' },
  { name: 'Auto-Healing Rate', score: 88.0, delta: 5.5, status: 'good' },
];