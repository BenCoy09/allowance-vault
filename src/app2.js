/* ============ landing, dashboard, vaults, wizard, agents ============ */

/* CashAddr checksum (format and checksum only; says nothing about whether the address is funded or owned by anyone) */
function cashaddrValid(addr) {
  const m = /^(bitcoincash|bchtest|bchreg):([qpzry9x8gf2tvdw0s3jn54khce6mua7l]{42})$/.exec(String(addr).trim().toLowerCase());
  if (!m) return false;
  const CH = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  const G = [0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n, 0xae2eabe2a8n, 0x1e4f43e470n];
  const vals = []; for (const ch of m[1]) vals.push(ch.charCodeAt(0) & 31); vals.push(0); for (const ch of m[2]) vals.push(CH.indexOf(ch));
  let c = 1n;
  for (const d of vals) { const c0 = c >> 35n; c = ((c & 0x07ffffffffn) << 5n) ^ BigInt(d); for (let i = 0; i < 5; i++) if ((c0 >> BigInt(i)) & 1n) c ^= G[i]; }
  return (c ^ 1n) === 0n;
}

/* ---------- hero visualization ---------- */
function heroViz() {
  return '<div class="viz"><svg viewBox="0 0 760 400" role="img" aria-labelledby="vt vd"><title id="vt">How an Allowance Vault limits an agent</title>' +
    '<desc id="vd">The owner sets rules in the vault. The AI agent signs two payments. The covenant accepts a 20,000 sat payment to an approved payee and rejects a 900,000 sat payment that exceeds the cap.</desc>' +
    '<defs><linearGradient id="gate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a441"/><stop offset="1" stop-color="#9fb7c4"/></linearGradient></defs>' +
    '<g font-family="IBM Plex Sans, system-ui, sans-serif" font-size="14">' +
    /* owner */ '<rect x="10" y="168" width="100" height="64" rx="10" fill="#1b201c" stroke="#454d45"/><text x="60" y="196" text-anchor="middle" fill="#ece8dc" font-weight="700" font-size="13">OWNER</text><text x="60" y="215" text-anchor="middle" fill="#8f968a" font-size="12">sets the rules</text>' +
    '<path d="M110 200H150" stroke="#6b7469" stroke-width="2"/><path d="M144 195l7 5-7 5" fill="none" stroke="#6b7469" stroke-width="2"/>' +
    /* vault */ '<rect x="150" y="158" width="130" height="84" rx="12" fill="#2a2418" stroke="#d9a441" stroke-width="1.6"/><text x="215" y="192" text-anchor="middle" fill="#ece8dc" font-weight="700" font-size="13">ALLOWANCE</text><text x="215" y="210" text-anchor="middle" fill="#ece8dc" font-weight="700" font-size="13">VAULT</text><text x="215" y="229" text-anchor="middle" fill="#e8c777" font-size="11.5">holds the BCH</text>' +
    '<path d="M280 200H330" stroke="#6b7469" stroke-width="2"/><path d="M324 195l7 5-7 5" fill="none" stroke="#6b7469" stroke-width="2"/>' +
    /* agent */ '<rect x="330" y="168" width="100" height="64" rx="10" fill="#1b201c" stroke="#9fb7c4"/><text x="380" y="196" text-anchor="middle" fill="#ece8dc" font-weight="700" font-size="13">AI AGENT</text><text x="380" y="215" text-anchor="middle" fill="#8f968a" font-size="12">limited key</text>' +
    /* lanes */ '<path d="M430 200C446 200 434 110 452 110H636" fill="none" class="flow-ok" stroke="#3ddc97" stroke-width="2"/>' +
    '<path d="M430 200C446 200 434 290 452 290H516" fill="none" stroke="#ff6b57" stroke-width="2" stroke-dasharray="3 6"/>' +
    /* gate */ '<rect x="520" y="56" width="12" height="288" rx="6" fill="url(#gate)"/><text x="526" y="40" text-anchor="middle" fill="#f0d9a0" font-weight="700" font-size="13">COVENANT</text><text x="526" y="366" text-anchor="middle" fill="#8f968a" font-size="12">checks every spend</text>' +
    /* payment */ '<rect x="640" y="80" width="112" height="60" rx="10" fill="#10261f" stroke="#3ddc97"/><text x="696" y="107" text-anchor="middle" fill="#a4f3cf" font-weight="700" font-size="13">BCH PAYMENT</text><text x="696" y="125" text-anchor="middle" fill="#7fcfaa" font-size="11.5">Payee A</text>' +
    '<text x="545" y="98" fill="#a4f3cf" font-size="12">Permitted</text><text x="545" y="156" fill="#8f968a" font-size="12">20,000 sats, approved payee</text>' +
    '<text x="508" y="318" text-anchor="end" fill="#ffb4a8" font-size="12">Rejected: 900,000 sats is over</text><text x="508" y="335" text-anchor="end" fill="#ffb4a8" font-size="12">the 40,000 sat cap</text>' +
    '<g class="pulse-ok" style="--dx:190px"><circle cx="452" cy="110" r="6.5" fill="#3ddc97"/></g>' +
    '<g class="pulse-bad" style="--dx2:60px"><circle cx="452" cy="290" r="6.5" fill="#ff6b57"/></g>' +
    '<g class="okflash"><rect x="652" y="148" width="92" height="24" rx="12" fill="#3ddc97" fill-opacity=".18" stroke="#3ddc97"/><text x="698" y="165" text-anchor="middle" fill="#a4f3cf" font-weight="700" font-size="12">ACCEPTED</text></g>' +
    '<g class="badflash"><rect x="470" y="236" width="92" height="24" rx="12" fill="#ff6b57" fill-opacity=".2" stroke="#ff6b57"/><text x="516" y="253" text-anchor="middle" fill="#ffb4a8" font-weight="700" font-size="12">REJECTED</text></g>' +
    "</g></svg><div class=\"caption\"><span>Illustration with example amounts.</span><span>The covenant is not deployed: this shows the rules, not a live vault.</span></div></div>";
}

/* ---------- landing ---------- */
reg("home", "Agents that can't overspend", "marketing", n => marketingShell(n,
  '<div class="wrap"><section class="hero"><div><span class="status-line"><b>Status</b> Reference model runs here. Covenant not deployed.</span>' +
  '<h1>Your agent can spend.<span class="l2">Your covenant sets the limits.</span></h1>' +
  '<p class="lead">Allowance Vault is a Bitcoin Cash covenant that gives an AI agent, bot or point-of-sale device a key that is safe to lose. The key can only sign payments the script accepts: a cap per payment, a budget that refills slowly, approved recipients and an expiry.</p>' +
  '<div class="ctas"><a class="btn primary" href="#app-security">Try to break the vault</a><a class="btn" href="#app-vaults-new">Design a vault</a><a class="btn" href="#docs">Read the docs</a></div></div>' + heroViz() + "</section></div>" +

  '<section class="section"><div class="wrap"><h2>A spending limit that lives in a wallet is only a suggestion</h2><p class="sub muted" style="margin-top:10px">Most agent wallets enforce limits in software next to the key. If the key leaks or the agent is talked into misbehaving, the limit goes with it.</p>' +
  '<div class="compare"><div class="panel"><h3>' + pill("bad", "Today") + " Limits in software</h3><ul><li>The cap is checked by the program that holds the key.</li><li>A leaked key skips the check completely.</li><li>Teams keep wallets nearly empty and top them up by hand.</li><li>Every wallet and framework invents its own rules.</li></ul></div>" +
  '<div class="panel"><h3>' + pill("ok", "Goal") + " Limits in the coins</h3><ul><li>The key can only sign what the script accepts.</li><li>Cap, budget, recipients and expiry travel with the funds.</li><li>The owner revokes at any time without the agent's help.</li><li>One rule set that any wallet or language can check.</li></ul></div></div></div></section>" +

  '<section class="section"><div class="wrap"><h2>How it works</h2><p class="sub muted" style="margin-top:10px">Four moves. Deployment is the part that is still planned.</p><div class="steps" style="margin-top:26px">' +
  '<div class="panel"><h3>Set the rules</h3><p>The owner picks a per-payment cap, a budget with a refill rate, the approved recipients and an expiry.</p></div>' +
  '<div class="panel"><h3>Fund the vault</h3><p>The owner sends BCH to the vault address. The owner key stays offline and never goes near the agent.</p></div>' +
  '<div class="panel"><h3>Hand over the key</h3><p>The agent signs payments with its own key. It cannot change the rules, the recipients or where the change goes.</p></div>' +
  '<div class="panel"><h3>Revoke or expire</h3><p>The owner can sweep the vault whenever they like. After the expiry, anyone can return the funds to the owner\'s refund address.</p></div></div></div></section>' +

  '<section class="section"><div class="wrap"><h2>What the covenant enforces</h2><p class="sub muted" style="margin-top:10px">Each rule below is checked by the reference model in this page. Statuses say how far each one has actually got.</p><div class="feat" style="margin-top:26px">' +
  '<div class="panel"><span class="fi">' + icon("box") + '</span><h3>Fixed output shape ' + STATUS.simulated() + "</h3><p>One input, two outputs: the payment and the vault's continuation. No room for a hidden third output.</p></div>" +
  '<div class="panel"><span class="fi">' + icon("coin") + '</span><h3>Fee cap ' + STATUS.simulated() + "</h3><p>The miner fee is worked out from inputs minus outputs and capped, so value cannot leave as a fee.</p></div>" +
  '<div class="panel"><span class="fi">' + icon("clock") + '</span><h3>A clock that cannot be forged ' + STATUS.simulated() + "</h3><p>Refill uses the transaction locktime, and the script requires a non-final sequence so the locktime counts.</p></div>" +
  '<div class="panel"><span class="fi">' + icon("key") + '</span><h3>Owner revocation ' + STATUS.simulated() + "</h3><p>Spending the vault output ends the agent's authority. A later agent transaction has nothing to spend.</p></div>" +
  '<div class="panel"><span class="fi">' + icon("hourglass") + '</span><h3>Expiry reclaim ' + STATUS.unverified() + "</h3><p>After expiry, anyone can send the funds to a refund address fixed when the vault was made.</p></div>" +
  '<div class="panel"><span class="fi">' + icon("shield") + '</span><h3>Independent audit ' + STATUS.planned() + '</h3><p>None yet. Treat every claim on this page as unproven until the contract is tested and reviewed.</p></div></div></div></section>' +

  '<section class="section"><div class="wrap"><h2>For developers</h2><p class="sub muted" style="margin-top:10px">A draft contract and a runnable reference model exist. The SDK is a design sketch.</p><div class="grid2" style="margin-top:24px"><div>' +
  code("cashscript", AV.CONTRACT_DRAFT.split("\n").slice(0, 24).join("\n") + "\n    // ...", "AllowanceVault.cash (first lines of the draft)") + '</div><div class="panel"><h3>What you can use today</h3><ul class="steplog" style="margin-top:10px"><li>The <a href="#app-security">Security Lab</a> runs nine attacks against the reference model.</li><li>The <a href="#docs-api">contract draft</a> is readable. It has not been compiled.</li><li>The <a href="#docs-sdk">SDK sketch</a> shows the planned shape of an integration.</li></ul><div class="row" style="margin-top:16px"><a class="btn primary" href="#developers">Developer portal</a><a class="btn" href="#docs-quickstart">Quickstart</a></div></div></div></div></section>' +

  '<div class="wrap"><div class="cta-band"><div><h2>Build agents that can\'t spend beyond their authority.</h2><p class="muted" style="margin-top:8px">Try to break the rules first. Then design a vault of your own.</p></div><div class="row"><a class="btn primary" href="#app-security">Open the Security Lab</a><a class="btn" href="#app-vaults-new">Design a vault</a></div></div></div>'));

/* ---------- dashboard ---------- */
const IMPL = [
  ["Reference model: 12 rule checks in JavaScript", "implemented", "Runs in this page. It models the planned covenant. It is not the covenant."],
  ["Security Lab: nine attacks and a free-form tester", "simulated", "Every verdict comes from the reference model, not from a chain."],
  ["CashAddr checksum check in the vault wizard", "implemented", "Checks format and checksum only."],
  ["AllowanceVault CashScript contract", "unverified", "A draft. Not compiled, not tested, not deployed, not audited."],
  ["Chipnet deployment and reproduction packets", "planned", "Needs a machine that can compile and broadcast."],
  ["Mainnet vault with a small balance", "planned", "Required for the BLAZE submission. Not started."],
  ["Wallet connection (WizardConnect or XO template)", "planned", "The Connect wallet button is disabled until this exists."],
  ["TypeScript SDK", "planned", "A design sketch only. Nothing is published."],
  ["Independent security review", "planned", "None yet."],
];
function implTable() {
  return '<div class="tablewrap"><table><thead><tr><th>Part</th><th>Status</th><th>What that means</th></tr></thead><tbody>' + IMPL.map(r => "<tr><td class=\"wrapc\">" + esc(r[0]) + "</td><td>" + STATUS[r[1]]() + "</td><td class=\"wrapc\">" + esc(r[2]) + "</td></tr>").join("") + "</tbody></table></div>";
}
const GATES = [
  ["Compile and test the contract locally", "Compile the CashScript, run unit tests for every rule in the Security Lab, and fix what breaks."],
  ["Deploy on chipnet", "Run each attack on chipnet. Save the raw transaction, the node error and a control transaction that succeeds."],
  ["Deploy on mainnet with a small balance", "Fund a vault with a sum you can afford to lose. Publish its address. Test the owner sweep."],
  ["Open the vault to public attempts", "Let people try to break the live rules. Pay any real bounty from the small balance."],
  ["Independent review", "Ask someone who did not write the contract to read it before anyone trusts it with real money."],
];
function gatesPanel() {
  return '<div class="panel"><h3>Path to mainnet ' + STATUS.planned() + '</h3><p class="muted" style="margin-top:6px">Mainnet is the goal. None of these gates is passed yet.</p><ol class="steplog" style="margin-top:12px;display:grid;gap:8px">' +
    GATES.map(g => "<li><b>" + esc(g[0]) + ".</b> <span class=\"muted\">" + esc(g[1]) + "</span></li>").join("") + "</ol></div>";
}
function sessionStats() {
  const rej = S.log.filter(l => l.res === "rejected").length, acc = S.log.filter(l => l.res === "accepted").length;
  return { rej, acc };
}
reg("app", "Overview", "app", n => {
  const v = S.session, st = sessionStats();
  const budget = AV.refilled(v, v.lastHeight);
  return appShell(n, [["app", "Overview"]],
    '<div class="grid4"><div class="panel metric"><span class="v">0</span><span class="k">Deployed vaults ' + STATUS.implemented() + '</span></div>' +
    '<div class="panel metric"><span class="v">' + sats(v.balance) + '</span><span class="k">Demo vault balance ' + STATUS.simulated() + "</span></div>" +
    '<div class="panel metric"><span class="v">' + sats(budget) + '</span><span class="k">Demo budget available ' + STATUS.simulated() + "</span></div>" +
    '<div class="panel metric"><span class="v">' + st.rej + " / " + (st.rej + st.acc) + '</span><span class="k">Attempts rejected this session ' + STATUS.simulated() + "</span></div></div>" +
    '<div class="grid2"><div class="panel"><h3>Start here</h3><div style="display:grid;gap:10px;margin-top:12px"><a class="btn primary" href="#app-security">Try to break the demo vault</a><a class="btn" href="#app-vaults-new">Design your own vault</a><a class="btn" href="#docs-quickstart">Read the quickstart</a></div></div>' + gatesPanel() + "</div>" +
    '<section><h2 style="font-size:1.3rem;margin-bottom:12px">What is built, and how far</h2>' + implTable() + "</section>",
    pageHead("Overview", "A vault gives an agent a key with limits. Here is where the project stands.", ""));
});

/* ---------- vaults ---------- */
function vaultCard(v, demo) {
  const st = demo ? (v.status === "active" ? pill("info", "Demo") : v.status === "revoked" ? pill("bad", "Revoked") : pill("warn", "Expired")) : pill("warn", "Pending");
  const cap = v.bucketCap, cur = demo ? AV.refilled(v, v.lastHeight) : v.bucketCap;
  const exp = demo ? "Block " + v.expiryHeight.toLocaleString("en-US") + " (example height)" : v.expiryDays + " days after deployment (" + (v.expiryDays * 144).toLocaleString("en-US") + " blocks)";
  const rec = demo ? v.allowlist.length + " approved" : v.recipientLabels.length + " approved";
  const acts = demo
    ? '<a class="btn small primary" href="#app-security">Open in Lab</a><button class="btn small" data-a="resetDemo">Reset demo</button>'
    : '<button class="btn small primary" data-a="labFrom" data-id="' + esc(v.id) + '">Test rules in Lab</button><button class="btn small" data-a="copyVault" data-id="' + esc(v.id) + '">Copy JSON</button><button class="btn small danger" data-a="delVault" data-id="' + esc(v.id) + '">Delete preview</button>';
  return '<article class="panel vcard"><header><div><h3>' + esc(v.name) + '</h3><span class="muted" style="font-size:.85rem">' + (demo ? "Reference model, simulation only" : "Preview. Not deployed.") + "</span></div>" + st + "</header>" +
    '<div><div class="row" style="justify-content:space-between;font-size:.85rem"><span class="muted">Budget</span><span>' + sats(cur) + " of " + sats(cap) + '</span></div><div class="bar" role="img" aria-label="Budget used"><i style="width:' + Math.max(0, Math.min(100, Math.round(cur / cap * 100))) + '%"></i></div></div>' +
    '<dl class="kv"><dt>Balance</dt><dd>' + sats(demo ? v.balance : v.funding) + "</dd><dt>Per-payment cap</dt><dd>" + sats(v.perTxCap) + "</dd><dt>Refill</dt><dd>" + sats(v.refillPerBlock) + " per block</dd><dt>Fee cap</dt><dd>" + sats(v.maxFee) + "</dd><dt>Recipients</dt><dd>" + rec + "</dd><dt>Agent</dt><dd>" + esc(demo ? "Agent key 1 (example)" : v.agent) + "</dd><dt>Expiry</dt><dd>" + esc(exp) + '</dd></dl><div class="row">' + acts + "</div></article>";
}
reg("app-vaults", "Vaults", "app", n => appShell(n, [["app", "Overview"], ["app-vaults", "Vaults"]],
  '<div class="vcards">' + vaultCard(S.session, true) + S.vaults.map(v => vaultCard(v, false)).join("") + "</div>" +
  (S.vaults.length ? "" : '<div class="empty"><b style="color:var(--fg)">No preview vaults yet</b><span>Design one with the wizard. It is saved in this browser only and is not deployed.</span><a class="btn primary" href="#app-vaults-new">Create a vault</a></div>') +
  '<div class="callout"><strong>Status words.</strong> Demo: the built-in reference vault. Pending: a design saved here, not deployed. Active, Expired and Revoked describe deployed vaults, so no vault can be Active until deployment exists.</div>',
  pageHead("Vaults", "Each vault holds BCH under one set of rules for one agent key.", '<a class="btn primary" href="#app-vaults-new">New vault</a>')));
actions.resetDemo = () => { resetSession(); toast("Demo vault reset"); rerender(); };
actions.labFrom = el => {
  const v = S.vaults.find(x => x.id === el.dataset.id); if (!v) return;
  const allow = v.recipientKeys.filter(k => AV.PAYEES[k]);
  resetSession({ name: v.name, balance: v.funding, perTxCap: v.perTxCap, bucketCap: v.bucketCap, bucket: v.bucketCap, refillPerBlock: v.refillPerBlock, maxFee: v.maxFee, expiryHeight: 900000 + v.expiryDays * 144, allowlist: allow });
  toast("Loaded into the Lab. Custom addresses are not modelled there."); go("app-security");
};
actions.copyVault = el => { const v = S.vaults.find(x => x.id === el.dataset.id); if (v) copyText(JSON.stringify(v, null, 2), "Preview JSON copied"); };
actions.delVault = async el => {
  const v = S.vaults.find(x => x.id === el.dataset.id); if (!v) return;
  const ok = S.prefs.confirmRevoke ? await confirmBox("Delete this preview?", "“" + v.name + "” is only saved in this browser. Nothing on-chain is affected.", "Delete preview", true) : true;
  if (ok) { S.vaults = S.vaults.filter(x => x.id !== v.id); save(); toast("Preview deleted"); rerender(); }
};

/* ---------- wizard ---------- */
const WSTEPS = ["Basics", "Limits and expiry", "Recipients", "Review"];
const W = { step: 0, name: "Research agent vault", agent: "Research agent", funding: 300000, perTxCap: 40000, bucketCap: 100000, refillPerBlock: 500, maxFee: 500, expiryDays: 7, ra: true, rb: true, custom: "", touched: {} };
function wErrors(step) {
  const e = {}; const int = x => Number.isInteger(Number(x)) && String(x).trim() !== "";
  if (step >= 0) { if (!W.name.trim()) e.name = "Give the vault a name."; else if (W.name.length > 40) e.name = "Keep the name under 40 characters."; if (!W.agent.trim()) e.agent = "Name the agent this key is for."; }
  if (step >= 1) {
    ["funding", "perTxCap", "bucketCap", "maxFee"].forEach(k => { if (!int(W[k]) || Number(W[k]) < 1) e[k] = "Enter a whole number of sats, 1 or more."; });
    if (!int(W.refillPerBlock) || Number(W.refillPerBlock) < 0) e.refillPerBlock = "Enter a whole number of sats, 0 or more.";
    if (!e.perTxCap && !e.bucketCap && Number(W.perTxCap) > Number(W.bucketCap)) e.perTxCap = "The per-payment cap cannot exceed the budget cap.";
    if (!e.maxFee && !e.perTxCap && Number(W.maxFee) > Number(W.perTxCap)) e.maxFee = "A fee cap above the payment cap makes no sense.";
    if (!e.funding && !e.perTxCap && Number(W.funding) < Number(W.perTxCap) + Number(W.maxFee || 0)) e.funding = "Fund at least one maximum payment plus the fee cap.";
    if (!int(W.expiryDays) || Number(W.expiryDays) < 1 || Number(W.expiryDays) > 365) e.expiryDays = "Choose 1 to 365 days.";
  }
  if (step >= 2) {
    const lines = customLines(); const bad = lines.filter(l => !cashaddrValid(l));
    if (bad.length) e.custom = bad.length + " address" + (bad.length > 1 ? "es fail" : " fails") + " the CashAddr check. Paste full addresses, one per line.";
    if (!W.ra && !W.rb && !lines.length) e.rec = "Approve at least one recipient.";
  }
  return e;
}
const customLines = () => W.custom.split("\n").map(s => s.trim()).filter(Boolean);
function worst() {
  const f = Number(W.funding), c = Number(W.bucketCap), r = Number(W.refillPerBlock), blocks = Number(W.expiryDays) * 144;
  const at = b => Math.min(f, c + r * b);
  return [["Right now (bucket starts full)", at(0)], ["After 1 hour (6 blocks)", at(6)], ["After 1 day (144 blocks)", at(144)], ["Until expiry (" + W.expiryDays + " days)", at(blocks)]];
}
function fld(id, label, hint, type) {
  const e = W.touched[id] ? wErrors(3)[id] : ""; // errors only after interaction
  return '<label class="field">' + label + (hint ? "<small>" + hint + "</small>" : "") + '<input data-w="' + id + '" ' + (type === "text" ? 'type="text"' : 'type="number" inputmode="numeric" min="0" step="1"') + ' value="' + esc(W[id]) + '"' + (e ? ' aria-invalid="true"' : "") + '><span class="err" role="alert">' + (e || "") + "</span></label>";
}
function wizardBody() {
  const e = wErrors(W.step);
  if (W.step === 0) return '<div class="grid2">' + fld("name", "Vault name", "Shown in your list.", "text") + fld("agent", "Agent", "Who or what will hold the key, for example a bot name.", "text") + '</div><div class="callout"><strong>Network.</strong> Only simulation is available. Chipnet and mainnet are planned and cannot be chosen yet.</div>' +
    '<label class="field">Network<select disabled aria-disabled="true"><option>Simulation (only option today)</option><option>Chipnet (planned)</option><option>Mainnet (planned)</option></select></label>';
  if (W.step === 1) return '<div class="grid2">' + fld("funding", "Funding", "Sats you would put in the vault. 100,000,000 sats = 1 BCH.") + fld("perTxCap", "Per-payment cap", "The most one payment can send, in sats.") + fld("bucketCap", "Budget cap", "The most the agent can have available at once, in sats.") + fld("refillPerBlock", "Refill per block", "Sats added to the budget each block. About 144 blocks a day.") + fld("maxFee", "Fee cap per payment", "Miner fee ceiling in sats. It counts against the budget.") + fld("expiryDays", "Expires after (days)", "After this the agent path closes and anyone can return the funds to you.") + "</div>";
  if (W.step === 2) return '<fieldset style="border:0;padding:0;margin:0;display:grid;gap:10px"><legend style="font-weight:600;margin-bottom:6px">Approved recipients</legend>' +
    '<label class="row"><input type="checkbox" data-w="ra"' + (W.ra ? " checked" : "") + '> Payee A (example, used by the Lab)</label><label class="row"><input type="checkbox" data-w="rb"' + (W.rb ? " checked" : "") + '> Payee B (example, used by the Lab)</label></fieldset>' +
    '<label class="field">Your own addresses<small>Optional. Full CashAddr addresses, one per line. The checksum is verified here. Whether you control an address is not.</small><textarea data-w="custom" placeholder="bitcoincash:q..." spellcheck="false">' + esc(W.custom) + '</textarea><span class="err" role="alert">' + (W.touched.custom ? (wErrors(2).custom || "") : "") + "</span></label>" +
    '<span class="err" role="alert" style="color:var(--bad)">' + (W.touched.rec ? (wErrors(2).rec || "") : "") + "</span>";
  const w = worst();
  return '<div class="panel flat"><h3>Review</h3><dl class="kv" style="margin-top:12px"><dt>Name</dt><dd>' + esc(W.name) + "</dd><dt>Agent</dt><dd>" + esc(W.agent) + "</dd><dt>Funding</dt><dd>" + sats(+W.funding) + "</dd><dt>Per-payment cap</dt><dd>" + sats(+W.perTxCap) + "</dd><dt>Budget cap</dt><dd>" + sats(+W.bucketCap) + "</dd><dt>Refill</dt><dd>" + sats(+W.refillPerBlock) + " per block</dd><dt>Fee cap</dt><dd>" + sats(+W.maxFee) + "</dd><dt>Expiry</dt><dd>" + W.expiryDays + " days (" + (W.expiryDays * 144).toLocaleString("en-US") + " blocks)</dd><dt>Recipients</dt><dd>" + (W.ra ? 1 : 0) + (W.rb ? 1 : 0) + " examples + " + customLines().length + " own</dd></dl></div>" +
    '<div class="panel flat"><h3>If the agent key leaks, the most it can take</h3><dl class="kv" style="margin-top:12px">' + w.map(r => "<dt>" + r[0] + "</dt><dd>" + sats(r[1]) + "</dd>").join("") + '</dl><p class="muted" style="margin-top:10px;font-size:.88rem">Computed as the smaller of the funding and the budget cap plus refill. Fees are inside the budget. It assumes the owner has not yet revoked.</p></div>' +
    '<div class="callout warn"><strong>Preview only.</strong> Saving keeps this design in your browser. It does not deploy a contract, create an address or move any funds. Deployment is planned.</div>';
}
reg("app-vaults-new", "New vault", "app", n => {
  const stp = '<div class="stepper" role="list" aria-label="Steps">' + WSTEPS.map((s, i) => '<span role="listitem" class="' + (i === W.step ? "on" : i < W.step ? "done" : "") + '"' + (i === W.step ? ' aria-current="step"' : "") + ">" + (i < W.step ? "✓ " : "") + s + "</span>").join("") + "</div>";
  const last = W.step === WSTEPS.length - 1;
  return appShell(n, [["app", "Overview"], ["app-vaults", "Vaults"], ["app-vaults-new", "New vault"]],
    '<div class="panel" style="display:grid;gap:18px;max-width:820px">' + stp + '<div id="wbody" style="display:grid;gap:16px">' + wizardBody() + '</div><div class="row" style="justify-content:space-between"><button class="btn" data-a="wBack"' + (W.step === 0 ? " disabled" : "") + ">Back</button>" +
    (last ? '<button class="btn primary" data-a="wSave">Save preview vault</button>' : '<button class="btn primary" data-a="wNext">Continue</button>') + "</div></div>",
    pageHead("Create a vault", "Four steps. The review shows the worst case before you commit to anything."));
});
actions.wNext = () => {
  const keys = { 0: ["name", "agent"], 1: ["funding", "perTxCap", "bucketCap", "refillPerBlock", "maxFee", "expiryDays"], 2: ["custom", "rec"] }[W.step] || [];
  keys.forEach(k => W.touched[k] = true);
  const e = wErrors(W.step); const rel = keys.filter(k => e[k]);
  if (rel.length) { rerender(); const f = $('[aria-invalid="true"]'); if (f) f.focus(); return; }
  W.step++; rerender(); const m = $("#main"); if (m) m.focus({ preventScroll: true });
};
actions.wBack = () => { if (W.step > 0) { W.step--; rerender(); } };
actions.wSave = () => {
  if (Object.keys(wErrors(3)).length) { toast("Fix the highlighted fields first"); return; }
  const keys = []; const labels = [];
  if (W.ra) { keys.push("payee-a"); labels.push("Payee A (example)"); } if (W.rb) { keys.push("payee-b"); labels.push("Payee B (example)"); }
  customLines().forEach(l => labels.push(l));
  S.vaults.push({ id: "p" + Date.now().toString(36), name: W.name.trim(), agent: W.agent.trim(), funding: +W.funding, perTxCap: +W.perTxCap, bucketCap: +W.bucketCap, refillPerBlock: +W.refillPerBlock, maxFee: +W.maxFee, expiryDays: +W.expiryDays, recipientKeys: keys, recipientLabels: labels, status: "pending", deployed: false });
  save(); W.step = 0; W.touched = {}; toast("Preview saved. Nothing was deployed."); go("app-vaults");
};
document.addEventListener("input", e => {
  const f = e.target.dataset && e.target.dataset.w; if (!f) return;
  W[f] = e.target.type === "checkbox" ? e.target.checked : e.target.value; W.touched[f] = true;
  if (e.target.type !== "checkbox") { /* validate in place, keep focus */
    const err = wErrors(W.step)[f]; const sp = e.target.parentElement.querySelector(".err");
    if (sp) sp.textContent = err || ""; if (err) e.target.setAttribute("aria-invalid", "true"); else e.target.removeAttribute("aria-invalid");
  }
});

/* ---------- agents ---------- */
const AG = { name: "", vault: "demo", err: "" };
reg("app-agents", "Agents", "app", n => {
  const vopts = '<option value="demo">Demo vault</option>' + S.vaults.map(v => '<option value="' + esc(v.id) + '">' + esc(v.name) + "</option>").join("");
  const rows = [{ id: "demo-agent", name: "Agent key 1 (example)", vault: "Demo vault", status: S.session.status === "active" ? "Simulated" : "Revoked", fixed: true }].concat(S.agents.map(a => ({ id: a.id, name: a.name, vault: a.vaultName, status: a.paused ? "Paused" : "Pending", paused: a.paused })));
  return appShell(n, [["app", "Overview"], ["app-agents", "Agents"]],
    '<div class="callout"><strong>Private keys stay with the agent.</strong> This app never asks for, shows or stores a private key. An agent creates its own key on its own device and shares only the public key. The agent key is written into the vault\'s locking script, so replacing it means moving the funds to a new vault.</div>' +
    '<div class="tablewrap"><table><thead><tr><th>Agent</th><th>Vault</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows.map(r => "<tr><td>" + esc(r.name) + "</td><td>" + esc(r.vault) + '</td><td><span class="pill ' + (r.status === "Revoked" ? "bad" : r.status === "Simulated" ? "info" : "warn") + '">' + r.status + "</span></td><td>" +
      (r.fixed ? '<a class="btn small" href="#app-security">Open in Lab</a>' : '<button class="btn small" data-a="agPause" data-id="' + esc(r.id) + '">' + (r.paused ? "Resume" : "Pause") + '</button> <button class="btn small danger" data-a="agDel" data-id="' + esc(r.id) + '">Remove</button>') + "</td></tr>").join("") + "</tbody></table></div>" +
    '<form class="panel" data-a-submit="agAdd" style="display:grid;gap:12px;max-width:560px"><h3>Add an agent slot</h3><p class="muted">A slot reserves a name and a vault for an agent. The public key is attached at deployment, which is planned.</p>' +
    '<label class="field">Agent name<input type="text" id="agname" value="' + esc(AG.name) + '" autocomplete="off"><span class="err" role="alert">' + esc(AG.err) + '</span></label><label class="field">Vault<select id="agvault">' + vopts + '</select></label><div><button class="btn primary" type="submit">Add agent</button></div></form>',
    pageHead("Agents", "Who can spend from which vault."));
});
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-a-submit]"); if (!f) return; e.preventDefault();
  if (f.dataset.aSubmit === "agAdd") {
    const name = $("#agname").value.trim(), vid = $("#agvault").value;
    if (!name) { AG.err = "Enter a name for the agent."; AG.name = ""; rerender(); const i = $("#agname"); if (i) i.focus(); return; }
    const vn = vid === "demo" ? "Demo vault" : (S.vaults.find(v => v.id === vid) || {}).name || "Unknown";
    S.agents.push({ id: "a" + Date.now().toString(36), name, vaultId: vid, vaultName: vn, paused: false }); save(); AG.name = ""; AG.err = ""; toast("Agent slot added"); rerender();
  }
  if (f.dataset.aSubmit === "labForm" && actions.labSubmit) actions.labSubmit(f);
});
actions.agPause = el => { const a = S.agents.find(x => x.id === el.dataset.id); if (a) { a.paused = !a.paused; save(); toast(a.paused ? "Agent paused" : "Agent resumed"); rerender(); } };
actions.agDel = async el => {
  const a = S.agents.find(x => x.id === el.dataset.id); if (!a) return;
  const ok = S.prefs.confirmRevoke ? await confirmBox("Remove " + a.name + "?", "This removes the slot from this browser. It does not touch any funds.", "Remove agent", true) : true;
  if (ok) { S.agents = S.agents.filter(x => x.id !== a.id); save(); toast("Agent removed"); rerender(); }
};
