import { Injectable, computed, signal } from '@angular/core';
import {
  AnnexControl,
  CustomizationLevel,
  DamageScenario,
  IMPACT_DIM_KEYS,
  ImpactScores,
  InventoryAsset,
  Methodology,
  Risk,
  ScalePoint,
  ScaleValue,
  SeverityTier,
  SimulationEvent,
  ThreatCatalogItem,
  Treatment,
  TreatmentOption,
  overallImpact,
} from './models';

const LIKELIHOOD: ScalePoint[] = [
  { value: 1, label: 'Rare' },
  { value: 2, label: 'Unlikely' },
  { value: 3, label: 'Possible' },
  { value: 4, label: 'Likely' },
  { value: 5, label: 'Almost certain' },
];

const IMPACT: ScalePoint[] = [
  { value: 1, label: 'Insignificant' },
  { value: 2, label: 'Minor' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Major' },
  { value: 5, label: 'Severe' },
];

// ----------------------------------------------------------------------------
// Methodology — Specora default v1
// ----------------------------------------------------------------------------
const DEFAULT_METHODOLOGY: Methodology = {
  version: 'v1',
  active: true,
  status: 'active',
  effectiveFrom: '2026-01-01',
  customizationLevel: 'NONE',
  likelihoodDefs: [
    { value: 1, label: 'Rare', description: 'May occur only in exceptional circumstances. < once per 5 years.' },
    { value: 2, label: 'Unlikely', description: 'Could occur at some time. Once every 2–5 years.' },
    { value: 3, label: 'Possible', description: 'Might occur. Once per year on average.' },
    { value: 4, label: 'Likely', description: 'Will probably occur. Multiple times per year.' },
    { value: 5, label: 'Almost certain', description: 'Expected to occur. Monthly or more often.' },
  ],
  impactDims: [
    {
      key: 'c',
      label: 'Confidentiality',
      description: 'Impact of unauthorised disclosure of information.',
      scale: [
        { value: 1, label: 'Insignificant', description: 'Public information only.' },
        { value: 2, label: 'Minor', description: 'Internal info disclosed to a small audience.' },
        { value: 3, label: 'Moderate', description: 'Sensitive business info leaked externally.' },
        { value: 4, label: 'Major', description: 'Customer PII or regulated data exposed.' },
        { value: 5, label: 'Severe', description: 'Mass disclosure of regulated data; statutory breach.' },
      ],
    },
    {
      key: 'i',
      label: 'Integrity',
      description: 'Impact of unauthorised modification or destruction of data.',
      scale: [
        { value: 1, label: 'Insignificant', description: 'Negligible data drift; trivially correctable.' },
        { value: 2, label: 'Minor', description: 'Local data inconsistency; manual recovery.' },
        { value: 3, label: 'Moderate', description: 'Material data corruption in one domain.' },
        { value: 4, label: 'Major', description: 'Cross-system data corruption; audit findings.' },
        { value: 5, label: 'Severe', description: 'Catastrophic loss of data integrity; recovery > 30 days.' },
      ],
    },
    {
      key: 'a',
      label: 'Availability',
      description: 'Impact of disruption to systems or services.',
      scale: [
        { value: 1, label: 'Insignificant', description: 'Outage < 1 hour; no customer impact.' },
        { value: 2, label: 'Minor', description: 'Outage 1–4 hours; limited customer impact.' },
        { value: 3, label: 'Moderate', description: 'Outage 4–24 hours; SLA breach for some tenants.' },
        { value: 4, label: 'Major', description: 'Outage 1–3 days; SLA breach across all tenants.' },
        { value: 5, label: 'Severe', description: 'Outage > 3 days; business continuity activation.' },
      ],
    },
    {
      key: 'f',
      label: 'Financial',
      description: 'Direct financial loss or regulatory fine.',
      scale: [
        { value: 1, label: 'Insignificant', description: '< €5k' },
        { value: 2, label: 'Minor', description: '€5k – €50k' },
        { value: 3, label: 'Moderate', description: '€50k – €250k' },
        { value: 4, label: 'Major', description: '€250k – €1M' },
        { value: 5, label: 'Severe', description: '> €1M or > 2% of annual revenue' },
      ],
    },
  ],
};

const SEED_METHODOLOGIES: Methodology[] = [
  DEFAULT_METHODOLOGY,
  {
    ...DEFAULT_METHODOLOGY,
    version: 'v2',
    active: false,
    status: 'draft',
    effectiveFrom: '2026-09-01',
    customizationLevel: 'PARTIAL',
  },
];

// ----------------------------------------------------------------------------
// Inventory — pre-seeded scope assets
// ----------------------------------------------------------------------------
const SEED_INVENTORY: InventoryAsset[] = [
  { id: 'IA-001', name: 'Customer Data Laptops',     category: 'Endpoint',       owner: 'IT Operations', criticality: 'high' },
  { id: 'IA-002', name: 'Customer-facing API',       category: 'Application',    owner: 'Platform',      criticality: 'critical' },
  { id: 'IA-003', name: 'Payroll database',          category: 'Database',       owner: 'Finance IT',    criticality: 'high' },
  { id: 'IA-004', name: 'Payroll database backup',   category: 'Backup',         owner: 'Finance IT',    criticality: 'high' },
  { id: 'IA-005', name: 'Office wifi guest network', category: 'Network',        owner: 'IT Operations', criticality: 'low' },
  { id: 'IA-006', name: 'Third-party CRM',           category: 'SaaS Vendor',    owner: 'Sales Ops',     criticality: 'high' },
  { id: 'IA-007', name: 'Identity provider (SSO)',   category: 'Identity',       owner: 'Security',      criticality: 'critical' },
  { id: 'IA-008', name: 'Document collaboration',    category: 'SaaS Vendor',    owner: 'IT Operations', criticality: 'medium' },
  { id: 'IA-009', name: 'Customer onboarding files', category: 'Data Store',     owner: 'Customer Ops',  criticality: 'high' },
  { id: 'IA-010', name: 'CI/CD pipeline',            category: 'Infrastructure', owner: 'Platform',      criticality: 'high' },
];

// ----------------------------------------------------------------------------
// Threat catalog — IRAM2 + BSI Elementary Threats (curated subset of G.0.1–G.0.47)
// ----------------------------------------------------------------------------
const SEED_THREATS: ThreatCatalogItem[] = [
  { id: 'IRAM2:ACC.002', code: 'ACC.002', source: 'IRAM2', title: 'Access control bypass',           description: 'An attacker bypasses access control to gain unauthorised access to resources.' },
  { id: 'IRAM2:COM.001', code: 'COM.001', source: 'IRAM2', title: 'Communications compromise',       description: 'Interception or tampering with information in transit.' },
  { id: 'IRAM2:INS.003', code: 'INS.003', source: 'IRAM2', title: 'Insider threat',                   description: 'A trusted insider abuses privileges to cause harm.' },
  { id: 'IRAM2:MAL.004', code: 'MAL.004', source: 'IRAM2', title: 'Malicious software execution',    description: 'Malware executes within the environment, exfiltrating or encrypting data.' },
  { id: 'IRAM2:PHY.001', code: 'PHY.001', source: 'IRAM2', title: 'Physical theft of device',        description: 'A device is stolen, exposing data and identities.' },

  { id: 'BSI:G.0.1',  code: 'G.0.1',  source: 'BSI', title: 'Fire',                                  description: 'Loss of assets due to fire.' },
  { id: 'BSI:G.0.14', code: 'G.0.14', source: 'BSI', title: 'Interception of information / espionage', description: 'Targeted interception of confidential information.' },
  { id: 'BSI:G.0.22', code: 'G.0.22', source: 'BSI', title: 'Manipulation of information',           description: 'Unauthorised modification of data alters business decisions.' },
  { id: 'BSI:G.0.23', code: 'G.0.23', source: 'BSI', title: 'Unauthorised intrusion into IT systems', description: 'Attacker gains unauthorised access to systems and data.' },
  { id: 'BSI:G.0.27', code: 'G.0.27', source: 'BSI', title: 'Theft',                                  description: 'Physical theft of devices, media, or documents.' },
  { id: 'BSI:G.0.31', code: 'G.0.31', source: 'BSI', title: 'Erroneous use or administration',       description: 'Operator error or misconfiguration causes incident.' },
  { id: 'BSI:G.0.36', code: 'G.0.36', source: 'BSI', title: 'Identity theft',                        description: 'Account takeover via credential theft or impersonation.' },
  { id: 'BSI:G.0.38', code: 'G.0.38', source: 'BSI', title: 'Misuse of personal data',               description: 'Data subjects experience harm via misuse of their personal data.' },
  { id: 'BSI:G.0.42', code: 'G.0.42', source: 'BSI', title: 'Social engineering',                    description: 'Pretexting or phishing manipulates staff into giving access.' },
  { id: 'BSI:G.0.43', code: 'G.0.43', source: 'BSI', title: 'Replay of messages',                    description: 'Captured network traffic is replayed to forge actions.' },
  { id: 'BSI:G.0.45', code: 'G.0.45', source: 'BSI', title: 'Data loss',                              description: 'Accidental loss of data without recoverable backup.' },
  { id: 'BSI:G.0.47', code: 'G.0.47', source: 'BSI', title: 'Harmful side-effects of IT attacks',    description: 'Cascading impact of incidents on connected systems.' },
];

// ----------------------------------------------------------------------------
// Damage scenario library
// ----------------------------------------------------------------------------
const SEED_DAMAGE_SCENARIOS: DamageScenario[] = [
  { id: 'DS-001', title: 'Customer PII leaked to third party',     description: 'Personal customer data is exfiltrated and disclosed externally.', baseline: { c: 4, i: 2, a: 1, f: 3 } },
  { id: 'DS-002', title: 'Critical service downtime > 4 hours',    description: 'A production service is unavailable for an extended window.',     baseline: { c: 1, i: 1, a: 5, f: 4 } },
  { id: 'DS-003', title: 'Account takeover with financial loss',   description: 'Attacker takes over an account and triggers fraudulent payments.', baseline: { c: 3, i: 4, a: 2, f: 5 } },
  { id: 'DS-004', title: 'Regulatory fine for compliance gap',     description: 'A control gap triggers a fine under GDPR / DORA / NIS2.',          baseline: { c: 2, i: 2, a: 1, f: 5 } },
  { id: 'DS-005', title: 'Reputation damage via public disclosure', description: 'A breach is publicly disclosed and impacts brand trust.',         baseline: { c: 4, i: 3, a: 2, f: 4 } },
  { id: 'DS-006', title: 'Supply-chain compromise',                description: 'A vendor breach cascades into our environment.',                  baseline: { c: 4, i: 4, a: 3, f: 3 } },
];

// ----------------------------------------------------------------------------
// Annex A controls (subset)
// ----------------------------------------------------------------------------
const SEED_CONTROLS: AnnexControl[] = [
  { id: 'A.5.1',  group: 'A.5 Organisational controls', title: 'Policies for information security', applicable: true,  justification: 'Required by management commitment and regulatory mandate.', implementation: 'implemented', implementationPct: 100 },
  { id: 'A.5.7',  group: 'A.5 Organisational controls', title: 'Threat intelligence',               applicable: true,  justification: 'Required to track emerging threats relevant to operations.', implementation: 'in-progress', implementationPct: 55 },
  { id: 'A.5.19', group: 'A.5 Organisational controls', title: 'Information security in supplier relationships', applicable: true, justification: 'Procurement vetting and contractual security clauses.', implementation: 'in-progress', implementationPct: 35 },
  { id: 'A.5.23', group: 'A.5 Organisational controls', title: 'Information security for use of cloud services', applicable: true, justification: 'AWS and Microsoft 365 are core platforms.', implementation: 'in-progress', implementationPct: 40 },
  { id: 'A.6.3',  group: 'A.6 People controls',         title: 'Information security awareness, education and training', applicable: true, justification: 'Mandatory annual awareness program for all staff.', implementation: 'implemented', implementationPct: 95 },
  { id: 'A.7.4',  group: 'A.7 Physical controls',       title: 'Physical security monitoring',      applicable: true,  justification: 'CCTV at office premises and DC partner sites.', implementation: 'implemented', implementationPct: 100 },
  { id: 'A.7.11', group: 'A.7 Physical controls',       title: 'Supporting utilities',              applicable: false, justification: 'Operations are 100% cloud-hosted; no physical utilities owned.', implementation: 'not-started', implementationPct: 0 },
  { id: 'A.8.5',  group: 'A.8 Technology controls · Access control', title: 'Secure authentication', applicable: true, justification: 'MFA enforced for all administrative accounts.', implementation: 'in-progress', implementationPct: 70 },
  { id: 'A.8.7',  group: 'A.8 Technology controls · Endpoint',       title: 'Protection against malware', applicable: true, justification: 'EDR rolled out to fleet endpoints.', implementation: 'implemented', implementationPct: 100 },
  { id: 'A.8.16', group: 'A.8 Technology controls · Monitoring',     title: 'Monitoring activities',  applicable: true, justification: 'SIEM consumes endpoint, identity and network logs.', implementation: 'in-progress', implementationPct: 60 },
  { id: 'A.8.24', group: 'A.8 Technology controls · Cryptography',   title: 'Use of cryptography',    applicable: true, justification: 'Full-disk encryption mandated on laptops via MDM. Key management aligned to NIST SP 800-57.', implementation: 'in-progress', implementationPct: 45 },
  { id: 'A.8.25', group: 'A.8 Technology controls · Development',    title: 'Secure development lifecycle', applicable: true, justification: 'SDLC enforced for the engineering org with mandatory reviews.', implementation: 'in-progress', implementationPct: 50 },
];

// ----------------------------------------------------------------------------
// Risk seed — multi-dim impact, affects[], threats[]
// ----------------------------------------------------------------------------
const SEED_RISKS: Risk[] = [
  {
    id: 'R-001',
    affects: ['IA-001'],
    scopeWide: false,
    threats: ['BSI:G.0.27', 'IRAM2:PHY.001'],
    vulnerability: 'Lack of full-disk encryption',
    damageScenarioId: 'DS-001',
    impactDescription: 'Unauthorized data disclosure',
    existingControls: 'MFA on login, asset tagging',
    owner: 'Marko K.',
    ownerInitials: 'MK',
    likelihood: 4,
    impact: { c: 4, i: 2, a: 2, f: 3 },
    createdAt: '2026-04-12',
  },
  {
    id: 'R-002',
    affects: ['IA-002', 'IA-007'],
    scopeWide: false,
    threats: ['IRAM2:ACC.002', 'BSI:G.0.36'],
    vulnerability: 'No rate limiting on /login',
    damageScenarioId: 'DS-003',
    impactDescription: 'Account takeover, regulatory exposure',
    existingControls: 'WAF, audit logging',
    owner: 'Ana Petrović',
    ownerInitials: 'AP',
    likelihood: 3,
    impact: { c: 3, i: 4, a: 2, f: 4 },
    createdAt: '2026-04-18',
  },
  {
    id: 'R-003',
    affects: ['IA-003', 'IA-004'],
    scopeWide: false,
    threats: ['BSI:G.0.45', 'BSI:G.0.23'],
    vulnerability: 'Backups not immutable',
    damageScenarioId: 'DS-002',
    impactDescription: 'Loss of payroll continuity',
    existingControls: 'Daily backup, off-site copy',
    owner: 'Lana D.',
    ownerInitials: 'LD',
    likelihood: 2,
    impact: { c: 2, i: 4, a: 5, f: 4 },
    createdAt: '2026-04-22',
  },
  {
    id: 'R-004',
    affects: ['IA-005'],
    scopeWide: false,
    threats: ['BSI:G.0.23'],
    vulnerability: 'Flat VLAN topology',
    impactDescription: 'Privileged network access',
    existingControls: 'Captive portal, MAC filtering',
    owner: 'Goran T.',
    ownerInitials: 'GT',
    likelihood: 2,
    impact: { c: 2, i: 2, a: 2, f: 1 },
    createdAt: '2026-05-02',
  },
  {
    id: 'R-005',
    affects: ['IA-006'],
    scopeWide: false,
    threats: ['BSI:G.0.47', 'IRAM2:INS.003'],
    vulnerability: 'Vendor lacks ISO 27001 certification',
    damageScenarioId: 'DS-006',
    impactDescription: 'Disclosure of pipeline data',
    existingControls: 'Contractual DPA only',
    owner: 'Marko K.',
    ownerInitials: 'MK',
    likelihood: 3,
    impact: { c: 3, i: 3, a: 3, f: 2 },
    createdAt: '2026-05-09',
  },
  {
    id: 'R-006',
    affects: [],
    scopeWide: true,
    threats: ['BSI:G.0.42'],
    vulnerability: 'Inconsistent phishing awareness across departments',
    damageScenarioId: 'DS-005',
    impactDescription: 'Account compromise across organisation',
    existingControls: 'Annual awareness program',
    owner: 'Ana Petrović',
    ownerInitials: 'AP',
    likelihood: 3,
    impact: { c: 3, i: 3, a: 2, f: 3 },
    createdAt: '2026-05-15',
  },
];

const SEED_TREATMENTS: Treatment[] = [
  {
    riskId: 'R-001',
    option: 'modify',
    strategy: 'Deploy full-disk encryption via MDM policies. Roll out BitLocker for Windows fleet and FileVault for macOS within Q3.',
    targetDate: '2026-08-31',
    residualLikelihood: 2,
    residualImpact: { c: 2, i: 2, a: 1, f: 2 },
    plannedControls: [
      { id: 'A.8.24', framework: 'ISO 27001:2022 Annex A', title: 'Use of cryptography' },
      { id: 'A.8.7',  framework: 'ISO 27001:2022 Annex A', title: 'Protection against malware' },
    ],
    acceptanceRationale: 'Residual risk within appetite; aligned with cryptography programme.',
    reviewDueDate: '2027-02-28',
  },
  {
    riskId: 'R-002',
    option: 'modify',
    strategy: 'Add adaptive rate limiting and bot-protection at the edge; enforce step-up auth on anomalies.',
    targetDate: '2026-07-15',
    residualLikelihood: 2,
    residualImpact: { c: 2, i: 3, a: 2, f: 3 },
    plannedControls: [
      { id: 'A.8.5',  framework: 'ISO 27001:2022 Annex A', title: 'Secure authentication' },
      { id: 'A.8.16', framework: 'ISO 27001:2022 Annex A', title: 'Monitoring activities' },
    ],
    acceptanceRationale: 'Adaptive controls bring likelihood back within appetite.',
    reviewDueDate: '2027-01-15',
  },
];

@Injectable({ providedIn: 'root' })
export class IsmsStore {
  // -------- Scales (used by the matrix) ----------
  readonly likelihoodScale = signal<ScalePoint[]>(LIKELIHOOD);
  readonly impactScale = signal<ScalePoint[]>(IMPACT);
  readonly acceptanceThreshold = signal<number>(10);

  // -------- Methodology ----------
  readonly methodologies = signal<Methodology[]>(SEED_METHODOLOGIES);
  readonly activeMethodology = computed(
    () => this.methodologies().find((m) => m.active) ?? this.methodologies()[0],
  );

  // -------- Catalogs ----------
  readonly inventory = signal<InventoryAsset[]>(SEED_INVENTORY);
  readonly threats = signal<ThreatCatalogItem[]>(SEED_THREATS);
  readonly damageScenarios = signal<DamageScenario[]>(SEED_DAMAGE_SCENARIOS);

  readonly inventoryById = computed(() => {
    const map = new Map<string, InventoryAsset>();
    for (const a of this.inventory()) map.set(a.id, a);
    return map;
  });
  readonly threatsById = computed(() => {
    const map = new Map<string, ThreatCatalogItem>();
    for (const t of this.threats()) map.set(t.id, t);
    return map;
  });
  readonly damageScenarioById = computed(() => {
    const map = new Map<string, DamageScenario>();
    for (const d of this.damageScenarios()) map.set(d.id, d);
    return map;
  });

  // -------- Risks / treatments / controls ----------
  readonly risks = signal<Risk[]>(SEED_RISKS);
  readonly treatments = signal<Treatment[]>(SEED_TREATMENTS);
  readonly controls = signal<AnnexControl[]>(SEED_CONTROLS);
  readonly events = signal<SimulationEvent[]>([]);

  // -------- Derived ----------
  readonly likelihoodMax = computed(() => this.likelihoodScale().length);
  readonly impactMax = computed(() => this.impactScale().length);
  readonly maxScore = computed(() => this.likelihoodMax() * this.impactMax());

  readonly enrichedRisks = computed(() =>
    this.risks().map((r) => {
      const ov = overallImpact(r.impact);
      const score = r.likelihood * ov;
      return {
        ...r,
        overallImpact: ov,
        score,
        tier: this.severity(score),
        breaches: score >= this.acceptanceThreshold(),
      };
    }),
  );

  readonly registerSummary = computed(() => {
    const list = this.enrichedRisks();
    return {
      total: list.length,
      breaching: list.filter((r) => r.breaches).length,
      reviewRequired: list.filter((r) => r.reviewRequired).length,
      avgScore:
        list.length === 0
          ? 0
          : Math.round((list.reduce((acc, r) => acc + r.score, 0) / list.length) * 10) / 10,
    };
  });

  readonly treatableRisks = computed(() =>
    this.enrichedRisks().filter((r) => r.breaches),
  );

  readonly treatmentsByRisk = computed(() => {
    const map = new Map<string, Treatment>();
    for (const t of this.treatments()) map.set(t.riskId, t);
    return map;
  });

  readonly controlsById = computed(() => {
    const map = new Map<string, AnnexControl>();
    for (const c of this.controls()) map.set(c.id, c);
    return map;
  });

  /** Map of Annex A control id → list of risk ids that planned this control. */
  readonly plannedControlLinks = computed(() => {
    const map = new Map<string, string[]>();
    for (const t of this.treatments()) {
      for (const pc of t.plannedControls) {
        const existing = map.get(pc.id) ?? [];
        existing.push(t.riskId);
        map.set(pc.id, existing);
      }
    }
    return map;
  });

  readonly soaSummary = computed(() => {
    const list = this.controls();
    return {
      total: list.length,
      applicable: list.filter((c) => c.applicable).length,
      excluded: list.filter((c) => !c.applicable).length,
      implemented: list.filter((c) => c.applicable && c.implementation === 'implemented').length,
    };
  });

  severity(score: number): SeverityTier {
    const max = this.maxScore();
    const t = this.acceptanceThreshold();
    if (score >= t && score >= Math.ceil(max * 0.65)) return 'critical';
    if (score >= t) return 'high';
    if (score >= Math.max(4, Math.ceil(t * 0.5))) return 'medium';
    return 'low';
  }

  severityClass(score: number): string {
    switch (this.severity(score)) {
      case 'critical': return 'sev-crit';
      case 'high':     return 'sev-high';
      case 'medium':   return 'sev-med';
      default:         return 'sev-low';
    }
  }

  severityLabel(score: number): string {
    switch (this.severity(score)) {
      case 'critical': return 'Critical';
      case 'high':     return 'High';
      case 'medium':   return 'Medium';
      default:         return 'Low';
    }
  }

  overallImpact(scores: ImpactScores): ScaleValue {
    return overallImpact(scores);
  }

  // -------- Mutators ----------
  setThreshold(value: number) {
    this.acceptanceThreshold.set(value);
  }

  setLikelihoodLabel(idx: number, label: string) {
    this.likelihoodScale.update((arr) => arr.map((p, i) => (i === idx ? { ...p, label } : p)));
  }
  setImpactLabel(idx: number, label: string) {
    this.impactScale.update((arr) => arr.map((p, i) => (i === idx ? { ...p, label } : p)));
  }

  setCustomizationLevel(level: CustomizationLevel) {
    this.methodologies.update((list) =>
      list.map((m) => (m.active ? { ...m, customizationLevel: level } : m)),
    );
  }

  activateMethodology(version: string) {
    this.methodologies.update((list) =>
      list.map((m) => ({
        ...m,
        active: m.version === version,
        status: m.version === version ? 'active' : m.status === 'active' ? 'retired' : m.status,
      })),
    );
  }

  addRisk(input: Omit<Risk, 'id' | 'createdAt'>): string {
    const id = `R-${(this.risks().length + 1).toString().padStart(3, '0')}`;
    const now = new Date().toISOString().slice(0, 10);
    const ownerInitials = input.ownerInitials || initials(input.owner);
    this.risks.update((list) => [...list, { ...input, id, ownerInitials, createdAt: now }]);
    return id;
  }

  updateRisk(id: string, patch: Partial<Risk>) {
    this.risks.update((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  removeRisk(id: string) {
    this.risks.update((list) => list.filter((r) => r.id !== id));
    this.treatments.update((list) => list.filter((t) => t.riskId !== id));
  }

  clearReview(riskId: string) {
    this.updateRisk(riskId, { reviewRequired: false, reviewReason: undefined });
  }

  setTreatment(riskId: string, patch: Partial<Treatment>) {
    const existing = this.treatments().find((t) => t.riskId === riskId);
    const next: Treatment = {
      riskId,
      option: existing?.option ?? 'modify',
      strategy: existing?.strategy ?? '',
      targetDate: existing?.targetDate ?? '',
      residualLikelihood: existing?.residualLikelihood ?? 1,
      residualImpact: existing?.residualImpact ?? { c: 1, i: 1, a: 1, f: 1 },
      plannedControls: existing?.plannedControls ?? [],
      acceptanceRationale: existing?.acceptanceRationale ?? '',
      reviewDueDate: existing?.reviewDueDate ?? '',
      ownerSignature: existing?.ownerSignature,
      ...patch,
    };
    this.treatments.update((list) => {
      const others = list.filter((t) => t.riskId !== riskId);
      return [...others, next];
    });
  }

  removeTreatment(riskId: string) {
    this.treatments.update((list) => list.filter((t) => t.riskId !== riskId));
  }

  toggleControlApplicable(id: string) {
    this.controls.update((list) =>
      list.map((c) => (c.id === id ? { ...c, applicable: !c.applicable } : c)),
    );
  }

  updateControl(id: string, patch: Partial<AnnexControl>) {
    this.controls.update((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  // -------- Simulator ----------
  simulate(kind: SimulationEvent['kind']) {
    const id = `E-${Date.now().toString().slice(-6)}`;
    const ts = new Date().toLocaleString('en-GB', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
    });

    let label = '';
    let note = '';
    let affected: string[] = [];

    const all = this.risks();
    const text = (r: Risk) => [
      r.vulnerability,
      r.impactDescription,
      ...r.threats.map((tid) => this.threatsById().get(tid)?.title ?? tid),
      ...r.affects.map((aid) => this.inventoryById().get(aid)?.name ?? aid),
    ].join(' ');

    if (kind === 'ransomware') {
      label = 'Ransomware campaign';
      note = 'Active ransomware affiliate targeting endpoints and backup repositories. Re-evaluate likelihood for related risks.';
      affected = all.filter((r) => /ransom|backup|laptop|endpoint|theft|malware/i.test(text(r))).map((r) => r.id);
    } else if (kind === 'cloud-migration') {
      label = 'Cloud migration · AWS';
      note = 'Major workloads moving to AWS. Re-evaluate risks tied to identity, shared responsibility, and supplier scope.';
      affected = all.filter((r) => /cloud|api|vendor|crm|database|identity|sso/i.test(text(r))).map((r) => r.id);
    } else {
      label = 'Third-party supplier breach';
      note = 'A major vendor disclosed credential exposure. Re-evaluate supplier-related risks and access shared with that vendor.';
      affected = all.filter((r) => /vendor|supplier|third|crm|partner|insider|saas/i.test(text(r))).map((r) => r.id);
    }
    if (affected.length === 0) affected = all.slice(0, 2).map((r) => r.id);

    this.events.update((list) =>
      [{ id, label, kind, timestamp: ts, affectedRiskIds: affected, note }, ...list].slice(0, 20),
    );

    this.risks.update((list) =>
      list.map((r) =>
        affected.includes(r.id) ? { ...r, reviewRequired: true, reviewReason: label } : r,
      ),
    );
  }

  clearEvents() {
    this.events.set([]);
    this.risks.update((list) =>
      list.map((r) => ({ ...r, reviewRequired: false, reviewReason: undefined })),
    );
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const TREATMENT_LABELS: Record<TreatmentOption, string> = {
  modify: 'Modify (Mitigate)',
  avoid:  'Avoid',
  share:  'Share (Transfer)',
  retain: 'Retain (Accept)',
};

export const TREATMENT_DESCRIPTIONS: Record<TreatmentOption, string> = {
  modify: 'Apply controls that reduce likelihood or impact. Most common path; cross-link to an Annex A control.',
  avoid:  'Discontinue the activity or remove the asset that creates the risk.',
  share:  'Transfer part of the risk via insurance or a vetted third party.',
  retain: 'Accept the risk; formal sign-off by the risk owner is required.',
};

export const IMPACT_DIM_LABELS: Record<string, string> = {
  c: 'Confidentiality',
  i: 'Integrity',
  a: 'Availability',
  f: 'Financial',
};

export { IMPACT_DIM_KEYS };
