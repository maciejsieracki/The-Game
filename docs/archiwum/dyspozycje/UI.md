# DYSPOZYCJA UI — suwaki Handlu + Wealth panel (1A, 4A)

**Data:** 2026-06-26. **Decyzje Macieja:** 1A, 4A. **NIE ruszać:** `main.ts`, `hud.ts`, minimapa (Q5 → czat MAPA).

## Cel

1. **Podział Handlu** — żywe suwaki (Skarbiec / Nauka / Społeczeństwo) w `cityPanel.ts`; suma = 100%; callback `onPodzialHandluChange(cityId, { procentPieniadz, procentNauka, procentLuksus })`.
2. **Wealth** — pełny blok: poziom W, pula luksusu, próg następnego W, mnożnik Skarbca, wpływ na szczęście (czytaj z `city.wealthState` + tick jeśli dostępny).
3. **Produkcja plaster-ready:** użyj `buildableProduction` zamiast `availableProduction` dla listy budynków; sekcja „Kup jednostkę" z `purchasableUnits` + callback `onPurchaseUnit(cityId, itemId, koszt)`.

## Kontrakt handoff

Plik: `dyspozycje/_handoff/UI-do-MASTER_wealth-suwaki.md` — API callbacków, pola City oczekiwane od EKONOMII.

## DoD

- [ ] Suwaki działają wizualnie; zmiana wywołuje callback (MASTER wpina zapis na City).
- [ ] Wealth panel pokazuje realne dane gdy `wealthState` jest na mieście.
- [ ] `buildableProduction` / `purchasableUnits` w UI (bez logiki skarbca — tylko UI + callback).
- [ ] Backup: `cityPanel.ts.bak-UI-2026-06-26`.
- [ ] Meldunek append w `UI-DO-MASTERA.md`.

## STAN

Czytaj `UI-STAN.md` jeśli istnieje.

---

## DO ZROBIENIA TERAZ

**[2026-06-29] SILNIK = router lane** — manifest `SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md`. Czat **Grupa E** (menu) lub **Grupa A** (HUD mapy) → `start`.

**[2026-06-28] MACIEJ → UI (przekazuje SILNIK) — WYKONAJ TERAZ**

**Od Macieja:** to **Twoja** robota, nie SILNIK. W czacie **Grupa E** (menu S0) napisz **`start`**.

| Priorytet | ID | Temat | Handoff |
|-----------|-----|-------|---------|
| **P0** | **E-P0-01…03** | Menu S0 · Kampania Wkrótce · wideo (5=C, 6=A, 7=A) | `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` |

**Manifest Macieja:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`  
**Po GOTOWE:** `UI-DO-MASTERA.md` + flaga `→ SILNIK: GOTOWE` · **NIE** `main.ts`

---

**[2026-06-28] MASTER → UI: PILNE (HUD D1B w silniku ✅ — Grupa E menu)**

| Priorytet | ID | Akcja | Handoff |
|-----------|-----|-------|---------|
| **P0 TERAZ** | **E-P0-01** | Menu S0 hybryda (5=C) | `_handoff/GRUPA-E-do-UI_menu-S0-5C.md` |
| **P0** | **E-P0-02/03** | Kampania Wkrótce + wideo tło menu | ten sam pakiet E-P0-01 |
| **P1** | **P0-D4** | preBattle — bonusy cyw (D4-Q3=A) | `_handoff/CYWILIZACJE-do-UI_bonusy-wyswietlanie.md` | **✅ DONE lane** → `UI-do-INTEGRATOR_preBattle-bonusy-P0-D4.md` |

| **P1** | **UI-P1-02** | Panel jednostki A2 — weryfikacja vs mockup (A2-Q4=A) | po E-P0-01 |

**WPIETE przez SILNIK (nie powtarzaj):** ABC1=A HUD D1B · F2 minimapa · dyplomacja D3-Q1 · E1-UX-02 kreator.

**Trigger:** `start` → E-P0-01 → meldunek `UI-DO-MASTERA.md` → `→ SILNIK: GOTOWE`.

**NIE ruszaj `main.ts` / `hud.ts` bez handoffu od SILNIK.**

---

**[2026-06-27] E1-UX-02 — Jakość mapy w kreatorze (krok 4) · Maciej**

Handoff: `dyspozycje/_handoff/MASTER-do-UI_kreator-jakosc-mapy.md`  
**WPIETE (MASTER):** `newGameFlow.ts` + `ui-params.json` + `main.ts` · decyzja **B** zaawansowane.  
**SILNIK:** batch `MASTER-do-SILNIK_batch-potwierdzone-2026-06-27.md` — build ROBOCZA + playtest.

---

**[2026-06-27] P0 — Grupa D (pilne)**

**[P0-D4] preBattle — wyświetlanie bonusów cyw (D4-Q3=A)**

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-UI_bonusy-wyswietlanie.md`

| AC | Plik |
|----|------|
| Sekcja bonusów atakujący/obrońca z `bonusy[].opis` | `gra/src/ui/preBattle.ts` |
| Hook `getCivBonusy(ownerId)` z config (SILNIK dostarczy) | typ w interfejsie preBattle |

**NIE ruszaj `main.ts`.** Meldunek: `UI-DO-MASTERA.md`.

**[P0-D3] Dyplomacja + drzewko — WPIETE (batch SILNIK P0-04)**

- `diplomacyPanel.ts` — modal wojny + `pre_contact` badge ✅
- SILNIK: callbacks + kontakt D-START-3A ✅ (`Gra-podglad-ROBOCZA.html`)

**Następne lane UI:** E-P0-01…03 (menu S0) · HUD-S2…S6 · P0-D4 preBattle bonusy.

---

## [2026-06-27] P0/P1 — Backlog pilny (audyt Macieja)

**Backlog:** `dyspozycje/_handoff/MASTER-do-SILNIK_backlog-pilne-2026-06-27.md`

| ID | Priorytet | Co | Pliki | Handoff |
|----|-----------|-----|-------|---------|
| **HUD-S2** | P0 | Dyplomacja blocking (inbox obowiązkowy) | `hud.ts`, `diplomacyPanel.ts` | API inbox od CYW — potem SILNIK wpina |
| **HUD-S3…S6** | P0 | D1B pełny HUD (Power, overlay kult/rel, żywność) | `hud.ts`, `sidePanel` | `MASTER-do-UI_HUD-D1B-domkniecie.md` |
| **HUD-S7** | P0 | Opus sign-off → kanon | — | po S3…S6 |

**NIE ruszaj `main.ts` (wpina SILNIK).** Meldunek: `UI-DO-MASTERA.md`.

---

## [2026-06-27] § PILNE — kolejka Macieja (skrót)

**Pełna lista:** `dyspozycje/PILNE-KOLEJKA-2026-06-27.md`

| ID | Status |
|----|--------|
| UI-P1-01 D3-Q1 modal | **✅ GOTOWE** |
| UI-P1-02 panel jednostki | **DO ZROBIENIA** |
| UI-P1-03 HUD wnętrza | **BACKLOG v1.1** |
| HUD-S2…S6 | patrz backlog powyżej |
