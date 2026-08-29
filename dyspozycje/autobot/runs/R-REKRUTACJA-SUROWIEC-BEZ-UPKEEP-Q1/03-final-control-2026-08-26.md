# 03 — FINAL CONTROL, runda 1 (2026-08-26)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`
MODEL+EFFORT: **Opus 5, effort high**
RUNDA: 1/5
GOAL: rekrutacja sprawdza wyłącznie `unitStockCost`; utrzymanie pobierane w NASTĘPNEJ turze; parytet gracz/AI/MP.

## 1. KONTROLA PROCEDURALNA — czy praca istnieje w Git (powód poprzedniej śmierci tematu)

`git fetch` wykonany. `origin/autobot/R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1` istnieje,
merge-base z `origin/main` = `8b6a64d0`. Commity ponad bazą (najstarszy → najnowszy):

| SHA (pełny) | Zawartość |
|---|---|
| `e9dda1c32052bc68f539f6fc4566fb7f50bce544` | **mechanika + UI** — `gra/src/game/economy-upkeep.ts`, `gra/src/ui/cityPanel.ts` |
| `5926a7040f5d55b50f1a02f45bd4a932752a2dbe` | bramka kontraktowa tematu + przepisany test AI/MP + wycofanie decyzji |
| `623b8bdcd535a9f277ce8367faf642ded575c198` | dowód w żywym Chromium + zrzuty |
| `6ac3485374a90c9bcc0d3000a5e70b20f782a5ec` | raport Operatora |
| `cc21da9f5c8f55ac1886fa34921cbfdf2bc0684c` | raport Evaluatora + jego dowody |
| `b0b72bcc…` (ten run) | niezależny pomiar Final Control (`dowody-fc-2026-08-26/`) |

**Zweryfikowane wprost, nie z raportu:** `git diff 8b6a64d0 cc21da9f -- gra/src/game/economy-upkeep.ts gra/src/ui/cityPanel.ts`
zwraca pełny, niepusty diff (usunięte `unitRecruitFullStockCost`, `canAffordUnitRecruitUpkeepReserve`,
`UNIT_RECRUIT_FULL_HINT`; `canAffordUnitRecruitStock` + `@deprecated` alias; UI liczy `unitStockCost`).
Zmiany są **w commitach**, nie w czyimś worktree. Mój worktree `/home/user/wt-fc-rekrutacja`
utworzony **z `origin/…`**, node_modules dowiązane z repo głównego.

Diffstat `8b6a64d0..cc21da9f`: 15 plików, +1362/−220. **Pliki spoza allowlisty: BRAK** —
`git diff --name-only … -- gra/src/main.ts gra/src/ui/buildModeHud.ts gra/data dyspozycje/WERSJE.md gra-robocza .git`
→ pusto. `main.ts` nietknięty dzięki aliasowi `canAffordUnitRecruitFull = canAffordUnitRecruitStock`.

**Próbny merge do dzisiejszego `origin/main` (`0ad2c20a`):** `git merge-tree --write-tree` → **rc=0**,
drzewo `bde3bb3a…`, **brak konfliktu**. `git diff --name-only 8b6a64d0 origin/main` nie zawiera
ani jednego pliku z allowlisty. **Konflikt z równoległym `R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1`
w `main.ts` jest niemożliwy konstrukcyjnie** — ten temat nie zmienia `main.ts` ani `buildModeHud.ts`.

## 2. KONTROLA MERYTORYCZNA — własny pomiar

Sonda FC napisana od zera: `dowody-fc-2026-08-26/fc-probe.cjs` (6 tur × 3 ownerów, prawdziwy
`advanceCityEconomy` + pobór 1:1 z `main.ts:26107-26120`). Uruchomiona na **bazie i na gałęzi**,
wynik jako JSON → `fc-probe-base.json`, `fc-probe-branch.json`, `fc-probe-base-vs-branch.diff`.

**(A) Czy robi to, o co prosi właściciel — TAK.** Ścieżką produkcyjną (`canAffordUnitRecruitFull`,
symbol faktycznie wołany w `main.ts:13014/13087/27485/28773`), Wojownik `{drewno:50}` + utrzymanie `{drewno:10}`:

| pula | baza | gałąź |
|---|---|---|
| 49 | false | **false** (bramka kosztu się nie rozbraja) |
| 50 | false | **true** |
| **57 (zrzut właściciela)** | **false**, hint „rekrutacja + utrzymanie 1 tura" | **true**, hint `null`, chip nieczerwony |
| 60 | true | true |

Arność bramki = 2 (brak `ownerId`); werdykty dla ownerów 0 / 4 / 31 identyczne → parytet gracz/AI/MP.

**(B) Czy NIE zepsuła poboru utrzymania — NIE zepsuła.** Ślad 6 tur po rekrutacji przy 57 Drewna
(pula 7), owner 0 = 4 = 31: `T1 nal={drewno:10} 7→0 niedobór={drewno:3}` · `T2–T6 nal={drewno:10}
0→0 niedobór={drewno:10}` (podłoga 0, brak ujemnej puli). Kontrola przeciwna bez jednostki: `{}`.
**Diff baza↔gałąź całej sondy: WYŁĄCZNIE werdykty bramki (10 linii). Każda liczba naliczenia,
poboru i niedoboru przez 6 tur × 3 ownerów jest bajt w bajt identyczna.**

**Mutacje FC (własne, każda cofnięta, drzewo czyste po każdej):**
- **FM1** bramka znów dolicza rezerwę → `recruitment-no-upkeep-gate` 36/0 → **28/8**,
  `ai-recruit-upkeep-gate` 23/0 → **21/2**, moja sonda odtwarza błąd właściciela (57 → `false`).
- **FM2** `totalUnitResourceUpkeep` → `{}` → 36/0 → **32/4**, a mój ślad wielotury **staje się płaski**
  (`nal={}`, 7→7). Dowód, że pobór na gałęzi jest żywy i że sonda jest na niego czuła.
- **FM3** bramka `return true` → 36/0 → **30/6**, `ai-recruit-upkeep-gate` → 21/2.

## 3. BRAMKI — własne uruchomienia, baza (`8b6a64d0`) → gałąź

| Bramka | baza | gałąź |
|---|---|---|
| `unit-stock-cost-test` | 41/**17 FAILED** | 41/**17 FAILED** — pre-istniejący drift ×1/×5, nie pogorszony, **nie naprawiony** |
| `unit-resource-upkeep-test` | 3/**4 FAILED** | 3/**4 FAILED** — j.w. |
| `ai-recruit-upkeep-gate-test` | 18/**9 FAILED** | **23/0** — ale plik **przepisany**; to **NIE** naprawa driftu, asercje ×1 zniknęły z wycofaną decyzją |
| `ai-prod-fallback-test` | 17/0 | 17/0 |
| `upkeep-test` | 73/0 | 73/0 |
| `ai-mp-rekrutacja-build-gate-test` | 21/0 | 21/0 |
| logic / tech-tree / research / unit-replace / combat | 213/213 · 19/0 · 33/33 · 13/13 · 6/6 | identycznie |
| `tsc --noEmit` | — | **exit 0** |
| vite build `--outDir /tmp/civ-dist-fc` | — | **OK, exit 0** |
| `recruitment-no-upkeep-gate-test` (nowa) | brak pliku | **36/0** |
| `recruit-card-stock-chip-real-render-test` (nowa, żywy Chromium) | brak pliku | **15/0** |

Baseline z dispatchu (18/9, 3/4, 41/17) **potwierdzony moim własnym uruchomieniem na bazie**.

## 4. Ocena not Evaluatora wobec §3b

| Nota | Klasyfikacja | Uzasadnienie |
|---|---|---|
| (1) test Chromium odtwarza 4-liniowe okablowanie `appendUnitRecruitCompactRow` zamiast je wołać | **KOSMETYCZNA** | Ograniczenie **jawnie zadeklarowane w nagłówku testu** (§13a), a nie przemilczane. Sprawdziłem odtworzenie linia po linii wobec `cityPanel.ts:7786-7806` — identyczne (`unitStockCost` → `missingStockFor` → `recruitOk` → `stockMissingLabel`). Sam predykat jest mutacyjnie udowodniony (FM1/FM3). Nie dotyka GOAL ani dowodu mechaniki. |
| (2) `ai-prod-fallback-test.cjs:271` — komentarz opisuje wycofaną decyzję („12 brąz: 10 + 2 rezerwa") | **KOSMETYCZNA** | Plik **nietknięty** przez temat (`git diff --name-only` pusto), bramka zielona 17/0. Nieaktualny komentarz, zero wpływu na zachowanie. **REJESTRUJĘ** do sprzątnięcia. |
| (3) nagłówek karty „Miecznik · Kamień" na zrzutach | **KOSMETYCZNA** | Etykietowanie w `unitRecruitCard.ts` — plik **poza allowlistą** tego tematu i przez niego niezmieniony. **REJESTRUJĘ jako osobne znalezisko**. |
| (4) dług: 5 wywołań `@deprecated` aliasu w `main.ts`; drift ×1/×5 | **KOSMETYCZNA / dług** | Alias jest **świadomą decyzją zakresową** chroniącą §2b (zero ruchu w `main.ts` przy równoległym temacie) i jest udokumentowany. Drift jawnie odnotowany, nie ukryty. |
| FC dodatkowo: `git diff --check` sygnalizuje trailing whitespace w `R-AI-RECRUIT-UPKEEP-GATE.md:3-4` | **KOSMETYCZNA** | To markdownowy twardy łamacz linii `  `, **obecny w tych samych liniach przed zmianą** — konwencja pliku, nie nowy defekt. |

**Żadna nota nie dotyka GOAL, dowodu, zakresu ani granic §9 → brak odesłania do Operatora.**

## 5. Kontrakt raportu

ZMIANY/COMMIT: gałąź `autobot/R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`, baza `8b6a64d0`, HEAD zweryfikowany `cc21da9f` + ten raport. Allowlista dotrzymana.
TESTY: tabela §3 — własne uruchomienia na bazie i gałęzi, 3 mutacje FC, sonda 6 tur × 3 ownerów.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree czysty wobec `0ad2c20a`), potem `READY_FOR_DEPLOY`.
DEPLOY/PUSH: **NIE WYKONANO** (wypchnięta wyłącznie gałąź tematu).

**GOTOWOŚĆ DO INTEGRACJI: TAK** — scenariusz właściciela (57 Drewna / koszt 50 / utrzymanie 10)
przechodzi, bramka kosztu się nie rozbraja (49 → nadal blokada), pobór utrzymania w następnej
turze udowodniony moim niezależnym pomiarem jako **bajt w bajt identyczny z bazą**, parytet
gracz/AI/MP owner-agnostyczny, bramki referencyjne zielone, trzy pre-istniejące czerwone
niepogorszone i jawnie opisane, allowlista i §9 dotrzymane, próbny merge do `origin/main` czysty.

**PRACA ZACOMMITOWANA NA GAŁĄŹ: TAK, SHA:** `e9dda1c3` (mechanika+UI) · `5926a704` · `623b8bdc` ·
`6ac34853` · `cc21da9f` · ten raport — wszystkie obecne na `origin/autobot/R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`.
