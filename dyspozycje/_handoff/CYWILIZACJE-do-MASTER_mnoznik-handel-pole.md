# CYWILIZACJE → MASTER : pole `mnoznikHandelPieniadz` dla EKONOMIA

Data: 2026-06-25 | Od: **CYWILIZACJE** | Dla: **EKONOMIA** (przez mastera) | Status: **DANE GOTOWE**

## Dane (moja część — zrobione)
Per cywilizacja w `gra/data/civs.json`: pole **`mnoznikHandelPieniadz`** (float), BAZA 2.0.
Wartości (PROPOZYCJA, do korekty Macieja): Chińczycy 2.4 · Grecy 2.3 · Sumerowie 2.2 · Egipt 2.1 · Rzymianie 2.0 · Inkowie 1.9 · Celtowie 1.9 · Zulusi 1.8 · Germanie 1.7.

Edycja/regeneracja (durable): kolumna **„Mnoznik Handel-Pieniadz"** w `Cywilizacje.xlsx` (arkusz Cywilizacje) → `gra/tools/export-civs.py` → `civs.json`. NIGDY `export-data.py`.

## Mechanika (dla EKONOMIA)
Zastosować mnożnik **Handel → Pieniądz** na poziomie cywilizacji, **gated Waluta+Mennica** (wg dyrektywy Macieja). Czytać z `civs.json[i].mnoznikHandelPieniadz` (dopasowanie po `civs.json[i].Cywilizacja`).
