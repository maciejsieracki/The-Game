# Master Silnik — routing po analizie czatów (2026-06-27)

> **⚠️ ARCHIWUM** — zastąpione przez `docs/czaty/SCHEMAT-DWIE-WERSJE.md` + `OD-MASTERA` § F.  
> Nie używać blokad sign-off D1B — ABC1=A zamknięte. TEST → ROBOCZA.

> Źródło historyczne: `DO-MASTERA.md` § A–F + lane raporty.

---

## Podsumowanie stanu lane

| Grupa / lane | Co dostarczyli | Flaga |
|--------------|----------------|-------|
| **A** | Mockupy D1B P0+P1, mapa kliknięć, revA, A1-Q5–Q9 decyzje | **CZEKA** sign-off D1B → potem F `hud.ts` |
| **B** | B2 UI panel (Q1–Q3 Maciej; Q4/Q5 prowizoryjnie) | **→ F** haki `main.ts` |
| **C** | C2 **ZAMKNIĘTE** Q2–Q7; C1 `preBattle.ts` TW | **→ F** C1 wpiecie + C2 map-click BattleScene |
| **D** | D4-RDY01 delegacja bonusów | **→ F** wiązania; **→ Master** rozdanie lane |
| **E** | E1 UI+MAPA + F generujSwiat | **→ F** bramka P0 |
| **F** | F1/F2/F-A2 kod | **→ F** bramka → TEST |

---

## Grupa F — kolejka (tylko `main.ts` + bramka)

| Batch | ID | Temat | Handoff | Blokada |
|-------|-----|-------|---------|---------|
| **P0** | F-BRAMKA | typecheck + testy + `Gra-podglad-TEST.html` | `bramka-test-publish.ps1` | Node lokalnie |
| **P1** | F-B2 | `getOrderState`, `getCityHealth` w `configureCityPanel` ×2 | `UI-do-MASTER_B2-spoleczenstwo.md` | Q4/Q5 prowizoryjne — OK do wpięcia |
| **P1** | F-C1 | `onSave`, `deploy:true`, map-click → `BattleScene` | `C1-do-SILNIK_preBattle-wpiecie.md` | Q2b–Q5 prowizoryjne — Maciej może wycofać |
| **P1** | F-C2 | `BattleScene({ deploy: true })` w testowej ścieżce T + mapa | `UNITS-DO-MASTERA` C2 zamknięte | **ODBLOKOWANE** (C2 pełne ABC) |
| **P2** | F-D4 | Audyt `civBonusyForOwnerId` / przekazanie do combat | `CYWILIZACJE-do-MASTER_bonusy-RDY01-delegacja.md` | tylko wiązanie, nie nowa logika |
| **—** | F-HUD | `hud.ts`, WYKONAJ gate, side panel | handoffy A1-Q5/8/9 | **BLOK** do sign-off D1B |
| **—** | F-B5 | `advanceEmpireFood` | EKONOMIA SPEC | **BLOK** stub throws |

---

## Master Silnik — kolejka (orkiestracja, bez `main.ts`)

| # | Zadanie | Dlaczego Master |
|---|---------|-----------------|
| M1 | Po GOTOWE-TEST → `OPUS-REVIEW-QUEUE` + promocja kanonu | flow stały |
| M2 | **Maciej:** potwierdź B2-Q4=C, B2-Q5=A, C1 Q2b–Q5 prowizoryjne | wycofanie bez kodu |
| M3 | **Maciej:** sign-off `MACIEJ-HUD-CHECKLIST-D1B.md` | odblokuje F-HUD |
| M4 | D4-RDY01: dopisać dyspozycje w `UNITS.md` / `UI.md` (bitwa 3D bonusy, tooltips) | delegacja lane |
| M5 | Grupa A: chip bunt B2-Q5 | `UI-do-GRUPA-A_B2-Q5-bunt-chip.md` |
| M6 | `STATUS.md` + `DZIENNIK` po każdym batchu F | dashboard |
| M7 | A1-Q11, A1-Q12a/b — **nie** nowe ABC; czekają Macieja | gameplay only |

---

## Decyzje Mastera (sesja 2026-06-27)

1. **C2 odblokowane dla F** — wszystkie C2-Q2…Q7 zamknięte w `DO-MASTERA`; backlog F aktualizowany.
2. **B2 i C1 idą do F przed HUD** — UI lane gotowe; nie czekamy na D1B.
3. **Bramka P0 blokuje Opus** — bez `Gra-podglad-TEST.html` brak kanonu.
4. **Prowizoryczne decyzje agentów** — wpięcie dozwolone; Maciej może wycofać decyzją, nie revertem kodu (chyba że BLOCK Opus).

---

## Wycofanie routingu

Usuń ten plik + przywróć C2 w `GRUPA-F-BACKLOG` BLOKADY jeśli Maciej odrzuci D5/C2.
