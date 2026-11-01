STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — weryfikacja na żywo, zero zmian w gra/src
TEMAT: R-WEB-LIVE-VERIFY-ROBOCZA-Q1
GOAL: zweryfikować w prawdziwej grze bundle `gra-robocza/Gra-ROBOCZA.html` (MD5 `fc1af15093852a9f221f75a44c86296e`, baza `c99ac58cd`) i zamknąć „NIE_ZMIERZONO żywy”.
ZMIANY/COMMIT: dokumenty i evidence (bez `gra/src`); SHA w odpowiedzi orkiestratora. Baza obrony: `0af46cdaa`.

ODPOWIEDZI NA ZARZUTY (8/8 PRZYJĘTE)
1. Pkt 1b (% lądu Kontynenty/Wyspy) — PRZYJMUJĘ. `mapMatches=false` dla 7/10 map; 30,0% i 50,0% pochodzą z mapy odtworzonej offline, nie z żywej. Status obniżony: Kontynenty i Wyspy = NIE_ZMIERZONO (żywy %); wartości offline tylko pomocniczo. Pangea 56,0–56,2% = ZGODNE (`mapMatches=true`, 7/7 stolic, 3 ziarna).
2. Pkt 3 (bieguny, Wyspy) — PRZYJMUJĘ. Dla Wysp położenia stolic z żywej gry sprawdzono na terenie z innej mapy (zgodność stolic 4/7 i 3/7). Wniosek „0 stolic AI na biegunie” obniżony do NIE_ZMIERZONO dla Wysp (najtrudniejszy przypadek: 376–567 heksów polarnych). Rzetelnie zmierzona jest Pangea: 3 ziarna, 7/7 zgodności stolic, 0 stolic AI/MP na polarnym. Kontynenty: 0 heksów polarnych, test nie dotyczy.
3. Pkt 3 (ziarna) — PRZYJMUJĘ. Twierdzenie „3 ziarna parity pokryte dla każdego typu” było nieprawdziwe: Pangea ma 4242/7777/1001; Wyspy tylko 1001 i 3333 (bez 4242/7777; dla 3333 `seedSeen=null`); Kontynenty 5 ziaren bez polaru. Sformułowanie wycofane.
4. Pkt 2 („Wolno wycinać las OFF: 0 wycinek”) — PRZYJMUJĘ. Wariant ON też daje 0 wycinek (`gate-farma-zr-on.txt`, `gate-farma-las-zr-on.txt`), więc OFF niczego nie odróżnia. Filtr `/wyrab|wycink/` (`live-verify-robocza-farm-analyze.cjs:32`) sprawdziłem względem gry: klucz wycinki w grze to `wyrab` (`typ: 'wycinka'`, `gra/src/game/ai.ts:157`, `improvement-tech.ts:167`), więc filtr jest poprawny, ale wniosek się nie zmienia. Część „OFF = zero wycinki” = NIE_ZMIERZONO. Zmierzone pozostaje E1.
5. Pkt 2 (fixture) — PRZYJMUJĘ. Log: „posadzono 6, zostało 6”, nie „cały R≤4”. Poprawny opis: fixture = las na 6 heksach; to nie jest pełny test E2/E3 (NIE_ZMIERZONO).
6. Pkt 5 (rozkład) — PRZYJMUJĘ. Realne `liveCapMin` z JSON (kolejność plików): kontynenty1001 16, 2024 18, 31337 17, 4242 15, 7777 17, pangea1001 15, 4242 15, 7777 15, wyspy1001 17, wyspy3333 15. Posortowane: 15,15,15,15,15,16,17,17,17,18; mediana 15,5 (pięć piętnastek). Wniosek „10/10 poniżej 25” bez zmian. Wiążące „przed” dla R-WEB-CAPITAL-SPACING-FIX-Q1: min 15, max 18, mediana 15,5. Zapis z 01 (mediana 16, cztery 15) unieważniony.
7. Bramki `EXIT=0` — PRZYJMUJĘ. EXIT=0 to tylko zakończenie skryptu, nie PASS. `gate-forty.txt`: EXIT=0 przy `errors 1` i `forty 0` = NIE_ZMIERZONO. `gate-farma-zr-off/zr-on/zy-on` różnią się niemal wyłącznie linią polityki i dają identyczny wynik, więc to nie trzy niezależne potwierdzenia, tylko brak wpływu profilu i opcji „Wolno wycinać las” na kolejność E1. TESTY niżej podają wynik merytoryczny.
8. Testy z dispatchu — PRZYJMUJĘ. Własny `live-verify-robocza-wizard.cjs` nie zawiera nazw obu istniejących testów; pominięcie było niezgłoszonym odstępstwem. NAPRAWIONE: uruchomiłem oba w tej rundzie (gitignorowane symlinki `gra/node_modules` do esbuild/playwright, `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium`): `evidence/gate-newgame-defaults.txt` 60 pass / 0 fail; `evidence/gate-newgame-reposition.txt` PASS (12 kart, 13 wierszy zaawansowanych, trwałość, parametry startu). Uwaga: to harness esbuild ze źródeł `gra/src`, nie bundle ROBOCZA, więc uzupełnia 14/14 z bundla, nie zastępuje go. Nadpisane przez testy zrzuty w `R-WEB-NEWGAME-DEFAULTS-Q1/evidence` cofnięte `git checkout`.

TABELA PO KOREKCIE
| # | Punkt | Status |
|---|---|---|
| 1a | Kreator: domyślny udział lądu | ZGODNE (bundle 14/14; harness źródłowy 60/60; reposition PASS) |
| 1b | Realny % lądu (Standardowy) | Pangea ZGODNE (56,0–56,2% przy celu 60%, −4 pp); Kontynenty NIE_ZMIERZONO; Wyspy NIE_ZMIERZONO (offline 30,0% / 50,0% tylko pomocniczo) |
| 2 | Farma przed trzodą | E1 ZGODNE; E2/E3 NIE_ZMIERZONO; „Wolno wycinać las OFF = zero wycinki” NIE_ZMIERZONO |
| 3 | AI na biegunach | Pangea ZGODNE (3 ziarna, 0 na polarnym); Wyspy NIE_ZMIERZONO; Kontynenty nie dotyczy |
| 4 | Forty z automatu | NIE_ZMIERZONO (2 tury, `errors 1`, 0 fortów) |
| 5 | Rozproszenie stolic PRZED | Żywa gra: 15,15,15,15,15,16,17,17,17,18 (mediana 15,5; 10/10 < 25); narzędzie przy konfiguracji domyślnej niezgodne; po dopasowaniu capMin 8/10; wiążące „przed” = pomiar żywy |

TESTY (wynik merytoryczny)
- `gate-wizard.txt` 14 pass / 0 fail; `gate-newgame-defaults.txt` 60 pass / 0 fail; `gate-newgame-reposition.txt` PASS.
- `gate-farma-*`: 0 błędów strony, 25 tur (las 20); farma przed trzodą w obu profilach; brak wycinki w ON i OFF.
- `gate-forty.txt`: 1 błąd (tura nie ruszyła), 0 fortów = NIE_ZMIERZONO.
- `gate-offline.txt`, `gate-spacing-tool.txt`: analiza wykonana; 7/10 map `mapMatches=false`, wnioski ograniczone jak wyżej.
- Bez `npm run build`/`dev`, bez pushu.

BLOKADY: forty (pkt 4), E2/E3, żywy % lądu Kontynenty/Wyspy, bieguny Wyspy — wymagają hooków (dostęp do terenu, limit miast, bramka końca tury) w `main.ts`: osobny temat z buildem.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator, weryfikacja obniżonych statusów.
DEPLOY/PUSH: NIE WYKONANO
