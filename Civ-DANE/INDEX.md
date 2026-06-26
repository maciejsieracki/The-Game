# Civ-DANE — indeks plików (cywilizacje / dane)

Katalog sesji **Civ-DANE** (dane cywilizacji + religie). Ścieżki podane względem korzenia projektu Civ. Utworzony: 2026-06-24.

## W tym katalogu (przeniesione tutaj)
- **`DOKUMENTACJA-DANE-cywilizacje.md`** — pełna dokumentacja deweloperska modułu (zakres, pipeline Excel→JSON, schemat `civs.json`, roster 9 typów, religia, system jednostek, control panel, reguły R1–R15, zależności, interakcje z działami, historia decyzji).
- **`PACZKA-DLA-UNITS-od-DANE.md`** — handoff (kierunek historyczny jednostek) dla sesji „Civ - Units / Battle".
- **`Jednostki-specjalne-przeglad.xlsx`** — przegląd jednostek specjalnych per epoka (Kamień/Brąz/Żelazo) + propozycje Żelaza, z kolumną „W zamian za".

## MUSZĄ zostać poza tym katalogiem (NIE przenosić — z powodem)
- **`../Cywilizacje.xlsx`** — ŹRÓDŁO PRAWDY / control panel → eksport do `civs.json`. Zostaje w korzeniu: konwencja „wszystkie źródłowe Excele w korzeniu" + wspólny (przyszły) pipeline `export-data.py`.
- **`../gra/data/civs.json`** — PLIK GRY (importowany przez `src/data/loader.ts` po ścieżce). Przeniesienie psuje build.
- **`../dyspozycje/DANE.md`** — skrzynka (wsad od mastera); czyta ją scheduled task `civ-dane-self-check` co 10 min po STAŁEJ ścieżce.
- **`../dyspozycje/DANE-DO-MASTERA.md`** — kanał raportów/Q&A do mastera.
- **`../Spoleczenstwo-parametry.xlsx`** — WSPÓŁDZIELONY (society/SILNIK); moja jest tylko zakładka „Religie cywilizacji" → `society-params.json`.

## Powiązane — inny lane (nie ruszam, tylko sygnalizuję)
- **`../DESIGN-cywilizacje-spawn.md`** — design roster + spawn; spawn należy do **Civ-MAPA**. Częściowo NIEAKTUALNY (mówi „7 typów, rozważane +2"; finalnie **9**). Część „roster" jest opisana pełniej i aktualnie w `DOKUMENTACJA-DANE-cywilizacje.md`. Decyzja o losie pliku: master / Civ-MAPA.

## Reguły kluczowe (skrót — pełne w dokumentacji)
- Edycja w `../Cywilizacje.xlsx` → **CELOWANY** eksport → tylko `../gra/data/civs.json`. **NIGDY** `export-data.py` / `npm run build`.
- Religie: bonusy w `../Spoleczenstwo-parametry.xlsx` → „Religie cywilizacji" → `society-params.json` (re-eksport: SILNIK/society).
- Po zmianie danych: `loader.ts` musi się kompilować (`tsc` = 0); żaden inny JSON nienadpisany.
