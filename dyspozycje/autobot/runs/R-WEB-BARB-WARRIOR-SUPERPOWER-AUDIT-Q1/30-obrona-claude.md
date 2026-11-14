# R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 — obrona Operatora (runda 1/5, odpowiedź na zarzuty Evaluatora r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian kodu gry)
TEMAT: R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 (zgłoszenie #286)
GOAL: rozstrzygnąć, czy „barbarzyński wojownik z supermocą” to (a) defekt mnożników, (b) zamierzone reguły, czy (c) artefakt rozstrzygania bitwy.
ZMIANY/COMMIT: `gra/tools/barb-warrior-audit-sim.cjs` (rozszerzenie: uzupełnione wiersze macierzy + sekcja 7 „oś liczebności”) oraz ten raport. Zero zmian w `gra/src`, `gra/data`, WERSJE.md. Baza: 83ebe9656 (kandydat Operatora r1).
TESTY: `cd gra && ESBUILD_BIN=/tmp/claude-0/nm/node_modules/esbuild/bin/esbuild N=200 node tools/barb-warrior-audit-sim.cjs` → exit 0, surowe wyjście w `/tmp/claude-0/nm/barb-run1.txt`. `git diff --check` czysty. tsc / bramki referencyjne: NIE_ZMIERZONO (zmiana nie dotyka `.ts`; `gra/node_modules` brak w worktree).
BLOKADY: (1) NIE_ZMIERZONO: zapis/tura zgłoszenia. (2) NIE_ZMIERZONO: symulacja nie modeluje modyfikatorów epoki, weterana, terenu ani fortu (używa surowych wierszy `units.json` przez `combatUnitFromDef`); stąd identyczne wyniki „Brąz/Żelazo Łucznik” i „Kamień Łucznik”. (3) `00-dispatch.md` brak w origin/main (treść z DODATKU).
RUNDY: 2/5 (odpowiedź na r1)
NASTĘPNY KROK: Evaluator r2 na 30-obrona-claude.md; potem decyzja ABC właściciela (sekcja „Wniosek zaktualizowany").
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

### Zarzut 1 (oś liczebności; wniosek „brak konfiguracji >90%/<10%” zbyt mocny) — PRZYJMUJĘ

Dowód przyjętego zarzutu: w poprzedniej wersji wszystkie walki 3v3 miały równą liczebność, więc ratio M nie zmieniało się względem 1v1. Oś liczebności nie była zmierzona, a wniosek „brak” był wnioskiem z braku pomiaru.

Poprawka: nowa sekcja 7 skryptu (Kamień, Wojownik barbarzyński A vs Łucznik D, AUTO na M = suma `fieldPower.total`, N=200):

| A vs D | RĘCZNE losowe: wygrana % (strata zw. %) | RĘCZNE pewne | AUTO: wygrana % (strata zw. %) | M_A / M_D |
|---|---|---|---|---|
| 1v1 | 71.5% (44.8%) | 0.0% | 100.0% (27.6%) | 27.0 / 19.0 |
| 2v1 | 91.5% (28.5%) | 0.0% | 100.0% (12.0%) | 54.0 / 19.0 |
| 3v1 | 98.5% (21.4%) | 0.0% | **100.0% (7.4%)** | 81.0 / 19.0 |
| 2v2 | 54.0% (55.6%) | 0.0% | 100.0% (27.6%) | 54.0 / 38.0 |
| 3v2 | 87.0% (46.5%) | 0.0% | 100.0% (16.9%) | 81.0 / 38.0 |
| 6v2 | 100.0% (26.1%) | 0.0% | **100.0% (7.4%)** | 162.0 / 38.0 |
| 3v3 | 50.5% (60.9%) | 0.0% | 100.0% (27.6%) | 81.0 / 57.0 |

Wiersze spełniające kryterium „barbarzyńca >90% wygranych przy stracie zwycięzcy <10%”: **AUTO 3v1 i AUTO 6v2** (wiersz wyjścia: `AUTO 3v1; AUTO 6v2`). Wynik AUTO 3v1 (100%, 7.4%) jest zgodny z pomiarem Evaluatora (ratio 4.263, strata 7.37%). Mechanizm jest potwierdzony: `winnerLossPct` spada poniżej 10% przy ratio ok. 3.3, a przewaga liczebna podnosi ratio M.

Ręczne 3v1 (sekwencyjne 1v1, przybliżenie) daje 98.5% wygranej, ale ze stratą 21.4%, więc nie spełnia kryterium. Kryterium spełnia tylko AUTO.

### Zarzut 2 (niepełna macierz) — PRZYJMUJĘ

Dodano do `CONFIGS`:
- Brąz: zwykły barbarzyński `Wojownik` (barbarians.ts:302) vs Włócznik, Łucznik, Wojownik z mieczem i tarczą.
- Żelazo: zwykły `Wojownik` vs Łucznik.

Wyniki (N=200; wygrana barbarzyńcy, ręczne losowe / pewne / AUTO):
- Brąz Wojownik vs Włócznik: 0% / 0% / 0% (1v1 i 3v3).
- Brąz Wojownik vs Wojownik z mieczem i tarczą: 0% / 0% / 0% (1v1 i 3v3).
- Brąz i Żelazo Wojownik vs Łucznik: 71.5% (44.8%) / 0% / 100% (27.6%) w 1v1 (identyczne z Kamieniem, bo symulacja nie modeluje epoki; patrz BLOKADY 2).

Braki po uzupełnieniu: Łucznik gracza w Brązie i Żelazie jest tym samym wierszem `units.json`, więc wynik nie jest niezależny od epoki. Modyfikatorów epoki nie zmierzono (NIE_ZMIERZONO, BLOKADY 2). Brak też Wojownika Sherden/szekelesz vs Łucznik — NIE_ZMIERZONO: nie ma ich w macierzy z dispatchu i nie zmieniają wniosku (Sherden/szekelesz przegrywają z Włócznikiem i Wojownikiem z mieczem we wszystkich trybach, patrz wiersze Brąz).

### Zarzut 3 (rozjazd kolumn PL/EN w karcie jednostki) — PRZYJMUJĘ

Dowód (sprawdzone w tej rundzie):
- `gra/src/ui/unitInfoCard.ts:291-294` czyta `unit.Atak`, `unit.Obrona`, `unit.Health`.
- `gra/src/ui/entityCards/unitAdapter.ts:239-242` czyta `unit.Atak`, `unit.Obrona`, `unit.Health`, `unit.Pancerz` (kolumny PL).
- `gra/src/game/combat.ts:203-210` (`combatUnitFromDef`) czyta `meleeAttack`, `meleeDefence`, `health`, `armor`, `weaponDamage` (kolumny EN).
- `gra/data/units.json`, wpis `Wojownik`: PL `Atak 6 / Obrona 6 / Health 60 / Pancerz 4`; EN `meleeAttack 4 / meleeDefence 4 / health 22 / armor 2`.

Werdykt hipotezy (d) „percepcja: karta pokazuje inne liczby niż silnik”: **PRZYCZYNA (potwierdzona rozbieżność danych; wpływ na zgłoszenie NIE_ZMIERZONO)**. Karta pokazuje Atak 6 / HP 60, silnik liczy 4 / 22. Ta sama rozbieżność dotyczy wszystkich jednostek z `units.json`, więc nie tłumaczy przewagi barbarzyńcy sama w sobie. Może jednak wyjaśniać, dlaczego gracz odbiera wynik jako „supermoc”. Potwierdzenie wymaga zrzutu karty w UI (poza zakresem tego audytu bez przeglądarki).

### Zarzut 4 (uchybienia formalne) — PRZYJMUJĘ

- Hipoteza (b) była oznaczona „CZĘŚCIOWO PRZYCZYNA”, co nie należy do dozwolonego zbioru. Werdykt zmieniony na **PRZYCZYNA**: symetryczne statystyki jednostek i brak fortyfikacji/terenu w symulacji dają przewagę Wojownika nad Łucznikiem w walce ręcznej (71.5%, strata 44.8%). Czy to zamierzone, jest pytaniem do właściciela (ABC pkt A), a nie werdyktem technicznym.
- Wynik AUTO „pewne” jest teraz liczbowo widoczny w tabeli (sekcja 3 i 7). W trybie „pewne” wygrywa zawsze atakujący w lustrze (100%), a w tabeli z zarzutu jest to 0% vs 100% dla Wojownika jako atakującego.

## Wniosek zaktualizowany

- (a) defekt mnożnika barbarzyńskiego: **ODRZUCONE** (bez zmian; `ai-difficulty-bonus.ts:22`, `main.ts:9885`, `main.ts:34604-34605`).
- (b) zamierzone reguły symetrycznych statystyk: **PRZYCZYNA** (częściowa; zamierzoność to decyzja ABC).
- (c) artefakt rozstrzygania AUTO przy przewadze liczebnej: **PRZYCZYNA (główna)**. AUTO daje 100% wygranej przy stracie zwycięzcy 7.4% dla 3v1 i 6v2 (Wojownik vs Łucznik). Przy równej liczebności AUTO daje 27.6% straty.
- (d) rozjazd kolumn PL/EN w karcie: **PRZYCZYNA (dane potwierdzone; wpływ NIE_ZMIERZONO)**.

Odpowiedź na zgłoszenie: „praktycznie bez strat” jest odtwarzalne w trybie AUTO przy przewadze liczebnej 3:1 lub 6:2 (strata zwycięzcy ok. 7%). Bez zapisu zgłoszenia nie stwierdzam, że to ten sam przypadek (NIE_ZMIERZONO).

Rekomendacja ABC dla właściciela (nie wdrażam):
- Pytanie A: czy tryb AUTO ma dawać 100% wygranej przy stracie 7% dla przewagi liczebnej (ratio ok. 4.3), czy ograniczyć wpływ liczebności (`L_MAX`, `p_atk` w `gra/data/auto-battle-params.json`, lub osobny próg).
- Pytanie B: czy tryb „pewne” ma zachować inicjatywę atakującego (100% w lustrze).
- Pytanie C: która wartość w `units.json` (PL: Atak 6 / HP 60, czy EN: meleeAttack 4 / health 22) jest kanoniczna dla karty; osobny temat danych.
- Pytanie D (nowe): czy 3v1 Wojownika barbarzyńskiego przeciw Łucznikowi powinno kończyć się wygraną bez strat, czy to zamierzone.

## Powtarzalna komenda

```
cd gra && ESBUILD_BIN=/tmp/claude-0/nm/node_modules/esbuild/bin/esbuild N=200 node tools/barb-warrior-audit-sim.cjs
```

## UWAGI-DLA-ORKIESTRATORA

- `00-dispatch.md` nadal brak w origin/main (treść zadania z DODATKU).
- Rozjazd PL/EN w `units.json` jest poza zakresem tego audytu; kandydat na osobny temat danych.
- Symulacja nie modeluje epoki, weterana, terenu ani fortu; wyniki dotyczą surowych statystyk jednostek.
