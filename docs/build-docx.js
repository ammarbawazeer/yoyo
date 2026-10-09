// Builds the Assignment 2 submission DOCX. Run: node docs/build-docx.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, HeadingLevel, ImageRun, PageBreak, BorderStyle, LevelFormat, Footer, PageNumber
} = require("docx");

const SHOTS = path.join(__dirname, "screenshots");
const LIVE = "https://ammarbawazeer.github.io/yoyo/";
const REPO = "https://github.com/ammarbawazeer/yoyo";
const PAGE_W = 11906, MARGIN = 1134, CW = PAGE_W - 2 * MARGIN; // A4, 2 cm margins

const FONT = "Calibri";
const HEAD_FILL = "1F3864", HEAD_INK = "FFFFFF", LABEL_FILL = "E8EEF7";

const p = (text, o = {}) => new Paragraph({
  spacing: { after: 100 }, alignment: o.align,
  children: [].concat(text).map(t => typeof t === "string" ? new TextRun({ text: t, bold: o.bold, italics: o.italics, size: o.size || 21, font: FONT }) : t)
});
const r = (text, o = {}) => new TextRun({ text, font: FONT, size: 21, ...o });
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 28, color: HEAD_FILL })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, font: FONT, bold: true, size: 24, color: "2E5597" })] });
const bullet = t => new Paragraph({ numbering: { reference: "bul", level: 0 }, spacing: { after: 60 }, children: [].concat(t).map(x => typeof x === "string" ? r(x) : x) });
const pb = () => new Paragraph({ children: [new PageBreak()] });

function cell(content, width, o = {}) {
  const paras = [].concat(content).flatMap(c => typeof c === "string" ? c.split("\n") : [c]).map(c => c instanceof Paragraph ? c :
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: String(c), font: FONT, size: o.size || 19, bold: o.bold, color: o.color })] }));
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: paras
  });
}
function table(headers, rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const trs = [];
  if (headers) trs.push(new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], { bold: true, fill: HEAD_FILL, color: HEAD_INK })) }));
  rows.forEach(row => trs.push(new TableRow({ children: row.map((c, i) => cell(c, widths[i], i === 0 && o.labelCol ? { bold: true, fill: LABEL_FILL } : {})) })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: trs });
}
const kv = (rows) => table(null, rows, [2900, CW - 2900], { labelCol: true });
function img(file, widthPx, caption) {
  const buf = fs.readFileSync(path.join(SHOTS, file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const out = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 },
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: widthPx, height: Math.round(widthPx * h / w) } })] })];
  if (caption) out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [r(caption, { italics: true, size: 18, color: "555555" })] }));
  return out;
}

// ---------- Content ----------
const results = (() => {
  // Actual outputs captured from tests/run-tests.js (v1.1 engine)
  const txt = fs.readFileSync(path.join(__dirname, "..", "tests", "results.json"), "utf8");
  return txt.trim().split(/\n(?=\{)/).map(s => JSON.parse(s));
})();
const res = id => results.find(x => x.id.startsWith(id));
const fmt = x => `${x.category}${x.secondary && x.category !== "Unclassified" ? " (2nd: " + x.secondary + ")" : ""}; ${x.urgency} urgency; conf. ${Math.round(x.confidence * 100)}%; ${x.decision}; route: ${x.team}` + (x.flags.length ? "; flags: " + x.flags.join(" | ") : "");

const children = [];

// Cover
children.push(
  p("WOXSEN UNIVERSITY", { bold: true, size: 32, align: AlignmentType.CENTER }),
  p("SCHOOL OF BUSINESS", { bold: true, size: 24, align: AlignmentType.CENTER }),
  p("ASSIGNMENT 2 (Individual)", { bold: true, size: 24, align: AlignmentType.CENTER }),
  p("AI Use-Case Canvas, Functional Prototype and Validation Brief", { bold: true, size: 26, align: AlignmentType.CENTER }),
  p("TriageAssist: AI-Assisted Customer Complaint Triage for an E-commerce Support Desk", { italics: true, size: 24, align: AlignmentType.CENTER }),
  new Paragraph({ spacing: { after: 200 } }),
  kv([
    ["Course", "AI Use-Case Design and Feasibility"],
    ["Programme/Semester", "BBA, Semester 5"],
    ["Assessment Mode", "Individual Project"],
    ["Maximum Marks", "20"],
    ["Instructor", "Dr. Dinesh Kumar"],
    ["Student Name", "[Enter name]"],
    ["Student ID", "[Enter ID]"],
    ["Programme/Section", "[Enter section]"],
    ["Prototype access", `Live: ${LIVE}   Source: ${REPO}`],
    ["Submission Date", "7 September 2026"]
  ]),
  new Paragraph({ spacing: { after: 160 } }),
  h2("Design Summary"),
  p("Customer complaints at a mid-sized e-commerce retailer arrive through email, web forms, chat and social media and are triaged manually by Level-1 agents in first-in-first-out order. Assignment 1 identified that this causes slow first responses, inconsistent categorisation, misrouted tickets and, most seriously, urgent safety, legal and fraud complaints waiting behind routine ones. Assignment 2 moves that opportunity into a working design: TriageAssist reads a new complaint, masks personal data, classifies it into one of six categories, scores urgency, recommends the responsible team and response SLA, explains its reasoning and drafts an acknowledgement. The AI never acts alone: an agent accepts, overrides or rejects each recommendation, and low-confidence, vague, non-English or safety/legal cases are escalated to a supervisor automatically."),
  p("The prototype is a working browser application (no installation, no data leaves the device). It was tested on seven distinct cases including four edge cases; testing exposed two genuine weaknesses (financial-loss complaints rated too low, and the phrase \"burning smell\" not triggering safety escalation), which were fixed in version 1.1. The main lesson is that the value of the tool lies less in classification accuracy than in reliable escalation and a clear human-review step.")
);

// Annexure A
children.push(h1("ANNEXURE A: ASSIGNMENT 1 CONTINUITY NOTE AND AI USE-CASE CANVAS"));
children.push(h2("A1. Assignment 1 to Assignment 2 Continuity Note"));
children.push(kv([
  ["Assignment 1 title", "AI-Based Customer Complaint Triage for Faster and Fairer Resolution [replace with exact Assignment 1 title if different]"],
  ["Refined title, if applicable", "TriageAssist: AI-Assisted Customer Complaint Triage for an E-commerce Support Desk"],
  ["Core problem being addressed", "Manual first-in-first-out triage of complaints leads to slow first response, inconsistent categorisation between agents, misrouting between teams and urgent (safety, legal, fraud, financial-loss) complaints not being prioritised."],
  ["Main faculty feedback or issue identified", "The Assignment 1 scope was broad (\"AI for customer service\") and did not specify exactly what the AI decides, where a human remains in control, or how failure would be handled. [Replace with the actual feedback received.]"],
  ["Change made after Assignment 1", "Scope narrowed to the triage step only (classify, prioritise, route, draft acknowledgement). Resolution of complaints stays fully human. Explicit confidence threshold, escalation rules and a mandatory agent review step were added; personal data is masked before analysis."],
  ["Reason for the change", "A narrow, testable task can be prototyped and validated within the course; it carries lower risk than an autonomous chatbot and keeps accountability with the support team. Triage is also where measurable delay and misrouting occur."]
]));
children.push(h2("A2. AI Use-Case Canvas"));
children.push(table(["Canvas Element", "Student Response"], [
  ["1. Primary user", "Level-1 customer support agents (direct users); support supervisors (escalation queue); customers benefit indirectly through faster, correctly routed responses."],
  ["2. Problem", "Complaints are read and routed manually in arrival order, so urgent cases wait, similar complaints are categorised differently by different agents, and misrouted tickets bounce between teams."],
  ["3. Current task or decision", "An agent opens the shared inbox, reads each complaint, decides its category and urgency from personal judgement, forwards it to a team and types an acknowledgement from scratch. No record is kept of why a routing decision was made."],
  ["4. AI-supported task", "For each new complaint: (a) assign one of six categories, (b) assign High/Medium/Low urgency with a 0–100 priority score, (c) recommend the responsible team and SLA, (d) list the evidence words used, (e) draft an acknowledgement, (f) decide whether the case must be escalated to a human."],
  ["5. Input data", "Complaint free text; channel; customer tier (Standard/Premium); number of previous contacts on the same issue. Later versions: order status and ticket history from CRM."],
  ["6. AI capability", "Natural-language text classification and urgency (sentiment/intent) detection. Prototype uses an explainable weighted-lexicon NLP model so each output can be traced to words in the complaint; production version would use a supervised classifier or LLM trained/evaluated on labelled historic tickets."],
  ["7. AI output", "Category (+ secondary category), confidence %, urgency and priority score, routing team, response SLA, evidence terms, urgency drivers, warnings, editable draft reply, and a decision: Auto-route / Escalate to human triage / Escalate to supervisor."],
  ["8. Human role", "L1 agent reviews every output and accepts, overrides (note required) or rejects it; supervisor handles all escalations; quality analyst reviews the decision log monthly and tunes the rules."],
  ["9. Workflow position", "Immediately after a complaint is received and before it is assigned to a resolution team, i.e. it replaces the manual read-and-sort step, not the resolution step."],
  ["10. Business value", "Faster first response, fewer misrouted tickets, urgent cases surfaced within hours, consistent categories for reporting, and a decision log that shows recurring problems (e.g. a courier partner or product batch)."],
  ["11. Success metrics", "Category agreement with agent ≥ 85%; urgent-case recall ≥ 95%; median time-to-triage < 2 minutes; misrouting rate < 5%; agent override rate tracked monthly (see D3)."],
  ["12. Failure condition", "A safety/legal/fraud complaint rated Low and not escalated; wrong team assigned without being caught; draft reply promising something the company cannot deliver; PII exposed; non-English or sarcastic complaints silently misclassified."],
  ["13. Escalation logic", "Escalate to human triage when confidence < 55%, two categories compete, text < 5 words, or language not supported. Escalate to Escalations Supervisor (4-hour SLA) whenever safety, legal, fraud or account-security cues are present, regardless of confidence."],
  ["14. Ownership", "Customer Support Manager owns the system and its outcomes; the reviewing agent owns each final routing decision; supervisor owns escalated cases; IT/Data owns data protection and model changes."]
], [2600, CW - 2600], { labelCol: true }));

// Annexure B
children.push(h1("ANNEXURE B: WORKFLOW, USER JOURNEY AND DATA REQUIREMENTS"));
children.push(h2("B1. Current Workflow or User Journey"));
children.push(...img("B1_current_workflow.png", 620, "Figure B1. Current manual triage: trigger → agent → input → judgement → output, with failure paths."));
children.push(h2("B2. Proposed AI-Enabled Workflow"));
children.push(...img("B2_proposed_workflow.png", 620, "Figure B2. TriageAssist workflow: input → data preparation → AI processing → AI output → validation check → human review → action → record/feedback, with escalation path."));
children.push(h2("B3. Data Requirement Table"));
children.push(table(["Data/Input", "Source", "Format", "Purpose", "Availability", "Quality/Privacy Concern"], [
  ["Complaint text", "Email, web form, chat, social DM, call transcript", "Free text (English)", "Core input for category & urgency detection", "Available in real time from support inbox / helpdesk tool", "Spelling errors, slang, sarcasm, mixed languages; contains names, phone, email, card numbers → masked before processing"],
  ["Channel", "Helpdesk ticket metadata", "Categorical", "Context for SLA and public-reputation risk (social media)", "Available automatically", "Low risk"],
  ["Customer tier", "CRM / loyalty system", "Categorical (Standard/Premium)", "Adjust priority for high-value customers", "Available via CRM lookup", "Fairness: tier must not override safety; personal data – access-controlled"],
  ["Previous contacts on issue", "Helpdesk ticket history", "Integer", "Detect repeat contacts and unresolved cases", "Available; needs ticket-linking", "Duplicate tickets may inflate count"],
  ["Labelled historic tickets", "Helpdesk export (last 12 months)", "CSV: text + final category + urgency", "Build/validate lexicon or train classifier; measure accuracy", "Needs export and cleaning", "Historic labels inconsistent (the problem itself); must be anonymised before any external AI tool"],
  ["Agent review decisions", "TriageAssist decision log", "CSV (AI vs final, note)", "Feedback loop for monthly tuning; audit trail", "Generated by prototype", "Stored without unmasked PII; retention policy needed"]
], [1350, 1600, 1150, 1700, 1600, CW - 7400]));
children.push(h2("B4. Human Review and Escalation"));
children.push(kv([
  ["Who remains accountable for the final decision?", "The reviewing L1 agent for each routing decision; the Escalations Supervisor for all escalated cases; the Customer Support Manager for overall system performance."],
  ["What must the human reviewer check before accepting the AI output?", "(1) Category matches the actual issue, including any secondary issue; (2) urgency reflects safety, legal, financial or repeat-contact risk; (3) team and SLA are correct; (4) draft reply contains no wrong promise and is personalised; (5) masked details are not needed to act."],
  ["What happens when the system is uncertain, wrong or outside its intended scope?", "Uncertain (confidence < 55%, mixed issue, too short) → \"Escalate to human triage\" queue. High-risk cues → supervisor within 4 working hours. Wrong → agent overrides with a mandatory note, which is logged. Outside scope (non-English, non-complaint) → flagged and routed to manual handling; the AI never sends replies on its own."]
]));

// Annexure C
children.push(h1("ANNEXURE C: FUNCTIONAL PROTOTYPE OR TOOL"));
children.push(kv([
  ["Prototype/tool name", "TriageAssist v1.1"],
  ["Platform, software or AI tool used", "Browser web application (HTML, CSS, JavaScript), hosted on GitHub Pages; rule-based NLP engine (triage.js); Node.js test script; built with assistance from Claude (Anthropic) – see E2."],
  ["Live link, file name, QR code or access method", `Live: ${LIVE}\nSource code: ${REPO}\nOffline: download the repository and open index.html in any browser.`],
  ["Primary user", "Level-1 customer support agent"],
  ["Input accepted by the prototype", "Any new complaint text typed or pasted, plus channel, customer tier and number of previous contacts."],
  ["AI processing or logic performed", "PII masking (regex) → text normalisation → weighted-lexicon scoring across six categories (≈130 weighted terms/phrases) → confidence = top score ÷ total score → urgency points from ≈45 cues (legal, safety, fraud, repeat contact, emotion, tier) → escalation rules → draft reply template."],
  ["Output produced", "Decision badge, category (+ secondary), confidence bar, urgency + priority score, routing team, SLA, evidence words, urgency drivers, warnings, editable draft acknowledgement; decision log exportable as CSV."],
  ["Human review point", "Section 3 of the screen: agent must Accept, Override (note mandatory) or Reject before the case is logged/routed."],
  ["Failure handling or fallback", "Escalation when confidence < 55%, text < 5 words, non-English, or no category signal; mandatory supervisor review for safety/legal/fraud/security cues; Reject → manual handling; nothing is sent automatically."],
  ["Current development stage", "Functional prototype (works on new inputs, repeatable outputs; not connected to a live helpdesk or CRM)."]
]));
children.push(h2("C1. Prototype Evidence"));
children.push(p("The following screenshots were captured from the running prototype using a fresh complaint that is not one of the built-in samples."));
children.push(...img("01_input.png", 560, "Screenshot 1. New input entered: damaged mixer grinder with burning smell, 2 previous contacts."));
children.push(...img("02_output.png", 560, "Screenshot 2. AI output: Product Quality & Defect (secondary Refund & Return), High urgency, safety cue detected → escalated to supervisor; draft reply generated."));
children.push(...img("03_escalation.png", 560, "Screenshot 3. Vague input \"Not happy. Fix it.\" → Unclassified, 0% confidence, escalated to human triage with warnings."));
children.push(...img("04_review_log.png", 520, "Screenshot 4. Human review and decision log: one acceptance, one override (Low → Medium with note), one rejection to manual handling."));

// Annexure D
children.push(h1("ANNEXURE D: PROTOTYPE TESTING, SUCCESS METRICS AND PRELIMINARY RISKS"));
children.push(h2("D1. Prototype Testing"));
children.push(p("All results below are the actual outputs of the prototype, reproduced by running node tests/run-tests.js (output saved in tests/results.json). Version 1.0 results are recorded where testing led to a change."));
const T = [
  ["Test 1", "\"I was charged twice for order #45821. Rs 2,499 was debited two times from my card ending 4417…\"", "Billing & Payment; at least Medium urgency (direct financial loss); Finance Support Desk", "v1.0: Billing & Payment, conf. 100%, LOW urgency, 72-h SLA.\nv1.1: " + fmt(res("Test 1")), "v1.0 Modify → v1.1 Acceptable"],
  ["Test 2", "\"My parcel was supposed to arrive last Monday. Tracking still shows 'in transit'…\"", "Delivery & Shipping; Low–Medium; Logistics Support", fmt(res("Test 2")), "Acceptable (agent may raise urgency if context known – see Screenshot 4)"],
  ["Test 3: difficult or edge case", "Mixed issue + safety + legal threat, Premium: \"The power bank… started OVERHEATING and burnt my bag!!! I want a refund immediately… consumer court.\"", "Product Quality with Refund as secondary; High; escalate to supervisor", fmt(res("Test 3")), "Acceptable"],
  ["Test 4: edge case (safety wording)", "\"…jar arrived cracked and the motor makes a burning smell… third time I am writing\" (2 prior contacts)", "Product Quality; High; safety escalation to supervisor", "v1.0: Product Quality, High, conf. 56%, Auto-route – safety NOT flagged (\"burning\" not in cue list).\nv1.1: " + fmt(res("Test 4")), "v1.0 Unacceptable → v1.1 Acceptable"],
  ["Test 5: incomplete input", "\"Not happy. Fix it.\"", "No category; escalate to human", fmt(res("Test 5")), "Acceptable"],
  ["Test 6: outside scope", "Hindi text: \"मेरा ऑर्डर अभी तक नहीं आया है, कृपया जल्दी भेजें\" (my order has not arrived)", "Should not guess; escalate as unsupported language", fmt(res("Test 6")), "Acceptable as safe fallback; Modify for future (multilingual support needed)"],
  ["Optional additional test", "Rude agent complaint containing phone number and email; 2 previous contacts", "Customer Service & Staff; Medium; PII masked", fmt(res("Test 7")), "Acceptable"]
];
children.push(table(["Test Case", "Input", "Expected Result", "Actual Prototype Result", "Evaluation"], T, [1150, 2050, 1700, CW - 1150 - 2050 - 1700 - 1450, 1450]));
children.push(h2("D2. Improvement After Testing"));
children.push(kv([
  ["Weakness discovered during testing", "(1) Double-charge complaint (Test 1) was rated Low urgency because financial-loss cues carried too little weight. (2) \"burning smell\" (Test 4) did not trigger the safety rule because only \"burnt\"/\"overheating\" were listed – a dangerous false negative. (3) Non-English complaints cannot be classified (Test 6). (4) The \"Save with override\" button could log an override even when nothing was changed."],
  ["Modification made or proposed", "Made in v1.1: financial-loss cues raised from 2 to 3 points and \"overcharged\", \"two times\" added; safety cues \"burning\", \"smoke\", \"sparks\" added; override now requires a changed category/urgency and a note. Proposed: maintain a reviewed safety-synonym list, add language detection with Hindi/Arabic support, and validate on 300+ labelled historic tickets before any pilot."],
  ["Expected improvement", "Financial-loss complaints now receive a 24-hour SLA instead of 72 hours; safety complaints worded differently are escalated within 4 hours; the decision log becomes a cleaner signal for measuring true override rate."]
]));
children.push(h2("D3. Success Metrics"));
children.push(table(["Success Metric", "Current/Baseline", "Target", "Measurement Method"], [
  ["Median time from receipt to triage/assignment", "Estimated several hours in FIFO queue (to be measured from helpdesk timestamps)", "< 2 minutes for auto-routed; < 4 h for escalations", "Helpdesk timestamps: received vs assigned"],
  ["Category agreement (AI vs final agent decision)", "Prototype test set: 5 of 5 classifiable cases correct (small sample)", "≥ 85% on 300 labelled historic tickets", "Decision log: Accepted ÷ total; confusion matrix on labelled set"],
  ["Urgent-case recall (safety/legal/fraud/financial)", "v1.0: 2 of 4 urgent test cases correctly prioritised; v1.1: 4 of 4", "≥ 95% (missing an urgent case is the costliest error)", "Supervisor audit of all High/escalated cases + monthly sample of Low"],
  ["Misrouting / re-assignment rate", "Not tracked today (baseline to be collected for 4 weeks)", "< 5% of tickets re-assigned", "Count of ticket team changes after first assignment"],
  ["Agent override rate", "New metric", "Monitored; falling trend after tuning", "Overridden ÷ reviewed in exported CSV log"]
], [2300, 2500, 2000, CW - 6800], { labelCol: true }));
children.push(h2("D4. Preliminary Design Risks"));
children.push(table(["Risk", "Why It May Occur", "Possible Consequence", "Proposed Control"], [
  ["Missed urgent case (false negative)", "Customers describe hazards or fraud in unexpected words; lexicon is incomplete", "Injury, legal claim, regulatory and reputational damage", "Safety cues always escalate; reviewed synonym list; supervisor audits a sample of Low tickets weekly; urgent-recall metric"],
  ["Automation bias", "Agents accept AI output without reading the complaint", "Errors pass through unchecked; accountability blurred", "Evidence words shown; override note required; monitor acceptance rate per agent; training"],
  ["Privacy breach", "Complaints contain phone, email, card and address data", "Breach of data-protection law (e.g. India DPDP Act 2023)", "PII masking before analysis; in-browser processing; no upload to public AI tools; access-controlled logs"],
  ["Unfair prioritisation", "Premium tier boost or language limits disadvantage some customers", "Non-English or Standard customers wait longer", "Tier cannot override safety rules; non-English escalated (not deprioritised); fairness review of SLAs by segment"],
  ["Inaccurate draft reply", "Template promises an outcome not yet verified", "Customer misled; extra complaints", "Draft is editable and marked for agent verification; never auto-sent"]
], [1900, 2300, 2100, CW - 6300], { labelCol: true }));

// Annexure E
children.push(h1("ANNEXURE E: DESIGN REFLECTION, AI-USE DISCLOSURE AND REFERENCES"));
children.push(h2("E1. Design Reflection"));
children.push(p("In Assignment 1 I treated complaint triage mainly as a classification problem: if the AI could pick the right category, the business value would follow. Building and testing TriageAssist showed that this view was incomplete. Category was the easy part; on clear complaints the prototype was correct every time. The real difficulty was urgency and escalation. A complaint about a double charge was rated Low, and a motor with a \"burning smell\" was not treated as a safety risk because the wording differed from my word list. These are exactly the cases where a wrong answer is costly, so the most important design decision became what the system does when it is unsure or when the stakes are high, not how clever the classifier is."));
children.push(p("Testing also made the human role concrete. In Assignment 1 \"human review\" was a single line; in the prototype it needed rules: a confidence threshold, mandatory notes for overrides, supervisor routing for legal and safety cues, and a log that turns every correction into improvement data. I also learned that real complaints are messy – very short, mixed-issue, emotional or not in English – and that a safe fallback is more valuable than a confident guess. Finally, the absence of baseline data (current triage time, misrouting rate) means a pilot must first measure the current process before any benefit can be claimed."));
children.push(h2("E2. AI-Use Disclosure"));
children.push(table(["AI Tool Used", "Purpose", "What I Personally Changed, Checked or Added"], [
  ["Claude (Anthropic), via Claude Code", "Coding assistance for the web prototype and test script; drafting of workflow diagrams; language support and structuring of annexure text", "[Student to complete honestly: e.g. chose the use case and categories, reviewed and edited all text, ran the prototype and verified every test result, adjusted weights/thresholds, checked references.]"],
  ["[Any other tool used]", "", ""]
], [2300, 3200, CW - 5500]));
children.push(h2("E3. References and Search Record"));
[
  "Amershi, S., Weld, D., Vorvoreanu, M., et al. (2019). Guidelines for Human-AI Interaction. Proceedings of CHI 2019. https://doi.org/10.1145/3290605.3300233",
  "Government of India (2023). The Digital Personal Data Protection Act, 2023. https://www.meity.gov.in/data-protection-framework",
  "Government of India (2019). The Consumer Protection Act, 2019, and Consumer Protection (E-Commerce) Rules, 2020. https://consumeraffairs.nic.in",
  "International Organization for Standardization (2018). ISO 10002:2018 Quality management – Customer satisfaction – Guidelines for complaints handling in organizations. https://www.iso.org/standard/71580.html",
  "Jurafsky, D., & Martin, J. H. (2024). Speech and Language Processing (3rd ed. draft), Ch. 4: Naive Bayes, Text Classification and Sentiment. https://web.stanford.edu/~jurafsky/slp3/",
  "National Institute of Standards and Technology (2023). Artificial Intelligence Risk Management Framework (AI RMF 1.0). https://doi.org/10.6028/NIST.AI.100-1",
  "Parasuraman, R., & Manzey, D. H. (2010). Complacency and bias in human use of automation: An attentional integration. Human Factors, 52(3), 381–410. https://doi.org/10.1177/0018720810376055",
  "Prototype source code and test results: TriageAssist repository. " + REPO
].forEach(ref => children.push(bullet(ref)));
children.push(p("Search record: Google Scholar and official government sites searched for \"complaint triage machine learning\", \"human-AI interaction guidelines\", \"automation bias\", \"DPDP Act 2023\" and \"ISO 10002 complaints handling\" in September 2026.", { italics: true, size: 19 }));
children.push(h2("E4. Student Declaration"));
children.push(p("I confirm that this submission continues my Assignment 1 topic unless an approved change is recorded, that the prototype evidence and test results reported here are genuine and that all permitted AI-tool use has been disclosed."));
children.push(table(null, [["Student Signature:", "Date:"], ["", ""]], [CW / 2, CW / 2]));

const doc = new Document({
  creator: "Student",
  title: "Assignment 2 – TriageAssist AI Use Case",
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  numbering: { config: [{ reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [r("Assignment 2 – TriageAssist  |  Page ", { size: 16, color: "777777" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "777777", font: FONT })] })] }) },
    children
  }]
});
const out = path.join(__dirname, "StudentID_Assignment2_AIUseCase_TriageAssist.docx");
Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log("Wrote " + out); });
