STATUS: PASS
DOMAIN: GAME/PROCESS
TEMAT: R-WEB-TEST-DEBT-BUDYNEK-GARNIZON-AI1-E4-DIAG-Q1
GOAL: dla każdej z dwóch czerwonych asercji (AI1, E4) w gra/tools/budynek-garnizon-test.cjs ustalić z dowodem, czy to (a) przestarzały test po świadomej zmianie, (b) błąd kodu, czy (c) fixture; naprawić zgodnie z wynikiem.
BAZA: e39dcd1f8d3994c18539a1244ce074b8c2c26205 (origin/main, ancestor HEAD: TAK).
ZMIANY/COMMIT: allowlista = gra/tools/budynek-garnizon-test.cjs (jedyny zmieniony plik kodu) + ten raport. Kod w gra/src NIE zmieniony (mutacje w src cofnięte z kopii, git diff src pusty). SHA: patrz pole sha w odpowiedzi orkiestratora (commit na gałęzi detached od e39dcd1f8).

## Dowody diagnozy

### [AI1] — KLASA (a): PRZESTARZAŁY TEST po świadomej zmianie
- Asercja wymagała obecności `const infraOrder = [ ... ];` w src/game/ai.ts.
- Lista została USUNIĘTA świadomie przez commit 25c44acde („Integracja: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1", kryterium 1: zero zaszytych id jako źródła kandydatów). Diff tego commita zawiera `-      const infraOrder = [` i `-      for (let i = 0; i < infraOrder.length; i++) {`.
- Komentarze w ai.ts (ok. l. 2038, 2189, 2236, 2305) potwierdzają zamierzony następca: grupowe punktowanie w collectAvailableBuildingCandidates + bramka „miasto-państwo: poza grupą 'Wojsko i obrona' dopiero po dopełnieniu garnizonu".
- Naprawa: stara kotwica tekstowa zastąpiona asercjami ZACHOWANIA (symulacja wyboru budowy AI, wzorem ai-produkcja-pokrycie-katalogu-test.cjs, bundle ai.ts przez esbuild do tools/):
  - [AI1] ai.ts nie zawiera już zaszytej listy infraOrder (sanity, z odwołaniem do 25c44acde).
  - [AI2] miasto-państwo z dopełnionym garnizonem (2 miecznicy, ownerId 4): AI WYBIERA `garnizon`.
  - [AI3] miasto-państwo bez garnizonu: `garnizon` stłumiony (grupa „Prawo i administracja" poza „Wojsko i obrona", ai.ts ~2189).
- Intencja nie osłabiona: test nadal pilnuje, że garnizon trafia do budowy miast-państw dopiero po dopełnieniu garnizonu; teraz robi to na wyniku wyboru, nie na obecności tekstu.

### [E4] — KLASA (a): PRZESTARZAŁY MATCHER po zmianie karty (nie błąd kodu)
- Asercja szukała `/Utrzymanie/` (wielka litera) w tekście karty.
- Karta buduje teraz sekcję „Koszt utrzymania" z wierszem „Co turę" (src/ui/entityCards/buildingAdapter.ts, sekcja 'cost-upkeep', linie ~436-444). Zmiana etykiety po stronie renderu, nie brak danych.
- Zrzut tekstu karty z uruchomienia (przed naprawą): `...Koszt utrzymaniaCo turę4 Pieniądz + 2 Drewno / turęPrzyrost za poziom+1 Pieniądz pkt / poziom...` — wiersz istnieje i ma wartość.
- Wartość 4 Pieniądz nie jest błędem karty: buildingUpkeep (src/game/economy-upkeep.ts:640) = floor(utrzymanie 2 × R_STAWKI_FALA2_MULT=2) × mnożnik ery. Karta pokazuje wynik silnika (ta sama funkcja, którą liczy gra). Odnotowuję jako obserwację, bez zmiany.
- Naprawa: matcher `/Koszt utrzymania\s*Co turę\s*\d+\s*Pieniądz/` (sekcja + wiersz + wartość w Pieniądzu), komunikat asercji zaktualizowany.

## Mutacje (kryterium b) — ZMIERZONO
Źródła src przejściowo zmutowane (kopie .bak w scratchpad, przywrócone, git status: tylko test):
- M1 buildingAdapter.ts: tytuł sekcji „Koszt utrzymania" → „Koszty" → E4 CZERWONA (wynik: 81 pass / 2 fail: AI2 + E4).
- M2 ai.ts: `if (opts.defensiveCopy && !csGarrisonMet)` → `if (opts.defensiveCopy)` → AI2 CZERWONA (ta sama runa).
Przed naprawą (stan bazowy): 79 pass / 2 fail (AI1, E4), zgodnie z dispatchem.

## TESTY — ZMIERZONO
- `node tools/budynek-garnizon-test.cjs` (z gra/, po `npm ci --ignore-scripts`): **83 pass, 0 fail, exit 0** (baza: 79/2).
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `git diff --check`: czysto.
- Mutacje M1, M2: patrz wyżej (czerwone jak wymagane).
- Dodatkowe testy UI dotknięte? NIE — src nie zmieniony po naprawie, więc lista dotkniętych testów UI nie dotyczy.
- 5 bramek referencyjnych z §6 R-PROC-AUTOBOT: NIE ZMIERZONO (poza garnizon-test i tsc nie uruchamiałem pozostałych bramek; wymagają osobnego przebiegu orkiestratora).

## BLOKADY
Brak blokad merytorycznych. Nie ruszano gra/data/** ani gra-robocza, WERSJE.md, build/dev.

## RUNDY
1/5 (ostatni werdykt: n/d — runda Operatora; decyzja nie jest wymagana, klasa (a) rozstrzygnięta dowodem).

## UWAGI-DLA-ORKIESTRATORA
- W worktree zostały (ignorowane przez git, do sprzątnięcia): gra/node_modules (npm ci --ignore-scripts, 71 pakietów), gra/tools/.budynek-garnizon-{node,ai}-{entry.ts,bundle.cjs}, gra/tools/.budynek-garnizon-ai-*. Sprzątanie robi orkiestrator.
- Zanotowane do rozważenia (poza zakresem, nie wpisywane do kolejki): Garnizon w karcie pokazuje 4 Pieniądz/turę przy danych utrzymanie 2 (efekt R_STAWKI_FALA2_MULT × era). Jeśli właściciel chce pokazywać wartość bazową, to jest decyzja, nie błąd.

NASTĘPNY KROK: bramka orkiestratora — integracja commita do FC/Evaluatora (Sonnet) zgodnie z obiegiem; deploy NIE.
DEPLOY/PUSH: NIE WYKONANO
