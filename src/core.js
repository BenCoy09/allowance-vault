/* Allowance Vault reference model.
   This is a JavaScript model of the rules in the PLANNED covenant. It is not the covenant, it does not
   touch any blockchain, and a result from it is a simulation. */
const AV = (() => {
  const PAYEES = {
    "payee-a": { label: "Payee A (example)", allowed: true },
    "payee-b": { label: "Payee B (example)", allowed: true },
    "stranger": { label: "Unlisted address (example)", allowed: false },
    "attacker": { label: "Attacker address (example)", allowed: false },
  };

  function newVault(over) {
    return Object.assign({
      id: "demo",
      name: "Demo vault",
      network: "simulation",
      balance: 500000,           // sats held by the vault UTXO
      perTxCap: 40000,           // sats per payment
      bucketCap: 100000,         // sats, maximum the bucket can hold
      refillPerBlock: 500,       // sats added per block
      maxFee: 500,               // sats, maximum miner fee per spend
      expiryHeight: 901008,      // block height
      allowlist: ["payee-a", "payee-b"],
      bucket: 100000,
      lastHeight: 900000,
      status: "active",          // active | revoked | expired
      agent: "agent-key-1",
    }, over || {});
  }

  function refilled(v, h) {
    return Math.min(v.bucketCap, v.bucket + v.refillPerBlock * Math.max(0, h - v.lastHeight));
  }

  /* tx = { signer, inputs, outputs:[{lock,value,token}], locktime, sequenceFinal, newHeight }
     Evaluates every condition (the real script stops at the first failure) and reports each. */
  function evaluate(v, tx) {
    const out0 = tx.outputs[0] || { lock: "?", value: 0 };
    const out1 = tx.outputs[1] || { lock: "?", value: 0 };
    const amount = out0.value;
    const fee = v.balance - (out0.value || 0) - (out1.value || 0);
    const live = v.status === "active";
    const refill = refilled(v, tx.newHeight);
    const checks = [];
    const add = (id, label, pass, detail) => checks.push({ id, label, pass: !!pass, detail });

    add("live", "Vault UTXO is unspent", live,
      live ? "The vault is active." : v.status === "revoked"
        ? "The owner swept this vault. Its UTXO is spent, so this transaction has nothing to spend."
        : "The vault has expired.");
    add("sig", "Signed by the agent key", tx.signer === "agent",
      tx.signer === "agent" ? "Signature matches the agent key in the contract." : "Only the agent key (or owner path) can unlock this vault.");
    add("shape", "Exactly 1 input and 2 outputs", tx.inputs === 1 && tx.outputs.length === 2,
      "Got " + tx.inputs + " input(s) and " + tx.outputs.length + " output(s). Extra outputs could carry hidden value or tokens.");
    add("tokens", "Payment output carries no tokens", !out0.token,
      out0.token ? "Output 0 holds a token. The contract requires token category 0x." : "No tokens on the payment output.");
    add("timelock", "Locktime is enforced (CLTV) and covers the claimed height",
      !tx.sequenceFinal && tx.locktime >= tx.newHeight,
      tx.sequenceFinal ? "Input sequence is final, so nLockTime is ignored. The contract's tx.time check requires a non-final sequence."
        : tx.locktime < tx.newHeight ? "Claimed height " + tx.newHeight + " is above locktime " + tx.locktime + "." : "Locktime " + tx.locktime + " covers claimed height " + tx.newHeight + ".");
    add("monotone", "Height does not go backwards", tx.newHeight >= v.lastHeight,
      "Claimed height " + tx.newHeight + ", last recorded height " + v.lastHeight + ".");
    add("expiry", "Vault has not expired", tx.newHeight < v.expiryHeight,
      "Height " + tx.newHeight + ", expiry height " + v.expiryHeight + ".");
    add("payee", "Recipient is on the approved list", v.allowlist.includes(out0.lock),
      (PAYEES[out0.lock] ? PAYEES[out0.lock].label : out0.lock) + (v.allowlist.includes(out0.lock) ? " is approved." : " is not approved."));
    add("cap", "Amount is within the per-payment cap", amount <= v.perTxCap,
      fmt(amount) + " requested, cap " + fmt(v.perTxCap) + ".");
    add("change", "Change returns to the same vault with its state token", out1.lock === "vault" && out1.keepsNft !== false,
      out1.lock === "vault" ? "Change goes back to the vault." : "Output 1 goes to " + (PAYEES[out1.lock] ? PAYEES[out1.lock].label : out1.lock) + ". The contract requires the vault's own locking script.");
    add("fee", "Miner fee is within the fee cap", fee >= 0 && fee <= v.maxFee,
      "Fee " + fmt(fee) + ", cap " + fmt(v.maxFee) + ". The fee is computed from inputs minus outputs, so it cannot be hidden.");
    add("bucket", "Amount plus fee fits the budget", amount + fee <= refill,
      "Needs " + fmt(amount + fee) + ", budget available " + fmt(refill) + " (bucket " + fmt(v.bucket) + " refilling " + fmt(v.refillPerBlock) + " per block, capped at " + fmt(v.bucketCap) + ").");

    const failed = checks.filter(c => !c.pass);
    return { checks, accepted: failed.length === 0, firstFail: failed[0] || null, fee, refill };
  }

  function apply(v, tx, result) {
    if (!result.accepted) return v;
    const amount = tx.outputs[0].value;
    v.bucket = result.refill - amount - result.fee;
    v.lastHeight = tx.newHeight;
    v.balance = v.balance - amount - result.fee;
    return v;
  }

  function ownerSweep(v) {
    v.status = "revoked";
    return { accepted: true, note: "Owner path: one input, owner signature, any outputs. No other rule applies." };
  }

  function fmt(sats) {
    const bch = sats / 1e8;
    return sats.toLocaleString("en-US") + " sats (" + bch.toFixed(8).replace(/0+$/, "").replace(/\.$/, ".0") + " BCH)";
  }
  function fmtShort(sats) { return sats.toLocaleString("en-US") + " sats"; }

  /* legitimate baseline transaction against a vault */
  function legit(v, over) {
    const height = v.lastHeight + 1;
    const amount = 20000, fee = 300;
    const tx = {
      signer: "agent", inputs: 1,
      outputs: [{ lock: "payee-a", value: amount, token: false }, { lock: "vault", value: v.balance - amount - fee, keepsNft: true }],
      locktime: height, sequenceFinal: false, newHeight: height,
    };
    return Object.assign(tx, over || {});
  }

  function mk(v, amount, fee, lock, extra) {
    const height = (extra && extra.newHeight) || v.lastHeight + 1;
    const tx = {
      signer: "agent", inputs: 1,
      outputs: [{ lock: lock, value: amount, token: false }, { lock: "vault", value: v.balance - amount - fee, keepsNft: true }],
      locktime: height, sequenceFinal: false, newHeight: height,
    };
    return Object.assign(tx, extra || {});
  }

  /* Attack catalogue. Each run() starts from a fresh vault and returns steps. */
  const ATTACKS = [
    {
      id: "a01", name: "Attack 01: Transaction cap bypass", short: "Send 200,000 sats in one payment to an approved payee.",
      expect: "The per-payment cap is 40,000 sats, so the covenant rejects it.",
      run() {
        const v = newVault();
        const tx = mk(v, 200000, 300, "payee-a");
        return { vault: v, steps: [{ label: "Agent key signs a 200,000 sat payment to Payee A", tx, res: evaluate(v, tx) }] };
      },
    },
    {
      id: "a02", name: "Attack 02: Unauthorized recipient", short: "Pay a small, within-cap amount to an address that is not approved.",
      expect: "The recipient is not on the approved list, so the covenant rejects it.",
      run() {
        const v = newVault();
        const tx = mk(v, 10000, 300, "attacker");
        return { vault: v, steps: [{ label: "Agent key signs a 10,000 sat payment to the attacker address", tx, res: evaluate(v, tx) }] };
      },
    },
    {
      id: "a03", name: "Attack 03: Budget exhaustion", short: "Split spending into many payments inside the same block range.",
      expect: "Each payment is inside the cap, but the budget is shared. The third one is rejected.",
      run() {
        const v = newVault();
        const steps = [];
        for (let i = 1; i <= 3; i++) {
          const tx = mk(v, 40000, 300, "payee-a", { newHeight: v.lastHeight, locktime: v.lastHeight });
          const res = evaluate(v, tx);
          steps.push({ label: "Payment " + i + " of 40,000 sats to Payee A", tx, res });
          apply(v, tx, res);
          if (!res.accepted) break;
        }
        return { vault: v, steps };
      },
    },
    {
      id: "a04", name: "Attack 04: Expired authorization", short: "Spend after the vault's expiry height.",
      expect: "The vault has expired, so the agent path is closed. Anyone can send the funds to the owner's refund address.",
      run() {
        const v = newVault();
        const h = v.expiryHeight + 5;
        const tx = mk(v, 10000, 300, "payee-a", { newHeight: h, locktime: h });
        return { vault: v, steps: [{ label: "Agent key signs a 10,000 sat payment at height " + h, tx, res: evaluate(v, tx) }] };
      },
    },
    {
      id: "a05", name: "Attack 05: Revoked agent", short: "Owner revokes, then the agent tries a normal payment.",
      expect: "Revocation spends the vault UTXO. The agent's later transaction has nothing to spend.",
      run() {
        const v = newVault();
        const steps = [];
        const sweep = ownerSweep(v);
        steps.push({ label: "Owner signs a sweep (revocation)", owner: true, res: { accepted: true, checks: [{ id: "owner", label: "Owner signature", pass: true, detail: sweep.note }], firstFail: null } });
        const tx = mk(v, 10000, 300, "payee-a");
        steps.push({ label: "Agent key signs a 10,000 sat payment to Payee A", tx, res: evaluate(v, tx) });
        return { vault: v, steps };
      },
    },
    {
      id: "a06", name: "Attack 06: Redirect the change", short: "Send the remainder of the vault to the attacker instead of back to the vault.",
      expect: "Output 1 must use the vault's own locking script, so the covenant rejects it.",
      run() {
        const v = newVault();
        const tx = mk(v, 10000, 300, "payee-a");
        tx.outputs[1] = { lock: "attacker", value: v.balance - 10000 - 300, keepsNft: false };
        return { vault: v, steps: [{ label: "Agent key signs a payment whose change goes to the attacker", tx, res: evaluate(v, tx) }] };
      },
    },
    {
      id: "a07", name: "Attack 07: Fee inflation", short: "Pay a huge miner fee to move value out through a cooperating miner.",
      expect: "The fee is inputs minus outputs and is capped at 500 sats, so the covenant rejects it.",
      run() {
        const v = newVault();
        const tx = mk(v, 10000, 30000, "payee-a");
        return { vault: v, steps: [{ label: "Agent key signs a payment with a 30,000 sat fee", tx, res: evaluate(v, tx) }] };
      },
    },
    {
      id: "a08", name: "Attack 08: Forge the clock", short: "Claim a far-future height with a final input sequence to mint a full budget.",
      expect: "A final sequence disables locktime, so the contract's time check fails.",
      run() {
        const v = newVault({ bucket: 0 });
        const tx = mk(v, 30000, 300, "payee-a", { newHeight: v.lastHeight + 400, locktime: 0, sequenceFinal: true });
        return { vault: v, steps: [{ label: "Agent key signs with a final sequence, claiming 400 blocks of refill", tx, res: evaluate(v, tx) }] };
      },
    },
    {
      id: "a09", name: "Attack 09: Extra token output", short: "Attach a token to the payment output.",
      expect: "The payment output must hold no tokens, so the covenant rejects it.",
      run() {
        const v = newVault();
        const tx = mk(v, 10000, 300, "payee-a");
        tx.outputs[0].token = true;
        return { vault: v, steps: [{ label: "Agent key signs a payment whose output carries a token", tx, res: evaluate(v, tx) }] };
      },
    },
  ];

  const CONTRACT_DRAFT = `// UNVERIFIED DRAFT. Not compiled. Not tested. Not deployed. Not audited.
pragma cashscript ^0.13.0;

contract AllowanceVault(
    bytes20 ownerPkh,
    pubkey agentPk,
    bytes allowedLock1,
    bytes allowedLock2,
    int perTxCap,
    int bucketCap,
    int refillPerBlock,
    int maxFee,
    int expiryHeight,
    bytes refundLock
) {
    // Agent path: one payment, vault continues with updated state.
    function agentSpend(sig agentSig, int amount, int newHeight) {
        require(checkSig(agentSig, agentPk));
        require(tx.inputs.length == 1);
        require(tx.outputs.length == 2);
        require(tx.time >= newHeight);          // forces a non-final sequence (CLTV)

        bytes state = tx.inputs[this.activeInputIndex].nftCommitment;
        bytes bucketBytes, bytes heightBytes = state.split(8);
        int bucket = int(bucketBytes);
        int lastHeight = int(heightBytes);
        require(newHeight >= lastHeight);
        require(newHeight < expiryHeight);

        bytes payee = tx.outputs[0].lockingBytecode;
        require(payee == allowedLock1 || payee == allowedLock2);
        require(tx.outputs[0].tokenCategory == 0x);
        require(tx.outputs[0].value == amount);
        require(amount <= perTxCap);

        require(tx.outputs[1].lockingBytecode == tx.inputs[this.activeInputIndex].lockingBytecode);
        require(tx.outputs[1].tokenCategory == tx.inputs[this.activeInputIndex].tokenCategory);

        int fee = tx.inputs[this.activeInputIndex].value - tx.outputs[0].value - tx.outputs[1].value;
        require(fee >= 0 && fee <= maxFee);

        int refilled = min(bucketCap, bucket + refillPerBlock * (newHeight - lastHeight));
        require(amount + fee <= refilled);
        int newBucket = refilled - amount - fee;
        require(tx.outputs[1].nftCommitment == bytes8(newBucket) + bytes8(newHeight));
    }

    // Owner path: revoke or withdraw at any time. No agent cooperation needed.
    function ownerSweep(pubkey ownerPk, sig ownerSig) {
        require(hash160(ownerPk) == ownerPkh);
        require(checkSig(ownerSig, ownerPk));
    }

    // After expiry anyone may return the funds to the owner's refund address.
    function expiredReclaim() {
        require(tx.time >= expiryHeight);
        require(tx.outputs.length == 1);
        require(tx.outputs[0].lockingBytecode == refundLock);
        require(tx.outputs[0].value >= tx.inputs[this.activeInputIndex].value - maxFee);
    }
}`;

  return { PAYEES, newVault, refilled, evaluate, apply, ownerSweep, legit, mk, ATTACKS, CONTRACT_DRAFT, fmt, fmtShort };
})();
if (typeof module !== "undefined") module.exports = AV;
