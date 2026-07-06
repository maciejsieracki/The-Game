# UI → MASTER: blockery otwarte (2026-07-05)

**Status:** OTWARTE — poza batch publish ROBOCZA  
**Powiązany handoff:** `UI-do-MASTER_publish-robocza-2026-07-05.md` §4  
**Inwentarz:** `dyspozycje/UI-INVENTORY-DESIGN-vs-GRA.md` §B + §C

Maciej pytał o te ekrany (screenshot ~23:05). **Nie weszły** — poniżej dlaczego i kto domyka.

---

## Tabela routing (Master)

| Priorytet | Temat | Bloker | Następny krok | Plik |
|-----------|-------|--------|---------------|------|
| P0 | Panel budowy A-08 | Brak mockup Design · lane nieportował `buildModeHud.ts` | Design START → lane port | `WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md` · `DESIGN-BRIEF-A08` |
| P0 | Panel heksu HEX-C1 | Brak mockup C1 · tylko provizorka lane | Design START → lane port | `DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md` |
| P0 | Panel Moc IMP-01 | Brak mockupu | Design START | `MASTER-do-UI_panel-moc-i-imperium.md` · `WKLEJKA-DESIGN-P0-IMP-MOC-C23-2026-07-05.md` |
| P0 | C23 Szczegóły bitwy | Brak mockupu v1 | Design START | j.w. |
| P0 | C12 Koniec v3 | W repo tylko v2 mockup | Design START v3 | `DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md` |
| P0 | W4 Rekrutacja 1:1 | Mockup jest · lane nie zrobił | **Lane UI batch 2** (bez Design) | `Miasto Zakładki W4 v2 (1E).dc.html` · `cityPanel.ts` rekrutacja |

---

## Wina lane (do wiadomości Mastera)

1. **A-08 + HEX** — briefy od 07-03/05 bez formalnego START w `WYMIANA` (naprawione 2026-07-05).
2. **W4 rekrutacja** — lane zrobił Handel/Buduj/karty B, **pominął** rekrutację i wnętrza zakładek.
3. **Moc/C23/C12** — lane napisał wklejki do Design, **nie** przekazał Masterowi jako osobny routing do czasu dziś.

---

## Co Master robi z tym plikiem

1. **Nie** oczekuj tych ekranów po publish robocza.
2. **Design P0:** wklejki w `docs/ux/WKLEJKA-DESIGN-*.md` (Maciej lub Master trigger).
3. **Lane batch 2:** po Design zip — dyspozycja w `dyspozycje/UI.md` (W4 rekrutacja może iść równolegle bez Design).
4. Dopisz w `DZIENNIK-MASTERA.md` gdy Design/lane zamkną każdy wiersz.

**Flaga zamknięcia batch blockers:** `→ MASTER: UI-blockery routing OK`
