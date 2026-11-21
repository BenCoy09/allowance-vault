# Test results

Run on 21 Nov 2026 on Ubuntu, Node 26, cashc 0.14.0, cashscript (MockNetworkProvider).

This is a **local VM emulator**, not a blockchain. It runs the compiled contract bytecode against test transactions. Nothing was broadcast to chipnet or mainnet.

| Case | Expected | Result | Stopped at |
| --- | --- | --- | --- |
| Valid 20,000 sat payment (control) | accepted | accepted | |
| Payment of 50,000 (cap is 40,000) | rejected | rejected | line 35, per-payment cap |
| Unapproved recipient | rejected | rejected | line 32, recipient list |
| Budget exhausted (19,400 left, pay 20,000) | rejected | rejected | line 44, budget |
| Spend at expiry height | rejected | rejected | line 29, expiry |
| Fee 5,000 (cap 2,000) | rejected | rejected | line 41, fee cap |
| Change sent to attacker | rejected | rejected | line 37, change must return to the vault |
| Wrong new budget in the state token | rejected | rejected | line 46, state commitment |
| Owner sweep (revoke) | accepted | accepted | |

## Not tested

- Forging the clock with a final sequence
- Attaching tokens to the payment output
- The expiredReclaim path
- Several payments in a row (state chaining across transactions)
- Any real chain: chipnet and mainnet are not done
- No audit

## Notes

- The compiled transaction is about 600 bytes, so the fee cap must be above about 1,000 sats. The first draft had 500, which the network would reject as too low.
- Earlier drafts used `bytes8(int)`, which cashc 0.14 rejects. It now uses `toPaddedBytes(value, 8)`.

## Reproduce

    npm install
    cashc contracts/AllowanceVault.cash --output contracts/AllowanceVault.json
    node test.mjs
