// ── Rules-based NLP scoring engine ─────────────────────────────────────────
// Evaluates a task title against urgency + importance signal groups, then
// maps the weighted score to a differentiated recommendation label.

export interface ScoreResult {
  importanceScore: 1 | 2 | 3 | 4 | 5;
  urgencyScore:    1 | 2 | 3 | 4 | 5;
  bucket:          'must-do' | 'should-do' | 'could-do';
  recommendationLabel:  'do-now' | 'schedule' | 'reconsider' | 'deprioritize';
  recommendationReason: string;
}

// ── Utility helpers ──────────────────────────────────────────────────────────

function clamp5(v: number): 1 | 2 | 3 | 4 | 5 {
  return Math.max(1, Math.min(5, Math.round(v))) as 1 | 2 | 3 | 4 | 5;
}

function has(text: string, terms: string[]): boolean {
  return terms.some(t => text.includes(t));
}

function rx(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(text));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','my','this','that','is','it','be','as','do','so','i','me','we','us',
  'get','have','need','will','its','our','some',
]);

function meaningfulWordCount(title: string): number {
  return title.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w)).length;
}

// ── Signal groups: Urgency ───────────────────────────────────────────────────

// User explicitly says this is optional or can wait → defer
const U_DEFER = [
  "if there's time", 'if time', 'no rush', 'low priority', 'low-priority',
  'eventually', 'someday', 'some day', 'when i get to it', 'when i get a chance',
  'can wait', 'not urgent', 'whenever', 'backlog', 'optional', 'maybe later',
  'at some point', 'one day',
];

// Explicit urgency — must act today
const U_CRITICAL = [
  'asap', 'urgent', 'urgently', 'immediately', 'right now', 'today',
  'this morning', 'this afternoon', 'tonight', 'this evening',
  'by eod', 'end of day', 'before noon', 'before lunch', 'eod',
  'overdue', 'past due', 'missed deadline', 'critical',
];
const U_CRITICAL_RX = [/\bdue\s+today\b/, /\bby\s+\d/, /\bbefore\s+\d/, /\bdeadline\s+today\b/];

// Due within the week
const U_HIGH = [
  'tomorrow', 'by tomorrow', 'first thing', 'tomorrow morning',
  'this week', 'by friday', 'by thursday', 'by wednesday', 'by tuesday', 'by monday',
  'by end of week', 'end of week',
];
const U_HIGH_RX = [/\bby\s+(mon|tue|wed|thu|fri)\b/i, /\bdue\s+this\s+week\b/i, /\bby\s+the\s+end\s+of\s+(the\s+)?week\b/i];

// Some pressure but not immediate
const U_MEDIUM = [
  'next week', 'soon', 'by next', 'this month', 'coming up', 'in the next few',
];
const U_MEDIUM_RX = [/\bdue\s+next\b/i, /\bin\s+(a\s+)?few\s+days\b/i, /\bby\s+next\s+(mon|tue|wed|thu|fri)\b/i];

// ── Signal groups: Importance ────────────────────────────────────────────────

// High-stakes: failure has real consequences
const I_CRITICAL = [
  'client', 'proposal', 'contract', 'launch', 'deploy', 'release',
  'investor', 'board', 'exec', 'ceo', 'cto', 'coo', 'vp',
  'annual review', 'performance review', 'quarterly', 'sign off', 'sign-off',
  'approval', 'approve', 'interview', 'deadline', 'submit', 'filing',
  'legal', 'compliance', 'security', 'incident', 'outage', 'production issue',
];

// Strategic or meaningful deliverables
const I_HIGH = [
  'presentation', 'present to', 'present for', 'report', 'meeting prep',
  'prepare', 'finalize', 'strategy', 'milestone', 'deliverable', 'project plan',
  'architecture', 'sprint', 'analysis', 'roadmap', 'kickoff',
];

// Routine coordination and comms
const I_MEDIUM = [
  'email', 'reply', 'respond', 'call', 'follow up', 'followup',
  'schedule', 'draft', 'write', 'update', 'send', 'book', 'feedback',
  'review', 'meeting', 'check in',
];

// Low-stakes: learning, research, exploration
const I_LOW = [
  'read', 'look into', 'check out', 'browse', 'explore', 'think about',
  'consider', 'learn', 'watch', 'listen to', 'look up', 'search for',
];

// Trivial housekeeping
const I_VERY_LOW = [
  'tidy', 'clean up', 'reorganize', 'rearrange', 'declutter', 'sort out',
  'file away', 'organise',
];

// Known ambiguous single-word titles
const GENERIC_TOKENS = new Set([
  'test','thing','stuff','item','misc','other','todo','task','work',
  'note','temp','wip','fix','bug','issue','check',
]);

// ── Main scoring function ────────────────────────────────────────────────────

export function scoreTask(
  title: string,
  opts: {
    importanceWeight?: number;
    urgencyWeight?:    number;
    isCarryover?:      boolean;
  } = {},
): ScoreResult {
  const iw = opts.importanceWeight ?? 0.6;
  const uw = opts.urgencyWeight    ?? 0.4;
  const isCarryover = opts.isCarryover ?? false;

  const t = title.toLowerCase().trim();
  const wordCount = meaningfulWordCount(title);
  const tokens = t.split(/\s+/).filter(w => w.length > 1);

  // Ambiguity detection
  const isSingleGeneric = tokens.length <= 1 && GENERIC_TOKENS.has(tokens[0] ?? '');
  const isShortWithNoSignals =
    wordCount < 3 &&
    !has(t, U_CRITICAL) && !rx(t, U_CRITICAL_RX) &&
    !has(t, I_CRITICAL) && !has(t, U_DEFER);
  const isAmbiguous = isSingleGeneric || isShortWithNoSignals;

  const signals: string[] = [];

  // ── Urgency ──────────────────────────────────────────────────────────────
  let urgencyBoost = 0;
  let isDeferred = false;

  if (has(t, U_DEFER)) {
    urgencyBoost = -4;
    isDeferred = true;
    signals.push('optional phrasing detected');
  } else if (has(t, U_CRITICAL) || rx(t, U_CRITICAL_RX)) {
    urgencyBoost = 3;
    signals.push('time-critical language');
  } else if (has(t, U_HIGH) || rx(t, U_HIGH_RX)) {
    urgencyBoost = 2;
    signals.push('due this week');
  } else if (has(t, U_MEDIUM) || rx(t, U_MEDIUM_RX)) {
    urgencyBoost = 1;
    signals.push('due soon');
  }

  if (isCarryover && !isDeferred) {
    urgencyBoost = Math.min(urgencyBoost + 1, 3);
    signals.push('carried over from yesterday');
  }

  // ── Importance ────────────────────────────────────────────────────────────
  let importanceBoost = 0;

  if (has(t, I_VERY_LOW)) {
    importanceBoost = -1;
    signals.push('housekeeping task');
  } else if (has(t, I_CRITICAL)) {
    importanceBoost = 3;
    signals.push('high-stakes or client-facing');
  } else if (has(t, I_HIGH)) {
    importanceBoost = 2;
    signals.push('strategic deliverable');
  } else if (has(t, I_MEDIUM)) {
    importanceBoost = 1;
    signals.push('coordination or communication');
  } else if (has(t, I_LOW)) {
    importanceBoost = -1;
    signals.push('learning or exploratory task');
  }

  // ── Compute scores (base = 2, below middle — must earn higher) ────────────
  const BASE = 2;
  let importance = clamp5(BASE + importanceBoost);
  let urgency    = clamp5(BASE + urgencyBoost);

  // Ambiguous titles stay low so they don't masquerade as priorities
  if (isAmbiguous) {
    importance = Math.min(importance, 2) as 1 | 2;
    urgency    = Math.min(urgency,    2) as 1 | 2;
    if (!signals.length) {
      signals.push(isSingleGeneric ? 'ambiguous title' : 'short title — ranked conservatively');
    }
  }

  // ── Weighted combined score ───────────────────────────────────────────────
  const score = importance * iw + urgency * uw;

  // ── Label mapping ─────────────────────────────────────────────────────────
  // Thresholds verified at default 60/40 weights:
  //   importance 5 + urgency 5 → 5.0  → do-now
  //   importance 5 + urgency 3 → 4.2  → do-now
  //   importance 4 + urgency 4 → 4.0  → do-now
  //   importance 5 + urgency 2 → 3.8  → schedule
  //   importance 4 + urgency 3 → 3.6  → schedule
  //   importance 3 + urgency 4 → 3.4  → schedule
  //   importance 3 + urgency 3 → 3.0  → reconsider
  //   importance 2 + urgency 3 → 2.4  → reconsider
  //   importance 2 + urgency 2 → 2.0  → deprioritize
  //   importance 1 + urgency 1 → 1.0  → deprioritize

  let label: 'do-now' | 'schedule' | 'reconsider' | 'deprioritize';

  if (isDeferred) {
    label = 'deprioritize';
  } else if (isAmbiguous) {
    label = 'reconsider';
  } else if ((importance >= 4 && urgency >= 4) || score >= 4.0) {
    label = 'do-now';
  } else if ((importance >= 4 && urgency >= 2) || score >= 3.2) {
    label = 'schedule';
  } else if (score >= 2.4) {
    label = 'reconsider';
  } else {
    label = 'deprioritize';
  }

  // ── Bucket ────────────────────────────────────────────────────────────────
  const bucket: 'must-do' | 'should-do' | 'could-do' =
    label === 'do-now'  ? 'must-do'  :
    label === 'schedule' ? 'should-do' :
    'could-do';

  // ── Reason (shown in "Why this?" collapsible) ─────────────────────────────
  const reason = buildReason(label, signals, isSingleGeneric, isShortWithNoSignals && !isSingleGeneric);

  return {
    importanceScore: clamp5(importance),
    urgencyScore:    clamp5(urgency),
    bucket,
    recommendationLabel:  label,
    recommendationReason: reason,
  };
}

function buildReason(
  label: 'do-now' | 'schedule' | 'reconsider' | 'deprioritize',
  signals: string[],
  isGeneric: boolean,
  isShort:   boolean,
): string {
  if (isGeneric) return 'Ambiguous title — add more detail for accurate ranking';
  if (isShort)   return 'Short title — ranked conservatively; add context to refine';

  const labelPhrase =
    label === 'do-now'      ? 'ranked Must Do'  :
    label === 'schedule'    ? 'ranked Should Do' :
    label === 'reconsider'  ? 'ranked Can Wait'  :
    'ranked Optional';

  if (!signals.length) return `No urgency or importance signals detected — ${labelPhrase}`;

  const top = signals.slice(0, 2).map((s, i) => i === 0 ? capitalize(s) : s).join(' · ');
  return `${top} — ${labelPhrase}`;
}
