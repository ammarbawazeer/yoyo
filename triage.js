/*
 * TriageAssist – complaint triage engine
 * Deterministic, explainable NLP: text normalisation, PII masking,
 * weighted-lexicon classification, urgency scoring, confidence and
 * escalation rules. Same input -> same output (repeatable).
 * Works in the browser (window.TriageAssist) and in Node (module.exports).
 */
(function (root) {
  "use strict";

  const CATEGORIES = {
    "Billing & Payment": {
      team: "Finance Support Desk",
      terms: {
        "charged twice": 4, "double charged": 4, "double charge": 4, "overcharged": 4,
        "charged": 2, "invoice": 3, "bill": 2, "billing": 3, "payment": 2,
        "card": 1, "transaction": 2, "deducted": 3, "debited": 3, "emi": 2,
        "subscription": 2, "auto-renew": 3, "renewal": 2, "upi": 2, "wrong amount": 4,
        "price": 1, "fee": 2, "hidden charge": 4, "statement": 1
      }
    },
    "Delivery & Shipping": {
      team: "Logistics Support",
      terms: {
        "not delivered": 4, "not received": 4, "never arrived": 4, "delivery": 3,
        "delivered": 2, "shipping": 3, "shipment": 3, "courier": 3, "tracking": 3,
        "late": 2, "delayed": 3, "delay": 2, "parcel": 3, "package": 2,
        "wrong address": 4, "dispatch": 2, "out for delivery": 3, "lost": 2,
        "arrive": 1, "arrived": 1
      }
    },
    "Product Quality & Defect": {
      team: "Product Quality Team",
      terms: {
        "damaged": 4, "broken": 4, "defective": 4, "faulty": 4, "not working": 4,
        "stopped working": 4, "cracked": 3, "torn": 3, "leaking": 3, "expired": 4,
        "quality": 2, "fake": 3, "counterfeit": 4, "wrong item": 4, "wrong product": 4,
        "missing parts": 3, "missing part": 3, "size": 1, "colour": 1, "color": 1,
        "smell": 2, "overheating": 4, "burnt": 4
      }
    },
    "Refund & Return": {
      team: "Returns & Refunds Desk",
      terms: {
        "refund": 4, "return": 3, "returned": 3, "exchange": 3, "replacement": 3,
        "money back": 4, "cancel": 2, "cancelled": 2, "cancellation": 3,
        "reverse pickup": 4, "pickup": 2, "credit note": 3, "store credit": 3
      }
    },
    "Customer Service & Staff": {
      team: "Customer Experience Lead",
      terms: {
        "rude": 4, "unprofessional": 4, "agent": 2, "staff": 3, "executive": 2,
        "no response": 3, "no one responded": 4, "nobody responded": 4, "ignored": 3,
        "hung up": 4, "call centre": 2, "call center": 2, "customer care": 2,
        "behaviour": 3, "behavior": 3, "attitude": 3, "waiting": 2, "on hold": 3,
        "chat": 1, "support": 1, "misbehaved": 4
      }
    },
    "Account & Technical": {
      team: "Digital / IT Support",
      terms: {
        "login": 4, "log in": 4, "password": 4, "otp": 4, "app": 2, "website": 2,
        "crash": 3, "crashes": 3, "error": 3, "bug": 3, "account": 2, "locked": 3,
        "hacked": 4, "unauthorised": 3, "unauthorized": 3, "page": 1, "checkout": 2,
        "cannot access": 4, "can't access": 4, "glitch": 3, "loading": 2
      }
    }
  };

  // Urgency cues: [phrase, points, reason]
  const URGENCY_CUES = [
    ["consumer court", 5, "Legal / regulatory threat"], ["consumer forum", 5, "Legal / regulatory threat"],
    ["legal action", 5, "Legal / regulatory threat"], ["lawyer", 5, "Legal / regulatory threat"],
    ["sue", 4, "Legal / regulatory threat"], ["police", 4, "Legal / regulatory threat"],
    ["fraud", 5, "Possible fraud"], ["scam", 4, "Possible fraud"], ["hacked", 5, "Account security"],
    ["unauthorised", 4, "Account security"], ["unauthorized", 4, "Account security"],
    ["fire", 5, "Safety hazard"], ["burnt", 5, "Safety hazard"], ["overheating", 5, "Safety hazard"],
    ["burning", 5, "Safety hazard"], ["smoke", 5, "Safety hazard"], ["sparks", 5, "Safety hazard"],
    ["injury", 5, "Safety hazard"], ["injured", 5, "Safety hazard"], ["shock", 4, "Safety hazard"],
    ["expired", 3, "Health / safety risk"], ["allergic", 5, "Health / safety risk"],
    ["social media", 3, "Public reputation risk"], ["twitter", 3, "Public reputation risk"],
    ["instagram", 3, "Public reputation risk"], ["review", 1, "Public reputation risk"],
    ["urgent", 3, "Customer states urgency"], ["immediately", 2, "Customer states urgency"],
    ["asap", 2, "Customer states urgency"], ["third time", 3, "Repeat contact"],
    ["again", 1, "Repeat contact"], ["still", 1, "Unresolved previous contact"],
    ["weeks", 2, "Long unresolved duration"], ["month", 2, "Long unresolved duration"],
    ["charged twice", 3, "Direct financial loss"], ["double charged", 3, "Direct financial loss"],
    ["overcharged", 3, "Direct financial loss"], ["two times", 1, "Direct financial loss"],
    ["unacceptable", 2, "Strong dissatisfaction"], ["worst", 2, "Strong dissatisfaction"],
    ["disgusting", 2, "Strong dissatisfaction"], ["pathetic", 2, "Strong dissatisfaction"],
    ["cancel my account", 3, "Churn risk"], ["never shop", 3, "Churn risk"], ["never order", 3, "Churn risk"]
  ];

  const SLA = { High: "4 working hours", Medium: "24 hours", Low: "72 hours" };
  const CONFIDENCE_THRESHOLD = 0.55;
  const MIN_SIGNAL = 3;

  function maskPII(text) {
    let found = [];
    let out = text
      .replace(/\b(?:\d[ -]?){13,19}\b/g, m => { found.push("card number"); return "[CARD]"; })
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, m => { found.push("email"); return "[EMAIL]"; })
      .replace(/(?:\+?\d{1,3}[ -]?)?\b\d{10}\b/g, m => { found.push("phone"); return "[PHONE]"; });
    return { text: out, piiTypes: [...new Set(found)] };
  }

  function normalise(text) {
    return " " + text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9'\- ]+/g, " ").replace(/\s+/g, " ") + " ";
  }

  function countPhrase(norm, phrase) {
    const re = new RegExp("(?<![a-z])" + phrase.replace(/[-]/g, "\\-") + "(?![a-z])", "g");
    return (norm.match(re) || []).length;
  }

  function triage(rawText, opts) {
    opts = opts || {};
    const text = String(rawText || "").trim();
    const flags = [];
    const masked = maskPII(text);
    if (masked.piiTypes.length) flags.push("PII detected and masked: " + masked.piiTypes.join(", "));
    const norm = normalise(masked.text);
    const words = norm.trim().split(" ").filter(Boolean);

    // Category scoring
    const scores = {}, evidence = {};
    for (const [cat, def] of Object.entries(CATEGORIES)) {
      scores[cat] = 0; evidence[cat] = [];
      for (const [term, w] of Object.entries(def.terms)) {
        const n = countPhrase(norm, term);
        if (n) { scores[cat] += w * Math.min(n, 2); evidence[cat].push(term); }
      }
    }
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const [topCat, topScore] = ranked[0];
    const [secondCat, secondScore] = ranked[1];
    const total = ranked.reduce((s, r) => s + r[1], 0);
    let confidence = total === 0 ? 0 : topScore / total;
    if (topScore < MIN_SIGNAL) confidence = Math.min(confidence, 0.3);
    confidence = Math.round(confidence * 100) / 100;

    // Urgency scoring
    let urgencyPoints = 0; const urgencyReasons = new Set();
    for (const [cue, pts, reason] of URGENCY_CUES) {
      if (countPhrase(norm, cue)) { urgencyPoints += pts; urgencyReasons.add(reason); }
    }
    const exclaim = (text.match(/!/g) || []).length;
    const capsWords = (text.match(/\b[A-Z]{4,}\b/g) || []).length;
    if (exclaim >= 3 || capsWords >= 2) { urgencyPoints += 2; urgencyReasons.add("Highly emotional tone"); }
    if (opts.tier === "Premium") { urgencyPoints += 2; urgencyReasons.add("Premium customer"); }
    if (opts.priorContacts >= 2) { urgencyPoints += 3; urgencyReasons.add(opts.priorContacts + " previous contacts on this issue"); }
    const safetyOrLegal = [...urgencyReasons].some(r => /Legal|fraud|security|Safety|Health/i.test(r));
    let urgency = urgencyPoints >= 6 || safetyOrLegal ? "High" : urgencyPoints >= 3 ? "Medium" : "Low";

    // Escalation rules
    let decision = "Auto-route (agent reviews draft)";
    let needsHuman = false;
    if (words.length < 5) { flags.push("Too short / insufficient detail"); needsHuman = true; }
    const asciiRatio = text.length ? (text.match(/[A-Za-z]/g) || []).length / text.replace(/\s/g, "").length : 0;
    if (text.length && asciiRatio < 0.5) { flags.push("Possibly non-English text – outside model scope"); needsHuman = true; }
    if (topScore < MIN_SIGNAL) { flags.push("No clear complaint category detected"); needsHuman = true; }
    else if (confidence < CONFIDENCE_THRESHOLD) { flags.push("Mixed issue – also matches " + secondCat); needsHuman = true; }
    if (safetyOrLegal) { flags.push("Safety / legal / fraud cue – mandatory supervisor review"); needsHuman = true; }

    let category = topScore < MIN_SIGNAL ? "Unclassified" : topCat;
    let team = category === "Unclassified" ? "Supervisor triage queue" : CATEGORIES[topCat].team;
    if (needsHuman) decision = "Escalate to human triage";
    if (safetyOrLegal) { decision = "Escalate to supervisor (priority)"; team = team + " + Escalations Supervisor"; }

    const priorityScore = Math.min(100, Math.round((urgency === "High" ? 70 : urgency === "Medium" ? 40 : 15) + urgencyPoints * 3));

    return {
      category, secondary: secondScore > 0 ? secondCat : null, confidence,
      urgency, priorityScore, team, sla: SLA[urgency], decision, needsHuman,
      evidence: category === "Unclassified" ? [] : evidence[topCat],
      urgencyReasons: [...urgencyReasons], flags, maskedText: masked.text,
      reply: draftReply(category, urgency, needsHuman),
      scores
    };
  }

  function draftReply(category, urgency, needsHuman) {
    const opener = "Dear Customer, thank you for contacting us and we are sorry for the inconvenience caused.";
    const body = {
      "Billing & Payment": "Our Finance Support Desk is checking the transaction details you shared and will confirm any correction or reversal.",
      "Delivery & Shipping": "Our Logistics team is tracing your shipment with the courier partner and will share an update on the delivery status.",
      "Product Quality & Defect": "Our Product Quality team is reviewing the issue with the item and will arrange the appropriate replacement, repair or refund.",
      "Refund & Return": "Our Returns & Refunds desk is reviewing your request and will confirm the return or refund steps.",
      "Customer Service & Staff": "Your experience with our team has been escalated to a Customer Experience Lead who will personally review it.",
      "Account & Technical": "Our Digital Support team is investigating the account / technical issue. Please do not share your password or OTP with anyone.",
      "Unclassified": "A member of our support team will review your message and may contact you for a few more details."
    }[category];
    const timing = "You can expect an update within " + SLA[urgency] + ".";
    return [opener, body, timing, needsHuman ? "[Agent: verify facts and personalise before sending]" : ""].filter(Boolean).join(" ");
  }

  const api = { triage, maskPII, CATEGORIES, SLA, CONFIDENCE_THRESHOLD };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TriageAssist = api;
})(typeof window !== "undefined" ? window : globalThis);
