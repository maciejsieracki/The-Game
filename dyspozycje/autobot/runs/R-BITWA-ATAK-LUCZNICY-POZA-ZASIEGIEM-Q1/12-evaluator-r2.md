# Niezależny Evaluator — runda 2

**Werdykt: PASS-WITH-NOTES.** Poprawka w `27d79fda` usuwa zarzut z rundy 1:
ograniczenie poruszania za linią piechoty stosuje się teraz tylko do doktryny Atak
(`steady`). Ruch dystansowych jednostek Skirmish wraca do nieograniczonej ścieżki.

## Niezależne kontrole

- Przejrzałem diff względem `05f66019`: jedyna zmiana produkcyjna warunkuje nową
  behind-melee gate przez `_effectiveMetaForUnit(ru).doctrine === 'steady'`. Dla Skirmish
  używana jest ścieżka `_compactAttackAllowsStep`, która natychmiast zezwala na krok,
  gdy doctrine nie jest steady.
- Nowy regresyjny przypadek sprawdza łucznika Skirmish poza zasięgiem z żywą własną
  piechotą: krok dystansowy wykonany, 10/10 w suite `battle-ranged-mounted-doctrine-test.cjs`.
- `npm run typecheck` — PASS.
- `node tools/battle-ranged-mounted-doctrine-test.cjs` — 10/10 PASS.
- `node tools/battle-melee-attack-doctrine-test.cjs` — PASS; piechota walczy w Ataku
  i Szturmie (24v24, 72 ataki i 720 HP utracone w każdym wariancie).
- `node tools/battle-manual-choice-contract-test.cjs` — 12/12 PASS.
- Chromium FOCUSED approach na produkcyjnym BattleScene, skład mieszany 42v42 — PASS:
  trzy rzeczywiste aktywacje łucznika, dystans 8 → 5 → 3, strzał w zasięgu 3,
  amunicja 12 → 11. Raport: `evidence/chromium-ranged-approach-probe-report.json`.
- In-range Chromium control nadal pokazuje strzał i HP 1000 → 997 w osobnym raporcie.

Konsola Chromium zgłasza wyłącznie 404 dla `/favicon.ico`, niepowiązane z walką;
żądania HTTP testu nie zgłaszały błędów. W focused approach, jak i wcześniej, szkody
od konkretnego strzału mogą zależeć od zmian bitewnych równoległych w fixture; dlatego
test zbliżania zalicza wejście w zasięg, strzał i wydatek amunicji, a test obrażeń jest
oddzielnym przypadkiem kontroli in-range.

## Zakres werdyktu

Zmiana i nowe testy zamykają konkretny zarzut regresji Skirmish. Obrona pozostaje
bez zmian, a testy kierunkowe potwierdzają dotychczasowe zachowanie Obrony i Szturmu.
Operator nie zmieniał gałęzi Szturmu ani Obrony w tej rundzie. PASS-WITH-NOTES oznacza,
że ten Operator/Evaluator etap jest gotowy do Final Control; to nie jest akceptacja
integracji, deploymentu ani push.
