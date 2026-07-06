# Jednostki i surowce — roadmap v1.0 → v2.0

**Decydent:** Maciej · **2026-06-29**  
**Status:** krok 1 🟢 WDROŻONY · kroki 2–3 🟡 ZAPISANE (v2.0)

---

## Krok 1 — v1.0 (teraz): styl Civ

- Rekrutacja jednostek = **💰 ze skarbca + ludność + tech** (tech już działa jako bramka odblokowania).
- Pola `Surowiec` / `Surowiec (ilość)` w `units.json` i Panel-C = **tylko referencja**, silnik **nie** pobiera surowców przy rekrutacji.
- Potwierdza decyzję 2026-06-25 (`production.ts`, handoff `EKONOMIA-do-MASTER_koszt-jednostek.md`).

---

## Krok 2 — v2.0 (następny): bramka dostępu

**Cywilizacja musi mieć dostęp do technologii LUB surowca**, żeby móc produkować daną jednostkę.

| Element | Intencja |
|---------|----------|
| **Tech** | Już częściowo (pole `Tech` w units.json) — utrzymać i doprecyzować. |
| **Surowiec (dostęp)** | Miasto / państwo musi **mieć dostęp** do wymaganego surowca (zasięg, ulepszenie, handel?) — **bez** jeszcze pełnego odejmowania zapasów przy rekrutacji. |
| **UI** | Jednostka niedostępna / wyszarzona + powód („brak Brązu w zasięgu”, „wymaga Łucznictwa”). |

**Lane:** głównie **B (EKONOMIA)** + **D (dane)** + wpięcie **F (Integrator)**.  
**Nie v1.0** — dopiero po zamknięciu bieżącego sprintu grywalności.

---

## Krok 3 — v2.0 (pełna polityka): koszty + produkcja + magazyn

- **Wlecenie surowców** w koszt jednostek **i budynków** (odejmowanie z zapasów przy produkcji).
- **Produkcja surowców** (pola, ulepszenia, łańcuch przetwórczy — spójnie z modelem dostępu v0.1).
- **Magazynowanie surowców** (pojemność, skarbiec państwa / magazyny, limity).

**Lane:** **B + A (mapa/złoża)** + **D (resources.json)** + **F**.  
**Zależność:** sensownie **po kroku 2** (najpierw „masz dostęp”, potem „płacisz z zapasów”).

---

## Powiązania

- Model dostępu surowców (budynki): `EKONOMIA-analiza-surowce-budynki.md` (MODEL DOSTĘPU v0.1, 2026-06-25).
- Panel-C / Panel-B: koszty jednostek i budynków — dane gotowe częściowo; egzekucja = krok 3.
- ID rejestru: **JEDN-KOSZT-v1** (krok 1) · **JEDN-KOSZT-v2-gate** (krok 2) · **JEDN-KOSZT-v2-full** (krok 3).

---

## Nie pytać ponownie (v1.0)

Czy jednostki kosztują drewno/brąz **teraz** — **nie** (krok 1 zamknięty).
