STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-DECISIONS-ARCHERBEHIND-SZCZESCIE-Q1
GOAL: asercja "lucznik za piechota" opisuje zachowanie planera (zostaje) i wykrywa regresje; komplet szczescia 12/24/32, katalog 44; zero zmian gra/src i gra/data.
ZMIANY/COMMIT: kandydat 359ad795e6701d0d0930ac22f85685b0afc07f4b (potomek bazy 439b1e1ae: merge-base --is-ancestor = tak; origin/main 6ddb8c2d2 tez potomek 439b1e1ae). Diff vs baza: 2 pliki gra/tools + raporty (10-operator, 30-obrona); `git diff 439b1e1ae 359ad795e -- gra/src gra/data` pusty; `git diff --check` czysty. Ten raport = jedyny plik dodany przez FC.

TESTY (surowe, ZMIERZONO na 359ad795e):
- tsc --noEmit: exit 0
- bitwa-auto-atak-wielojednostkowy-evaluation-test: 10 passed, 0 failed
- szczescie-przebudowa-skali-test: 535 OK, 0 FAIL
- logic-test 213/213; tech-tree 20 pass/0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6 pass/0 fail (brak czerwieni do porownania z baza)
- Mutacja FC (nowa): w galezi steady `_activateUnit` dla primaryRanged wymuszony krok do przodu (ru.q+1, ru.r-1) -> test 7 passed / 3 FAIL (krok lucznika, pozycja po commit, runda 2). src przywrocony (cp), git status czysty.
- Mutacje Obrony (hold w steady 7/3; emporion epokaWejscia 99 -> 2 FAIL) i Operatora (usuniecie garnizonu z kompletu -> 3 FAIL) przyjete z raportow 10/30 (nie powtarzane przeze mnie).

ZARZUTY:
1. Mutacja "wypycha lucznika przed piechote" w wariancie _advanceStep: ODDAL. Fixture ma ammoLeft 0 / shootingEnabled false (canShoot=false), wiec lucznik idzie galezia steady -> _advanceStep (wspolna z piechota); swap na _advanceStep jest rownowaznikiem. Realne odchylenia na wykonywanej sciezce (hold, krok do przodu) sa wykrywane (moja mutacja 7/3). NOTATKA: test nie pokrywa planera strzeleckiego (_rangedAction); komentarz w tescie przywoluje 9dc324bb9, co jest nieco mylace - dlug testowy, nie regresja.
2. Trywialna asercja rundy 2: ODDAL (naprawione przez Obrone: dokladny stan infantry (4,3) / archer (2,2); wykrywa hold i push). NOTATKA: przyczyna pustych krokow obu jednostek w rundzie 2 nie zbadana (NIE ZMIERZONO; hipoteza: rowne tempo mieszanej armii W19/W40). Asercja utrwala ten stan - gdy zmieni sie logika tempa, test trzeba swiadomie zaktualizowac.
3. Nieaktualne liczby: ODDAL dla zakresu dispatchu (grep docs/ i komentarze gra/src: w docs/ zero trafien 11/23/31; sekcja 2a testu poprawiona). Pozostalosci, NIE blokuja: dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md:21 ("11 / 23 / 31"; dispatch nie obejmuje dyspozycje/); civpediaOpenGate.ts:36 "16 z 41" to historyczny pomiar z innego tematu (nie opis kompletu); szczescie-skala-normalizacja-test.cjs:571 "31 budynkow" to parametr wejsciowy scenariusza, nie twierdzenie o katalogu. Brak NAPRAW => brak FAIL.

BLOKADY: brak. Symlink gra/node_modules w worktree (gitignored) do usuniecia przez orkiestratora.
RUNDY: FC 1/5.
NASTEPNY KROK: orkiestrator integruje (bez wdrozenia ROBOCZEJ, tylko gra/tools); opcjonalnie osobny temat dokumentacyjny: BALANS-SZCZESCIE-SKALOWANIE-EPOK.md:21 -> 12 / 24 / 32 (bez zwijania 13 / 29 / 42).

UWAGI-DLA-ORKIESTRATORA:
1. Dlug testowy: wariant fixture z wlaczonym strzelaniem (pokrycie _rangedAction / planera strzeleckiego).
2. Dlug: zbadac przyczyne pustych intencji rundy 2 (piechota z wolnym polem stoi).
3. Dokument BALANS (dyspozycje/) nieaktualny: 11/23/31 -> 12/24/32.
DEPLOY/PUSH: NIE WYKONANO
