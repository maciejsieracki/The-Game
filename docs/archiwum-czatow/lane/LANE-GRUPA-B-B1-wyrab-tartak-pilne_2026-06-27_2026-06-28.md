# LANE-GRUPA-B-B1-wyrab-tartak-pilne_2026-06-27_2026-06-28

## Metadane

| Pole | Wartość |
|------|---------|
| **Rola** | LANE-GRUPA-B (EKONOMIA + MAPA + UI) |
| **Temat czatu** | Pilne luki · Wyrąb/Tartak B1 · tech gate · audyt lane |
| **Data sesji** | 2026-06-27 → 2026-06-28 |
| **Pełna korespondencja** | `docs/archiwum-czatow/eksport-pelny/GRUPA-B_KORESPONDENCJA.md` |
| **Chat ID** | `a28467c6-7830-4ab8-bdf3-d1343dacedcc` |
| **Powiązane pliki** | `docs/decyzje/B1-wyrab-tartak-tech.md`, `docs/decyzje/B1-tech-ABC-OTWARTE.md`, `dyspozycje/GRUPA-B-ZADANIA-PILNE.md` |

---

## Podsumowanie sesji

- **Pilne luki (F-B-PILNE):** lane dostarczył `resource-access.ts`, `society-inputs.ts`, `army-starvation.ts`, fix `cityPanel.ts` → handoff Silnika.
- **Wyrąb vs Tartak (B1):** wyrąb = wycinka FREE (+20P×3, usuwa las); tartak = ulepszenie płatne, tech **Obróbka drewna**, tech gate w panelu Budowa.
- **Korekta Maciej:** tartak na **lesie** — las **zostaje**; wyrąb usuwa las.
- **Korekta Maciej:** tartak **+3 Pracy** / turę; drewno = **tylko dostęp** boolean (v0.1 bez magazynu) — Excel + JSON zsynchronizowane.
- **Lane → Silnik:** 3 batche handoff: `F-B-PILNE`, `F-B-WYRAB-TARTAK`, `F-B-TARTAK-DREWNO` (+ UNITS starvation).
- **Analiza drzewka tech ↔ ulepszenia** — propozycja Q1–Q5; **BLOK** na decyzję Macieja (`B1-tech-ABC-OTWARTE.md`).
- **Wielokrotny audyt lane:** wszystko w scope Grupy B **zrobione i przekazane**; poza scope → CYWILIZACJE / UI / MAPA / UNITS (P1).
- **Testy lane:** `grupa-b-lane-test.cjs` — 27 pass.

---

## Decyzje ABC (Maciej)

| ID / temat | Ustalenie | Status lane |
|------------|-----------|-------------|
| **B1 Wyrąb** | FREE, wycinka lasu, +60 Pracy temp., bez drewna | ✅ JSON + handoff |
| **B1 Tartak** | 25P, tech Obróbka drewna, na lądzie i lesie | ✅ |
| **B1 Tartak bonus** | +3 Pracy; drewno = dostęp (nie ilość) | ✅ Excel/JSON/`resource-access.ts` |
| **Tech gate** | szare ulepszenia bez badań | ✅ `improvement-tech.ts` + UI |
| **Q1–Q5 drzewko tech** | — | ⏸ czeka Maciej |

---

## Handoffy → Silnik (lane GOTOWE)

| Batch | Plik |
|-------|------|
| F-B-PILNE | `dyspozycje/_handoff/EKONOMIA+UI-do-SILNIK_PILNE-luki-2026-06-27.md` |
| F-B-WYRAB-TARTAK | `dyspozycje/_handoff/MAPA+EKONOMIA-do-SILNIK_wyrab-tartak-tech.md` |
| F-B-TARTAK-DREWNO | `dyspozycje/_handoff/EKONOMIA-do-SILNIK_tartak-drewno-access.md` |
| UNITS −8% HP | `dyspozycje/_handoff/UNITS-do-SILNIK_army-starvation-hp.md` |

Flagi: `docs/czaty/DO-MASTERA.md`, `dyspozycje/F-KOLEJKA-P0.md`, `dyspozycje/EKONOMIA-DO-MASTERA.md`.

---

## NIE dotyczy lane B (routing)

| Temat | Owner |
|-------|-------|
| Wpięcie `main.ts` | Silnik (F) |
| `tech.json` Rolnictwo/Łowiectwo, sync aliasów | CYWILIZACJE (+ EKONOMIA po ABC) |
| P1: mockup MIASTO, layout Civ V | UI |
| P1: ownCultureShare z mapy | MAPA + Silnik |
| P1: save/load HP | UNITS + Silnik |

---

## Następne kroki

1. **Maciej:** Q1–Q5 w `docs/decyzje/B1-tech-ABC-OTWARTE.md` (opcjonalnie).
2. **Silnik:** batche F-B-* według `F-KOLEJKA-P0.md` (lane już przekazał).
3. **Playtest ROBOCZA:** checklist w `DO-MASTERA.md` § 2026-06-28.

---

## Eksport pełny

Pełna korespondencja 1:1 (automatyczny sync, bez ręcznego Export UI):

→ **`docs/archiwum-czatow/eksport-pelny/GRUPA-B_KORESPONDENCJA.md`**

Ostatni sync sesji: 2026-06-28 (delta).
