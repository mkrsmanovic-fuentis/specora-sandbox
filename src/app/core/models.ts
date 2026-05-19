export type ScaleValue = 1 | 2 | 3 | 4 | 5;

export interface ScalePoint {
  value: ScaleValue;
  label: string;
}

export type SeverityTier = 'low' | 'medium' | 'high' | 'critical';

export type TreatmentOption = 'modify' | 'avoid' | 'share' | 'retain';

export type ImplementationStatus = 'not-started' | 'in-progress' | 'implemented';

export interface Risk {
  id: string;
  asset: string;
  threat: string;
  vulnerability: string;
  impactDescription: string;
  existingControls: string;
  owner: string;
  ownerInitials: string;
  likelihood: ScaleValue;
  impact: ScaleValue;
  reviewRequired?: boolean;
  reviewReason?: string;
  createdAt: string;
}

export interface Treatment {
  riskId: string;
  option: TreatmentOption;
  strategy: string;
  targetDate: string; // ISO date
  residualLikelihood: ScaleValue;
  residualImpact: ScaleValue;
  linkedControlId?: string;
}

export interface AnnexControl {
  id: string;            // e.g. "A.8.24"
  group: string;         // e.g. "A.8 Technology controls"
  title: string;
  applicable: boolean;
  justification: string;
  implementation: ImplementationStatus;
  implementationPct: number;
}

export interface SimulationEvent {
  id: string;
  label: string;
  kind: 'ransomware' | 'cloud-migration' | 'supplier-breach';
  timestamp: string;
  affectedRiskIds: string[];
  note: string;
}
