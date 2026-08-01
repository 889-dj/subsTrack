export type BillingCycle = 'monthly' | 'yearly';

/** Where a subscription record came from. */
export type SubscriptionSource = 'manual' | 'statement';

export const CATEGORIES = [
  'Entertainment',
  'Music',
  'Software',
  'Cloud & Storage',
  'News & Reading',
  'Fitness',
  'Food & Delivery',
  'Utilities',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: string; // ISO date string
  category?: string;
  note?: string;
  source: SubscriptionSource;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionInput = Omit<
  Subscription,
  'id' | 'createdAt' | 'updatedAt' | 'source'
> & {
  source?: SubscriptionSource;
};

/** Lifecycle of an uploaded bank statement as the backend works through it. */
export type StatementStatus =
  | 'uploading'
  | 'parsing' // pulling raw transactions out of the PDF/CSV
  | 'analyzing' // AI grouping transactions into recurring charges + categorising
  | 'ready' // detections available for review
  | 'failed';

export interface Statement {
  id: string;
  fileName: string;
  fileSize: number;
  status: StatementStatus;
  /** 0-1, drives the progress bar while parsing/analyzing. */
  progress: number;
  transactionCount: number;
  detectedCount: number;
  error?: string;
  uploadedAt: string;
}

/** One recurring charge the AI matched across several statement lines. */
export interface DetectedSubscription {
  id: string;
  statementId: string;
  /** Cleaned-up merchant name, e.g. "Netflix". */
  name: string;
  /** Raw descriptor as it appeared on the statement. */
  rawDescriptor: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: string;
  category: Category;
  /** Model confidence that this is a recurring subscription, 0-1. */
  confidence: number;
  /** Dates the charge was seen on, oldest first. */
  occurrences: string[];
  /** True when this matches a subscription the user already tracks. */
  alreadyTracked: boolean;
}

/** A detection after the user has reviewed or corrected it. */
export interface ReviewedDetection {
  id: string;
  name: string;
  cost: number;
  category: Category;
  billingCycle: BillingCycle;
}

export interface ConfirmDetectionsResponse {
  created: Subscription[];
  skipped: number;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
