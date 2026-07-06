# Decyzje Macieja — indeks tematów (jeden czat = jeden temat)

> **Ekran zawsze w nazwie.** Nie używamy samych numerów D1–D15 w czacie — tylko ID tematu poniżej.
> **Stare „Q1–Q10”** = tylko **Grupa A** (mapa świata). **Grupa B** = panel miasta + ekonomia (B1–B5).
>
> **AKTUALNY KANON (2026-07-01):** `Gra-podglad.html` = `Gra-podglad-ROBOCZA.html` · md5 **`4602e752d7e4b21f3c2460e494e82a8f`**

---

## Legenda statusu

| Status | Znaczenie |
|--------|-----------|
| `OTWARTE` | Czat tematyczny aktywny, pytania do Macieja |
| `CZĘŚCIOWO` | Część decyzji zamknięta, reszta w pliku tematu |
| `ZAMKNIĘTE` | Decyzje w pliku — implementacja w tym czacie lub czeka `→ SILNIK` |
| `WPIĘTE` | Master Silnik zakończył wpięcie `main.ts` / kanon |
| `N/A` | Po v1.0 lub już rozstrzygnięte w archiwum |

---

## Grupa A — Mapa świata

**Fazy wykonania (w czacie tematycznym):** Grupa A = **F1** + **F2.1**, **F2.3**, **F2.4** (polish po v1.0).

| Faza | Zakres | Uwagi |
|------|--------|--------|
| **F1** | Grupa A — całość (fundament) | Render świata zaakceptowany (teren, miasta, surowce); baseline MAPA |
| **F2.1** | Grupa A — podbatch | Szczegóły w dyspozycji / paste |
| **F2.2** | **Grupa C — walka** (C1–C4; w tym skróty w bitwie) | UNITS + UI + SILNIK |
| **F2.3** | Grupa A — podbatch | Szczegóły w dyspozycji / paste |
| **F2.4** | Grupa A — podbatch | Szczegóły w dyspozycji / paste |

| ID | Czat w Cursor (propozycja tytułu) | Ekran | Plik decyzji | Status |
|----|-----------------------------------|-------|--------------|--------|
| **A1** | Civ — T-A1 HUD mapy | Mapa świata | `A1-hud-mapy.md` | **ZAMKNIĘTE dec.** · F-HUD |
| **A2** | Civ — T-A2 Jednostka na mapie | Mapa świata | `A2-jednostka-mapa.md` | **ZAMKNIĘTE** A2-Q4=A |
| **A3** | Civ — T-A3 Ruch i armie | Mapa świata | *(D6/D8 KARTA)* | CZĘŚCIOWO |
| **A4** | Civ — T-A4 Budowanie mapa | Mapa świata | `A4-D4-przeglad-ulepszen-terenu.md` | **ZAMKNIĘTE** 2026-06-27 |
| **A5** | Civ — T-A5 Wygląd mapy | Mapa świata | *(D12 KARTA)* | CZĘŚCIOWO |

## Grupa B — Miasto i ekonomia

| ID | Czat | Ekran | Co decydujesz | Było w „10” | Plik | Status |
|----|------|-------|---------------|-------------|------|--------|
| **B1** | Civ — T-B1 Panel budowa | Panel miasta | Produkcja, kolejka, budynki, worked tiles, ulepszanie | T5 | `B1-panel-budowa.md` | CZĘŚCIOWO — B1.1–B1.4 |
| **B2** | Civ — T-B2 Społeczeństwo | Panel miasta | Q3 per miasto, porządek, bunt, zdrowie, 3-koszyk | brak (T5/T6) | `B2-spoleczenstwo.md` | Q1–Q6 **ZAMKNIĘTE** · Q7–Q9 OTWARTE |
| **B3** | Civ — T-B3 Suwaki miasto | Panel miasta | Podatek 70/20/10, plaster D2, kupno, auto-zarządca | T5 + T6 | `B3-suwaki.md` | ZAMKNIĘTE |
| **B4** | Civ — T-B4 Wealth | Panel + HUD | D3, Wealth ≠ złoto; B4.1 kultura, B4.2 religia UI | T6 | `B4-wealth.md` | ZAMKNIĘTE + B4.1–B4.2 |
| **B5** | Civ — T-B5 Żywność | Panel + HUD mapy | Q1 hybryda; B5.1–B5.2 UI split | brak | `B5-zywnosc.md` | SPEC OK · B5.1–B5.2 |

**Kanon ulepszeń terenu (żywność + hodowla, 2026-06-29):** `KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md` — **ZAMKNIĘTE** · wdrożenie **F-FOOD-HODOWLA-01** (EKONOMIA+MAPA→Integrator)

Audyt + pytania: `docs/grupa-b/MACIEJ-PYTANIA-ABC.md` (format **1ABC–11ABC**) · hub: `docs/grupa-b/`

## Grupa C — Walka

**Faza wykonania (czat C2 + UNITS/UI):** **F2.2** — Grupa C po zamknięciu decyzji.

| Faza | Zakres | Tematy decyzyjne |
|------|--------|-------------------|
| **F2.2** | Walka end-to-end: wejście C1, UX C2 (w tym **skróty klawiszowe**), oblężenie C3, logika C4 | C1, C2, C3, C4 |

> **Trzy warstwy (nie mylić):** **A2** = wojsko na heksie strategicznym · **C1** = most (preBattle, „Pole bitwy”) · **C2** = wojsko na polu bitwy 3D · **C3** = oblężenie na mapie świata (przed C1) · **C4** = reguły (posiłki, katapulta, balans).

| ID | Czat | Ekran | Co decydujesz | Było w „10” | Plik | Status |
|----|------|-------|---------------|-------------|------|--------|
| **C1** | Civ — T-C1 Wejście w walkę | Mapa → overlay | Atak z mapy, preBattle (Q5), AUTO vs manual, deployment, skład z mapy | brak (T7/T8) | `C1-wejscie-walke.md` | **ZAMKNIĘTE** (2026-06-26) |
| **C2** | Civ — T-C2 UX bitwy | **Mapa bitwy** | Q2–Q7, minimapa w bitwie, roster, tooltipy — `Gra-podglad-BITWA.html` | T7 | `C2-ux-bitwy.md` | **ZAMKNIĘTE** (2026-06-26) |
| **C3** | Civ — T-C3 Oblężenie | Mapa świata | Blokada, garnizon, machiny, głód, kapitulacja — zanim scena bitwy | T8 (½) | `C3-obleczenie.md` | **ZAMKNIĘTE** (2026-06-27 · w kanonie `4602e752…`) |
| **C4** | Civ — T-C4 Zasady walki | Logika (oba ekrany) | Posiłki D8, katapulta D10, epoki machin, balans Excel — nie UI | T8 (½) | `C4-zasady-walki.md` | CZĘŚCIOWO (D8, D10) |

## Grupa D — Nauka, dyplomacja, cywilizacje

| ID | Czat | Ekran | Plik | Status |
|----|------|-------|------|--------|
| **D1** | Civ — T-D1 Nauka | Overlay | `D1-nauka.md` | **ZAMKNIĘTE** (1B, 2A) |
| **D2** | Civ — T-D2 Kultura idee | HUD/overlay | `D2-kultura.md` | **ZAMKNIĘTE** (3A) |
| **D3** | Civ — T-D3 Dyplomacja | Panel | `D3-dyplomacja.md` | **ZAMKNIĘTE** (4B; T1–T4 wcześniej) |
| **D4** | Civ — T-D4 Bonusy cyw | Dane | `D4-bonusy-cyw.md` | **ZAMKNIĘTE** (5A+B) |

## Grupa E — Meta

> **Katalog roboczy:** `docs/grupa-e/` (decyzje, audyt, handoff)

| ID | Czat | Ekran | Plik | Status |
|----|------|-------|------|--------|
| **E1** | Civ — T-E1 Nowa gra | Menu | `docs/grupa-e/decyzje/E1-nowa-gra.md` | CZĘŚCIOWO (Q9–Q12 OTWARTE) |
| **E2** | Civ — T-E2 AI zwycięstwo | Logika | `docs/grupa-e/decyzje/E2-ai-zwyciestwo.md` | OTWARTE |
| **E3** | Civ — T-E3 Surowce epoki | Mapa+dane | `docs/grupa-e/decyzje/E3-surowce-epoki.md` | CZĘŚCIOWO (D14) |

Audyt: `docs/grupa-e/AUDYT-2026-06-27.md`

---

## Trzy ekrany + most — nie mylić

| Warstwa | ID | Opis |
|---------|-----|------|
| **Mapa świata** | A1–A5, C3, część B | Jednostki na heksach, oblężenie, HUD |
| **Most wejścia** | **C1** | Overlay preBattle: Auto / **Pole bitwy** / Wycofaj |
| **Mapa bitwy 3D** | **C2** | `battleScene` — Q2–Q7, **≠ A2 Q4** |
| **Panel miasta** | B1–B5 | Produkcja, Wealth, suwaki |
| **Logika walki** | **C4** | Posiłki, katapulta, balans — bez UI |

```
A2 (heks strategiczny) → C1 (preBattle) → C2 (pole 3D)
C3 (obleżenie miasta) → … → C1 gdy szturm
```

---

## Mapowanie starych D1–D15 → tematy

| Stare | Temat |
|-------|-------|
| D1, D15, HUD Q1–Q3 | A1 |
| HUD Q4–Q10 | A2 |
| D6, D7 merge, D8 | A3, C4 |
| D4 | A4, B1 |
| D12 | A5 |
| D2 | B3 |
| D3 | B4 |
| Q1 żywność | B5 |
| Q3 zadowolenie | B2 |
| D5 | C1, C2 |
| D10 | C4 |
| D11 | D1 |
| D13 | E1 |
| D14 | E3 |

---

## Lane per temat (które działy wolno dotykać)

| ID | Lane'y | Wpięcie silnika |
|----|--------|-----------------|
| A1 | UI, MAPA | → SILNIK (hud w main) |
| A2 | UI, MAPA | → SILNIK jeśli hook w main |
| A3 | MAPA, UNITS, UI, CYWILIZACJE | część w temacie; hooki → SILNIK |
| A4 | MAPA, EKONOMIA | → SILNIK (buduj z mapy) |
| A5 | MAPA, CYWILIZACJE | render w temacie |
| B1–B5 | EKONOMIA, UI | pętla tury → SILNIK |
| C1 | UI, UNITS | → SILNIK |
| C2 | UI, UNITS | kanon → SILNIK |
| C3 | UNITS, EKONOMIA | → SILNIK |
| C4 | UNITS, CYWILIZACJE | logika w temacie |
| D1–D4 | UI, CYWILIZACJE, EKONOMIA | zależnie |
| E1–E3 | UI, MAPA, CYWILIZACJE, EKONOMIA | menu → SILNIK |
| F1 | UNITS, UI, MAPA | po v1.0 |
| F2.x | UI (+ UNITS F2.2) | po v1.0 |

---

## Po v1.0 (Grupa F)

| ID | Temat | Lane | Grupa czatu |
|----|--------|------|-------------|
| F1 | Panel armii TW | UNITS, UI, MAPA | A |
| F2.1 | Tooltipy HUD | UI, MAPA | A |
| F2.2 | Skróty bitwa | UI, UNITS | C |
| F2.3 | Zegar realny | UI | A |
| F2.4 | Narracja wydarzeń | UI, CYWILIZACJE | A |

---

## Otwarcie czatu tematycznego

1. **Charter grupy:** `docs/czaty/README.md` → plik dla zakładki (A–E)
2. **Wklej:** `docs/decyzje/DYSPOZYCJA-STALA.md` (z `<GRUPA CZATU>` + `<ID>`, lane, ekran)
3. Protokół: `docs/CZAT-TEMATYCZNY-PROTOKOL.md`
4. Pytania do **Master Silnika:** `docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md`
5. Hub: **Czat 2 — Master Silnik** → `weryfikuj` / `pytania <ID>`

HUD mapy (Q1–Q10): `docs/MACIEJ-DECYZJE-HUD-MAPA-Q1-Q10.md`
