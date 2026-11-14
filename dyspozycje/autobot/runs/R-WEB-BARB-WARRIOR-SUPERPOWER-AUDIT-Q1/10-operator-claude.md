# R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian kodu gry)
TEMAT: R-WEB-BARB-WARRIOR-SUPERPOWER-AUDIT-Q1 (zgloszenie #286)
GOAL: rozstrzygnac, czy „jednostka barbarzyncow (wojownik) z supermoca” to (a) defekt mnoznikow, (b) zamierzone reguly, czy (c) artefakt skrotu/auto-rozstrzygania.
ZMIANY/COMMIT: tylko nowe `gra/tools/barb-warrior-audit-sim.cjs` (allowlista) i ten raport. Zero zmian w `gra/src`, `gra/data`, WERSJE.md. Baza: 6e72c3c17 (origin/main).
TESTY: patrz sekcja „Wyniki”. `git diff --check` czysty. Symulacja: `N=200`, ziarna LCG 1000+k*7919 (powtarzalne), prawdziwe moduly silnika bundlowane przez esbuild 0.24.2.
BLOKADY: (1) `dyspozycje/autobot/runs/.../00-dispatch.md` NIE istnieje w origin/main; tresc zadania wzieta z DODATKU (`origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, `00-dispatch-DODATEK-claude.md`). (2) `gra/node_modules` nie istnieje w worktree; esbuild zainstalowano poza repo (katalog w scratchpad). (3) NIE_ZMIERZONO: konkretny zapis/tura/scenariusz zgloszenia — bez nich nie da sie odtworzyc „zero strat” dokladnie.
RUNDY: 1/5
NASTEPNY KROK: decyzja wlasciciela (ABC) w sekcji „Wniosek” — ewentualny temat naprawczy dopiero po jej wyniku.
DEPLOY/PUSH: NIE WYKONANO

---

## 1. Hipotezy (a/b/c) — tabela

| Hipoteza | Werdykt | Dowod |
|---|---|---|
| (a) Barbarzynca dostaje mnoznik/bonus, ktorego nie ma inna strona (trudnosc, weteran, forty) | **ODRZUCONE** dla mnoznika trudnosci i weterana | `src/game/ai-difficulty-bonus.ts:22` `qualifiesForMajorAiDifficultyBonus` = `ownerId > 0 && !isBarbarian(ownerId) && !isCityState` -> barbarzynca dostaje 1. `src/main.ts:9885` `difficultyCombatMultForOwner` zwraca 1 dla tej gałęzi. `src/main.ts:34604-34605` (`attackerDifficultyCombatMult`) -> 1 dla barbarzyncy. Brak jakiegokolwiek wyrazenia `barb` w `src/game/veteran.ts`. Fortyfikacja (`unitGetsFortifyBonus`, `src/main.ts:34295`) gateuje po `ufortyfikowanyWPolu`/`inGarnizon`, bez galezi barbarzyncow. |
| (a') Statystyki barbarzyncy != statystyki gracza tej samej jednostki | **ODRZUCONE** | Wojownik barbarzynca (`barbarians.ts:302` `unitTypeId: 'Wojownik'`) to ten sam wiersz `data/units.json` co Wojownik gracza. Brazowy barbarzynca (`LUDY_MORZA_BARB_UNIT_IDS`, `barbarians.ts:697`) to Sherden/szekelesz — tez wiersze jednostek, identyczne z tymi, ktorych moga uzyc gracze/AI. |
| (b) Zamierzone reguly (stan jednostek / brak pancerza / brak fortyfikacji) | **CZESCIOWO PRZYCZYNA** | Statystyki sa symetryczne, wiec przewaga wynika z dopasowania jednostek i z trybu rozstrzygania, nie z barbarzynskiego kodu. Wniosek o zamierzonosci zalezy od decyzji wlasciciela (patrz §5). |
| (c) Artefakt rozstrzygania bitwy (auto / losowe vs pewne) | **PRZYCZYNA (glowna)** | AUTO liczy wynik z M (`resolveAutoBattleByPower`, `auto-battle-power.ts:152`) i daje wygrana barbarzyncy 100% przy stracie zwyciezcy 27.6% (Wojownik vs Lucznik) — wynik ostry, niezalezny od losowania. Tryb „pewne” zmienia wynik ręcznej walki na 0% (Wojownik vs Lucznik) i 100% (lustro, atakujacy wygrywa). Zadna konfiguracja nie daje strat zwyciezcy <10% przy wygranej >90% (patrz §3). |

## 2. Dane (plik:linia)

- Wojownik (barbarzynca i gracz): `data/units.json` — kolumny PL `Atak 6 / Obrona 6 / Health 60 / Pancerz 4`, kolumny EN (czytane przez silnik) `meleeAttack 4 / meleeDefence 4 / health 22 / armor 2 / weaponDamage 4`. **Rozjazd danych**: kolumny PL i EN nie sa zgodne. Silnik i M (`fieldPower`, `unit-power.ts:113`) czytaja EN. Ktora wartosc wyswietla karta jednostki — NIE_ZMIERZONO w tym tematu (do sprawdzenia przez UI).
- Brak galezi barbarzyncow w `src/game/combat.ts` (`resolveCombat` 843; mnozniki tylko z `attackerDifficultyCombatMult`/`attackerVeteranBonusFrac`, przekazywane przez wywolujacego).
- Symulacja uzywa `combatUnitFromDef` (ta sama sciezka co runtime) i `fieldPower`.

## 3. Wyniki (N=200, `gra/tools/barb-warrior-audit-sim.cjs`)

Statystyki z silnika (EN):

| Jednostka | Atak | Obrona | HP | Pancerz | fieldPower total |
|---|---|---|---|---|---|
| Wojownik (barb i gracz) | 4 | 4 | 22 | 2 | 27 |
| Łucznik | 2 | 2 | 16 | 1 | 19 |
| Wojownik Sherden (barb, Brąz) | 6 | 5 | 28 | 3 | 35.5 |
| Wojownik szekelesz (barb, Brąz) | 5 | 5 | 28 | 3 | 32 |
| Włócznik | 5 | 8 | 32 | 6 | 44 |
| Wojownik z mieczem i tarczą | 6 | 5 | 28 | 4 | 39 |
| Falanga | 7 | 12 | 40 | 8 | 58.5 |
| Miecznik galijski | 8 | 2 | 38 | 3 | 35 |

Wygrana barbarzyncy % (sredni % utraty HP zwyciezcy-barbarzyncy):

| Epoka | Barbarzynca | Gracz | Format | Reczne losowe | Reczne pewne | AUTO |
|---|---|---|---|---|---|---|
| Kamien | Wojownik | Łucznik | 1v1 | 71.5% (44.8%) | 0.0% | 100% (27.6%) |
| Kamien | Wojownik | Łucznik | 3v3 | 50.5% (60.9%) | 0.0% | 100% (27.6%) |
| Kamien | Wojownik | Wojownik | 1v1 | 54.0% (37.5%) | 100% (54.5%) | 0% (remis M) |
| Kamien | Wojownik | Wojownik | 3v3 | 61.5% (55.0%) | 100% (59.1%) | 0% (remis M) |
| Braz | Sherden | Włócznik | 1v1/3v3 | 0% | 0% | 0% |
| Braz | Sherden | Wojownik z mieczem i tarczą | 1v1 | 6.0% | 0% | 21% (upset 21%) |
| Braz | Sherden | Wojownik z mieczem i tarczą | 3v3 | 0.5% | 0% | 21% (upset 21%) |
| Braz | szekelesz | Włócznik / Wojownik z mieczem i tarczą | 1v1/3v3 | 0% | 0% | 0% |
| Zelazo | Wojownik | Falanga / Miecznik galijski | 1v1/3v3 | 0% | 0% | 0% |

Kontrola roli 1v1 (wygrana ATAKUJACEGO, role odwrocone):

| Para (atakujacy vs obronca) | Losowe | Pewne |
|---|---|---|
| Łucznik vs Wojownik | 33.0% | 100% |
| Wojownik vs Wojownik | 54.0% | 100% |
| Włócznik vs Wojownik Sherden | 100% | 100% |
| Wojownik z mieczem i tarczą vs Wojownik Sherden | 96.0% | 100% |
| Włócznik vs Wojownik szekelesz | 100% | 100% |
| Wojownik z mieczem i tarczą vs Wojownik szekelesz | 100% | 100% |
| Falanga vs Wojownik | 100% | 100% |
| Miecznik galijski vs Wojownik | 100% | 100% |

Konfiguracje „barbarzynca >90% wygranych przy stracie zwyciezcy <10%”: **brak**.

Interpretacja:
- Tryb pewne: atakujacy wygrywa kazde lustro 100% (inicjatywa). Dotyczy kazdego atakujacego (gracz tez), nie tylko barbarzyncow. Barbarzynca zawsze atakuje, wiec to dziala na jego korzysc, ale mechanizm jest ogolny.
- Tryb losowe: przewaga Wojownika nad Lucznikiem (71.5%) przy stracie 44.8% HP — to nie jest „zero strat”.
- AUTO: model M daje 100% przy stratach 27.6% dla Wojownik vs Lucznik. Winner-loss (`winnerLossPct`, `auto-battle-power.ts:104`) = `L_MAX / ratio^p_atk` z L_MAX 0.42, p 1.2. Strata zwyciezcy spada ponizej 10% dopiero przy ratio ~ 3.3. Zadna para z tabeli nie ma ratio >= 3.3, wiec „prawie zero strat” w AUTO nie wystepuje dla tych jednostek.
- Rozbieznosc AUTO vs ręczne: Wojownik vs Lucznik — AUTO 100%, ręczne losowe 71.5%. Model M upraszcza ranged/HP, co przesuwa wynik.

## 4. Wniosek

**Wniosek: zamierzone (w sensie braku barbarzynskiego mnoznika) + artefakt modelu rozstrzygania.** Nie znaleziono barbarzynskiego mnoznika w zadnej sciezce (trudnosc, weteran, fort, statystyki). Nie udalo sie odtworzyc „praktycznie bez strat” dla zadnej konfiguracji z tabeli: najblizej jest AUTO Wojownik vs Lucznik (100% wygranej, 27.6% strat), co przy zgloszeniu „bez strat” moze byc widziane jako duzy rozmiar przewagi i brak realnej reakcji gracza.

Mechanizm, ktory warto zweryfikowac na zapisie zgloszenia: (1) tryb AUTO, (2) gracz bez pancerza/fortu z jednostkami o M ~ 19 (Lucznik), (3) przewaga M przy wyzszej liczebnosci strony barbarzynskiej. NIE_ZMIERZONO: zapis/tura zgloszenia — bez nich nie ma dowodu, ze to ten sam przypadek.

## 5. Rekomendacja ABC dla wlasciciela (nie wdrazam)

- Pytanie A: czy tryb AUTO ma dawac 100% wygranej przy stratach 27% dla przewagi M ~1.4 (obecne), czy zmienic krzywa strat / progi upsetu (`UPSET_R_THRESHOLD`, `UPSET_CHANCE`, `L_MAX`, `p_atk`) — to decyzja balansu.
- Pytanie B: czy tryb „pewne” ma zachowac inicjatywe atakujacego (100% w lustrze), czy ja zniwelowac.
- Pytanie C: rozjazd kolumn PL (Atak 6 / Health 60) i EN (meleeAttack 4 / health 22) w `data/units.json` — ktora wartosc jest kanoniczna dla karty jednostki.
- Minimalna poprawka (tylko jesli wlasciciel wybierze A): zmiana wspolczynnika `p_atk` lub `L_MAX` w `gra/data/auto-battle-params.json` (1 linia), bez zmian w kodzie.

## 6. Powtarzalna komenda

```
cd gra && ESBUILD_BIN=<sciezka>/esbuild N=200 node tools/barb-warrior-audit-sim.cjs
```

Skrypt bundluje `src/game/{combat,unit-power,auto-battle-power,hit-mode}.ts` do katalogu tymczasowego (sprzatany przy wyjsciu) i nic nie zapisuje w repo.

## 7. UWAGI-DLA-ORKIESTRATORA

- `00-dispatch.md` brakuje w origin/main — prosze o uzupelnienie (orkiestrator decyduje).
- Rozjazd PL/EN w `units.json` (§2) — poza zakresem tego tematu; kandydat na osobny temat danych.
- Symulacja 3v3 jest przyblizeniem (sekwencyjne 1v1, zwyciezca zostaje z pozostalym HP); brak terenu/fortu/morale w tej serii.
