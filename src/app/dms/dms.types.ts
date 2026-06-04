/* ============================================================
   DMS — domain types + seed data
   Ported from the design handoff (dms.js).
   ============================================================ */

export type View = 'documents' | 'types' | 'config';
export type IntStatus = 'connected' | 'error' | 'syncing' | 'disabled';

export interface DocType {
  id: string;
  name: string;
  color: string;
  desc: string;
  fields: string[];
}

export interface IntegrationConfig {
  url: string;
  client: string;
  secret: string;
  folder: string;
  scope: string;
}

export interface Integration {
  id: string;
  provider: string;
  label: string;
  status: IntStatus;
  lastSync: string;
  error?: string;
  config: IntegrationConfig;
}

export interface DmsDoc {
  id: string;
  name: string;
  ext: string;
  sourceType: 'integration' | 'upload';
  intId: string | null;
  typeId: string | null;
  days: number;
  date: string;
  size: string;
  owner: string;
  meta: Record<string, string>;
}

export interface Owner {
  name: string;
  initials: string;
  bg: string;
  fg: string;
}

export interface Provider {
  name: string;
  mono: string;
  hue: string;
  blurb: string;
  urlLabel: string;
  urlPh: string;
}

/* ---------- owners ---------- */
export const OWN: Record<string, Owner> = {
  mk: { name: 'Marko K.', initials: 'MK', bg: 'var(--accent)', fg: 'var(--accent-fg)' },
  ap: { name: 'Ana Petrović', initials: 'AP', bg: 'rgb(141 198 245 / .20)', fg: 'var(--info)' },
  ld: { name: 'Lana D.', initials: 'LD', bg: 'rgb(240 201 135 / .20)', fg: 'var(--warn)' },
  gt: { name: 'Goran T.', initials: 'GT', bg: 'rgb(242 164 164 / .20)', fg: 'var(--danger)' },
  sys: { name: 'Sync service', initials: 'SY', bg: 'var(--surface-hi)', fg: 'var(--fg-3)' },
};

/* ---------- type color palette ---------- */
export const PALETTE = ['#f2a4a4', '#f0c987', '#8dc6f5', '#8cf0c8', '#c9a8f0', '#f0a8cf', '#9fe0c0', '#e0b48c'];

/* ---------- providers (brand-neutral) ---------- */
export const PROVIDERS: Record<string, Provider> = {
  sharepoint: { name: 'SharePoint', mono: 'SP', hue: '#8dc6f5', blurb: 'Microsoft 365 document libraries', urlLabel: 'Site URL', urlPh: 'https://contoso.sharepoint.com/sites/isms' },
  dropbox: { name: 'Dropbox', mono: 'DB', hue: '#8dc6f5', blurb: 'Team & personal shared folders', urlLabel: 'Team folder path', urlPh: '/Compliance/Shared' },
  gdrive: { name: 'Google Drive', mono: 'GD', hue: '#8cf0c8', blurb: 'Shared drives & My Drive', urlLabel: 'Drive ID / URL', urlPh: 'https://drive.google.com/drive/folders/…' },
  box: { name: 'Box', mono: 'BX', hue: '#f0c987', blurb: 'Enterprise content cloud', urlLabel: 'Root folder ID', urlPh: '0' },
  s3: { name: 'Amazon S3', mono: 'S3', hue: '#f0c987', blurb: 'Object storage buckets', urlLabel: 'Bucket URI', urlPh: 's3://compliance-docs' },
};

export const SCOPES = [
  { value: 'incremental', label: 'Incremental — only changed files' },
  { value: 'full', label: 'Full — re-sync everything each run' },
  { value: 'manual', label: 'Manual — pull on demand only' },
];

export function relDate(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + 'd ago';
  if (days < 30) return Math.round(days / 7) + 'w ago';
  return Math.round(days / 30) + 'mo ago';
}

export const SEED_TYPES: DocType[] = [
  { id: 'conf', name: 'CONFIDENTIAL', color: '#f2a4a4', desc: 'Restricted — strictly need-to-know access.', fields: ['Classification owner', 'Review date'] },
  { id: 'policy', name: 'POLICY', color: '#8dc6f5', desc: 'Approved governing document in force.', fields: ['Version', 'Effective date'] },
  { id: 'finance', name: 'FINANCE', color: '#f0c987', desc: 'Financial records and statements.', fields: ['Reporting period', 'Currency'] },
  { id: 'public', name: 'PUBLIC', color: '#8cf0c8', desc: 'Cleared for external distribution.', fields: [] },
];

export const SEED_INTEGRATIONS: Integration[] = [
  {
    id: 'int-sp', provider: 'sharepoint', label: 'ISMS Document Library', status: 'connected', lastSync: '2h ago',
    config: { url: 'https://contoso.sharepoint.com/sites/isms', client: 'a1b2c3d4-ee55', secret: '••••••••••', folder: '/Shared Documents/ISMS', scope: 'incremental' },
  },
  {
    id: 'int-db', provider: 'dropbox', label: 'Finance — Shared', status: 'error', lastSync: '1d ago', error: 'Access token expired — re-authorize.',
    config: { url: '/Finance/Shared', client: 'fin-app-21', secret: '••••••••••', folder: '/Finance/Shared', scope: 'incremental' },
  },
];

const SEED_DOCS: [string, string, 'integration' | 'upload', string | null, string | null, number, string, string][] = [
  ['Information Security Policy', 'pdf', 'integration', 'int-sp', 'policy', 4, '1.2 MB', 'mk'],
  ['Access Control Procedure', 'docx', 'integration', 'int-sp', 'policy', 9, '480 KB', 'ap'],
  ['Risk Treatment Plan 2025', 'xlsx', 'integration', 'int-sp', 'conf', 2, '2.4 MB', 'ld'],
  ['Q3 Financial Statement', 'xlsx', 'integration', 'int-db', 'finance', 12, '3.1 MB', 'gt'],
  ['Vendor NDA — Acme', 'pdf', 'upload', null, 'conf', 1, '210 KB', 'mk'],
  ['Incident Response Runbook', 'pdf', 'integration', 'int-sp', 'policy', 21, '890 KB', 'ap'],
  ['Board Pack — November', 'pdf', 'upload', null, 'finance', 6, '5.6 MB', 'gt'],
  ['Data Retention Schedule', 'xlsx', 'integration', 'int-sp', null, 34, '120 KB', 'ld'],
  ['Press Release — Certification', 'docx', 'upload', null, 'public', 0, '64 KB', 'mk'],
  ['Penetration Test Report', 'pdf', 'integration', 'int-db', 'conf', 17, '4.8 MB', 'gt'],
];

export function seedDocuments(): DmsDoc[] {
  return SEED_DOCS.map((d, i) => ({
    id: 'doc-' + (i + 1), name: d[0], ext: d[1], sourceType: d[2], intId: d[3],
    typeId: d[4], days: d[5], date: relDate(d[5]), size: d[6], owner: d[7], meta: {},
  }));
}

export const PULL_SAMPLES: Record<string, [string, string, string][]> = {
  sharepoint: [['Statement of Applicability', 'xlsx', '320 KB'], ['Internal Audit Report', 'pdf', '1.1 MB'], ['Asset Register', 'xlsx', '740 KB']],
  dropbox: [['Expense Policy', 'pdf', '260 KB'], ['Invoice Batch — Oct', 'pdf', '1.9 MB']],
  gdrive: [['Onboarding Checklist', 'docx', '90 KB'], ['Org Chart', 'pdf', '410 KB'], ['Meeting Notes', 'docx', '55 KB']],
  box: [['Contract — Renewal', 'pdf', '880 KB'], ['SOW Appendix', 'docx', '120 KB']],
  s3: [['Backup Manifest', 'xlsx', '44 KB'], ['Access Log Export', 'pdf', '2.2 MB']],
};
