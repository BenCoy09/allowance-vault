# Allowance Vault

A Bitcoin Cash covenant design that gives an AI agent, bot or device a spending key with built-in limits: per-payment cap, refilling budget, approved recipients, expiry, owner revocation.

Built for BCH BLAZE 2026. Built with Claude (Anthropic) as a coding assistant.

## Status (be skeptical)

| Part | Status |
| --- | --- |
| Product site and Security Lab (`src/`) | Implemented |
| JavaScript reference model of the rules (`src/core.js`) | Implemented, simulation only |
| CashScript contract (`contracts/AllowanceVault.cash`) | Compiles with cashc 0.14.0. 9 test cases pass in a **local VM emulator** (`test.mjs`, results in `TESTS.md`). |
| Chipnet / mainnet deployment | **Not done** |
| Independent audit | **Not done** |
| Wallet connection, SDK | Not done |

## Run the site

    python3 build.py
    python3 -m http.server 8080
    # open http://localhost:8080/index.html

## Next steps

1. Test the remaining attacks (forged clock, token output, expiry reclaim, chained spends).
2. Deploy on chipnet and keep raw transactions and node errors.
3. Mainnet vault with a small balance.
4. Independent review.

## Test the contract

    npm install
    npm test

License: MIT
