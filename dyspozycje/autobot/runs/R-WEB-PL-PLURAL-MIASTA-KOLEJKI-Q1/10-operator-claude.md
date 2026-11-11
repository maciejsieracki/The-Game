STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PL-PLURAL-MIASTA-KOLEJKI-Q1
GOAL: formatMiastaCount i formatKolejkiCount (gra/src/ui/formatPl.ts) odmieniają wg reguł polskich (1 / 2–4 poza 12–14 / reszta), z testem tabelarycznym 0..130 i jawnymi przypadkami granicznymi; pozostałe helpery formatPl.ts sprawdzone pod tą samą regułą.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje, czy test czerwienieje po mutacji i czy brak zmian w formatPl.ts jest zgodny z GOAL. Final Control po Evaluatorze.
DEPLOY/PUSH: NIE WYKONANO

## Ustalenia (zmierzone)

- Baza: origin/main = `6ade0f0ecae730a22d56f0b14252b2249d13363c` (HEAD worktree identyczny).
- Oryginalny dispatch `00-dispatch.md` NIE istnieje ani w origin/main, ani na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Jedyny dostępny opis zadania to `00-dispatch-DODATEK-claude.md` z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` — na nim oparto wykonanie (GOAL, KRYTERIA, ALLOWLISTA z tego pliku).
- `gra/src/ui/formatPl.ts` na main JUŻ implementuje poprawną regułę: `pluralPl` (linie 16–22) zwraca `few` tylko dla `v % 10` w 2..4 i `v % 100` poza 12..14, dla `|floor(n)|`; `formatMiastaCount` i `formatKolejkiCount` (linie 50–57) używają `pluralPl`. Stara reguła `n >= 2 && n <= 4` nie występuje w formatPl.ts.
- Pozostałe funkcje formatPl.ts (`formatJednostkiCount`, `formatTurCount`, `formatBudynkiCount`, `formatUmowyCount`) są zgodne z tą samą regułą (1 → forma jednostkowa, 2–4 poza 12–14 → forma „few”, reszta → „many”). Zgodność potwierdzona testem 0..130 (sekcja 4 testu).
- Poza formatPl.ts (poza allowlistą, NIE ruszane) pozostają lokalne kopie tej samej reguły z innymi warunkami zapisu, np. `gra/src/ui/diplomacyDealDisplay.ts:18`, `gra/src/ui/empireDetailPanel.ts:1074/3530/3886/3901/3929`, `gra/src/ui/hud.ts:961/975`, `gra/src/ui/cityPanel.ts:1000/1633`, `gra/src/ui/siegeMapPanel.ts:283`, `gra/src/ui/unitCardStatus.ts:226`, `gra/src/main.ts:21`, `gra/src/game/manpower.ts:525`, `gra/src/game/siege-surrender-forecast.ts:136`, `gra/src/game/diplomacy-penalty-preview.ts:206` (`if (n >= 2 && n <= 4)` — BEZ wykluczenia 12–14, to realny błąd dla 12–14 tur, ale poza allowlistą tego tematu), `gra/src/game/eot-event-defer.ts:97`, `gra/src/battle/siegeHud1E.ts:98`. Do zgłoszenia jako osobny temat (decyzja orkiestratora), nie naprawiane tutaj.

## Zmiany

- Kod: BRAK zmian w `gra/src/ui/formatPl.ts` (poprawka już obecna na main; zmiana nie była potrzebna do spełnienia GOAL).
- Nowy test: `gra/tools/format-pl-plural-miasta-kolejki-q1-test.cjs` (untracked, do zacommitowania).
- Raport: ten plik.
- COMMIT: zob. sekcja SHA w odpowiedzi orkiestracji (commit obejmuje wyłącznie test i raport).

## Testy (surowe liczby z wyjścia)

- Nowy test przed mutacją: `Wynik: 818 pass / 0 fail` (exit 0).
- Mutacja (tymczasowo w `formatPl.ts` linia 19 zamieniona na `if (v >= 2 && v <= 4) return few;`, czyli stara reguła bez wyjątku 12–14): `157` linii `FAIL`, `Wynik: 661 pass / 157 fail`. Test czerwienieje.
- Przywrócenie: `git checkout -- gra/src/ui/formatPl.ts`, `git status` pokazuje tylko nowy plik testu; ponowny test: `818 pass / 0 fail`.
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0, 0 linii wyjścia.
- Bramki referencyjne (z §6 R-PROC-AUTOBOT, cytowane wyniki referencyjne są stare z 2026-08-20; zmierzone dziś):
  - logic-test: `LOGIC OK (213/213)` (ref 213/213)
  - tech-tree-test: `tech-tree-test: 20 pass, 0 fail` (ref 19/19 — rozbieżność liczby asercji, wynik zielony; odnotowane)
  - research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33` (ref 33/33)
  - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)` (ref 13/13 — liczba asercji zmieniona, wynik zielony; odnotowane)
  - combat-test: `COMBAT TEST: 6/6 pass` (ref 6/6)
- Istniejący test formatPl: format-pl-signed-minus-glif-test: `13 passed, 0 failed`.
- NIE_ZMIERZONO: przeglądarka/zrzut (temat nie jest wizualny); `npm run build` nie uruchamiano (zakaz).

## Blokady

- Brak oryginalnego pliku `00-dispatch.md` w repo (patrz Ustalenia) — założenie: GOAL/KRYTERIA z DODATKU.
- Brak blokad technicznych.

## Założenia (luki w dispatchu)

- Ponieważ poprawka jest już na main, PASS-WITH-NOTES: test dowodzi poprawności i jest niezależny od implementacji, ale nie zmienia kodu. Ewentualny Evaluator może uznać, że „test czerwienieje po mutacji” wystarcza jako dowód (wykonane).
- Wartości 12–14 w `diplomacy-penalty-preview.ts:206` i pokrewne lokalne reguły uznano za poza allowlistą.
