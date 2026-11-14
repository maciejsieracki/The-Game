# R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 — Final Control (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian kodu gry)
TEMAT: R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 (zgloszenie #286)
GOAL: rozstrzygnac, czy "barbarzynski wojownik z supermoca" to (a) defekt mnoznikow, (b) zamierzone reguly, czy (c) artefakt auto-rozstrzygania bitwy.
ZMIANY/COMMIT: kandydat 4becb9180073f78b72aa67a111b8047cf20e3c61 (potomek bazy 6e72c3c17: `git merge-base --is-ancestor` = tak). Diff vs baza: 3 pliki, +482 linii: `gra/tools/barb-warrior-audit-sim.cjs`, `runs/.../10-operator-claude.md`, `runs/.../30-obrona-claude.md` — wszystko w allowliscie. Zero zmian w `gra/src`, `gra/data`, WERSJE.md, gra-robocza, rust-port.
TESTY:
- `git diff --check 6e72c3c17 4becb9180`: czysty.
- Samodzielne uruchomienie: `cd gra && ESBUILD_BIN=/tmp/claude-0/nm/node_modules/esbuild/bin/esbuild N=200 node tools/barb-warrior-audit-sim.cjs` -> exit 0, 66 linii wyjscia. Liczby zgodne z raportami: Wojownik vs Lucznik 1v1 losowe 71.5% (44.8%), AUTO 100% (27.6%); os liczebnosci AUTO 2v1 12.0%, 3v1 7.4%, 6v2 7.4%; linia "AUTO 3v1; AUTO 6v2" obecna.
- Dowody plik:linia sprawdzone samodzielnie: `ai-difficulty-bonus.ts:22` (barbarzynca nie dostaje bonusu trudnosci), `combat.ts:203-210` (silnik czyta kolumny EN `health`/`meleeAttack`), `units.json` Wojownik: PL Atak 6/Obrona 6/Health 60/Pancerz 4 vs EN 4/4/22/2, `unitInfoCard.ts:291-294` i `unitAdapter.ts:239-242` (karta czyta kolumny PL), `barbarians.ts:302` (`unitTypeId: 'Wojownik'`), `auto-battle-power.ts:104-115` (strata zwyciezcy z `ratio`).
- tsc --noEmit i 5 bramek referencyjnych: NIE_ZMIERZONO — `gra/node_modules` nie istnieje w worktree, a diff nie dotyka zadnego `.ts`/`.json` gry (baza == kandydat dla calego `gra/src` i `gra/data`), wiec stan bramek jest identyczny z baza.
- Weryfikacja w Chromium: nie dotyczy (temat bez UI).
BLOKADY: brak blokujacych. NIE_ZMIERZONO (z powodem): zapis/tura zgloszenia (brak danych od wlasciciela); epoka, weteran, teren, fort w symulacji (surowe wiersze `units.json`); `00-dispatch.md` nie ma w origin/main.
RUNDY: 2/5 (FC po r1 Evaluatora + obronie)
NASTEPNY KROK: integracja orkiestratora (dokladane sa tylko nowe pliki; origin/main poszedl dalej do 8e97928df, wiec merge zamiast FF), potem pytania ABC do wlasciciela.
DEPLOY/PUSH: NIE WYKONANO

## Rozstrzygniecie zarzutow Evaluatora

| Nr | Decyzja | Uzasadnienie |
|---|---|---|
| 1 os liczebnosci | ODDAL | Sekcja 7 skryptu mierzy 1v1..6v2; AUTO 3v1 i 6v2 = 100% wygranej, strata 7.4%; odtworzone przeze mnie 1:1. Poprzedni wniosek "brak konfiguracji" uchylony. |
| 2 macierz | ODDAL | Dopisano Wojownika barb (Braz/Zelazo) vs Wlocznik, Lucznik, Wojownik z mieczem; brak niezaleznosci od epoki jawnie oznaczony NIE_ZMIERZONO z powodem technicznym. |
| 3 karta PL vs silnik EN | ODDAL | Hipoteza (d) dodana z plik:linia (zweryfikowane); wplyw na zgloszenie NIE_ZMIERZONO — uczciwie. |
| 4 formalia | ODDAL z uwaga | Werdykty (a)-(d) naleza do zbioru; wynik AUTO widoczny liczbowo. Uwaga: (b) nadal ma dopisek "czesciowa" w nawiasie. |

Zadnego NAPRAW — brak FAIL.

## Uwagi (nie blokuja)

1. `30-obrona-claude.md` jest wersja obowiazujaca. `10-operator-claude.md` zawiera nieaktualne tezy ("brak konfiguracji <10%", (b) "CZESCIOWO", Wniosek §4). Przy konflikcie obowiazuje 30.
2. Wniosek w 30 nie ma jednej linii "zamierzone: ..., rekomendacja ABC" — tresc jest (brak barbarzynskiego mnoznika = zamierzone; mechanizm odtwarzalny = AUTO przy przewadze liczebnej ok. 3,3:1+; ABC A-D). Orkiestrator powinien przekazac wlascicielowi w jednej linii: "zamierzone (symetryczny model AUTO), nie defekt barbarzyncow; rekomendacja ABC: A-D".
3. Symetria: przewaga liczebna w AUTO dziala identycznie dla gracza i barbarzyncow (ten sam `resolveAutoBattleByPower`); "supermoc" wynika z rozmiaru oboz (2 jednostki, +1 na wyzszej trudnosci, x3 w oknie Ludow Morza) i rzadkosci obrony gracza, nie z bonusu.
4. W trybie "pewne" Wojownik-atakujacy vs Lucznik daje 0%, a Lucznik-atakujacy vs Wojownik 100% — zarowno raport, jak i obrona tego nie wyjasniaja (podejrzenie: pierwszy strzal dystansowy w modelu deterministycznym). Poza zakresem ("supermoc" barbarzyncy tego nie tlumaczy), kandydat na osobny audyt.
5. Przy 100% wygranej AUTO na ratio >= 1,2 (Wojownik vs Lucznik, ratio 1,42) strata 27,6% — decyzja balansu (ABC A), nie defekt.

## UWAGI-DLA-ORKIESTRATORA

- `00-dispatch.md` nadal brak w origin/main.
- Rozjazd PL/EN w `units.json` (karta pokazuje 6/60, silnik liczy 4/22) — kandydat na osobny temat danych/UI, ABC C.
- Zadnych nowych sesji/zadan nie zakladalem.
