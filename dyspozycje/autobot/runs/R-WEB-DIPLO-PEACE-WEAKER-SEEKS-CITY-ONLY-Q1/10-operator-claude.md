# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — raport Operatora (runda 1/5)

STATUS: FAIL (runda 1 niekompletna — część zakresu z DODATKU nie wdrożona, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1
GOAL: rozejm i pokój wg siły militarnej: słabsza strona szuka rozejmu/pokoju, silniejsza go odrzuca, opór silniejszej przełamuje wyłącznie miasto (cena PN jak dotąd); bez pieniędzy i surowców jako słodzika. Dotyczy gracza i AI.
ZMIANY/COMMIT: baza 646d95248 (origin/main), worktree odłączony. Zmienione pliki (allowlista): gra/data/diplomacy-war-peace-params.json, gra/src/game/diplomacy-military-strength.ts, gra/src/game/diplomacy-war-peace-profile.ts, gra/src/game/diplomacy-proposals.ts, gra/src/game/ai.ts, gra/src/game/diplomacy-ai-forced-peace.ts, gra/src/main.ts (tylko diploProposalWarState, gateVerdict AI↔AI i import), gra/tools/diplo-war-peace-profile-unit-test.cjs (asercje o starej regule). SHA: patrz pole sha w odpowiedzi strukturalnej.
TESTY:
- `npx tsc --noEmit`: exit 0 (po zmianach w ai.ts i main.ts).
- diplo-war-peace-gate-test: 24 pass / 0 fail.
- diplo-war-peace-profile-unit-test: 198 pass / 0 fail (po aktualizacji 3 asercji R5b i 1 asercji ceny R5).
- diplo-military-strength-test: 27 PASS / 0 FAIL.
- diplo-war-declare-zero-trust-test: 43 OK / 0 FAIL.
- diplo-war-peace-sim-test: 17 pass / 5 fail. Asercje S2, S2b, S3, S4b (stara reguła „czuje się silniejsze" przy rw ≥ 0,55) — do przepisania na pozycję militarną w rundzie 2. M_TUR: wynik do przeglądu (test mutacji minTurWojny, nie zweryfikowany w tej rundzie). Dług z bazy: 3 FAIL — NIE_ZMIERZONO na bazie w tej rundzie (brak uruchomienia bazy).
- NIE uruchomiono: logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, diplomacy-test, diplo-military-strength-test (zrobiony), diplo-war-battle-counter-test, diplo-trust-numbers-test, diplo-peace-*, diplomacy-proposals-*.
- NIE napisano: gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs (wymagany przez DODATEK pkt (a)–(h)).

BLOKADY (niewykonane w tej rundzie):
1. Słabsza AI nie dołącza miasta do propozycji. Ścieżka zaproponuj_pokoj (ai.ts, priorytet 2) wysyła pokój/rozejm bez słodzika. DODATEK wymaga: propozycja AI słabszej zawiera miasto AI o PN ≥ ceny. Brak mechanizmu → TO JEST LUKA; do zrobienia w rundzie 2 (oferuj_miasto_za_pokoj dla pokoju i rozejmu, z rodzajem w komendzie).
2. Brak nowego testu zachowania (a)–(h) i mutacji bramek (lekcja W45/W47).
3. Cztery pozostałe gate'y (logic/tech-tree/research/unit-replace/combat) nie uruchomione.
4. Stare asercje w diplo-war-peace-sim-test (S2, S2b, S3, S4b) do przepisania.
5. Parametr progu pasma: wdrożony w JSON (progRozniceSilyPokoj.wartosc = 0), ale weryfikacja pasma (>0) nieprzetestowana.

NASTĘPNY KROK: runda 2 — (1) komenda AI słabszej z miastem AI (ai.ts) + obsługa rozejmu; (2) przepisanie asercji sim; (3) nowy test gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs z mutacjami; (4) pełne bramki z DODATKU.
DEPLOY/PUSH: NIE WYKONANO

## Zmiany (co zrobione)

| Miejsce | Stare | Nowe |
|---|---|---|
| diplomacy-war-peace-profile.ts `evaluatePeaceAiGate` | verdict 'stronger' gdy rw ≥ 0,55 ∧ brak utraty ∧ tura < 10; blokada przewagi >20% z rw | verdict 'stronger' gdy `pozycjaMilitarna === 'silniejsza'` (siła militarna); reszta 'ok' |
| `peaceStrengthPriceMultiplier` (mnożnik ceny od siły ×2/×0,5) | używany w gate | nieużywany w gate (funkcja zostaje); cena = mnożnik cywilizacji |
| diplomacy-military-strength.ts | — | `peaceMilitaryPosition(a, b, progProc)` → 'silniejsza' / 'slabsza' / 'pasmo' (remis: reguła compareMilitaryStrength) |
| diplomacy-war-peace-params.json | — | `progRozniceSilyPokoj.wartosc = 0` (opis po polsku) |
| diplomacy-proposals.ts (pokój/rozejm od gracza) | 'stronger' = odrzucenie | 'stronger' = odrzucenie, CHYBA ŻE suma PN miast w giveItems ≥ basePn (złoto/surowce pominięte) |
| main.ts `diploProposalWarState` | warState.responderRw | + `responderPozycjaMilitarna` z diploMilitarySideOf |
| main.ts gateVerdict AI↔AI | rw zwycięzcy | pozycja militarna zwycięzcy |
| diplomacy-ai-forced-peace.ts | 'stronger' = czekaj | 'stronger' = czekaj, chyba że plan.full (pełne pokrycie miastami) |
| ai.ts blok propozycji | aiFeelsStronger z rw; aiAdvantageBlocksPeace z rw | aiFeelsStronger = peacePosMil==='silniejsza'; słabsza (siła) zawsze wysyła sygnał 'f' i szuka pokoju |

## Założenia (rozstrzygnięte przez Operatora)

- Z1: Przy progu 0 (domyślnie) nie ma pasma: każda różnica siły decyduje; idealny remis rozstrzyga reguła compareMilitaryStrength (większa armia, potem mniejszy id). Brak danych siły (ai.ts: brak silaMilitarnaAI/Partner) = 'pasmo' (brak ograniczeń).
- Z2: Przy progu > 0 różnica w paśmie (|S_a − S_b| < próg%) nie wymusza ani odrzucenia, ani miasta (pasmo = brak ograniczeń).
- Z3: Mnożnik siły z ceny pokoju został usunięty (decyzja właściciela: zastąpiony przez zasadę miasta). Zostaje mnożnik cywilizacji i zmęczenie wojną (wearyFactor, osobny temat).
- Z4: Miasto liczy się wyłącznie z pozycji `giveItems` typ 'miasto' (wycena resolveProposalPn). Złoto i surowce w tej sumie pomijane.
- Z5: Jedno miasto, słabsza strona bez innego miasta — w tej rundzie NIE rozstrzygnięte (luka, BLOKADA 1). Proponowana zasada do potwierdzenia przez FC: brak propozycji pokoju od słabszej AI, dopóki nie ma miasta do oddania (zachowanie do końca wojny bez pokoju). Nie wymyślono nowej mechaniki.
- Z6: Limit czasu AI↔AI (`force` po limicie tur) pozostaje jako istniejący mechanizm; może obejść bramkę 'stronger' bez miasta. ZAŁOŻENIE do decyzji właściciela, nie zmieniono.
- Z7: Krok 4b (zmęczenie wojną, war-weariness*) nie ruszany (ZAKAZ z DODATKU). Rozejm 5/10/15 i tryb propozycji AI nie zmienione.

## Miejsca z DODATKU (plik:linia) — stan

- bramka pokoju: diplomacy-war-peace-profile.ts evaluatePeaceAiGate — zmienione.
- cena i mnożnik od siły: peaceStrengthPriceMultiplier — usunięty z bramki (funkcja zachowana).
- „czuje się silniejsze": isFeelingStronger — zachowana jako @deprecated, nieużywana w ścieżkach gry (ai.ts, diplomacy-proposals.ts, war-peace-profile). Ai.ts: aiFeelsStronger przepięte na siłę.
- generowanie oferty przez AI (ai.ts ok. 7118–7150): zmienione sygnały; BRAK city-offer (BLOKADA 1).
- skrzynka propozycji gracza (diplomacy-proposals.ts ok. 1351–1400): dodano warunek miasta.
- AI↔AI (main.ts ok. 36516; diplomacy-ai-forced-peace.ts ok. 273): zmienione.

## Tabela przeglądu testów (sim)

- S2 / S2b / S3 / S4b: stare asercje rw ≥ 0,55 — DO PRZEPISANIA (runda 2).
- M_TUR: do przeglądu — zachowanie minTurWojny działa w bramce (too_early), ale wynik sim wymaga analizy.

Zgłoszono w raporcie: 10-operator-claude.md.
