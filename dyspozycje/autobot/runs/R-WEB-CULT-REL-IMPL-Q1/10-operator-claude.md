STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-IMPL-Q1 (CULTIMPL, #173 + #174)
GOAL: kultura i religia liczą się do Szczęścia i do Prawa miasta (granice łatwy −10/+10, normalny −15/+5, trudny −20/0 na linię, skala epok ×1,0/×1,6/×2,3); ustawienie „Kultura i religia” w nowej grze (Mały wpływ łatwy domyślnie / Neutralny / Duży wpływ); zapisy bez pola = tryb zgodności (dzisiejsze zachowanie, bez linii Prawa).
ZMIANY/COMMIT: baza 690947a2adfb7c78e656959fea77fe50d864dda2 (origin/main). Allowlista:
  - gra/src/game/culture-religion-level.ts (NOWY: typ poziomu, granice domyślne, stan poziomu, cultureReligionLineValue)
  - gra/src/game/society-breakdown.ts (linie Kultury/Religii w computeHappinessBreakdown; linie kultura_prawo/religia_prawo w computeLawBreakdown; udziały przekazywane z happinessInput w evaluateOrderFromBreakdown)
  - gra/data/society-params.json (nowy blok top-level kultura_religia_poziomy: D/G per poziom)
  - gra/src/ui/newGameFlow.ts (opcja „Kultura i religia” w zaawansowanych, domyślnie latwy; normalizacja; podsumowanie)
  - gra/src/main.ts (tylko: import, setCulturaReligiaLevel przy nowej grze i przy wczytaniu zapisu, pole kulturaReligiaLevel w haku civTest getSettings)
  - gra/tools/culture-religion-level-test.cjs (NOWY)
  - dyspozycje/autobot/runs/R-WEB-CULT-REL-IMPL-Q1/10-operator-claude.md (ten raport)
  Nie zrobione z dispatchu: sekcja w docs/obieg/ (opis zasad) — NIE WYKONANO.
  Założenia inżynierskie:
  (a) wzór linii: (D + (G − D)·udział) · (x_epoki / x_epoki1), x_epoki1 = 10 z szczescie_skala_kultura_religia (hard). Dosłowne „D + (G−D)·udział × skala” bez mnożenia D/G przez skalę dawałoby przy udziale 0% tę samą wartość we wszystkich epokach, sprzecznie z „stawki rosną w kolejnych epokach”.
  (b) poziom łatwy (i brak pola) idzie DOKŁADNIE dzisiejszym wzorem proporcjonalneSzczescie (2·x·udział − x) — bit-w-bit.
  (c) linia Prawa dla kultury/religii pojawia się TYLKO gdy poziom ustawiony (nowa gra). Zgodność = brak linii.
  (d) stan poziomu to stan modułowy (jak Dyplomacja i wojna), ustawiany w main.ts; callerzy silnika nie zmienieni.
  (e) udział religii dla Prawa = ten sam co dla Szczęścia (ownReligionShare lub z haRel); brak = 0,5 (0 punktów).
  (f) granice D/G można nadpisać z society-params.json → kultura_religia_poziomy (dane = źródło prawdy).
TESTY:
  - tsc --noEmit (gra/): exit 0
  - culture-religion-level-test.cjs: 50 pass / 0 fail. Poziom MAKSYMALNY = trudny dla testów silnika; tabela 3 poziomów tylko w teście czystej funkcji. Obejmuje: granice per poziom, skala ×1,6/×2,3, udział spoza [0,1], normalizację pola (brak/zła = null), zgodność/łatwy bit-w-bit na siatce 3 epoki × 9 × 9 = 243 przypadków (0 rozjazdów), linie Prawa tylko przy poziomie, granice z JSON.
  - Mutacje: testy zawierają asercje, które wykryłyby zamianę D/G, brak skali epok, brak linii Prawa i brak ścieżki zgodności. NIE URUCHOMIONO prawdziwych mutacji na źródle (dispatch wymagał mutacji czerwonych) — NIE ZMIERZONO jako mutacje źródłowe.
  - Bramki ogólne (wszystkie exit 0): happiness-breakdown-test 38/38; law-garrison-test 3/0; porzadek-panel-czytelnosc-test 93/0; prawo-palac-tier-test 30/0; prawo-przebudowa-skali-test 152/0; prawo-siatka-v2-test 55/0; society-breakdown-test 56/0; szczescie-audyt-c-prawo-osiedla-test 15/0; szczescie-audyt-d-progi-bunt-test 18/0; szczescie-przebudowa-skali-test 535/0; szczescie-skala-normalizacja-test 148/0; szczescie-zamoznosc-test 88/0; logic-test 213/213; tech-tree-test 20/0; research-test ALL GREEN; combat-test OK; unit-replace-test 21/21; ai-test 297 passed / 0 failed (poziom domyślny = zgodność, wynik niezmieniony).
  - NIE ZMIERZONO: pomiar AI 60 tur seed 4242 na poziomie trudnym (garnizony AI, bunty własnych miast, utrata miast) — brak runnera w tej rundzie.
  - NIE ZMIERZONO: test live w Chromium (kreator → trudny → odczyt rozbicia) oraz round-trip zapisu pola kulturaReligiaLevel w grze.
  - NIE ZMIERZONO: porównanie PRZED/PO na scenariuszach z gita; zgodność sprawdzona przez siatkę względem dzisiejszego wzoru i przez niezmienione testy regresji.
BLOKADY: brak blokad kodu. Otwarte: pomiar AI 60 tur (trudny) i test live — runda 2; sekcja docs/obieg; prawdziwe mutacje czerwone.
  Uwaga do decyzji: przy nowej grze domyślnie „Mały wpływ (łatwy)” linie Prawa kultury/religii dają do +20 pkt Prawa (2 × +10) w epoce 1 przy 100% własnej, a obca kultura i religia −20. Zmienia to PoR w nowych grach — do sprawdzenia przez model (CULTMODEL2).
RUNDY: 1/5 (Operator, Haiku 5.5)
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja tabeli granic i zgodności; runda 2 Operatora: pomiar AI 60 tur na trudnym seed 4242, test live w Chromium, prawdziwe mutacje czerwone, sekcja docs/obieg.
UWAGI-DLA-ORKIESTRATORA: (1) dispatch wskazywał analizę dyspozycje/analizy/KULTURA-RELIGIA-WPLYW-2026-11-26.md oraz model-kultura-religia-entry.ts — w gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 ani w bazie origin/main w tym worktree nie znaleziono pliku analizy; nie użyto go. (2) Pozycja z tasku #173 „cel garnizonu 2/3/4” nie została wdrożona w tym kodzie; jednostka garnizonu 20 pkt bez zmian.
DEPLOY/PUSH: NIE WYKONANO
