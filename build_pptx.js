const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();

// ============================================================
// DESIGN SYSTEM - Professional Light Theme
// ============================================================
const D = {
  // Colors
  white: 'FFFFFF',
  bg: 'FAFAFB',
  cardBg: 'FFFFFF',
  text1: '111827',      // Primary headings
  text2: '374151',      // Body text
  text3: '6B7280',      // Muted
  text4: '9CA3AF',      // Very muted
  brand: 'FF6B00',      // Primary orange
  brandSoft: 'FFF0E0',  // Light orange bg
  brandDark: 'E65C00',  // Darker orange
  border: 'E5E7EB',     // Subtle borders
  divider: 'FF6B00',    // Divider lines
  success: '059669',
  successBg: 'ECFDF5',
  
  // Fonts
  font: 'Inter',
  fontBold: 'Inter',
  
  // Layout (inches)
  slideW: 13.333,
  slideH: 7.5,
  margin: 0.75,
  gutter: 0.30,
  contentW: 11.833,
  contentH: 6.0,
  headerH: 1.3,
  footerH: 0.5,
  footerY: 7.5 - 0.5 - 0.15,
  
  // Grid
  col1: 11.833,
  col2: (11.833 - 0.30) / 2,
  col3: (11.833 - 0.60) / 3,
  col4: (11.833 - 0.90) / 4,
  
  // Card
  cardPad: 0.24,
  cardIcon: 0.52,
  cardMinH: 1.9,
  
  // Type scale
  h1: 38,
  h2: 28,
  h3: 22,
  h4: 18,
  body: 15,
  bodySm: 13,
  caption: 12,
  captionSm: 11,
  
  // Spacing
  s0: 0,
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
};

// ============================================================
// HELPERS
// ============================================================
function addRect(slide, opts) {
  const options = { 
    fill: opts.fill || D.white, 
    line: opts.line && opts.line !== 'none' ? opts.line : 'none',
    lineSize: opts.lineSize || 1,
    rounded: opts.rounded || false
  };
  if (opts.line === 'none') {
    delete options.line;
    delete options.lineSize;
  }
  return slide.addShape('rect', options);
}

function addCircle(slide, opts) {
  const options = {
    fill: opts.fill || D.white,
    line: opts.line && opts.line !== 'none' ? opts.line : 'none',
    lineSize: opts.lineSize || 1
  };
  if (opts.line === 'none') {
    delete options.line;
    delete options.lineSize;
  }
  return slide.addShape('ellipse', options);
}

function addText(slide, text, opts) {
  const defaults = {
    fontFace: D.font,
    color: D.text2,
    fontSize: D.body,
    bold: false,
    align: 'left',
    lineSpacing: 1.35,
    margin: 0,
  };
  return slide.addText(text, { ...defaults, ...opts });
}

function addTextBox(slide, texts, opts) {
  // texts = array of {text, options}
  const defaults = {
    fontFace: D.font,
    color: D.text2,
    fontSize: D.body,
    bold: false,
    align: 'left',
    lineSpacing: 1.35,
    margin: 0,
  };
  const merged = { ...defaults, ...opts };
  return slide.addText(texts.map(t => ({ 
    text: t.text, 
    options: { ...defaults, ...merged, ...t.options } 
  })));
}

function makeHeader(slide, title, subtitle) {
  // Accent bar
  addRect(slide, { x: 0, y: 0, w: D.slideW, h: 0.06, fill: D.brand, line: 'none' });
  
  // Title
  addText(slide, title, { x: D.margin, y: 0.35, w: D.contentW, h: 0.5, 
    fontSize: D.h2, color: D.text1, bold: true, fontFace: D.fontBold });
  
  if (subtitle) {
    addText(slide, subtitle, { x: D.margin, y: 0.85, w: D.contentW, h: 0.35,
      fontSize: D.body, color: D.text3 });
  }
  
  // Divider
  addRect(slide, { x: D.margin, y: 1.3, w: 2.5, h: 0.03, fill: D.brand, line: 'none' });
  
  return 1.45; // content start Y
}

function makeFooter(slide, current, total) {
  addRect(slide, { x: D.margin, y: D.footerY - 0.02, w: D.contentW, h: 0.005, fill: D.border, line: 'none' });
  addText(slide, 'HireLoop  •  AI Interview Infrastructure Platform', {
    x: D.margin, y: D.footerY, w: D.contentW, h: 0.25,
    fontSize: D.captionSm, color: D.text4, align: 'center', fontFace: D.font
  });
  addText(slide, `${current} / ${total}`, {
    x: 12.0, y: D.footerY, w: 1.0, h: 0.25,
    fontSize: D.captionSm, color: D.text4, align: 'right', fontFace: D.font
  });
}

function makeCard(slide, x, y, w, h, icon, title, desc) {
  // Card bg
  addRect(slide, { x, y, w, h, fill: D.cardBg, line: D.border, lineSize: 1, rounded: true });
  
  // Icon circle
  const ix = x + D.cardPad;
  const iy = y + D.cardPad;
  const ic = D.cardIcon;
  addCircle(slide, { cx: ix + ic/2, cy: iy + ic/2, r: ic/2, fill: D.brandSoft, line: 'none' });
  addText(slide, icon, { x: ix, y: iy, w: ic, h: ic, fontSize: 20, color: D.brand, bold: true, align: 'center', valign: 'middle' });
  
  // Title
  const tx = x + D.cardPad;
  const ty = y + D.cardPad + ic + 0.1;
  addText(slide, title, { x: tx, y: ty, w: w - 2*D.cardPad, h: 0.3,
    fontSize: D.bodySm, color: D.text1, bold: true, fontFace: D.fontBold });
  
  // Description
  const dy = ty + 0.35;
  addText(slide, desc, { x: tx, y: dy, w: w - 2*D.cardPad, h: h - (dy - y) - D.cardPad,
    fontSize: D.caption, color: D.text2, lineSpacing: 1.4 });
}

function makeMetric(slide, x, y, w, h, value, label, sub) {
  addRect(slide, { x, y, w, h, fill: D.white, line: D.border, lineSize: 1, rounded: true });
  
  addText(slide, value, { x, y: y + 0.1, w, h: 0.55,
    fontSize: 32, color: D.brand, bold: true, align: 'center', fontFace: D.fontBold, valign: 'middle' });
  
  addText(slide, label, { x, y: y + 0.75, w, h: 0.3,
    fontSize: D.caption, color: D.text2, align: 'center', valign: 'middle' });
  
  if (sub) {
    addText(slide, sub, { x, y: y + 1.05, w, h: 0.2,
      fontSize: D.captionSm, color: D.text4, align: 'center', valign: 'middle' });
  }
}

function addCardsRow(slide, y, cards) {
  const n = cards.length;
  const w = (D.contentW - (n - 1) * D.gutter) / n;
  const h = D.cardMinH;
  cards.forEach((c, i) => {
    const x = D.margin + i * (w + D.gutter);
    makeCard(slide, x, y, w, D.cardMinH, c.icon, c.title, c.desc);
  });
  return y + D.cardMinH + D.gutter;
}

function addCardsGrid(slide, y, cards, cols = 3) {
  const w = (D.contentW - (cols - 1) * D.gutter) / cols;
  const h = D.cardMinH;
  const rows = Math.ceil(cards.length / cols);
  
  cards.forEach((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = D.margin + col * (w + D.gutter);
    const yy = y + row * (h + 0.16);
    makeCard(slide, x, yy, w, h, c.icon, c.title, c.desc);
  });
  return y + rows * (D.cardMinH + 0.16) + D.gutter;
}

function addMetricsRow(slide, y, metrics) {
  const n = metrics.length;
  const w = (D.contentW - (n - 1) * D.gutter) / n;
  const h = 1.45;
  
  metrics.forEach((m, i) => {
    const x = D.margin + i * (w + D.gutter);
    makeMetric(slide, x, y, w, h, m.value, m.label, m.sub);
  });
  return y + h + D.gutter;
}

function addBullets(slide, y, items) {
  const texts = items.map((item, i) => ({
    text: '•  ' + item,
    options: { fontSize: D.body, color: D.text2, bold: i === 0 }
  }));
  addTextBox(slide, texts, { x: D.margin, y, w: D.contentW, h: 3.0, lineSpacing: 1.4, spaceAfter: 10 });
  return y + items.length * 0.35 + D.gutter;
}

function addTwoCol(slide, y, leftItems, rightItems) {
  const lw = D.contentW / 2 - D.gutter / 2;
  const rx = D.margin + lw + D.gutter;
  
  // Left
  const leftTexts = leftItems.map((item, i) => ({
    text: item,
    options: { fontSize: D.body, color: D.text2, bold: i === 0 }
  }));
  addTextBox(slide, leftTexts, { x: D.margin, y, w: lw, h: 2.5, lineSpacing: 1.4, spaceAfter: 10 });
  
  // Right
  const rightTexts = rightItems.map((item, i) => ({
    text: item,
    options: { fontSize: D.body, color: D.text2, bold: i === 0 }
  }));
  addTextBox(slide, rightTexts, { x: D.margin + lw + D.gutter, y, w: D.contentW / 2 - D.gutter / 2, h: 2.5, lineSpacing: 1.4, spaceAfter: 10 });
  
  return y + 2.7;
}

// ============================================================
// BUILD SLIDES
// ============================================================
const TOTAL = 14;
let slideNum = 0;

function newSlide(title, subtitle) {
  slideNum++;
  const slide = pptx.addSlide({ backgroundColor: D.bg });
  const y = makeHeader(slide, title, subtitle);
  return { slide, y };
}

function finishSlide(slide) {
  makeFooter(slide, slideNum, TOTAL);
}

// ============================================================
// SLIDE 1: TITLE
// ============================================================
{
  const slide = pptx.addSlide({ backgroundColor: D.white });
  addRect(slide, { x: 0, y: 0, w: D.slideW, h: 0.08, fill: D.brand, line: 'none' });
  addRect(slide, { x: 0, y: D.slideH - 0.08, w: D.slideW, h: 0.08, fill: D.brand, line: 'none' });
  
  // Logo
  const ls = 1.3;
  const lx = D.margin;
  const ly = 1.6;
  slide.addShape('ellipse', { x: lx, y: ly, w: ls, h: ls, fill: D.brand, line: 'none' });
  slide.addText('HL', { x: lx, y: ly, w: ls, h: ls, fontSize: 38, color: D.white, bold: true, align: 'center', valign: 'middle', fontFace: D.fontBold });
  
  // Title
  const tx = lx + ls + 0.4;
  slide.addText('HireLoop', { x: tx, y: ly + 0.04, w: 9, h: 1.0, fontSize: 38, color: D.text1, bold: true, fontFace: 'Inter' });
  
  // Subtitle
  slide.addText('AI Interview Infrastructure Platform', { x: tx, y: ly + 1.1, w: 9, h: 0.6, fontSize: 22, color: D.text2 });
  
  // Tagline
  slide.addText('Screen. Interview. Score. Hire. — All in One Platform.', { 
    x: tx, y: ly + 1.8, w: 9, h: 0.4, fontSize: 16, color: D.brand, bold: true });
  
  makeFooter(pptx.slides[0], 1, TOTAL);
}

// ============================================================
// SLIDE 2: PROBLEM
// ============================================================
{
  const { slide, y } = newSlide('The Hiring Problem', 'Why traditional hiring fails at scale');
  
  // Metrics row
  const metricsY = y + 0.1;
  addMetricsRow(slide, metricsY, [
    { value: '60–80%', label: 'Recruiter Time\nWasted on Scheduling', sub: 'First-round interviews' },
    { value: '40%+', label: 'Candidate Drop-off', sub: 'Due to scheduling delays' },
    { value: '0%', label: 'Consistency', sub: 'Across human interviewers' },
    { value: '$50–200', label: 'Cost per Interview', sub: 'Recruiter time cost' },
  ]);
  
  addBullets(slide, 2.1, [
    'High-volume hiring (50–500+ roles/year) overwhelms recruiting teams',
    'Inconsistent evaluation — human bias, fatigue, varying standards',
    'No audit trail — no record of why candidates were hired/rejected',
    'Candidate experience suffers: long waits, scheduling ping-pong, no feedback',
    "Existing ATS/HRIS manage workflow but don't CONDUCT interviews",
    'Building in-house AI interview infrastructure takes 12–18 months and $500K+'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 3: SOLUTION
// ============================================================
{
  const { slide, y } = newSlide('HireLoop: AI Interview Infrastructure', 'One platform. Voice AI + Proctoring + Scoring + Human Orchestration');
  
  // Feature cards
  let cy = y + 0.1;
  cy = addCardsRow(slide, cy, [
    { icon: '🎙', title: 'Voice AI Interviews', desc: 'Structured Q&A with TTS/STT, bilingual EN/HI, pre-rendered audio' },
    { icon: '🛡', title: 'Automated Proctoring', desc: 'Face detection, gaze tracking, tab-switch, AI snapshot analysis — cheating probability %' },
    { icon: '📊', title: 'AI Scoring Engine', desc: 'Per-question scores (0–10), overall weighted score, strengths/concerns, red flags' },
    { icon: '🤝', title: 'Human Round Orchestration', desc: 'Calendar sync, self-scheduling, scorecards, panel interviews, offer management' },
  ]);
  
  // KPIs
  addMetricsRow(slide, cy + 0.2, [
    { value: '<15 min', label: 'Time to First\nInterview', sub: 'Apply → Interview link' },
    { value: '>85%', label: 'Completion\nRate', sub: 'Start → Complete' },
    { value: 'r ≥ 0.7', label: 'AI ↔ Human\nCorrelation', sub: 'Score validity' },
    { value: '$2–5', label: 'Cost per\nAI Interview', sub: 'vs $50–200 human' },
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 4: WHO WE SERVE
// ============================================================
{
  const { slide, y } = newSlide('Who HireLoop Serves', 'Primary personas and their jobs-to-be-done');
  
  const cards = [
    { icon: '👔', title: 'HR Leaders / TA Heads', desc: 'Mid-market to enterprise (50–5,000 employees)\nHiring 20–500+ interns/graduates/year\nPain: "We lose 40% candidates to scheduling delays"' },
    { icon: '🔍', title: 'Recruiters / TA Specialists', desc: 'Screen 200 applicants in 2 hours, not 2 weeks\nReview AI scores + proctoring flags\nFocus on top 10% only' },
    { icon: '👨‍💼', title: 'Hiring Managers', desc: 'See only top 5 candidates with AI scores + proctoring reports\nConduct final rounds with structured scorecards\n"Don\'t make me reinvent questions"' },
    { icon: '📅', title: 'Coordinators', desc: 'Auto-schedule 50 final rounds\nCalendar sync (Google/Outlook)\nReminders: 24h, 2h, 15min' },
    { icon: '📋', title: 'Interviewers (Human Rounds)', desc: 'Receive calendar invites with prep materials\nSubmit structured scorecards\nCalibration across interviewers' },
    { icon: '🏢', title: 'Enterprise IT / Procurement', desc: 'SOC 2 / GDPR ready\nSSO (Okta, Entra ID, Google)\nWebhooks → ATS/HRIS (Greenhouse, Lever, Workday)\nData residency (US/EU/IN)' },
  ];
  
  let cy = y + 0.1;
  cy = addCardsGrid(slide, cy, cards, 3);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 5: WORKFLOW
// ============================================================
{
  const { slide, y } = newSlide('End-to-End Workflow', 'From job posting to qualified candidate handoff');
  
  const steps = [
    '1. ADMIN: Create job → Define form → Build question bank (mandatory + variable) → Set proctoring thresholds → Publish',
    '2. CANDIDATE: Clicks apply link → Branded form → Eligibility check → Interview link sent instantly',
    '3. AI INTERVIEW: Consent → Proctoring setup → Mic check → Voice Q&A (TTS questions → STT answers) → Auto-advance with timers',
    '4. PROCTORING: Continuous face detection + periodic AI snapshot analysis → Cheating probability % (0–100%) → Flagged but NEVER auto-rejected',
    '5. AI SCORING: Per-question scores (0–10) + overall weighted score + strengths/concerns/red flags → Pass/fail vs threshold',
    '6. PIPELINE: Auto-advance to Recruiter Review → Human rounds (schedule → scorecards → panel) → Offer → Hired',
    '7. HANDOFF: candidate.qualified webhook → ATS/HRIS → Customer manages offer, background check, onboarding'
  ];
  
  addBullets(slide, y + 0.1, steps);
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 6: PROCTORING v2
// ============================================================
{
  const { slide, y } = newSlide('Proctoring v2: Fairness First', 'Cheating probability scoring — never auto-reject, always human review');
  
  // Metrics
  let cy = y + 0.1;
  cy = addMetricsRow(slide, cy, [
    { value: 'Face\nDetection', label: 'MediaPipe\nReal-time', sub: '30fps client-side' },
    { value: 'Multi-face\nDetection', label: 'Unauthorized\nPerson', sub: 'Critical severity' },
    { value: 'Gaze\nTracking', label: 'Looking Away\n>3s', sub: 'Warning severity' },
    { value: 'Tab\nSwitching', label: 'Fullscreen\nEnforcement', sub: 'Warning → Critical' },
  ]);
  
  addBullets(slide, cy + 0.1, [
    'Cheating Probability Score (0–100%): Critical events +25, Warnings +10, AI snapshot critical +15, warning +5',
    'Time decay: Linear over 24h to 30% weight — recent events matter more',
    'NEVER auto-ends interview: Flags logged, cheating % shown on dashboard, human reviews',
    'Explicit critical violations (phone detected, second person) flag immediately but interview continues',
    'Candidate sees: "Proctoring active" indicator; Admin sees: Probability badge + flagged timeline + snapshots',
    'Configurable thresholds per job: Default 3 critical OR 15 warnings = flagged (adjustable)'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 7: HYBRID SCORING
// ============================================================
{
  const { slide, y } = newSlide('Hybrid Scoring Engine', 'Default Gemini AI + Per-job custom rules = Best of both worlds');
  
  // Cards
  let cy = y + 0.1;
  cy = addCardsRow(slide, cy, [
    { icon: '🤖', title: 'Default AI Scoring', desc: 'Gemini Flash evaluates transcript vs ideal answers\nPer-question score (0–10) + rationale + red flags\nOverall weighted score + pass/fail vs threshold' },
    { icon: '⚙️', title: 'Custom Rules (Per Job)', desc: 'Section weights: Technical 1.3×, HR 0.8×\nRequired keywords: "GAAP", "reconciliation"\nBonus keywords: "SOX", "Big 4", "CPA"\nPenalty keywords: "guess", "not sure", "unfamiliar"' },
    { icon: '📝', title: 'Rubric Overrides', desc: '"Score 8+ only if end-to-end process shown"\n"Penalize generic answers without examples"\nApplied as prompt augmentation to LLM' },
  ]);
  
  addBullets(slide, cy + 0.1, [
    'Default: Pure Gemini Flash scoring — works out of the box',
    'Custom rules: Admin adds via Job Questions Editor → stored in job_roles.custom_scoring_rules JSONB',
    'Scale tier: Webhook for fully custom scoring engine (bring your own model)',
    'Scoring failure = never silent 0 — raises ScoringError, flags for manual review',
    'Audit trail: Every score has question_id, prompt_text, rationale, red_flags, timestamp',
    'Bias mitigation: Structured rubric, blind scoring option, demographic parity dashboard (Phase 2)'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 8: SYSTEM BOUNDARY (CRITICAL)
// ============================================================
{
  const { slide, y } = newSlide('System Boundary: Where HireLoop Ends', 'Clear separation — we hand off at "Qualified Candidate List"');
  
  const leftItems = [
    '✅  HireLoop Owns (In-Boundary)',
    '',
    '• Branded application forms & eligibility rules',
    '• Voice AI interviews (TTS/STT, bilingual)',
    '• Automated proctoring + cheating probability',
    '• AI scoring (Gemini + custom rules)',
    '• Pipeline stages & Kanban',
    '• Human round scheduling (calendar sync, self-scheduling)',
    '• Structured scorecards',
    '• Qualified candidate list + webhook handoff',
    '• Audit logs, proctoring evidence, transcripts'
  ];
  
  const rightItems = [
    '❌  Customer Owns (Out-of-Boundary)',
    '',
    '• Offer letter creation & approval',
    '• E-signature (DocuSign, HelloSign)',
    '• Background checks (Checkr, Sterling)',
    '• HRIS/Payroll onboarding (BambooHR, Workday, Rippling)',
    '• Equity/cap table (Carta, Pulley)',
    '• Benefits/insurance enrollment',
    '• Employee onboarding & Day 1 ops',
    '• Visa/immigration processing'
  ];
  
  addTwoCol(slide, y + 0.1, leftItems, rightItems);
  
  // Handoff details
  addBullets(slide, 4.2, [
    'Handoff Event: candidate.qualified webhook fires when stage → partner_review / hired',
    'Payload: application_id, candidate_id, job_id, ai_score, human_scorecards[], proctoring_flagged, cheating_probability, qualified_at',
    'Customer integrates via webhook → their ATS/HRIS creates offer, triggers background check, provisions HRIS',
    'HireLoop provides: Qualified candidate list, export (CSV/JSON/Parquet), scheduled exports to S3/SFTP/Sheets',
    'No lock-in: Data export anytime, webhook replay, API access for custom integrations',
    'We don\'t replace your ATS/HRIS — we feed it qualified candidates'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 9: INTEGRATION ECOSYSTEM
// ============================================================
{
  const { slide, y } = newSlide('Integration Ecosystem', 'Plug into your existing stack — webhooks, APIs, pre-built connectors');
  
  const connectors = [
    { icon: '🔗', title: 'ATS Connectors', desc: 'Greenhouse, Lever, Ashby, Teamtailor, Workable\nBidirectional: Jobs ↔ Candidates ↔ Scores ↔ Stages' },
    { icon: '🏢', title: 'HRIS Connectors', desc: 'Workday, BambooHR, Rippling, Deel, Keka\nWebhook: candidate.qualified → Worker creation' },
    { icon: '📅', title: 'Calendar & Video', desc: 'Google Calendar, Outlook, Calendly\nZoom, Teams, Meet, Whereby links auto-generated' },
    { icon: '✍️', title: 'E-Sign & Checks', desc: 'DocuSign, HelloSign, Adobe Sign\nCheckr, Sterling, First Advantage via webhook' },
    { icon: '🔌', title: 'Webhooks (14 Events)', desc: 'application.created, interview.completed, score.available, stage.changed, candidate.qualified, offer.sent, offer.accepted, candidate.hired + 6 more' },
    { icon: '📡', title: 'REST API v1', desc: 'Jobs, Applications, Candidates, Scores, Stages, Offers — scoped API keys with granular scopes' },
    { icon: '📊', title: 'Scheduled Exports', desc: 'CSV/JSON/Parquet → S3, SFTP, GCS, Email, Google Sheets\nDaily/hourly/weekly — field mapping UI' },
    { icon: '🔐', title: 'SSO & SCIM', desc: 'SAML/OIDC (Okta, Entra ID, Google)\nSCIM provisioning for auto-deprovision\nRole mapping: Owner/Admin/Recruiter/HiringManager/Interviewer' },
  ];
  
  let cy = y + 0.1;
  cy = addCardsGrid(slide, cy, connectors, 4);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 10: SECURITY & COMPLIANCE
// ============================================================
{
  const { slide, y } = newSlide('Security, Privacy & Compliance', 'Enterprise-grade from day one');
  
  let cy = y + 0.1;
  cy = addMetricsRow(slide, cy, [
    { value: 'SOC 2\nType II', label: 'In Progress', sub: 'Target Q4 2026' },
    { value: 'GDPR\nReady', label: 'DPA Available', sub: 'Art. 28 DPA standard' },
    { value: 'Data\nResidency', label: 'US / EU / IN', sub: 'Supabase multi-region' },
    { value: 'Encryption', label: 'AES-256 / TLS 1.3', sub: 'At rest + in transit' },
  ]);
  
  addBullets(slide, cy + 0.1, [
    'Row-Level Security (RLS) on every table — org isolation enforced at DB level',
    'Service-role key only in backend; anon key for public apply pages',
    'Proctoring snapshots: private bucket, signed URLs (1hr), path = {session_id}/',
    'Answer audio: private bucket, service-role only, auto-delete after scoring (configurable)',
    'PII handling: Email/name/phone flagged; excluded from analytics exports by default',
    'Right to Erasure: DELETE /v1/candidates/{id} cascades (applications, sessions, scores, docs)',
    'Data Processing Addendum (DPA) standard for Scale+ tiers',
    'Penetration testing annually; OWASP Top 10 covered; bug bounty program'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 11: PRICING
// ============================================================
{
  const { slide, y } = newSlide('Simple, Transparent Pricing', 'Per AI interview completed — no per-seat, no hidden fees');
  
  const tiers = [
    { icon: '🌱', title: 'Starter', desc: '$299/mo\n50 AI interviews/mo\n5 team seats\n3 jobs\nEmail support\n$5/extra interview' },
    { icon: '📈', title: 'Growth', desc: '$999/mo\n250 AI interviews/mo\n15 seats\n15 jobs\nDepartments\nWebhooks + API\nPriority support\n$4/extra interview' },
    { icon: '🚀', title: 'Scale', desc: '$2,999/mo\n1,000 AI interviews/mo\n50 seats\nUnlimited jobs\nSSO/SAML\nCustom exports\nDedicated CSM\n$3/extra interview' },
    { icon: '💎', title: 'Custom', desc: 'Volume discounts\nWhite-label candidate portal\nCustom domain (careers.yourco.com)\nOn-prem / VPC deployment\nDedicated infrastructure\nCustom SLA (99.9%+)\nCustom scoring webhook' },
  ];
  
  let cy = y + 0.1;
  cy = addCardsRow(slide, cy, tiers);
  
  addBullets(slide, cy + 0.1, [
    '"AI Interview" = one completed candidate session (regardless of question count)',
    'Human rounds, scorecards, scheduling, offers — included in all tiers',
    'No per-seat fees for interviewers/hiring managers',
    '14-day free trial (10 AI interviews) — no credit card',
    'Annual billing: 20% discount | Non-profit/edu: 50% off Growth+',
    'Usage metering: Real-time dashboard + alerts at 80%/100%'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 12: GETTING STARTED
// ============================================================
{
  const { slide, y } = newSlide('Getting Started in 3 Steps', 'From zero to first AI interview in under an hour');
  
  let cy = y + 0.1;
  cy = addCardsRow(slide, cy, [
    { icon: '1️⃣', title: 'Step 1: Organization Setup', desc: '• Sign up → Org created\n• Invite team (8 roles)\n• Add departments\n• Select pipeline template (Graduate / Internship / Custom)\n• Brand: logo, colors, intro video, email templates' },
    { icon: '2️⃣', title: 'Step 2: Create Your First Job', desc: '• Job wizard (5 steps): Details → Form → Questions → Rules → Publish\n• Build question bank (mandatory + variable)\n• Set proctoring thresholds & passing score\n• Configure custom scoring rules (optional)\n• Publish → Get apply link' },
    { icon: '3️⃣', title: 'Step 3: Invite Candidates & Go', desc: '• Share apply link (careers page, email, LinkedIn, QR)\n• Candidates apply → instant eligibility → interview link emailed\n• Watch dashboard: real-time applications, interviews, scores\n• Move qualified → human rounds → offers → hired' },
  ]);
  
  addBullets(slide, cy + 0.1, [
    'Sandbox environment: Full-featured trial org with test candidates',
    'Migration help: CSV import for existing candidates/questions',
    'Dedicated onboarding specialist (Growth+ tiers)',
    'Documentation: docs.hireloop.com | API: api.hireloop.com/docs',
    'Support: In-app chat, email, Slack connect (Scale+)',
    'SLA: 99.5% uptime (Scale), 99.9% (Custom)'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 13: ROADMAP
// ============================================================
{
  const { slide, y } = newSlide('Roadmap: What\'s Next', 'Continuous innovation — driven by customer feedback');
  
  const roadmap = [
    { icon: '🧠', title: 'Q3 2026', desc: 'Bias audit dashboard\nDemographic parity on scores\nQuestion performance analytics\nPredictive time-to-hire' },
    { icon: '🤖', title: 'Q4 2026', desc: 'AI-suggested follow-up questions\nAuto-generated scorecard templates\nInterviewer calibration reports\nCandidate benchmarking (anonymized)' },
    { icon: '🔌', title: '2027', desc: 'SSO/SCIM full rollout\nAdvanced ATS connectors (Workday, SAP)\nCustom scoring webhook (bring your model)\nWhite-label candidate portal' },
    { icon: '🌍', title: 'Beyond', desc: '10+ languages (ES, FR, DE, JA, ZH, PT)\nCandidate referral portal\nSkill assessments integration\nReference check automation' },
  ];
  
  let cy = y + 0.1;
  cy = addCardsRow(slide, cy, roadmap);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SLIDE 14: CLOSING
// ============================================================
{
  const { slide, y } = newSlide('Ready to Transform Your Hiring?', 'Join 100+ companies screening smarter, faster, fairer');
  
  let cy = y + 0.1;
  cy = addMetricsRow(slide, cy, [
    { value: '10×', label: 'Faster\nScreening', sub: 'Apply → Interview in minutes' },
    { value: '90%+', label: 'Consistency', sub: 'Structured every time' },
    { value: '85%+', label: 'Completion', sub: 'Candidate-friendly UX' },
    { value: '40%+', label: 'Cost\nReduction', sub: 'vs traditional screening' },
  ]);
  
  addBullets(slide, cy + 0.1, [
    'Start free: hireloop.com → "Start Free Trial" (10 AI interviews, no credit card)',
    'Book a demo: calendly.com/hireloop/demo — 30 min tailored walkthrough',
    'Technical deep-dive: api.hireloop.com/docs | docs.hireloop.com',
    'Email: hello@hireloop.com | Slack: slack.hireloop.com',
    'We\'re not just an interview tool — we\'re your AI hiring infrastructure partner'
  ]);
  
  finishSlide(pptx.slides[pptx.slides.length - 1]);
}

// ============================================================
// SAVE
// ============================================================
pptx.writeFile({ fileName: 'HireLoop_Professional_Presentation.pptx' })
  .then(() => console.log('\n✅ Presentation saved: HireLoop_Professional_Presentation.pptx'))
  .catch(err => console.error('Error:', err));