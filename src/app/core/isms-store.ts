import { Injectable, computed, signal } from '@angular/core';
import {
  AnnexControl,
  Risk,
  ScalePoint,
  ScaleValue,
  SeverityTier,
  SimulationEvent,
  Treatment,
  TreatmentOption,
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

const SEED_CONTROLS: AnnexControl[] = [
  {
    id: 'A.5.1',
    group: 'A.5 Organisational controls',
    title: 'Policies for information security',
    applicable: true,
    justification: 'Required by management commitment and regulatory mandate.',
    implementation: 'implemented',
    implementationPct: 100,
  },
  {
    id: 'A.5.7',
    group: 'A.5 Organisational controls',
    title: 'Threat intelligence',
    applicable: true,
    justification: 'Required to track emerging threats relevant to operations.',
    implementation: 'in-progress',
    implementationPct: 55,
  },
  {
    id: 'A.5.23',
    group: 'A.5 Organisational controls',
    title: 'Information security for use of cloud services',
    applicable: true,
    justification: 'AWS and Microsoft 365 are core platforms.',
    implementation: 'in-progress',
    implementationPct: 40,
  },
  {
    id: 'A.6.3',
    group: 'A.6 People controls',
    title: 'Information security awareness, education and training',
    applicable: true,
    justification: 'Mandatory annual awareness program for all staff.',
    implementation: 'implemented',
    implementationPct: 95,
  },
  {
    id: 'A.7.4',
    group: 'A.7 Physical controls',
    title: 'Physical security monitoring',
    applicable: true,
    justification: 'CCTV at office premises and DC partner sites.',
    implementation: 'implemented',
    implementationPct: 100,
  },
  {
    id: 'A.8.5',
    group: 'A.8 Technology controls · Access control',
    title: 'Secure authentication',
    applicable: true,
    justification: 'MFA enforced for all administrative accounts.',
    implementation: 'in-progress',
    implementationPct: 70,
  },
  {
    id: 'A.8.7',
    group: 'A.8 Technology controls · Endpoint',
    title: 'Protection against malware',
    applicable: true,
    justification: 'EDR rolled out to fleet endpoints.',
    implementation: 'implemented',
    implementationPct: 100,
  },
  {
    id: 'A.8.16',
    group: 'A.8 Technology controls · Monitoring',
    title: 'Monitoring activities',
    applicable: true,
    justification: 'SIEM consumes endpoint, identity and network logs.',
    implementation: 'in-progress',
    implementationPct: 60,
  },
  {
    id: 'A.8.24',
    group: 'A.8 Technology controls · Cryptography',
    title: 'Use of cryptography',
    applicable: true,
    justification:
      'Full-disk encryption mandated on laptops via MDM. Key management aligned to NIST SP 800-57.',
    implementation: 'in-progress',
    implementationPct: 45,
  },
  {
    id: 'A.8.25',
    group: 'A.8 Technology controls · Development',
    title: 'Secure development lifecycle',
    applicable: true,
    justification: 'SDLC enforced for the engineering org with mandatory reviews.',
    implementation: 'in-progress',
    implementationPct: 50,
  },
  {
    id: 'A.5.19',
    group: 'A.5 Organisational controls',
    title: 'Information security in supplier relationships',
    applicable: true,
    justification: 'Procurement vetting and contractual security clauses.',
    implementation: 'in-progress',
    implementationPct: 35,
  },
  {
    id: 'A.7.11',
    group: 'A.7 Physical controls',
    title: 'Supporting utilities',
    applicable: false,
    justification: 'Operations are 100% cloud-hosted; no physical utilities owned.',
    implementation: 'not-started',
    implementationPct: 0,
  },
];

const SEED_RISKS: Risk[] = [
  {
    id: 'R-001',
    asset: 'Customer Data Laptops',
    threat: 'Theft of device',
    vulnerability: 'Lack of full-disk encryption',
    impactDescription: 'Unauthorized data disclosure',
    existingControls: 'MFA on login, asset tagging',
    owner: 'Marko K.',
    ownerInitials: 'MK',
    likelihood: 4,
    impact: 4,
    createdAt: '2026-04-12',
  },
  {
    id: 'R-002',
    asset: 'Customer-facing API',
    threat: 'Credential stuffing',
    vulnerability: 'No rate limiting on /login',
    impactDescription: 'Account takeover, regulatory exposure',
    existingControls: 'WAF, audit logging',
    owner: 'Ana Petrović',
    ownerInitials: 'AP',
    likelihood: 3,
    impact: 4,
    createdAt: '2026-04-18',
  },
  {
    id: 'R-003',
    asset: 'Payroll database backup',
    threat: 'Ransomware on backup target',
    vulnerability: 'Backups not immutable',
    impactDescription: 'Loss of payroll continuity',
    existingControls: 'Daily backup, off-site copy',
    owner: 'Lana D.',
    ownerInitials: 'LD',
    likelihood: 2,
    impact: 5,
    createdAt: '2026-04-22',
  },
  {
    id: 'R-004',
    asset: 'Office wifi guest network',
    threat: 'Lateral movement from guest segment',
    vulnerability: 'Flat VLAN topology',
    impactDescription: 'Privileged network access',
    existingControls: 'Captive portal, MAC filtering',
    owner: 'Goran T.',
    ownerInitials: 'GT',
    likelihood: 2,
    impact: 2,
    createdAt: '2026-05-02',
  },
  {
    id: 'R-005',
    asset: 'Third-party CRM (vendor)',
    threat: 'Supplier security breach',
    vulnerability: 'Vendor lacks ISO 27001 certification',
    impactDescription: 'Disclosure of pipeline data',
    existingControls: 'Contractual DPA only',
    owner: 'Marko K.',
    ownerInitials: 'MK',
    likelihood: 3,
    impact: 3,
    createdAt: '2026-05-09',
  },
];

const SEED_TREATMENTS: Treatment[] = [
  {
    riskId: 'R-001',
    option: 'modify',
    strategy:
      'Deploy full-disk encryption via MDM policies. Roll out BitLocker for Windows fleet and FileVault for macOS within Q3.',
    targetDate: '2026-08-31',
    residualLikelihood: 2,
    residualImpact: 2,
    linkedControlId: 'A.8.24',
  },
  {
    riskId: 'R-002',
    option: 'modify',
    strategy: 'Add adaptive rate limiting and bot-protection at the edge; enforce step-up auth on anomalies.',
    targetDate: '2026-07-15',
    residualLikelihood: 2,
    residualImpact: 3,
    linkedControlId: 'A.8.5',
  },
];

@Injectable({ providedIn: 'root' })
export class IsmsStore {
  // -------- Criteria & threshold ----------
  readonly likelihoodScale = signal<ScalePoint[]>(LIKELIHOOD);
  readonly impactScale = signal<ScalePoint[]>(IMPACT);
  /** Inclusive lower bound where risk is considered Unacceptable / requires treatment. */
  readonly acceptanceThreshold = signal<number>(10);

  // -------- Domain entities ----------
  readonly risks = signal<Risk[]>(SEED_RISKS);
  readonly treatments = signal<Treatment[]>(SEED_TREATMENTS);
  readonly controls = signal<AnnexControl[]>(SEED_CONTROLS);
  readonly events = signal<SimulationEvent[]>([]);

  // -------- Derived state ----------
  readonly likelihoodMax = computed(() => this.likelihoodScale().length);
  readonly impactMax = computed(() => this.impactScale().length);
  readonly maxScore = computed(() => this.likelihoodMax() * this.impactMax());

  readonly enrichedRisks = computed(() =>
    this.risks().map((r) => {
      const score = r.likelihood * r.impact;
      return {
        ...r,
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
      case 'critical':
        return 'sev-crit';
      case 'high':
        return 'sev-high';
      case 'medium':
        return 'sev-med';
      default:
        return 'sev-low';
    }
  }

  severityLabel(score: number): string {
    switch (this.severity(score)) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  }

  // -------- Mutators ----------
  setThreshold(value: number) {
    this.acceptanceThreshold.set(value);
  }

  setLikelihoodLabel(idx: number, label: string) {
    this.likelihoodScale.update((arr) =>
      arr.map((p, i) => (i === idx ? { ...p, label } : p)),
    );
  }
  setImpactLabel(idx: number, label: string) {
    this.impactScale.update((arr) =>
      arr.map((p, i) => (i === idx ? { ...p, label } : p)),
    );
  }

  addRisk(input: Omit<Risk, 'id' | 'createdAt'>) {
    const id = `R-${(this.risks().length + 1).toString().padStart(3, '0')}`;
    const now = new Date().toISOString().slice(0, 10);
    const ownerInitials = input.ownerInitials || initials(input.owner);
    this.risks.update((list) => [...list, { ...input, id, ownerInitials, createdAt: now }]);
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
      residualImpact: existing?.residualImpact ?? 1,
      linkedControlId: existing?.linkedControlId,
      ...patch,
    };
    this.treatments.update((list) => {
      const others = list.filter((t) => t.riskId !== riskId);
      return [...others, next];
    });
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
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });

    let label = '';
    let note = '';
    let affected: string[] = [];

    const all = this.risks();
    const match = (predicate: (r: Risk) => boolean) =>
      all.filter(predicate).map((r) => r.id);

    if (kind === 'ransomware') {
      label = 'Ransomware campaign';
      note =
        'Active ransomware affiliate targeting endpoints and backup repositories. Re-evaluate likelihood for related risks.';
      affected = match(
        (r) =>
          /ransom|backup|laptop|endpoint/i.test(r.threat + r.asset + r.vulnerability),
      );
      if (affected.length === 0) affected = all.slice(0, 2).map((r) => r.id);
    } else if (kind === 'cloud-migration') {
      label = 'Cloud migration · AWS';
      note =
        'Major workloads moving to AWS. Re-evaluate risks tied to identity, shared responsibility, and supplier scope.';
      affected = match((r) =>
        /cloud|api|vendor|crm|database/i.test(r.threat + r.asset + r.vulnerability),
      );
      if (affected.length === 0) affected = all.slice(0, 2).map((r) => r.id);
    } else {
      label = 'Third-party supplier breach';
      note =
        'A major vendor disclosed credential exposure. Re-evaluate supplier-related risks and access shared with that vendor.';
      affected = match((r) =>
        /vendor|supplier|third|crm|partner/i.test(r.threat + r.asset + r.vulnerability),
      );
      if (affected.length === 0) affected = all.slice(-2).map((r) => r.id);
    }

    this.events.update((list) =>
      [{ id, label, kind, timestamp: ts, affectedRiskIds: affected, note }, ...list].slice(0, 20),
    );

    this.risks.update((list) =>
      list.map((r) =>
        affected.includes(r.id)
          ? { ...r, reviewRequired: true, reviewReason: label }
          : r,
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
  avoid: 'Avoid',
  share: 'Share (Transfer)',
  retain: 'Retain (Accept)',
};

export const TREATMENT_DESCRIPTIONS: Record<TreatmentOption, string> = {
  modify:
    'Apply controls that reduce likelihood or impact. Most common path; cross-link to an Annex A control.',
  avoid: 'Discontinue the activity or remove the asset that creates the risk.',
  share: 'Transfer part of the risk via insurance or a vetted third party.',
  retain: 'Accept the risk; formal sign-off by the risk owner is required.',
};
