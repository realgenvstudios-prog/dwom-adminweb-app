import type { ApprovalStatus, DocRule, DocState, Vehicle } from '../../../services/riderApplicationsService';

export const APPROVAL: Record<ApprovalStatus, { label: string; className: string }> = {
  pending: { label: 'Waiting for review', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700' },
  changes_requested: { label: 'Needs changes', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700' },
  incomplete: { label: 'Not finished', className: 'border-border bg-muted text-muted-foreground' },
  rejected: { label: 'Rejected', className: 'border-red-500/30 bg-red-500/10 text-red-700' },
  approved: { label: 'Approved', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
};

export const DOC_STATE: Record<DocState, { label: string; className: string }> = {
  missing: { label: 'Not uploaded', className: 'border-border bg-muted text-muted-foreground' },
  pending: { label: 'To check', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700' },
  approved: { label: 'Approved', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  rejected: { label: 'Rejected', className: 'border-red-500/30 bg-red-500/10 text-red-700' },
  expired: { label: 'Expired', className: 'border-red-500/30 bg-red-500/10 text-red-700' },
};

export const VEHICLES: { key: Vehicle; label: string }[] = [
  { key: 'motorbike', label: 'Motorbike' },
  { key: 'bicycle', label: 'Bicycle' },
  { key: 'car', label: 'Car' },
];

export const vehicleLabel = (v: Vehicle) => VEHICLES.find((x) => x.key === v)?.label ?? v;

export const RULES: { key: DocRule; label: string }[] = [
  { key: 'required', label: 'Required' },
  { key: 'optional', label: 'Optional' },
  { key: 'off', label: 'Off' },
];

/** Plain words for the rider history list. */
export const EVENT_LABELS: Record<string, string> = {
  signup_started: 'Started signing up',
  document_uploaded: 'Uploaded a document',
  payout_account_saved: 'Added payout account',
  briefing_completed: 'Finished the safety briefing',
  submitted: 'Sent for review',
  document_approved: 'Document approved',
  document_rejected: 'Document rejected',
  approved: 'Approved',
  changes_requested: 'Asked for changes',
  rejected: 'Rejected',
};

export const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not yet';
