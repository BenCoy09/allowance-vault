// Runs the compiled AllowanceVault contract against a local VM emulator (cashscript MockNetworkProvider).
// Not a chain. Usage: cashc contracts/AllowanceVault.cash --output contracts/AllowanceVault.json && node test.mjs
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';
import { Contract, MockNetworkProvider, randomUtxo, SignatureTemplate, TransactionBuilder } from 'cashscript';
import { secp256k1, hash160, encodeCashAddress, binToHex, hexToBin } from '@bitauth/libauth';

const artifact = JSON.parse(readFileSync('contracts/AllowanceVault.json', 'utf8'));
const key = () => { let k; do { k = new Uint8Array(randomBytes(32)); } while (!secp256k1.validatePrivateKey(k)); return k; };
const pub = k => secp256k1.derivePublicKeyCompressed(k);
const lock = pk => hexToBin('76a914' + binToHex(hash160(pk)) + '88ac');
const enc = (type, pk) => { const r = encodeCashAddress({ prefix: 'bchtest', type, payload: hash160(pk) }); return typeof r === 'string' ? r : r.address; };
const addr = pk => enc('p2pkh', pk);
const addrT = pk => enc('p2pkhWithTokens', pk);
const le8 = n => { const b = new Uint8Array(8); let v = BigInt(n); for (let i = 0; i < 8; i++) { b[i] = Number(v & 0xffn); v >>= 8n; } return b; };
const state = (bucket, height) => new Uint8Array([...le8(bucket), ...le8(height)]);

const ownerK = key(), agentK = key(), payeeA = key(), payeeB = key(), refund = key(), attacker = key();
const CAT = binToHex(new Uint8Array(randomBytes(32)));
const P = { perTxCap: 40000n, bucketCap: 100000n, refill: 500n, maxFee: 2000n, expiry: 901008n };
const args = () => [hash160(pub(ownerK)), pub(agentK), lock(pub(payeeA)), lock(pub(payeeB)), P.perTxCap, P.bucketCap, P.refill, P.maxFee, P.expiry, lock(pub(refund))];
const nft = (b, h) => ({ amount: 0n, category: CAT, nft: { capability: 'mutable', commitment: binToHex(state(b, h)) } });

async function spend(o) {
  const provider = new MockNetworkProvider();
  const c = new Contract(artifact, args(), { provider });
  const bal = o.balance ?? 500000n, last = o.last ?? 900000n, h = o.height ?? last + 1n, bucket = o.bucket ?? 100000n;
  const amount = o.amount ?? 20000n, fee = o.fee ?? 1000n;
  provider.addUtxo(c.address, randomUtxo({ satoshis: bal, token: nft(bucket, last) }));
  const x = bucket + P.refill * (h - last), refilled = x > P.bucketCap ? P.bucketCap : x;
  const newBucket = o.newBucket ?? refilled - amount - fee;
  await new TransactionBuilder({ provider })
    .addInput((await c.getUtxos())[0], c.unlock.agentSpend(new SignatureTemplate(agentK), amount, h))
    .addOutput({ to: o.to ?? addr(pub(payeeA)), amount })
    .addOutput({ to: o.changeTo ?? c.tokenAddress, amount: bal - amount - fee, token: nft(newBucket, h) })
    .setLocktime(Number(h))
    .debug();
}
async function sweep() {
  const provider = new MockNetworkProvider();
  const c = new Contract(artifact, args(), { provider });
  provider.addUtxo(c.address, randomUtxo({ satoshis: 500000n, token: nft(100000n, 900000n) }));
  await new TransactionBuilder({ provider })
    .addInput((await c.getUtxos())[0], c.unlock.ownerSweep(pub(ownerK), new SignatureTemplate(ownerK)))
    .addOutput({ to: addr(pub(refund)), amount: 499000n }).debug();
}
const tests = [
  ['CONTROL: valid 20,000 sat payment', () => spend({}), true],
  ['Cap bypass: 50,000 > 40,000 cap', () => spend({ amount: 50000n }), false],
  ['Unauthorized recipient', () => spend({ to: addr(pub(attacker)) }), false],
  ['Budget exhausted: bucket 19,400, pay 20,000', () => spend({ bucket: 19400n, last: 900000n, height: 900000n }), false],
  ['Expired: height at expiry', () => spend({ height: 901008n }), false],
  ['Fee inflation: fee 5,000 > 2,000', () => spend({ fee: 5000n }), false],
  ['Redirect change to attacker', () => spend({ changeTo: addrT(pub(attacker)) }), false],
  ['Wrong new bucket (state lie)', () => spend({ newBucket: 100000n }), false],
  ['Owner sweep (revoke)', () => sweep(), true],
];
let bad = 0;
for (const [name, fn, shouldPass] of tests) {
  let passed = true, msg = '';
  try { await fn(); } catch (e) { passed = false; msg = String(e.message || e).split('\n')[0].slice(0, 130); }
  const good = passed === shouldPass; if (!good) bad++;
  console.log((good ? 'OK   ' : 'FAIL ') + name + ' -> ' + (passed ? 'accepted' : 'rejected: ' + msg));
}
console.log(bad ? bad + ' unexpected result(s)' : 'All results as expected');
process.exit(bad ? 1 : 0);
