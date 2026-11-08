STATUS: PASS-WITH-NOTES
TEMAT: R-WEB-PANGEA-LAND-FRACTION-Q1
RUNDY: 1/5 (obrona)

Zarzut 1 (parity czerwony): PRZYJMUJE. Fixture BASE (10 wpisow pangea) przegenerowany; PARITY same=30/30 maxDist=0 PASS (gate-polar-parity-r2.txt). 20 wpisow kontynenty/wyspy bez zmian.
Zarzut 2 (plik poza allowlista): PRZYJMUJE fakt; plik zmieniony w OSOBNYM commicie (latwy do odrzucenia). Wymaga potwierdzenia orkiestratora (precedent: ten sam fixture przegenerowal R-WEB-CAPITAL-SPACING-FIX-Q1).
Zarzut 3 (stage-diag poza wzorcem): PRZYJMUJE; plik usuniety.
Zarzut 4 (determinism bez asercji): PRZYJMUJE; dodano EXPECTED hashe 12 map (baza 57cc8aded) + zakres 59-61% Pangei, exit 1 przy naruszeniu (gate-det-r2.txt: PASS).
Zarzut 5 (luka raportu): PRZYJMUJE; shape FAIL=0 EXIT=0, fraction 3 seedy PASS EXIT=0 (fraction: deklarowane 20% daje 10,5%, 50% daje 43,4% - deficyt poza zakresem 60%).
Notatka: mylacy komentarz w topUp poprawiony (tylko komentarz). tsc EXIT=0. Seed 42 = 59,15% (w zakresie, blisko dolnej granicy).
