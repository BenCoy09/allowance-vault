/* ============ Security Lab, activity, developers, docs, FAQ, settings, boot ============ */
const LAB = { sel: null, res: null, ctl: null, free: null };
function logStep(vault, label, res) {
  S.log.unshift({ t: new Date(), src: "simulated", vault, ev: label, res: res.accepted ? "accepted" : "rejected", why: res.firstFail ? res.firstFail.label : "" });
  if (S.log.length > 200) S.log.length = 200;
}
function checksHtml(res) {
  return '<ul class="checks">' + res.checks.map(c => '<li class="' + (c.pass ? "pass" : "fail") + '"><span class="ic" aria-hidden="true">' + (c.pass ? "✓" : "✕") + '</span><span><b>' + esc(c.label) + '</b> <span class="sr">' + (c.pass ? "passed" : "failed") + "</span><small>" + esc(c.detail) + "</small></span></li>").join("") + "</ul>";
}
function packet(tx) {
  const j = JSON.stringify({ note: "Reference-model input. Not a real transaction.", tx }, null, 2);
  return '<details class="drawer" style="margin-top:8px"><summary>Reproduction packet</summary><p class="muted" style="margin:8px 0;font-size:.88rem">A rejected transaction never reaches a block, so it has no transaction id. On a real chain the proof is the raw transaction, the node\'s rejection message and a control that succeeds. Here the packet is the model input.</p>' + code("json", j, "packet.json") + "</details>";
}
function stepCard(s, i) {
  const acc = s.res.accepted;
  return '<div class="panel flat" style="display:grid;gap:8px"><div class="row" style="justify-content:space-between"><b>' + (i + 1) + ". " + esc(s.label) + "</b>" + pill(acc ? "ok" : "bad", acc ? "Accepted" : "Rejected") + "</div>" +
    (!acc && s.res.firstFail ? '<div class="callout bad"><strong>Failed:</strong> ' + esc(s.res.firstFail.label) + "<br>" + esc(s.res.firstFail.detail) + "</div>" : "") +
    (S.prefs.labDetail ? "<details" + (acc ? "" : " open") + "><summary>All " + s.res.checks.length + " checks</summary>" + checksHtml(s.res) + "</details>" : "") + (s.tx ? packet(s.tx) : "") + "</div>";
}
function labResult() {
  if (!LAB.res) return '<div class="empty"><b style="color:var(--fg)">Pick an attack</b><span>Each one signs a transaction with the agent key and asks the vault rules to judge it.</span></div>';
  const { a, r } = LAB.res; const blocked = r.steps.filter(s => !s.owner && !s.res.accepted).length;
  const moved = r.steps.filter(s => !s.owner && s.res.accepted).reduce((t, s) => t + s.tx.outputs[0].value, 0);
  return '<div class="verdict" id="labres" tabindex="-1" aria-live="polite"><h2 style="font-size:1.2rem">' + esc(a.name) + '</h2><p class="muted">' + esc(a.short) + '</p><div class="big ' + (blocked ? "rej" : "acc") + '">' + (blocked ? "✕ Blocked" : "✓ Accepted") + '<span style="font-size:.95rem;font-weight:500;color:var(--fg)">' + esc(blocked ? blocked + " of " + r.steps.filter(s => !s.owner).length + " agent transactions rejected" : "No rule stopped it") + "</span></div>" +
    '<p><b>Expected:</b> ' + esc(a.expect) + '</p><p><b>Value that reached a payee:</b> ' + sats(moved) + ". <span class=\"muted\">Vault afterwards: balance " + sats(r.vault.balance) + ", status " + esc(r.vault.status) + ".</span></p>" + r.steps.map(stepCard).join("") + "</div>";
}
function attackBtn(a) { return '<button class="attack" data-a="runAttack" data-id="' + a.id + '" aria-pressed="' + (LAB.sel === a.id) + '"><b>' + esc(a.name.replace(/^Attack \d+: /, "")) + "</b><span>" + esc(a.short) + "</span></button>"; }
function sessionPanel() {
  const v = S.session;
  return '<div class="panel" style="display:grid;gap:12px"><div class="row" style="justify-content:space-between"><h3>Try your own transaction</h3>' + pill(v.status === "active" ? "info" : "bad", v.status === "active" ? "Vault: " + esc(v.name) : "Revoked") + "</div>" +
    '<dl class="kv"><dt>Balance</dt><dd>' + sats(v.balance) + "</dd><dt>Budget available</dt><dd>" + sats(AV.refilled(v, v.lastHeight)) + "</dd><dt>Per-payment cap</dt><dd>" + sats(v.perTxCap) + "</dd><dt>Fee cap</dt><dd>" + sats(v.maxFee) + "</dd><dt>Last block seen</dt><dd>" + v.lastHeight.toLocaleString("en-US") + "</dd><dt>Approved</dt><dd>" + (v.allowlist.length ? esc(v.allowlist.map(k => AV.PAYEES[k].label).join(", ")) : "nobody") + "</dd></dl>" +
    '<form data-a-submit="labForm" style="display:grid;gap:12px"><div class="grid2"><label class="field">Amount (sats)<input name="amount" type="number" min="0" step="1" value="10000"></label><label class="field">Miner fee (sats)<input name="fee" type="number" min="0" step="1" value="300"></label>' +
    '<label class="field">Recipient<select name="to">' + Object.keys(AV.PAYEES).map(k => '<option value="' + k + '">' + esc(AV.PAYEES[k].label) + "</option>").join("") + '</select></label><label class="field">Blocks since last spend<input name="adv" type="number" min="0" step="1" value="1"></label></div>' +
    '<fieldset style="border:0;padding:0;margin:0;display:grid;gap:6px"><legend style="font-weight:600;margin-bottom:4px">Tricks</legend><label class="row"><input type="checkbox" name="final"> Use a final input sequence (tries to fake the clock)</label><label class="row"><input type="checkbox" name="tok"> Put a token on the payment output</label><label class="row"><input type="checkbox" name="redir"> Send the change to the attacker address</label></fieldset>' +
    '<div class="row"><button class="btn primary" type="submit">Sign and submit as the agent</button><button class="btn danger" type="button" data-a="labRevoke"' + (v.status !== "active" ? " disabled" : "") + '>Owner revokes</button><button class="btn" type="button" data-a="labReset">Reset vault</button></div></form>' +
    (LAB.free ? '<div id="freeres" aria-live="polite" style="display:grid;gap:10px"><div class="verdict"><div class="big ' + (LAB.free.res.accepted ? "acc" : "rej") + '">' + (LAB.free.res.accepted ? "✓ Accepted" : "✕ Rejected") + "</div></div>" + (LAB.free.res.firstFail ? '<div class="callout bad"><strong>Failed:</strong> ' + esc(LAB.free.res.firstFail.label) + "<br>" + esc(LAB.free.res.firstFail.detail) + "</div>" : "") + "<details><summary>All checks</summary>" + checksHtml(LAB.free.res) + "</details>" + packet(LAB.free.tx) + "</div>" : "") + "</div>";
}
reg("app-security", "Security Lab", "app", n => appShell(n, [["app", "Overview"], ["app-security", "Security Lab"]],
  '<div class="callout warn"><strong>Mode B: simulation.</strong> Verdicts come from the reference model of the planned covenant, not from a blockchain. Mode A, where each attack is a real chipnet or mainnet transaction with its raw hex and node error, is planned. A reference model can be wrong in the same way the contract is, so treat green results as a claim to be tested, not as proof.</div>' +
  '<div class="lab"><div style="display:grid;gap:14px"><div class="panel"><h3>Core attacks</h3><div class="attacks" style="margin-top:12px">' + AV.ATTACKS.slice(0, 5).map(attackBtn).join("") + '</div></div><div class="panel"><h3>More attacks</h3><div class="attacks" style="margin-top:12px">' + AV.ATTACKS.slice(5).map(attackBtn).join("") +
  '</div></div><div class="panel"><h3>Control</h3><p class="muted" style="margin:6px 0 12px;font-size:.9rem">The same kind of payment with no violation. If a control fails, a rejection above proves nothing.</p><button class="btn" data-a="runControl">Run a valid payment</button>' +
  (LAB.ctl ? '<div id="ctlres" aria-live="polite" style="margin-top:12px;display:grid;gap:8px"><div class="verdict"><div class="big ' + (LAB.ctl.res.accepted ? "acc" : "rej") + '">' + (LAB.ctl.res.accepted ? "✓ Accepted" : "✕ Rejected") + "</div></div><p class=\"muted\" style=\"font-size:.88rem\">" + LAB.ctl.res.checks.filter(c => c.pass).length + " of " + LAB.ctl.res.checks.length + " checks passed.</p></div>" : "") + "</div></div>" +
  '<div style="display:grid;gap:16px;min-width:0">' + labResult() + sessionPanel() + "</div></div>",
  pageHead("Try to break the vault.", "Pick an attack, or build your own transaction. The agent key is assumed stolen.")));
actions.runAttack = el => {
  const a = AV.ATTACKS.find(x => x.id === el.dataset.id); if (!a) return;
  const r = a.run(); LAB.sel = a.id; LAB.res = { a, r }; r.steps.forEach(s => logStep("Demo vault (fresh)", a.name.replace(/^Attack \d+: /, "") + ": " + s.label, s.res));
  rerender(); const x = $("#labres"); if (x) { x.focus({ preventScroll: true }); if (innerWidth < 980) x.scrollIntoView({ block: "start" }); }
};
actions.runControl = () => {
  const v = AV.newVault(); const tx = AV.legit(v); LAB.ctl = { tx, res: AV.evaluate(v, tx) }; logStep("Demo vault (fresh)", "Control: valid 20,000 sat payment", LAB.ctl.res); rerender();
};
actions.labSubmit = f => {
  const v = S.session, fd = new FormData(f); const num = k => Math.max(0, parseInt(fd.get(k), 10) || 0);
  const amount = num("amount"), fee = num("fee"), adv = num("adv"), h = v.lastHeight + adv;
  const fin = fd.get("final") === "on";
  const tx = AV.mk(v, amount, fee, fd.get("to"), { newHeight: h, locktime: fin ? 0 : h, sequenceFinal: fin });
  if (fd.get("tok") === "on") tx.outputs[0].token = true;
  if (fd.get("redir") === "on") tx.outputs[1] = { lock: "attacker", value: v.balance - amount - fee, keepsNft: false };
  const res = AV.evaluate(v, tx); if (res.accepted) AV.apply(v, tx, res);
  LAB.free = { tx, res }; logStep(v.name, "Custom payment of " + AV.fmtShort(amount) + " to " + AV.PAYEES[fd.get("to")].label, res); rerender();
  const x = $("#freeres"); if (x) x.scrollIntoView({ block: "nearest" });
};
actions.labRevoke = async () => {
  const ok = S.prefs.confirmRevoke ? await confirmBox("Revoke this vault?", "The owner sweeps the vault. The agent key stops working at once. In the simulation you can reset it afterwards.", "Revoke vault", true) : true;
  if (!ok) return; AV.ownerSweep(S.session); S.log.unshift({ t: new Date(), src: "simulated", vault: S.session.name, ev: "Owner revoked the vault", res: "accepted", why: "" }); toast("Vault revoked"); rerender();
};
actions.labReset = () => { resetSession(); LAB.free = null; toast("Vault reset"); rerender(); };

/* ---------- activity ---------- */
const ACT = { f: "all" };
reg("app-activity", "Activity", "app", n => {
  const sim = S.log; const show = ACT.f === "chain" ? [] : sim;
  const tabs = [["all", "All"], ["sim", "Simulated (" + sim.length + ")"], ["chain", "On-chain (0)"]].map(([k, t]) => '<a href="#app-activity" data-a="actF" data-f="' + k + '"' + (ACT.f === k ? ' aria-current="page"' : "") + ">" + t + "</a>").join("");
  let body;
  if (!show.length) body = ACT.f === "chain" ? '<div class="empty"><b style="color:var(--fg)">No on-chain activity</b><span>Nothing is deployed, so there are no real vault events. When a vault exists this list will read transactions from the chain and show their transaction ids.</span></div>' : '<div class="empty"><b style="color:var(--fg)">Nothing has happened yet</b><span>Run an attack in the Security Lab and each verdict is listed here.</span><a class="btn primary" href="#app-security">Open the Security Lab</a></div>';
  else body = '<div class="tablewrap"><table><thead><tr><th>Time</th><th>Source</th><th>Vault</th><th>Event</th><th>Result</th></tr></thead><tbody>' + show.map(l => "<tr><td>" + stamp(l.t) + "</td><td>" + pill("info", "Simulated") + "</td><td>" + esc(l.vault) + '</td><td class="wrapc">' + esc(l.ev) + (l.why ? '<br><span class="muted">' + esc(l.why) + "</span>" : "") + "</td><td>" + pill(l.res === "accepted" ? "ok" : "bad", l.res === "accepted" ? "Accepted" : "Rejected") + "</td></tr>").join("") + "</tbody></table></div>";
  return appShell(n, [["app", "Overview"], ["app-activity", "Activity"]], '<div class="row" style="justify-content:space-between"><div class="tabs">' + tabs + "</div>" + (sim.length ? '<button class="btn small" data-a="actClear">Clear simulated log</button>' : "") + "</div>" + body,
    pageHead("Activity", "Every verdict from this session. The list resets when you close the page."));
});
actions.actF = el => { ACT.f = el.dataset.f; rerender(); };
actions.actClear = () => { S.log = []; rerender(); };

/* ---------- developers ---------- */
reg("developers", "Developers", "marketing", n => marketingShell(n,
  '<div class="wrap" style="padding-top:clamp(30px,6vw,64px);display:grid;gap:40px"><header><span class="status-line"><b>Status</b> Contract unbuilt. SDK is a sketch.</span><h1>Build with a vault that limits your agent</h1><p class="lead muted" style="margin-top:14px;font-size:1.1rem">Everything an integration needs is in the rules: what a payment must look like for the vault to accept it. This page says what exists, what does not, and what comes next.</p></header>' +
  '<section><h2>What exists today</h2><div class="tablewrap" style="margin-top:16px"><table><thead><tr><th>Piece</th><th>Status</th><th>Where</th></tr></thead><tbody>' +
  '<tr><td>Reference model (12 checks, JavaScript)</td><td>' + STATUS.implemented() + '</td><td><a href="#docs-api">Contract and API</a></td></tr><tr><td>Nine attack scenarios</td><td>' + STATUS.simulated() + '</td><td><a href="#app-security">Security Lab</a></td></tr><tr><td>CashScript contract</td><td>' + STATUS.unverified() + '</td><td><a href="#docs-api">Contract and API</a></td></tr><tr><td>TypeScript SDK</td><td>' + STATUS.planned() + '</td><td><a href="#docs-sdk">SDK sketch</a></td></tr><tr><td>Wallet signing for covenant inputs</td><td>' + STATUS.planned() + '</td><td><a href="#docs-security">Security model</a></td></tr></tbody></table></div></section>' +
  '<section class="grid2"><div style="display:grid;gap:12px;min-width:0"><h2>How an agent would use it</h2><p class="muted">The agent builds a payment that fits the vault\'s shape and signs it with its limited key. It never needs the owner key.</p>' + code("typescript", "// PLANNED. Illustrates the intended flow. This SDK does not exist yet.\nconst payment = await vault.buildPayment({ to: payeeAddress, sats: 20_000n });\nconst txid = await vault.broadcast(await agentKey.sign(payment));", "agent loop (planned)") + '</div><div style="display:grid;gap:12px;min-width:0"><h2>How to review the rules</h2><p class="muted">Read the draft contract, then run each rule in the Lab. A rule you cannot break there is a rule worth testing on chipnet.</p><div class="row"><a class="btn primary" href="#docs-api">Open the contract draft</a><a class="btn" href="#app-security">Run the attacks</a></div></div></section>' +
  "<section>" + gatesPanel() + '</section><div class="callout"><strong>Contributing.</strong> The most useful help right now is a failed attack: a transaction the rules would accept that should not be accepted.</div></div>'));

/* ---------- docs ---------- */
const DOCP = [["docs", "Overview"], ["docs-quickstart", "Quickstart"], ["docs-sdk", "SDK sketch"], ["docs-api", "Contract and API"], ["docs-security", "Security model"]];
const tbl = (h, rows) => '<div class="tablewrap"><table><thead><tr>' + h.map(x => "<th>" + x + "</th>").join("") + "</tr></thead><tbody>" + rows.map(r => "<tr>" + r.map(c => '<td class="wrapc">' + c + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
const DOCB = {
  docs: () => "<h1>Allowance Vault documentation</h1><p>Allowance Vault is a Bitcoin Cash covenant for giving an AI agent, bot or device a spending key with built-in limits. These pages describe the design and mark clearly what has been built.</p>" +
    '<div class="callout warn"><strong>Read this first.</strong> The contract compiles and passes nine test cases in a local VM emulator. It has not been deployed on any chain or audited. The Security Lab runs a JavaScript reference model of the rules, not a chain.</div>' +
    "<h2>Concepts</h2>" + tbl(["Term", "Meaning"], [["Owner", "Holds the owner key. Can sweep the vault at any time."], ["Agent", "Holds a limited key. Can only sign payments the rules accept."], ["Vault", "A UTXO locked by the contract. It carries a small state token."], ["Budget", "A token bucket: it holds up to the budget cap and refills a set number of sats per block."], ["Per-payment cap", "The most one payment may send."], ["Recipients", "The approved destinations, fixed when the vault is made."], ["Expiry", "A block height after which the agent path closes."]]) +
    "<h2>Status of each part</h2>" + implTable() + "<h2>Where to start</h2><ul><li><a href=\"#docs-quickstart\">Quickstart</a> for the shortest path.</li><li><a href=\"#docs-api\">Contract and API</a> for the rules and the draft contract.</li><li><a href=\"#docs-security\">Security model</a> for what is and is not protected.</li></ul>",
  "docs-quickstart": () => "<h1>Quickstart</h1><p>Steps 1 to 3 work today in this page. Steps 4 to 6 are planned and have not been run.</p>" +
    '<h2>1. Break the vault</h2><p>Open the <a href="#app-security">Security Lab</a>, choose "Transaction cap bypass" and read which check failed.</p><h2>2. Run the control</h2><p>Click "Run a valid payment". A rejection only means something when the same payment without the violation is accepted.</p><h2>3. Design a vault</h2><p>Use the <a href="#app-vaults-new">wizard</a>. The review shows the most a leaked agent key could take at each point in time.</p>' +
    "<h2>4. Compile the contract " + STATUS.planned() + "</h2><p>Planned. Check the CashScript documentation for the current compiler command before running it.</p>" + code("bash", "# PLANNED. Not yet run.\ncashc AllowanceVault.cash -o AllowanceVault.json", "terminal (planned)") +
    "<h2>5. Deploy on chipnet " + STATUS.planned() + "</h2><p>Planned. Fund a vault with test coins, run each attack and keep the raw transaction and node error for every rejection.</p><h2>6. Deploy on mainnet " + STATUS.planned() + "</h2><p>Planned. Use a balance you can afford to lose. Publish the address and test the owner sweep first.</p>",
  "docs-sdk": () => "<h1>SDK sketch</h1>" + '<div class="callout warn"><strong>Not published.</strong> No package exists. The names below are a design sketch and will change. ' + STATUS.planned() + "</div><p>The aim is a small surface: deploy a vault, build a payment the rules will accept, let the agent sign it, and let the owner revoke.</p>" +
    code("typescript", "// PLANNED INTERFACE. Placeholder names. Nothing here is installable.\nconst vault = await AllowanceVault.deploy({\n  network: \"chipnet\",\n  ownerPublicKeyHash,\n  agentPublicKey,\n  rules: {\n    perPaymentSats: 40_000n,\n    budgetCapSats: 100_000n,\n    refillSatsPerBlock: 500n,\n    maxFeeSats: 500n,\n    expiryHeight,\n    recipients: [addressA, addressB],\n  },\n});\n\n// Agent side\nconst tx = await vault.buildPayment({ to: addressA, sats: 20_000n });\nawait vault.broadcast(await agentKey.sign(tx));\n\n// Owner side\nawait vault.revoke(ownerKey);", "sdk-sketch.ts") +
    "<h2>Design notes</h2><ul><li>The SDK must refuse to build a payment the rules would reject, and say which rule.</li><li>Private keys are passed to a signer. The SDK never stores them.</li><li>The reference model in this page would become the SDK's pre-flight check.</li></ul>",
  "docs-api": () => {
    const v = AV.newVault(); const checks = AV.evaluate(v, AV.legit(v)).checks;
    return "<h1>Contract and API</h1>" + '<div class="callout warn"><strong>Compiled and tested locally.</strong> This contract compiles with cashc 0.14.0 and passes nine test cases in a local VM emulator. It has not been deployed or audited. The fee cap has to exceed about 1,000 sats because the transaction is about 600 bytes. ' + STATUS.implemented() + "</div>" +
      "<h2>Constructor parameters</h2>" + tbl(["Name", "Type", "Meaning"], [["ownerPkh", "bytes20", "Hash of the owner public key."], ["agentPk", "pubkey", "The agent's public key."], ["allowedLock1, allowedLock2", "bytes", "Locking scripts of the approved recipients."], ["perTxCap", "int", "Maximum payment in sats."], ["bucketCap", "int", "Maximum budget in sats."], ["refillPerBlock", "int", "Budget added per block in sats."], ["maxFee", "int", "Maximum miner fee per spend in sats."], ["expiryHeight", "int", "Block height at which the agent path closes."], ["refundLock", "bytes", "Where an expired vault's funds go."]]) +
      "<h2>Functions</h2>" + tbl(["Function", "Who", "What it does"], [["agentSpend", "Agent", "Pays an approved recipient and continues the vault with updated state."], ["ownerSweep", "Owner", "Moves the funds anywhere. This is revocation."], ["expiredReclaim", "Anyone", "After expiry, returns the funds to the refund address."]]) +
      "<h2>State</h2><p>The vault output carries a mutable NFT whose commitment holds the current budget and the last block height seen, 8 bytes each.</p>" +
      "<h2>The twelve checks of agentSpend</h2><p>The reference model evaluates these in order. The real script stops at the first failure, the model reports all of them.</p><ol>" + checks.map(c => "<li>" + esc(c.label) + "</li>").join("") + "</ol>" +
      "<h2>Contract</h2>" + code("cashscript", AV.CONTRACT_DRAFT, "AllowanceVault.cash (compiled, tested locally)");
  },
  "docs-security": () => "<h1>Security model</h1><p>This page lists what an attacker with the agent key can try, which rule answers it and how far that answer has been checked.</p>" +
    "<h2>Threats</h2>" + tbl(["Attacker tries", "Answered by", "Status"], [["Send more than the cap in one payment", "Per-payment cap", STATUS.simulated()], ["Pay an unapproved address", "Recipient list", STATUS.simulated()], ["Spend through many small payments", "Shared budget with refill", STATUS.simulated()], ["Spend after expiry", "Expiry check, then reclaim path", STATUS.simulated()], ["Spend after revocation", "Owner sweep spends the vault output", STATUS.simulated()], ["Redirect the change", "Output 1 must reuse the vault script", STATUS.simulated()], ["Hide value in the miner fee", "Fee computed from inputs and capped", STATUS.simulated()], ["Fake a later block height", "Locktime check needs a non-final sequence", STATUS.simulated()], ["Attach tokens to the payment", "Token category must be empty", STATUS.simulated()]]) +
    "<h2>What it does not protect</h2><ul><li><b>The owner key.</b> Whoever holds it can take everything. Keep it offline or behind a multisig.</li><li><b>A manipulated agent.</b> If the agent is tricked into paying an approved recipient, the vault allows it. It only bounds the damage.</li><li><b>A compromised recipient.</b> Funds sent to an approved address are gone.</li><li><b>Chain-level problems.</b> Reorgs and miner censorship are outside the contract.</li></ul>" +
    "<h2>How a rejection is proved</h2><p>A rejected transaction never reaches a block. The proof has four parts: the raw transaction, the node's rejection message, the unspent vault outpoint, and a control transaction without the violation that succeeds. The Lab shows the model's version of this. " + STATUS.planned() + "</p>" +
    "<h2>Wallets</h2><p>Signing a covenant input needs a wallet that understands the contract. Whether that is done through WizardConnect or an XO template is undecided. " + STATUS.planned() + "</p><h2>Reporting a problem</h2><p>There is no disclosure channel yet. The Security Lab is the public place to challenge the rules: if you find a transaction the model accepts that it should reject, that is the report.</p>",
};
let DIDX = null;
function didx() { if (!DIDX) DIDX = DOCP.map(([k, t]) => { const d = document.createElement("div"); d.innerHTML = DOCB[k](); return { k, t, text: d.textContent.replace(/\s+/g, " ") }; }); return DIDX; }
function docsSearch(q) {
  q = q.trim().toLowerCase(); if (!q) return "";
  const terms = q.split(/\s+/); const out = [];
  didx().forEach(p => { const low = p.text.toLowerCase(); if (terms.every(t => low.includes(t) || p.t.toLowerCase().includes(t))) { const i = Math.max(0, low.indexOf(terms[0]) - 40); out.push('<a href="#' + p.k + '"><b>' + esc(p.t) + '</b><br><small class="muted">…' + esc(p.text.slice(i, i + 110)) + "…</small></a>"); } });
  return out.length ? out.join("") : '<span class="muted" style="padding:6px 10px;font-size:.9rem">No page mentions that. Try a shorter word.</span>';
}
DOCP.forEach(([k, t], i) => reg(k, t === "Overview" ? "Docs" : t, "marketing", n => {
  const prev = DOCP[i - 1], next = DOCP[i + 1];
  return marketingShell(n, '<div class="wrap"><div class="docs"><aside><label class="field sr-label"><span class="sr">Search the docs</span><input type="search" data-q placeholder="Search the docs" aria-label="Search the docs"></label><nav aria-label="Docs" id="dres-wrap"><div id="dres" style="display:grid;gap:2px"></div>' + DOCP.map(([kk, tt]) => '<a href="#' + kk + '"' + (kk === n ? ' aria-current="page"' : "") + ">" + tt + "</a>").join("") + '</nav></aside><article class="doc" style="min-width:0">' + DOCB[k]() +
    '<div class="pager">' + (prev ? '<a href="#' + prev[0] + '"><small>Previous</small>' + prev[1] + "</a>" : "<span></span>") + (next ? '<a class="next" href="#' + next[0] + '"><small>Next</small>' + next[1] + "</a>" : "<span></span>") + "</div></article></div></div>");
}));
document.addEventListener("input", e => { if (e.target.hasAttribute && e.target.hasAttribute("data-q")) { const r = $("#dres"); if (r) r.innerHTML = docsSearch(e.target.value); } });

/* ---------- FAQ ---------- */
const FAQ = [
  ["What is Allowance Vault?", "A Bitcoin Cash covenant, meaning a coin whose spending rules are part of the coin. It lets an AI agent, bot or device hold a key that can only spend within a per-payment cap, a refilling budget, an approved recipient list and an expiry."],
  ["Is it live on mainnet?", "No. The covenant compiles and passes nine tests in a local emulator, but it is not deployed on any chain and not audited. A mainnet vault with a small balance is the next goal and is not started. Everything you can try here runs on a reference model in your browser."],
  ["What happens if the agent key leaks?", "The thief can only do what the rules allow: pay approved recipients, up to the cap, inside the budget. The wizard's review shows the exact worst case for your settings. The owner can then revoke."],
  ["Can the agent drain the vault?", "Not past the budget. It cannot change the recipients, the caps, the expiry or where the change goes, and the fee is capped and counted inside the budget."],
  ["How does the budget refill?", "It is a token bucket. The bucket holds up to the budget cap and gains a fixed number of sats per block. A fixed daily window would allow nearly double spending at a boundary. A bucket does not."],
  ["How does the owner revoke?", "The owner spends the vault output with the owner key, usually back to their own address. After that the agent has nothing to spend. Bitcoin Cash has no replace-by-fee, so the owner can also chain a spend on top of an unconfirmed agent transaction."],
  ["What if the owner key leaks?", "Then everything can be taken. The vault protects against agent-key loss, not owner-key loss. Keep the owner key offline or behind a multisig."],
  ["Why a covenant and not software limits?", "A limit enforced by the program that holds the key disappears when the key leaks. A limit in the script is checked by every node, whatever program signed the transaction."],
  ["Does it work with tokens such as stablecoins?", "Not in the first version. A vault output holds one NFT and fungible tokens of one category, so a token vault needs a second output. BCH comes first and tokens are planned."],
  ["Can I run several agents?", "Give each agent its own vault. One vault is one output, so spends are serialized. Separate vaults avoid agents blocking each other and keep their budgets separate."],
  ["How do I know a rejection was real?", "A rejected transaction has no transaction id. On a real chain the proof is the raw transaction, the node's rejection message, the unspent outpoint and a control that succeeds. Today the Lab shows the reference model's verdicts, labelled as simulated."],
  ["Which wallets will work?", "That is undecided. A wallet has to sign a covenant input. The options are WizardConnect or an XO template. The Connect wallet button stays disabled until one exists."],
  ["Has it been audited?", "No. Nobody has reviewed the contract. Do not put money in it that you cannot afford to lose, and treat every claim here as unproven."],
  ["How would I use it with my agent framework?", "Through a TypeScript SDK that is planned and not published. The SDK sketch shows the intended shape. Today you can read the contract and try the rules in the Lab."],
];
reg("faq", "FAQ", "marketing", n => marketingShell(n, '<div class="wrap" style="padding-top:clamp(30px,6vw,64px);max-width:820px"><h1>Questions, answered plainly</h1><p class="muted" style="margin:12px 0 28px">Where the honest answer is "not yet", it says so.</p><div class="faq">' + FAQ.map((f, i) => "<details" + (i === 1 ? " open" : "") + "><summary>" + esc(f[0]) + "</summary><div>" + esc(f[1]) + "</div></details>").join("") + '</div><div class="callout" style="margin-top:28px">Still unsure? <a href="#app-security">Try to break the vault</a> and see which rule stops you.</div></div>'));

/* ---------- settings ---------- */
function sw(key, title, hint) { return '<div class="switch"><div class="t"><label for="p-' + key + '">' + title + "</label><small>" + hint + '</small></div><input type="checkbox" id="p-' + key + '" data-p="' + key + '"' + (S.prefs[key] ? " checked" : "") + "></div>"; }
reg("preferences", "Preferences", "app", n => appShell(n, [["app", "Overview"], ["preferences", "Preferences"]],
  '<div class="tabs"><a href="#preferences" aria-current="page">Preferences</a><a href="#preferences-security">Security</a></div><div class="panel" style="max-width:720px">' +
  '<div class="switch"><div class="t"><label for="p-density">Density</label><small>How tightly the app lays out rows and buttons.</small></div><select id="p-density" data-p="density"><option value="comfortable"' + (S.prefs.density === "comfortable" ? " selected" : "") + '>Comfortable</option><option value="compact"' + (S.prefs.density === "compact" ? " selected" : "") + ">Compact</option></select></div>" +
  '<div class="switch"><div class="t"><label for="p-motion">Motion</label><small>System follows your device setting for reduced motion.</small></div><select id="p-motion" data-p="motion"><option value="system"' + (S.prefs.motion === "system" ? " selected" : "") + '>Follow system</option><option value="reduce"' + (S.prefs.motion === "reduce" ? " selected" : "") + '>Reduce</option><option value="full"' + (S.prefs.motion === "full" ? " selected" : "") + ">Full</option></select></div>" +
  sw("bg", "Animated background", "A slow network of dots behind the page. Turn off to save battery.") + sw("labDetail", "Show all checks in the Lab", "List every rule check under each result, not only the one that failed.") +
  '<div class="switch"><div class="t"><label for="p-net">Network</label><small>Only simulation exists. Chipnet and mainnet are planned.</small></div><select id="p-net" disabled><option>Simulation</option></select></div></div>',
  pageHead("Preferences", "Saved in this browser only.")));
reg("preferences-security", "Security settings", "app", n => appShell(n, [["app", "Overview"], ["preferences", "Preferences"], ["preferences-security", "Security"]],
  '<div class="tabs"><a href="#preferences">Preferences</a><a href="#preferences-security" aria-current="page">Security</a></div><div class="panel" style="max-width:720px">' +
  sw("confirmRevoke", "Confirm before destructive actions", "Ask before revoking a vault or deleting a preview or an agent.") + sw("hideAmounts", "Hide amounts", "Mask sat values on screen, for screen sharing.") + "</div>" +
  '<div class="panel" style="max-width:720px;display:grid;gap:10px"><h3>Key handling</h3><p class="muted">This app has no field that accepts a seed phrase or private key, and it stores none. Agents keep their own keys. Wallet connection is planned, so there is nothing to disconnect yet.</p></div>' +
  '<div class="panel" style="max-width:720px;display:grid;gap:12px"><h3>Local data</h3><p class="muted">Preview vaults, agent slots and preferences live in this browser. They are not sent anywhere.</p><div class="row"><button class="btn" data-a="exportData">Copy as JSON</button><button class="btn danger" data-a="wipe">Clear local data</button></div></div>',
  pageHead("Security settings", "Control what the app asks and shows.")));
document.addEventListener("change", e => {
  const k = e.target.dataset && e.target.dataset.p; if (!k) return;
  S.prefs[k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; save(); applyPrefs(); if (k === "hideAmounts" || k === "labDetail") toast("Saved"); else toast("Saved");
});
actions.exportData = () => copyText(JSON.stringify({ prefs: S.prefs, vaults: S.vaults, agents: S.agents }, null, 2), "Local data copied");
actions.wipe = async () => {
  const ok = await confirmBox("Clear all local data?", "This deletes your preview vaults, agent slots and preferences from this browser. Nothing on-chain exists to be affected.", "Clear data", true);
  if (!ok) return; S.vaults = []; S.agents = []; S.log = []; S.prefs = { density: "comfortable", motion: "system", bg: true, confirmRevoke: true, hideAmounts: false, labDetail: true }; resetSession(); try { localStorage.removeItem(KEY); } catch (e) { /* ok */ } applyPrefs(); toast("Local data cleared"); rerender();
};

reg("404", "Not found", "marketing", n => marketingShell(n, '<div class="wrap" style="padding-top:80px"><div class="empty"><h1 style="font-size:2rem">That page does not exist</h1><span>The address <code>' + esc(location.hash) + '</code> matches no page.</span><a class="btn primary" href="#home">Back to the start</a></div></div>'));

/* ---------- boot ---------- */
load(); applyPrefs(); setFavicon(); render(false);
