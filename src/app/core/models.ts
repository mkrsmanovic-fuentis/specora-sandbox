export type ScaleValue = 1 | 2 | 3 | 4 | 5;

export interface ScalePoint {
  value: ScaleValue;
  label: string;
}

export type SeverityTier = 'low' | 'medium' | 'high' | 'critical';

export type TreatmentOption = 'modify' | 'avoid' | 'share' | 'retain';

export type ImplementationStatus = 'not-started' | 'in-progress' | 'implemented';

export type ImpactDimension = 'c' | 'i' | 'a' | 'f';

export type CustomizationLevel = 'NONE' | 'PARTIAL' | 'FULL';

export interface ImpactScores {
  c: ScaleValue;
  i: ScaleValue;
  a: ScaleValue;
  f: ScaleValue;
}

export interface InventoryAsset {
  id: string;
  name: string;
  category: string;
  owner: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface ThreatCatalogItem {
  id: string;          // catalog id e.g. "BSI:G.0.14"
  code: string;        // display code e.g. "G.0.14"
  source: 'IRAM2' | 'BSI' | 'Custom';
  title: string;
  description: string;
}

export interface DamageScenario {
  id: string;
  title: string;
  description: string;
  baseline: ImpactScores;
}

export interface PlannedControl {
  id: string;          // Annex A id e.g. "A.8.24"
  framework: string;   // e.g. "ISO 27001:2022 Annex A"
  title: string;
}

export interface Risk {
  id: string;

  // Identification
  affects: string[];           // InventoryAsset ids
  scopeWide: boolean;          // when true, link to assets is not required
  threats: string[];           // ThreatCatalogItem ids
  vulnerability: string;
  damageScenarioId?: string;
  impactDescription: string;
  existingControls: string;

  // Ownership
  owner: string;
  ownerInitials: string;

  // Assessment
  likelihood: ScaleValue;
  impact: ImpactScores;        // C / I / A / Financial dimensions

  // Workflow state
  reviewRequired?: boolean;
  reviewReason?: string;
  createdAt: string;
}

export interface Treatment {
  riskId: string;
  option: TreatmentOption;
  strategy: string;
  targetDate: string;          // ISO date
  residualLikelihood: ScaleValue;
  residualImpact: ImpactScores;
  plannedControls: PlannedControl[];
  acceptanceRationale: string;
  reviewDueDate: string;       // ISO date
  ownerSignature?: string;
}

export interface AnnexControl {
  id: string;
  group: string;
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

export interface ImpactDimensionDef {
  key: ImpactDimension;
  label: string;
  description: string;
  scale: { value: ScaleValue; label: string; description: string }[];
}

export interface Methodology {
  version: string;
  active: boolean;
  status: 'active' | 'draft' | 'retired';
  effectiveFrom: string;
  customizationLevel: CustomizationLevel;
  likelihoodDefs: { value: ScaleValue; label: string; description: string }[];
  impactDims: ImpactDimensionDef[];
}

export const IMPACT_DIM_KEYS: ImpactDimension[] = ['c', 'i', 'a', 'f'];

export function overallImpact(scores: ImpactScores): ScaleValue {
  return Math.max(scores.c, scores.i, scores.a, scores.f) as ScaleValue;
}
