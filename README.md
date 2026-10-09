# TriageAssist – AI-assisted customer complaint triage

Functional prototype for **Assignment 2: AI Use-Case Canvas, Functional Prototype and Validation Brief** (AI Use-Case Design and Feasibility, BBA Sem 5).

TriageAssist reads a new customer complaint and:

1. masks personal data (phone, email, card numbers),
2. classifies it into one of six categories (Billing, Delivery, Product Quality, Refund/Return, Customer Service, Account/Technical),
3. scores urgency (High / Medium / Low + 0–100 priority) from legal, safety, fraud, financial-loss, repeat-contact and emotional cues,
4. recommends the team and response SLA, shows the evidence words, drafts an acknowledgement,
5. escalates to a human when confidence < 55%, the text is vague or non-English, or any safety/legal/fraud cue appears.

The support agent then **accepts, overrides (note required) or rejects** each recommendation; every decision goes into a log that can be exported as CSV.

## Run it

- **Live:** https://ammarbawazeer.github.io/yoyo/ (GitHub Pages)
- **Offline:** download the repo and open `index.html` in any browser. No install, no server, nothing is uploaded.

## Files

| Path | What |
|---|---|
| `index.html` | The prototype UI |
| `triage.js` | Triage engine (shared by the UI and tests) |
| `tests/run-tests.js` | Runs the 7 documented test cases → `node tests/run-tests.js` |
| `tests/results.json` | Actual outputs used in Annexure D1 |
| `docs/StudentID_Assignment2_AIUseCase_TriageAssist.docx` | Submission report (Annexures A–E) |
| `docs/build-docx.js` | Regenerates the report → `node docs/build-docx.js` |
| `docs/diagrams.html`, `docs/screenshots/` | Workflow diagrams and prototype evidence |

## Method & limits

The engine is a deterministic, explainable weighted-lexicon NLP model (same input → same output). It is a prototype: it is English-only, has not been validated on real historic tickets, and is not connected to a helpdesk/CRM. See Annexure D of the report for testing, metrics and risks.
