# 02 — EVALUATOR (runda 1)

STATUS: FAIL (naprawione przez Final Control jako integration micro-fix,
bez zużycia rundy 2 — patrz 03).
MODEL/EFFORT: Opus 5 (`claude-opus-5[1m]`).

## Potwierdzone niezależnym pomiarem (własny harness, zero linii wspólnych
z testem Operatora)

Wszystkie znaleziska D1-D4 Operatora potwierdzone co do cyfry (rewers
poprawki daje 0 px w każdym przypadku). Kryterium 3 (iklwa) i kryterium 2
(spójność z T4 — zero zmian stałych) potwierdzone. Zakres commitu zgodny
z allowlistą hunk po hunku. Bramki referencyjne i cała seria T1-T9(bez
T9)/T11 zielone, uruchomione niezależnie.

## Trzy defekty blokujące (§16a)

- **F1 (zakres/dowód).** Operator odpiął w teście T8 precyzyjny pin
  Drużynnika (`mesh: 32, maxY: 0.6540` → `null, null`) mimo że te liczby
  nadal są prawdziwe (potwierdzone eksperymentalnie: przywrócenie pinu
  daje 80/0). Odpięcie było niepotrzebne i osłabiało bramkę T8.
- **F2 (nieprawdziwa liczba w komentarzu K3).** „Zsunięcie okucia hełmu
  zostawia pasek twarzy 0.0114" — zbudowany wariant daje 0.0420, nie
  0.0114; wniosek („nie zmieniać") może zostać, ale liczba była zmyślona.
- **F3 (nieścisłość w K1 iButho).** „Obrona 7 vs 6 Impi to jedyna różnica
  statystyk obronnych" — nieprawda, Impi ma dodatkowo `armor: 3`, którego
  iButho w ogóle nie ma.

## Uwagi kosmetyczne (do rejestru, nie do kodu)

1. Deski tarczy Drużynnika promieniste vs równoległe — potwierdzone,
   zgoda na nie-naprawianie w T10 (dotyczy też T4).
2. Para Drużynnik/Miecznik galijski 0.521 < 0.558 — zależność od T9.
3. Próg zerowy H12 przepuszcza bryły „prawie martwe" (8-11 px) — dla
   całej serii testów, nie tylko T10.
4. `units.json`: Drużynnik `Atak dystansowy 0` vs `missileAttack: 7`
   runtime; iButho bez klucza `armor` — dane zastane.
5. Źródła K2 iButho myliły stanowiska KwaZulu-Natal z tradycją ceramiczną
   Silver Leaves/Matola (Limpopo/Mozambik) — jedno słowo do poprawy.

RUNDY: 1/5 (rekomendacja: runda 2 Operatora na F1-F3 — wykonana zamiast
tego przez Final Control, patrz 03).
