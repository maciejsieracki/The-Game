# CYWILIZACJE → MASTER : nazwy klastrów wpisane do civs.json (handoff + status)

Data: 2026-06-24 22:44 | Od: CYWILIZACJE | Status: ZROBIONE (1 ryzyko do rozdania)

## ZROBIONE
Nazwy klastrów (10/typ, wariant **INKOWIE**, ze `MAPA-do-MASTER_nazwy-klastrow.md`) wpisane do `gra/data/civs.json`.
- Pole: **`cywilizacje[i].nazwyKlastra`** = tablica 10 stringów; **`[0]` = stolica**, `[1..9]` = miasta klastra AI tego samego typu.
- Identyfikacja cywilizacji po `cywilizacje[i].Cywilizacja`.
- 9 typów × 10 nazw; JSON poprawny (`json.tool` OK); backup `civs.json.bak-CYWILIZACJE`.

## DLA MAPA (przez mastera)
Render mapy czyta nazwy z **`cywilizacje[i].nazwyKlastra`** (kolejność: stolica, potem klaster). To zamyka handoff `MAPA-do-MASTER_nazwy-klastrow.md`.

## RYZYKO / PIPELINE (do decyzji)
`civs.json` jest generowany **wyłącznie przez `export-data.py` (zakazany)** z `Cywilizacje.xlsx`. Moja edycja jest BEZPOŚREDNIA w `civs.json` i **nie jest w arkuszu** → ponowny `export-data.py` **SKASUJE** `nazwyKlastra`.
## DECYZJA POTRZEBNA OD MASTERA (Maciej przekierował to pytanie do Ciebie)
Jak TRWALE generować `civs.json`, by nie tracić `nazwyKlastra` (i innych ręcznych edycji) przy regeneracji?
- **A)** Ja (CYWILIZACJE) robię **targeted `export-civs.py`** + kolumnę nazw klastra w `Cywilizacje.xlsx` (analogicznie do `export-diplomacy.py`). `civs.json` regenerowalny bezpiecznie z arkusza, bez `export-data.py`. (subagent Sonnet)
- **B)** Zostawiamy edycję bezpośrednią w `civs.json` (ryzyko: `export-data.py` skasuje); umawiamy się, że nikt nie odpala `export-data.py`.
- **C)** Master przerabia globalny `export-data.py` (FIX-REPO: zaszyta ścieżka sandboxa + regeneracja wszystkich JSON) — wtedy ja tylko dodaję kolumnę do arkusza.

**Rekomendacja: A** (czysto, w moim lane, bez ruszania wspólnego `export-data.py`). Czekam na decyzję.

## DROBNE (otwarte)
Pisownia nazw obcych (diakrytyki/transkrypcja) — zachowałem jak w propozycji MAPA (UTF-8). Do ew. korekty przez Macieja.
