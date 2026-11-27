STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-BUTTON-ARIA-Q1 (tag ENDARIA)
GOAL: przycisk „Zakończ turę” ma aria-disabled/is-disabled zgodny z canEnd; błąd odtworzony (pomiar przed poprawką), poprawka z testem czerwonym→zielonym, bramki zielone.
ZMIANY/COMMIT: baza 2515e501a (kandydat Evaluatora); commit obrony = czubek gałęzi (SHA w polu sha wyniku). Zmienione ścieżki:
- gra/src/ui/bottomBarHud.ts — cykl syncEndTurnState (co 500 ms; render() tylko przy zmianie stanu przycisku; renderedEndKey ustawiany w render(); clearInterval w destroy()). Klikalność, bramka advanceSeat i logika blokady nietknięte.
- gra/tools/endturn-aria-sync-test.cjs (nowy) — jsdom + esbuild, bundluje realny bottomBarHud.ts.
- gra/tools/endturn-aria-probe.cjs — poprawione nagłówek i komunikat użycia (p4 nie ma fallbacku na hak; dopisane haki SETUP).
- dyspozycje/analizy/KONIEC-TURY-PRZYCISK-ARIA-2026-11-27.md — przepisany (tabela zgodna z jsonl, mechanizm, poprawka, ograniczenia).
- dyspozycje/autobot/runs/R-WEB-ENDTURN-BUTTON-ARIA-Q1/endaria-s7-postfix-run1.jsonl (nowy) — pomiar po poprawce, seed 7, 8 tur.
- dyspozycje/autobot/runs/R-WEB-ENDTURN-BUTTON-ARIA-Q1/30-obrona-claude.md (ten plik).

TESTY:
- Test czerwony→zielony (gra/tools/endturn-aria-sync-test.cjs): na pierwotnym kodzie 2515e501a (skopiowanym tymczasowo obok modułu i usuniętym po teście) — 3 PASS / 2 FAIL (FAIL [2] aria-disabled nie przechodzi na false po canEndTurn=true bez update(); FAIL [3] klasa is-disabled pozostaje). Po poprawce — 5 PASS / 0 FAIL.
- Pomiar live po poprawce, seed 7, 8 tur (endaria-s7-postfix-run1.jsonl): po każdym kliknięciu poll przechodzi cA → Ca w ciągu ≤500 ms; aria=false przy canEnd=true; klik skuteczny 8/8 tur.
- Bramki (gra/, po poprawce, liczby z surowego wyjścia):
  - npm run typecheck (tsc --noEmit): exit 0, brak błędów.
  - logic-test: 213 PASS, 0 FAIL (liczba linii ^PASS = 213, ^FAIL = 0).
  - tech-tree-test: 20 pass, 0 fail.
  - research-test: PASSED 33 / FAILED 0 / TOTAL 33.
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
  - combat-test: All sanity checks passed (exit 0).
  - society-breakdown-test: 56 OK, 0 FAIL.
  - ai-test: 297 passed, 0 failed.
  - ai-city-order-need-wiring-test: 267 passed, 0 failed (of 267).
- Instalacja zależności: npm ci --ignore-scripts w gra/ (exit 0; ostrzeżenie audytu, bez wpływu na wynik). Bez npm run build/dev.

BLOKADY: brak. Dwie rzeczy do decyzji orkiestratora (nie blokują): (a) cykl wywołuje canEndTurn() co 500 ms poza updateHud(); komentarze w main.ts potwierdzają, że ta funkcja jest już wołana z pętli HUD, ale nie zmierzono wpływu na wydajność ani liczby console.warn z canPlayerInitiateEndTurn przy zablokowanej turze; (b) poprawka nie obsługuje hipotetycznego zawieszonego activeEndTurnPointers (zob. ODPOWIEDZI nr 3).

RUNDY: 2/5 (runda 1: pomiar + BLOCK; runda 2: ta obrona).
NASTĘPNY KROK: Evaluator — ponowna ocena kandydata po tym commicie; Final Control po PASS Evaluatora; integracja i deploy wyłącznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — brak poprawki, brak testu z mutacją czerwoną i pełnych bramek
PRZYJMUJĘ. Poprawka w gra/src/ui/bottomBarHud.ts (cykl syncEndTurnState). Test czerwony na pierwotnym kodzie (3 PASS / 2 FAIL) i zielony po poprawce (5/0). Bramki zielone (lista w TESTY).

### Zarzut 2 — tabela w KONIEC-TURY §1 nie zgadza się z jsonl; biegi 1–2 nie są w repo
PRZYJMUJĘ. Dokument przepisany. Tabela odpowiada wyłącznie endaria-s4242-run3.jsonl (8 wierszy, tury 1–8). Usunięto twierdzenia o dwóch niezależnych biegach i o turach z pre canEnd=false (tury 3–4 w jsonl mają pre canEnd=true). Biegi 1–2 nie są przytaczane jako dowód.

### Zarzut 3 — przyczyna z §2 to wniosek z lektury kodu, bez eksperymentu
PRZYJMUJĘ W CZĘŚCI, z dowodem na resztę.
- Eksperyment jest teraz: (a) test czerwony na pierwotnym kodzie, który odtwarza stale-aria bez update() (FAIL [2], [3]); (b) live po poprawce, seed 7: poll pokazuje, że aria podąża za canEnd w ciągu jednego kroku cyklu.
- Sprawdzono grep: w gra/src/ui/hud.ts jedynym wywołaniem refreshD1BModules jest updateHud (hud.ts:2276), a bottomBarApi jest aktualizowany tylko z refreshD1BModules (hud.ts:2132-2133). To jest sprawdzenie statyczne; NIE ZMIERZONO częstotliwości wywołań updateHud ani tego, czy updateHud woła się po końcu pipeline'u tury (nie instrumentowano).
- Zawieszony activeEndTurnPointers (bottomBarHud.ts:194-195): NIE ZBADANO. Poprawka nie zmienia tego zachowania (render i sync są wstrzymywane przy wciśniętym wskaźniku, tak jak wcześniej). Przyjmuję jako ryzyko szczątkowe, udokumentowane w KONIEC-TURY §5. Brak dowodu, że to druga przyczyna, ale też brak dowodu, że nie jest — stąd odnotowanie, nie odrzucenie.

### Zarzut 4 — zakres pomiaru niepełny (seed 7 niezmierzony; brak pełnej tabeli t1–t8 × 2 ziarna; kolumna komunikatu to tylko hintText)
PRZYJMUJĘ.
- Seed 7 zmierzony po poprawce (endaria-s7-postfix-run1.jsonl, 8 tur). Przed poprawką seed 7 NIE był mierzony w tym temacie — objaw dla seed 7 (4 tury, aria=true przy canEnd=true) pochodzi z pomiaru Evaluatora, nie z repo.
- Pełnej tabeli przed poprawką dla obu ziaren nie ma; zacommitowany jest tylko seed 4242 przed poprawką i seed 7 po poprawce. To jest niedomiar, nie jest uzupełniane.
- Kolumna „komunikat” w danych to hintText (wiersz `hintText`), nie pełny komunikat bramki — przyjęte jako ograniczenie opisu.

### Zarzut 5 — nagłówek i usage probe to skopiowany komentarz REALDEF5; probe ma haki setupu i „fallback na hak” dla p4
PRZYJMUJĘ.
- Sprawdzono kod: p4 nie zawiera żadnego fallbacku na hak (klik page.mouse, wiersz niesie clickEffective i clickNote). Wzmianka o fallbacku w nagłówku była błędna i została usunięta.
- Komunikat użycia poprawiony na zestaw walidowany (p0|p1|p2|p3|p4|dopen|dclose|didle).
- Dopisano w nagłówku haki SETUP (closeModals, clearBattles, rejectAwaitingAiOffers, acceptForcedPeace) i zaznaczono, że acceptForcedPeace jest ingerencją w stan (akceptuje wymuszony pokój blokujący turę).
- Dane: clickNote = null we wszystkich wierszach obu zacommitowanych biegów, czyli klik był skuteczny i żaden wiersz nie zależał od fallbacku.
