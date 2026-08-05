# R-WIARYGODNOSC — audyt open vs deployed (AutoBot OPERATOR)

**Data:** 2026-08-05  
**Branch audytu:** `cursor/wiarygodnosc-audit-63a1`  
**Źródła:** `docs/decyzje/*WIAR*` · `dyspozycje/WERSJE.md` FALA WIAR · `gra/src/**` · `gra/tools/wiarygodnosc-test.cjs`  
**Bez deployu.**

---

## Werdykt

| Kategoria | Wynik |
|-----------|--------|
| **Rdzeń mechanizmu (§1–§6, dźwignie 1/3/4)** | **ZDEPLOYOWANE** — ROBOCZA od FALA 19 przez 206, domknięcie R1/R1b/UI FALA 233–237 |
| **Decyzje ABC produktowe (§9 paczka 2026-07-26)** | **ZAMKNIĘTE** — wszystkie 10 punktów ma cytat/decyzję w `WIARYGODNOSC-SPECYFIKACJA.md` §9 „ODPOWIEDZIANE" |
| **Otwarte ABC do Macieja** | **0** — nie tworzymy `R-WIARYGODNOSC-OPEN-ABC.md` |
| **Backlog wdrożeniowy (nie ABC)** | 2 pozycje — patrz §Backlog |

**Rejestr:** `R-WIARYGODNOSC` → status **ZDEPLOYOWANE / WDROŻONE** (FALA 19, 21, 36, 111, 206, 213, 233–237).

---

## ZDEPLOYOWANE (kod + ROBOCZA)

### FALE (WERSJE.md)

| FALA | md5 (label) | Zakres WIAR |
|------|-------------|-------------|
| **19** | `ce54be5b` | Etapy 2–4 silnik: rejestr zdarzeń, strumień, save/load |
| **21** | `3e847677` | Dźwignia 2 (później wycofana decyzją A, 2026-08-03) |
| **36** | `a74c3797` | C-WIAR-D4, C-WIAR-N1-UX, C-WIAR-N4-AI |
| **111** | `e5c1bbed` | D-WIAR-KASKADA-Q1=B |
| **206** | `1c7e9df7` | D3 progi W, tempo WIAR-Q3=C, usunięcie Dźwigni 2, dryf przygotowany |
| **213** | `1d3b8755` | REL-WIARYG-DRIFT-Q1 (ΔZ = W×0,03/turę) |
| **233** | `06712ea4` | Etap 0 typy + przegląd Dźwigni 2–4 (docs) |
| **234** | `7d86fa19` | **R1** — `applyWiarygodnoscTempoDoDelty` w `computeTickZaufanieDelta` |
| **235** | `9c0a38ae` | **R1b** — ten sam mnożnik w `applyDiplomaticEvent` / `applyDiploEventTracked` |
| **236** | `03a19191` | UI §4/§7 — `rozbicieWiarygodnosci`, tooltip życiorys vs bieżące |
| **237** | `5b0e1c19` | UI §7 — badge `W ±N · pasmo`, kolumna W w rankingu Potęgi |

Aktualna ROBOCZA (2026-08-05): **FALA 247** `540d2490` — zawiera wszystkie powyższe (łańcuch zastąpień).

### Decyzje (docs/decyzje)

| ID | Status | Dowód kodu |
|----|--------|------------|
| C-WIAR-D4 | WDROŻONA | `applyWiarygodnoscD4ToRelation`, `diplomacy-layers.ts` |
| C-WIAR-N1-UX | WDROŻONA | `showWarConsentModal`, `withPlayerWarConsent` |
| C-WIAR-N4-AI | WDROŻONA | `shouldHonorAllianceWarObligation`, `ai.ts` |
| D-WIAR-KASKADA-Q1 | WDROŻONA | `isDefensiveAllianceWarObligation`, `chargeWarDeclarationCredibility` |
| REL-WIARYG-DRIFT-Q1 | WDROŻONA | `zaufanieDryfOdWiarygodnosci` w `computeTickZaufanieDelta` |
| R-WIARYGODNOSC-DZWIGNIA2 | ZAMKNIĘTE (A) | flat `max_zaufanie_na_ture=5` |
| R-WIARYGODNOSC-D3-PROGI | ZAMKNIĘTE | `evaluateProposal` nap/sojusz + `wiarygodnoscProg*` |
| R-WIARYGODNOSC-TEMPO | WDROŻONE R1+R1b | `diplomacy-credibility.ts`, `diplomacy.ts`, `main.ts` |
| R-WIARYGODNOSC-ETAP0 | ZAMKNIĘTE | `wiarygodnosc-types.ts` |
| R-WIARYGODNOSC-DZWIGNIE-2-4-PRZEGLAD | ZAMKNIĘTE | R1–R4 ✅ w tabeli rekomendacji |

### Haków silnika (§8 spec — stan kodu 2026-08-05)

| Obszar | Kod | Plik / funkcja |
|--------|-----|----------------|
| N1–N7 kary | ✅ | `chargeWarDeclarationCredibility`, `appendWiarygodnoscEvent`, `main.ts` |
| S1–S4 strumień | ✅ | `wiarygodnoscStrumienByOwner`, `tickCredibilityStreamEntry` |
| P1–P3 finisz | ✅ | `runDiplomacyTurnTick` — dotrwanie sojusz/NAP/handel |
| P4 bez wojny 30 tur | ✅ | `tickWiarygodnoscP4Milestones` (globalnie, §9.3=A) |
| P5 pomoc sojusznikowi | ✅ | `applyAllianceObligationsOnWar` |
| D1 tempo + dryf | ✅ | `applyWiarygodnoscTempoDoDelty`, `zaufanieDryfOdWiarygodnosci` |
| D3 progi | ✅ | `diplomacy-proposals.ts` |
| D4 pierwszy kontakt | ✅ | `applyWiarygodnoscD4ToRelation` |
| Save/load | ✅ | `meta.wiarygodnoscZdarzeniaByOwner`, `wiarygodnoscStrumienByOwner` |
| UI badge + ranking | ✅ | `diplomacy-display.ts`, `powerOverlayHud.ts`, `diplomacyAudience.ts` |
| Testy | ✅ | `wiarygodnosc-test.cjs` — **146/146 PASS** |

**Uwaga:** Tabela §8 w `WIARYGODNOSC-SPECYFIKACJA.md` jest **STALE** (snapshot sprzed FALA 19+). Obowiązuje ten audyt + `R-WIARYGODNOSC-DZWIGNIE-2-4-PRZEGLAD.md`.

---

## NIE czeka na ABC (zamknięte wcześniej)

Sekcja „Nadal nierozstrzygnięte" w spec §9 (punkty 1–10) **duplikuje** decyzje z bloku „ODPOWIEDZIANE 2026-07-26" — **nie traktować jako otwartych ABC**:

| Stary §9 punkt | Decyzja (już zapisana) |
|----------------|------------------------|
| Kumulacja strumienia | §9.2 = **C** bez limitu |
| P4 globalnie vs per para | §9.3 = **A** globalnie |
| Strumień pozytywny w wojnie | §9.4 = **A** działa normalnie |
| NAP terminowy/bezterminowy | §9.1 = **oba warianty** (implementacja — patrz backlog) |
| Kumulacja śladów | §9.6 = **A** bez limitu |
| Dźwignie 2–4 przegląd | §9.5 = **C** — wykonany (R1–R4) |
| Sufit Zaufania skrajny | §9.7 = **A** proste przycięcie 0–100 |
| Zaokrąglanie / odświeżanie W | §9.8–§9.9 = decyzje techniczne integratora |
| Bramka 2 Dźwigni 3 | §9.10 = **A** NAP (nie Wasal/Trybut) — R3 ZAMKNIĘTE |

---

## Backlog wdrożeniowy (nie blokuje statusu ZDEPLOYOWANE)

| ID roboczy | Opis | Typ | Blokuje grę? |
|------------|------|-----|--------------|
| **WIAR-NAP-IMP** | §9.1 zatwierdzone: wybór NAP **terminowy (10–20 tur)** lub **bezterminowy** przy zawieraniu. Kod: `diplomacy-proposals.ts` case `'nap'` zawsze `clamp(turns, 10, 20)` — brak gałęzi `wygasaTura: null`. | Implementacja po decyzji | Nie — NAP terminowy działa |
| **WIAR-UI-REJESTR** | ✅ **WDROŻONE** (`buildWiarygodnoscBreakdown` + rejestr w audiencji gracza, sekcja Reputacja). Per-zdarzenie + strumień S1–S4; tooltip życiorys/bieżące bez zmian. | UI | Nie |

**Strojenie liczb** (wagi N*, S*, czasy zapominania) — temat **post-playtest**, nie ABC; parametry w `diplomacy.json` / `DIPLOMACY_PARAMS`.

---

## Czekające ID (dla raportu)

**Otwarte ABC:** — (brak)

**Backlog (nie ABC):** `WIAR-NAP-IMP`

**Zamknięte / wdrożone:** `WIAR-UI-REJESTR` · `C-WIAR-D4` · `C-WIAR-N1-UX` · `C-WIAR-N4-AI` · `D-WIAR-KASKADA-Q1` · `REL-WIARYG-DRIFT-Q1` · `R-WIARYGODNOSC-D3` · `R-WIARYGODNOSC-DZWIGNIA2` · `R-WIARYGODNOSC-TEMPO` (R1/R1b) · `R-WIARYGODNOSC-ETAP0` · przegląd R1–R4
