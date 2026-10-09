// Runs the prototype engine on the documented test cases and prints actual results.
const { triage } = require("../triage.js");
const cases = [
  { id: "Test 1", text: "I was charged twice for order #45821. Rs 2,499 was debited two times from my card ending 4417 but I only placed one order. Please reverse the extra payment.", opts: {} },
  { id: "Test 2", text: "My parcel was supposed to arrive last Monday. Tracking still shows 'in transit' and the courier is not answering. When will it be delivered?", opts: {} },
  { id: "Test 3 (edge: mixed + safety)", text: "The power bank you sent started OVERHEATING and burnt my bag!!! I want a refund immediately and if nobody responds I will go to consumer court.", opts: { tier: "Premium" } },
  { id: "Test 4 (edge: safety wording)", text: "Ordered a mixer grinder last week. The jar arrived cracked and the motor makes a burning smell when switched on. I need a replacement, this is the third time I am writing to you.", opts: { priorContacts: 2 } },
  { id: "Test 5 (edge: vague/short)", text: "Not happy. Fix it.", opts: {} },
  { id: "Test 6 (edge: non-English)", text: "मेरा ऑर्डर अभी तक नहीं आया है, कृपया जल्दी भेजें", opts: {} },
  { id: "Test 7 (PII + repeat contact)", text: "The agent on the call centre was very rude and hung up on me. Call me back on 9876543210 or email ravi.k@example.com.", opts: { priorContacts: 2 } }
];
for (const c of cases) {
  const r = triage(c.text, c.opts);
  console.log(JSON.stringify({ id: c.id, category: r.category, secondary: r.secondary, confidence: r.confidence, urgency: r.urgency, priority: r.priorityScore, team: r.team, sla: r.sla, decision: r.decision, evidence: r.evidence, urgencyReasons: r.urgencyReasons, flags: r.flags }, null, 1));
}
