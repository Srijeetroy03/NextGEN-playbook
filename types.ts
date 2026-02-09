export enum AgentRole {
  SUPERVISOR = 'Supervisor Agent',
  DISCOVERY = 'Network Discovery Agent',
  TOPOLOGY = 'Network Topology Mapper',
  RECONCILIATION = 'Data Reconciliation Engine',
  ANOMALY = 'Anomaly Detection Agent',
  VISUALIZATION = 'Visualization Agent',
  SELF_HEALING = 'Self-Healing Agent',
}

export enum WorkflowType {
  FULL_AUDIT = 'Full Network Audit',
  INCIDENT_RESPONSE = 'Incident Response',
  COMPLIANCE_CHECK = 'Compliance Validation',
  CAPACITY_PLANNING = 'Capacity & Self-Healing',
}

export interface LogEntry {
  id: string;
  timestamp: number;
  agent: AgentRole;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'server' | 'firewall' | 'endpoint';
  status: 'healthy' | 'warning' | 'critical';
  ip: string;
  group: number;
}

export interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  bandwidth: string;
  latency: number;
}

export interface QualityMetric {
  name: string;
  score: number;
  delta: number;
  status: 'good' | 'average' | 'poor';
}

export interface SimulationState {
  nodes: NetworkNode[];
  links: NetworkLink[];
  logs: LogEntry[];
  metrics: QualityMetric[];
  activeAgent: AgentRole | null;
  isProcessing: boolean;
}