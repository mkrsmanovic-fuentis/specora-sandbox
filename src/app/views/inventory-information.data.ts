export type Classification = 'Public' | 'Internal' | 'Confidential' | 'Restricted';

export interface InfoAsset {
  id: string;
  name: string;
  location: string;
  owner: string;
  ownerInitials: string;
  classification: Classification;
  cia: { c: number; i: number; a: number }; // 1-5
  reviewed: string;
  reviewedTone: 'fresh' | 'stale' | 'overdue';
}

export const SEED: InfoAsset[] = [
  { id: 'IA-001', name: 'Customer PII database',          location: 'production-db-01 · AWS Aurora',     owner: 'Marko K.',     ownerInitials: 'MK', classification: 'Confidential', cia: { c: 4, i: 4, a: 4 }, reviewed: '2d ago',     reviewedTone: 'fresh'   },
  { id: 'IA-002', name: 'Source code repositories',        location: 'GitHub Enterprise Org',             owner: 'Goran T.',     ownerInitials: 'GT', classification: 'Internal',     cia: { c: 3, i: 5, a: 3 }, reviewed: '1w ago',     reviewedTone: 'fresh'   },
  { id: 'IA-003', name: 'Employee personnel files',        location: 'BambooHR · EU-WEST tenancy',        owner: 'Ana Petrović', ownerInitials: 'AP', classification: 'Restricted',   cia: { c: 5, i: 4, a: 3 }, reviewed: '11d ago',    reviewedTone: 'stale'   },
  { id: 'IA-004', name: 'Financial transactions ledger',   location: 'NetSuite ERP · Production',         owner: 'Lana D.',      ownerInitials: 'LD', classification: 'Restricted',   cia: { c: 5, i: 5, a: 4 }, reviewed: '4d ago',     reviewedTone: 'fresh'   },
  { id: 'IA-005', name: 'Marketing brand assets',          location: 'Cloudinary · brand bucket',         owner: 'Sara V.',      ownerInitials: 'SV', classification: 'Public',       cia: { c: 1, i: 3, a: 2 }, reviewed: '3w ago',     reviewedTone: 'stale'   },
  { id: 'IA-006', name: 'Engineering wiki',                location: 'Confluence · eng space',            owner: 'Goran T.',     ownerInitials: 'GT', classification: 'Internal',     cia: { c: 3, i: 3, a: 3 }, reviewed: '6d ago',     reviewedTone: 'fresh'   },
  { id: 'IA-007', name: 'Incident response runbooks',      location: 'Confluence · sec space',            owner: 'Ana Petrović', ownerInitials: 'AP', classification: 'Confidential', cia: { c: 4, i: 4, a: 5 }, reviewed: '9d ago',     reviewedTone: 'stale'   },
  { id: 'IA-008', name: 'Customer contracts (signed)',     location: 'DocuSign vault',                    owner: 'Marko K.',     ownerInitials: 'MK', classification: 'Confidential', cia: { c: 4, i: 5, a: 3 }, reviewed: '14d ago',    reviewedTone: 'stale'   },
  { id: 'IA-009', name: 'Threat intelligence feed',        location: 'Recorded Future · API ingest',      owner: 'Goran T.',     ownerInitials: 'GT', classification: 'Internal',     cia: { c: 3, i: 4, a: 4 }, reviewed: '1d ago',     reviewedTone: 'fresh'   },
  { id: 'IA-010', name: 'Compliance evidence archive',     location: 'Drata · evidence library',          owner: 'Lana D.',      ownerInitials: 'LD', classification: 'Confidential', cia: { c: 4, i: 5, a: 3 }, reviewed: '37d ago',    reviewedTone: 'overdue' },
  { id: 'IA-011', name: 'Board minutes & decisions',       location: 'Diligent board portal',             owner: 'Marko K.',     ownerInitials: 'MK', classification: 'Restricted',   cia: { c: 5, i: 5, a: 2 }, reviewed: '5d ago',     reviewedTone: 'fresh'   },
  { id: 'IA-012', name: 'Pricing strategy documents',      location: 'Notion · revenue workspace',        owner: 'Sara V.',      ownerInitials: 'SV', classification: 'Confidential', cia: { c: 4, i: 3, a: 2 }, reviewed: '8d ago',     reviewedTone: 'fresh'   },
];
