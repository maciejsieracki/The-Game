# F → MASTER: batch D4-WYMIANA-PN — GOTOWE-ROBOCZA

| Pole | Wartość |
|------|---------|
| **Status** | → **MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-01 |
| **Od** | Integrator F |
| **Do** | Master Orkiestrator |
| **Batch** | `D4-WYMIANA-PN` |
| **Backup** | `gra/src/main.ts.bak-INTEGRATOR-D4-WYMIANA-PN-2026-06-30` |

---

## MD5 ROBOCZA

| Artefakt | MD5 |
|----------|-----|
| `Gra-podglad-ROBOCZA.html` | `7db1561668bdd9df18a010af28fe46c6` |
| `gra-robocza/ROBOCZA-MANIFEST.json` | `7db1561668bdd9df18a010af28fe46c6` |
| Poprzedni kanon (Master) | `4B360364201828D2F0D5B6C3C40EE556` |

**Start:** `gra-robocza/START.html`

---

## Wyniki testów (lane D4 + bramka częściowa)

| Test | Wynik |
|------|-------|
| `diplomacy-value-catalog-test.cjs` | **41/41** PASS |
| `diplomacy-test.cjs` | **143/143** PASS |
| `diplomacy-proposal-test.cjs` | **31/31** PASS |
| `smoke.cjs` | **OK** |
| `vite build --outDir $env:TEMP\civ-dist` | **OK** |
| `publish-robocza-snapshot.ps1` | **OK** |
| `bramka-test-publish.ps1` (pełna) | **NIE uruchomiona** — `npm run typecheck` ma istniejące błędy spoza batcha (battleScene, cityPanel, …) |

---

## Pliki zmienione

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | Stan `trustPnGainedThisTurn` / `dobraWolaRemainingTur` / `zlozeGrants`; save/load; `getState()` audiencji; PN trust po dealu; transfer koszyka; dobra wola tick; wojna→zawieszenie złoża |
| `gra/src/main.ts.bak-INTEGRATOR-D4-WYMIANA-PN-2026-06-30` | Backup przed batch |
| `gra/src/game/diplomacy-pn-engine.ts` | **NOWY** — helper PN→Zaufanie, fair deal, dobra wola, złoże |
| `gra/src/game/diplomacy.ts` | `dar` / `handel` event: +0 Zauf. (W1-A, PN w silniku) |
| `gra/src/game/diplomacy-proposals.ts` | W4-A strict PN (`diplomacyFairGivePn`); payload `givePn`/`receivePn`/koszyk |
| `gra/src/ui/diplomacyAudience.ts` | Typ `getState`: `trustPnGainedThisTurn`, `progDarRelacja` |
| `gra/tools/diplomacy-test.cjs` | Dar/hand el +0 (PN) |
| `gra/tools/diplomacy-proposal-test.cjs` | Handel strict PN |
| `gra-robocza/*` | Publish snapshot |
| `Gra-podglad-ROBOCZA.html` | Publish root legacy |

---

## DoD checklist

- [x] Katalog PN wpięty w silnik (`diplomacy-pn-engine` + `main.ts` apply/trust)
- [x] Limit +5 Zauf./turę z PN (`trustPnGainedThisTurn` + reset na początku tury gracza)
- [x] UI może czytać stan z `getState()` (`trustPnGainedThisTurn`, `relacjaTotal`, `progDarRelacja`)
- [x] AI akceptacja strict PN (W4-A) w `evaluateProposal`
- [x] Transfer v1: zloto, praca, żywność (spichlerz/zapasy), złoże boolean; tech/jednostka/surowiec stub
- [x] W10-A+: zawieszenie grantów złoża przy wojnie (`suspendZlozeOnWar`)
- [x] Dobra wola +1/turę × 3 (tick w `runDiplomacyTurnTick`)
- [x] Backup main.ts
- [x] Testy lane D zielone + smoke + build + publish ROBOCZA
- [ ] Master: review subagent → promocja kanon

---

## Co sprawdzić po wpięciu (Master / playtest)

1. Audiencja → `getState()` zwraca `trustPnGainedThisTurn` rosnące po hojnym handlu, reset po N.
2. Fair deal (give=receive @ Rel) → 0 Zauf. z PN; nadmiar ≥100 PN → skok + ewentualna dobra wola.
3. Wojna → komunikat „Dostęp do złoża wygasł"; po pokoju granty nie wracają (wymaga nowej umowy).
4. Grupa E koszyk UI (`diplomacyTradeBasket.ts`) — payload `giveItems`/`receiveItems` gotowy w silniku.

---

## Blokery / uwagi

- **typecheck globalny** — pre-existing errors (nie z tego batcha); pełna `bramka-test-publish.ps1` stopuje na `tsc`. Batch lane D + smoke + vite build: **OK**.
- **Tech/jednostka/surowiec** — transfer stub (log); batch 2 gdy UI+ścieżki gotowe.
- **Grupa E** — koszyk UI równolegle (nie blokuje ROBOCZA).

---

## Następny krok Master

Review subagent readonly → APPROVE/BLOCK → ewentualna promocja `gra-kanon/`.
