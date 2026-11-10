STATUS: LIMIT-5-EXCEEDED / DECISION_REQUIRED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1
GOAL: Przejrzeć wszystkie stare pliki `AUDYT-*.md`/`WERYFIKACJA-*.md`/pokrewne i nadać każdemu
znalezionemu błędowi status z dowodem na aktualnym pinie edb8fb56.

RUNDY: 5/5 (limit wyczerpany). Final Control rundy 5: 6× ODDAL (zarzuty 1,2,3,6,7,8 — poprawione
albo przesłonięte przez §10), 2× DO_DECYZJI_WŁAŚCICIELA (zarzuty 4 i 5 — nie dają się domknąć bez
dalszych rund/bez decyzji właściciela). Agregat: DECISION_REQUIRED.

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` — §8-§10 dopisane (232 insertions wg
`git diff HEAD`, 1 usunięta linia opisana jawnie w §10.4 pkt 6). Pierwsze 79 linii (§1-§5)
nienaruszone. Brak zmian w `gra/`.

STAN ZAKRESÓW (z dowodem, wg Final Control):
- AUDYT-KODU: 10 NIEROZSTRZYGNIĘTYCH (#2, #4, #20, #31, #48, #49, #53, #59, #60, #62).
- WERYFIKACJA-53: 6 NIEROZSTRZYGNIĘTYCH (pokrywają się z AUDYT-KODU).
- PARYTET-AI: 8 NIEROZSTRZYGNIĘTYCH — w tym #9, gdzie dowód Operatora (`koszt_surowce`=0
  w units.json) jest za słaby: nie dowodzi, czy produkcja jednostek pobiera surowiec z puli,
  bo `buildingStockCost()` nie zostało sprawdzone.
- STOLICE: 5 NIEROZSTRZYGNIĘTYCH.
- CIVPEDIA: 3 hasła + lista miejsc usunięcia Karawanseraju.
- OPISY: liczba nieprzeliczonych wierszy NIEUSTALONA (plik OPISY ma 69 wierszy danych na pinie,
  nie 79 jak w starym audycie; stare błędne liczby „79"/„48" nie zostały usunięte ze starszych
  sekcji, tylko nadpisane przez §10).

DECYZJA WYMAGANA OD WŁAŚCICIELA — Final Control (zarzut 5, powtórzone z §10.2 pliku) rekomenduje
podział pozostałej pracy na osobne tematy, bo jeden temat przy limicie 5 rund nie starcza na 6
niezależnych zakresów:
1. `P1.16c-KODU-A` — domknięcie 10 pozycji AUDYT-KODU (z WERYFIKACJA-53 jako podzbiorem).
2. `P1.16c-PARYTET-AI` — domknięcie 8 pozycji, w tym #9 (production-pobiera-z-puli — wymaga
   przeczytania `buildingStockCost()`, nie tylko `units.json`).
3. `P1.16c-STOLICE` — 5 pozycji. **Wymaga WCZEŚNIEJ odpowiedzi ABC właściciela** (wg §10.2 pliku —
   stolice dotykają decyzji projektowej, nie tylko audytu faktów).
4. `P1.16c-CIVPEDIA-KARAWANSERAJ` — 3 hasła + lista miejsc usunięcia.
5. `P1.16c-OPISY` — ustalenie faktycznej liczby nieprzeliczonych wierszy (69 vs stare 79/48) i
   status każdego.

Tematy 1, 2, 4, 5 nie wymagają decyzji produktowej — można dispatchować od razu, SEKWENCYJNIE
względem siebie (wszystkie piszą do tego samego pliku `P1-16-EDGE-CASES.md`, więc nie równolegle).
Temat 3 (STOLICE) wymaga pytania ABC do właściciela PRZED dispatchem.

NASTĘPNY KROK: orkiestrator nie dispatchuje dalej na TYM ID (R-RUSTPORT-P1-16B), zgodnie z zasadą
dla DECISION_REQUIRED. Zamiast tego: przedstawić właścicielowi pytanie o STOLICE i potwierdzić
podział na 4 nowe tematy (1,2,4,5 od razu, 3 po odpowiedzi).
DEPLOY/PUSH: NIE WYKONANO
