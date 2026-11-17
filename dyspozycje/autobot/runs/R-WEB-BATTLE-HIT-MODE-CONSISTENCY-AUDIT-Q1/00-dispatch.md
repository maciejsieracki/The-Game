# R-WEB-BATTLE-HIT-MODE-CONSISTENCY-AUDIT-Q1 (HITMODE)

DOMAIN: GAME (pomiar + narzędzia, BEZ zmian reguł) · Operator HAIKU · Evaluator SONNET · Obrona HAIKU · FC SONNET · max 5 rund.

## Zgłoszenie i decyzja właściciela (2026-11-17)
Właściciel: „Nie wiem też czy w toku jakichś prac nie usunęliśmy szans trafienia, ustalając, że zawsze jest pełne szanse trafienia.” Decyzja ABC: **A — domyślnie zostaje tryb „pewne”** (nowe gry); „losowe” zostaje w opcjach zaawansowanych i dla starych zapisów. Reguł NIE zmieniamy.

## GOAL
Dowód liczbowy i kodowy, że (1) szanse trafienia nie zostały usunięte, tylko działają w trybie „losowe”, (2) wszystkie ścieżki walki czytają ten sam tryb i liczą spójnie, (3) opis liczbowy siły łuczników vs Wojowników w OBU trybach (symulacja 20 vs 20).

## Zakres (tylko odczyt src; zapisy wyłącznie w `gra/tools/` i `dyspozycje/autobot/runs/<ID>/`)
1. Audyt ścieżek (tabela plik:linia | co robi w „pewne” | co w „losowe”): `gra/src/game/hit-mode.ts`, `combat.ts` (certainHits, hitChanceTw, upset AUTO), `battleScene.ts` (~9535 certainHit/roll), `auto-battle-power.ts`, `render/scene.ts`, `main.ts` (setActiveHitMode: nowa gra / wczytanie zapisu / `__civSetHitMode`), `newGameFlow.ts` (DEFAULT_ADVANCED hitMode 'pewne'). Wskaż KAŻDE miejsce, które NIE czyta `isCertainHitMode()` a liczy trafienie (rozbieżność = defekt do osobnego tematu, nie naprawiaj).
2. Narzędzie `gra/tools/hit-mode-archers-vs-warrior-sim.cjs` (esbuild harness z `gra/tools/lib/esbuild-raw-plugin.cjs`): symulacja walki 20 Łuczników (Atak dyst. 4, zdrowie wg `health`) vs 20 Wojowników (dane z `gra/data/units.json` po FALI 792) w trybach `pewne` i `losowe` (N≥30 ziaren, stałe ziarna, determinizm), przez prawdziwy silnik `combat.ts` (nie własny wzór). Raport: średnie straty, % wygranych każdej strony, średnia liczba rund, per tryb. Odległość startowa i teren: płaski, bez bonusów; opisz założenia.
3. Test strażnik `hit-mode-consistency-test.cjs`: w „pewne” 100% trafień niezależnie od Obrony; w „losowe” trafienie = clamp(40+atk−def,15,75) (próbka statystyczna, tolerancja podana); czerwienieje po mutacji (kopia pliku, NIE `git checkout`).
4. Odpowiedź liczbowa na pytanie właściciela: czy w „pewne” siła łuczników vs Wojownik jest skrajna (np. 24 obrażeń/salwa deterministycznie) i jak się to ma do „losowe”.

## Kryteria binarne
- Tabela audytu kompletna (każdy plik z listy), rozbieżności jawnie wypisane albo „brak”.
- Symulacja uruchamialna jedną komendą, wyniki w raporcie (liczby, nie „wygląda”).
- Test strażnik zielony + RED po mutacji; tsc bez nowych błędów; 5 bramek referencyjnych.
- Brak zmian w `gra/src`, `gra/data`, `gra-robocza`, `WERSJE.md`.

## Zakazy
`npm run build/dev` w `gra/`, `git add -A`, `rm/rmdir/unlink` w komendach (orkiestrator sprząta), logi do /tmp, nie commituj cudzych PNG nadpisanych testami. Nie zmieniaj liczb walki. Decyzje produktowe → `DECISION_REQUIRED`.
