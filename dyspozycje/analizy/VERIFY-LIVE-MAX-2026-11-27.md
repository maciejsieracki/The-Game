# VERIFY-LIVE-MAX (R-WEB-VERIFY-LIVE-MAX-Q1, tag VLIVE) — pomiary live na poziomie MAKSYMALNYM

Data: 2026-11-27. Baza: origin/main `6319eaf66`, kandydat runda 1 `1a16d0406`, obrona (runda 2) w commicie z raportu `30-obrona-claude.md`.
Operator: Haiku 5.5, runda 2/5 (obrona po FAIL Evaluatora `61eb13797`).
Zakres: zamknięcie pozycji NIE ZMIERZONO z zadań #38/#79 na poziomie maksymalnym ustawień (reguła właściciela 26.11).
Zmiany w `gra/src`: brak. Zmiany w `gra/tools`: brak. Dane źródłowe pomiaru 1–2 i 5a skopiowane do repo: `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q1/dane/` (sumy sha256 w sekcji „Dowody”).

## Poziom maksymalny (przyjęty i sprawdzony)

- „Dyplomacja i wojna” = **Trudna** (kary ×3, bonusy ÷3; najwyższy z trzech poziomów w `gra/src/ui/newGameFlow.ts`). Pomiary 1–2 wykonane na tym poziomie.
- „Koszty jednostek”: **maksimum = Wysoki (×4)** (`gra/src/ui/newGameFlow.ts`, opcje: Niski / Normalny / Wysoki). Biegi pomiarów 1–2 startowały z **Niski** (domyślne ustawienie runnera `doStartGame`). To NIE jest poziom maksymalny. Zarzut Evaluatora nr 8 PRZYJĘTY: nie uzasadniono, czemu maksimum nie dotyczy pomiarów 1–2. Pomiar pozycji 1–2 na Wysokim (×4) NIE ZMIERZONO w tej rundzie (czas i obciążenie maszyny, patrz tabela).
- Pomiary 3–5: poziom kosztów i wzrostu według danych kreatora (`Koszty jednostek` = domyślny, `Wzrost surowców` = domyślny). NIE są na poziomie maksymalnym. Wpisane jako takie w tabeli.
- Flagi dyplomacji (pakiet 6 flag, `--all-flags 1`): ON (zgodnie z domyślnymi wartościami od FALI 888).
- Gracz: autopilot (`--player-ai 1`).

## Bramki ogólne (uruchomione w rundzie 2, surowe wyjście)

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` (gra/) | exit 0 |
| `tools/logic-test.cjs` | LOGIC OK (213/213) |
| `tools/tech-tree-test.cjs` | tech-tree-test: 20 pass, 0 fail |
| `tools/research-test.cjs` | PASSED: 33 / FAILED: 0 / TOTAL: 33 |
| `tools/combat-test.cjs` | COMBAT TEST: 6/6 pass |
| `tools/unit-replace-test.cjs` | WSZYSTKIE TESTY ZIELONE (21/21) |
| `tools/ai-test.cjs` | ai-test: 297 passed, 0 failed |

Zarzut nr 1 PRZYJĘTY I WYKONANY. Bramki uruchomione przez Operatora w rundzie 2 (nie tylko odtworzone przez Evaluatora).

## Tabela wyników

Poziom „maks.” = zgodny z regułą właściciela (Dyplomacja = Trudna; Koszty jednostek = Wysoki ×4). Kolumna „Poziom” mówi, czy pomiar był na maksimum.

| Pomiar | Wynik | Poziom ustawień | NIE ZMIERZONO |
|---|---|---|---|
| 1. Limit wojen z graczem (seed 4242, tury 2–99) | **0 naruszeń** limitu. Sprawdzone z surowego jsonl (`analiza-limitow.py`): każda cywilizacja (gracz i AI) ma co najwyżej **1 wojnę typu „naturalna” i 1 typu „epoki”** w każdej turze. Gracz: pierwsza wojna w turze 40 (typ naturalna, potem epoki w turze 69). Wszystkie wiersze mają dane do tury 99. | Dyplomacja = **Trudna** (maks.); Koszty jednostek = Niski (NIE maks.); flagi ON | Tury 100–120: NIE ZMIERZONO (Chromium SIGSEGV przy wznowieniu slotu, obciążenie maszyny load 6–25). Seed 7: NIE ZMIERZONO (czas). Koszty jednostek na Wysokim: NIE ZMIERZONO. |
| 2. Limit 2 sojuszy AI↔AI (seed 4242, tury 2–99) | **0 sojuszy** AI↔AI w całym biegu (wartość `sojuszeAiAi` = {0} we wszystkich 98 wierszach). Limit 2 nie został przekroczony, ale też **nie został przetestowany przy wartości > 0** w tym biegu (zarzut nr 3 PRZYJĘTY). | Dyplomacja = **Trudna** (maks.); Koszty jednostek = Niski (NIE maks.); flagi ON | Tury 100–150: NIE ZMIERZONO. Seed 7: NIE ZMIERZONO. Porównanie z poziomem Łatwy/Normalny w tym samym ziarnie: NIE ZMIERZONO. Brak sojuszy na Trudnej jest obserwacją, nie dowodem błędu. |
| 3. Żywa zamiana Żywność→Podatek (kurs 0,2) | Harness na modułach gry (`verify-live-food-to-tax-test.cjs`): PASS w rundzie 1 (odtworzone przez Evaluatora). Wynik z rundy 1: 100 żywności → 20 podatku, kurs 0,2. Nie uruchamiane ponownie w rundzie 2. | Kurs z danych (0,2); Koszty jednostek i Wzrost surowców domyślne (NIE maks.) | **Żywa tura z zbudowanym Targowiskiem** (UI/hak): NIE ZMIERZONO. |
| 4. Pokój z cesją miast | Żywo (Chromium, `diplomacy-city-cession-live-test.cjs`, wynik z rundy 1): 17 PASS / 0 FAIL, cesja **1 miasta** w obu kierunkach i odrzucenie cesji stolicy. Logika (`peace-city-cession-negotiated-test.cjs`): 19 PASS / 0 FAIL, cesja **2 miast** i ostatniego miasta. | Gra domyślna (NIE maks.); pokój z cesją | **Cesja >1 miasta na żywej grze**: NIE ZMIERZONO (zarzut nr 5 PRZYJĘTY). Brak skryptu z hakiem civTest dla wielu miast. |
| 5a. FLEEMANUAL (ręczny odwrót, bitwa 3D) | `flee-manual-measure.cjs`: **28 PASS / 0 FAIL**, plik `flee-manual-measure-caseall.json` (sha256 zgodny, patrz „Dowody”). Limit ruchu, brak wyjścia poza planszę (0), brak kroków bez punktów (0). | Scenariusz bitwy (nie zależy od poziomu dyplomacji) | **Animacja odwrotu**: NIE ZMIERZONO (runner nie ma hooka na koniec animacji). |
| 5b. FORTRING (pierścień fortów, round-trip zapisu przy flagach ON) | — | — | **NIE ZMIERZONO** (zarzut nr 6 PRZYJĘTY): w rundzie 1 nie udokumentowano próby uruchomienia ze slotu. Wcześniejszy round-trip t8 (5/5, #119) to wynik historyczny, nie z tego biegu. |

## Wniosek dla orkiestratora (stan pozycji)

- Kryterium binarne dispatchu (liczba albo NIE ZMIERZONO z powodem; dokument w repo; zero zmian reguł gry) jest spełnione.
- Cel tematu (zamknięcie pozycji NIE ZMIERZONO) **NIE jest osiągnięty**: pozycje 1 (tury 100–120, seed 7), 2 (tury 100–150, seed 7, limit > 0), 3 (żywa tura z Targowiskiem), 4 (żywa cesja >1 miasta), 5a (animacja), 5b (FORTRING) pozostają otwarte.
- Te pomiary wymagają czystej maszyny (load < 4 na 4 rdzeniach) albo osobnego tematu z wznawianiem slotu. Nie zostały wykonane w rundzie 2, bo Chromium padało przy wznowieniach, a tempo spadało do 40–90 s/turę przy load 9–25 (dane rundy 1).
- Propozycja następnego tematu (do decyzji orkiestratora, nie do właściciela): R-WEB-VERIFY-LIVE-MAX-Q2 z runnerami dla pozycji 1 (tury 100–120 + seed 7), 2 (tury 100–150, seed 7), 3, 4 (>1 miasto live), 5b, uruchamianymi na czystej maszynie.

## Dowody (dane w repo)

Folder: `dyspozycje/autobot/runs/R-WEB-VERIFY-LIVE-MAX-Q1/dane/`

| Plik | sha256 |
|---|---|
| `seed4242-all1-lvl-trudna.jsonl` (98 wierszy, tury 2–99) | `dbe92930d200fd882c82cf9042015c673001e4f6e2d5a2a375c98d300c145feb` |
| `seed4242-all1-lvl-trudna.summary.json` | `ca2a38ee42bea9f245fe2a0626bc6704fea4ea426032f7e4533cfbf728e688b6` |
| `seed4242-all1-lvl-trudna.state.json` | `d53226590db2976834222b62928672b803d923537299e5ca7d7b546af29d5150` |
| `flee-manual-measure-caseall.json` (5a) | `eda3b50dc7f6cfc52a3b3bdfa7ef4299b03b3035177998c4ee89e2bb58c6094e` |
| `analiza-limitow.py` + `analiza-limitow.wynik.txt` | skrypt weryfikujący pomiar 1–2 (uruchomienie: `python3 -I analiza-limitow.py seed4242-all1-lvl-trudna.jsonl`) |

## Definicje metryk (zarzut nr 9 — wyjaśnienie)

Pozornej niespójności nie ma. Dwie różne metryki:

- **Pary w wojnie naraz (cała gra)**: liczba par cywilizacji ze statusem „wojna” w danej turze. Maksimum = **7 par** (t85; t88 też 7). Źródło: `diplo.pairs`.
- **`wojnyRownolegleMax`**: maksimum liczby wojen **jednej cywilizacji** w danej turze (liczba par, w których dana cywilizacja jest stroną). Maksimum w biegu = **2** (t69). Wartość licznika zgodna z wyliczeniem w każdym z 98 wierszy (`analiza-limitow.wynik.txt`). Nie jest to suma wszystkich wojen.
- **`zerwaniaZeroZaufania`**: licznik **skumulowany** zerwań przy zerowym zaufaniu (od początku sesji pomiaru). Pierwszy wiersz = 0; wartość 40 osiągnięta w turze 93 i bez zmian do tury 99 (zerwaniaSuma w state.json = 40). Nie jest to liczba w jednej turze.

## Przebieg techniczny (ślad)

- Bundle: `vite build --outDir /tmp/vlive-q1-dist` (poza repo), 18 s (runda 1).
- Bieg diplomacy (runda 1): `tools/diplomacy-harder-measure-run.cjs --diplo-level trudna --all-flags 1 --seed 4242 --every 1 --player-ai 1`, odcinki `--stop-at` (30, 71, 82, 88, 93, 99). Wznowienia ze slotu `dipl-measure-seed4242-all1-lvl-trudna`.
- Crash Chromium (SIGSEGV / „Target page … has been closed”): przy wznowieniach w t71, t81, t88, t97; część wznowień wymagała ponowień. Znany problem harnessu (#90).
- Runda 2: nie uruchamiano żadnego nowego biegu live. Zrobiono: bramki modułowe, analiza surowych danych, kopie dowodów do repo.

## Uwagi dla orkiestratora

1. **Sojusze AI↔AI = 0 przy Dyplomacji „Trudna” (t2–99, seed 4242).** Trudna dzieli bonusy przez 3 (w tym za sojusze, wg hintu ustawienia). Obserwacja pomiarowa, nie dowód błędu. Wymaga porównania z Łatwą/Normalną w tym samym ziarnie, zanim zostanie uznane za błąd gry lub za zamierzone.
2. **Crash Chromium przy wznowieniach ze slotu** (#90) blokuje pomiary > tura 100. Przyczyna w harnessie, nie w grze.
3. Seed 7 nie był mierzony w żadnej pozycji tego tematu.
