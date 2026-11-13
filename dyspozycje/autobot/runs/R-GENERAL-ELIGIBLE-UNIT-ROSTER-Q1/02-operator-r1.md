# AutoBot Operator — leader roster R1

STATUS: **IMPLEMENTED — READY FOR INDEPENDENT EVALUATION**. Scope is limited to `bestGeneralUnitForOwner()` plus the focused and existing recruitment tests. No unit data, stats, costs, ordinary recruitment rules, AI behavior, battle logic, deployment, or integration changed.

## Owner decisions applied

- Q2=A: keep cavalry and chariots even if their data has missile attack; exclude only `Dystans` and `Oblężnicza` line roles.
- Q3=B: in Bronze, use the strongest currently available eligible infantry/cavalry until the approved chariot is legally available, then switch to it.
- Stone before Wheel uses Warrior; after Wheel uses Ox Chariot.
- Iron uses the strongest currently available cavalry/mounted equivalent.
- A Wódz/Generał model must still respect normal era, technology, Barracks (or its building upgrade), capital, manpower, stock, and payment rules.

## Data-backed expected roster

The table lists model selection. “Bronze chariot” is selected when its ordinary era/technology/building requirements are met; until then the Q3=B fallback applies. Stone has two owner-approved variants around Wheel.

| Civilization | Stone before Wheel | Stone after Wheel | Bronze target | Iron target |
|---|---|---|---|---|
| Greeks | Warrior | Ox Chariot | Mycenaean Chariot | Cavalry |
| Romans | Warrior | Ox Chariot | Horse Chariot | Cavalry |
| Chinese | Warrior | Ox Chariot | Shang Chariot | Chinese Rider |
| Incas | Warrior | Ox Chariot | Horse Chariot | Cavalry |
| Zulu | Warrior | Ox Chariot | Horse Chariot | Cavalry |
| Egypt | Warrior | Ox Chariot | Egyptian Chariot | Cavalry |
| Sumerians | Warrior | Ox Chariot | Sumerian Chariot | Cavalry |
| Celts | Warrior | Ox Chariot | Horse Chariot | Cavalry |
| Germans | Warrior | Ox Chariot | Horse Chariot | Cavalry |
| Harappa | Warrior | Ox Chariot | Horse Chariot | Cavalry |
| Hittites | Warrior | Ox Chariot | Cappadocian Chariot | Cavalry |
| Slavs | Warrior | Ox Chariot | Horse Chariot | Javelin Rider |
| Babylonians | Warrior | Ox Chariot | Horse Chariot | Cavalry |
| Assyrians | Warrior | Ox Chariot | Horse Chariot | Assyrian Lance Cavalry |
| Phoenicians | Warrior | Ox Chariot | Horse Chariot | Cavalry |

Metadata recon: approved Bronze national chariots are mounted/flanking units. Egyptian Chariot has missile attack and remains eligible under Q2=A. Slavic Javelin Rider also has missile attack and remains eligible. Assyrian Archer Cavalry is ranged and excluded; Assyrian Lance Cavalry remains eligible. The Celtic Iron Chariot is not an Iron leader target because the accepted Iron category is the best cavalry/mounted equivalent.

## Replacement suppression and purchase-path review

Normal production hides generic Warrior for some civilizations and hides the generic Bronze Horse Chariot for Celts because a later national replacement declares `W zamian za`. The owner-approved leader models nevertheless explicitly require Warrior before Wheel and Horse Chariot for Celts in Bronze. The selector therefore offers these exact base models only for the leader card when the future replacement is the reason they are absent from normal production. It still checks era, technology, and the local Barracks/upgrade gate; it does not expose the model as a regular recruitment option. The normal purchase callback then checks treasury, manpower, stock resources, deducts the computed unit cost/resources, and queues the leader. The current `showStockGatedUnits` context keeps stock shortage from hiding a card, but actual purchase is still rejected if the pool cannot pay the stock cost.

The generic Celtic Bronze Horse Chariot is a specific approved leader exception, not a general bypass of the national replacement rule. Its selector regression confirms that missing `Jeździectwo` or Barracks blocks it. Stone Warrior retains its own standard wood cost and resource check.

## Verification

- `node gra/tools/general-eligible-unit-roster-test.cjs` — PASS, 137 checks; all 15 civs in Stone pre/post Wheel, Bronze target/fallback and Iron cavalry, role exclusions, missile-armed cavalry/chariots, legal gate checks, and Celtic replacement regression.
- `node gra/tools/general-capital-recruitment-order-test.cjs` — PASS, 0 failures; includes capital-only offer, era/technology/Barracks availability, card click, payment, resource deduction, and queue behavior.
- `cd gra && npm run typecheck` — PASS (`tsc --noEmit`).
- `git diff --check` — PASS for the scoped source, test, registry, and run-directory changes.

## Evaluator handoff

Please independently review only this selector change and its tests, with special attention to the narrow leader-only exception for generic Celtic Bronze Horse Chariot and Stone Warrior under later national replacement suppression. Do not edit AI tests or run unrelated formatting.
