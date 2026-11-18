# R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1 — Evaluator (adwersarialny), runda 1

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BATTLE-SETUP-UNITS-Q1
GOAL: port rozstawienia jednostek (_placeUnits / _placeSiegeDefenders / _repositionSiegeAttackers + initialBattleSlots)
      wg pinu 07d2fbd72, pozycje bajt w bajt z wykonaniem tekstu pinu
ZMIANY/COMMIT: oceniany kod 3beb05068c16776fe8c62fd0f84fee0dbf6325e4 + raport 253a5565c (galaz rust-port-wip/bsetupunits-r1,
      baza 789d49bd80ad8d59696ffbbea4dccb9de886b869 = dispatch); Evaluator nie zmienia kodu, tylko ten raport
      (galaz rust-port-wip/bsetupunits-ev1, worktree wf_61a2a56a-82f-2)
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; trojka bramek 9+15+7 EXIT 0; pelny cargo test --all-targets
      --no-fail-fast (partiami, setsid nohup) EXIT=0: 538 binarek, 4051 passed, 0 failed, 1 ignored (istniejacy
      p6_order_lane::e2e::dump_tick1_econ_for_web_generator); generator odtworzony: MD5 wektorow identyczne;
      mutanty Evaluatora 31: 23 zabite, 4 rownowazne/niewazne (E03, E10, E30 z argumentu; E14 ta sama wartosc stalej),
      4 NIE-ROWNOWAZNE PRZEZYLY (E12, E16, E27, E32)
BLOKADY: 4 przezywajace mutanty nierownowazne = luki wektorow na granicach galezi pinu (§4)
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 (ten sam ID): dopisac scenariusze z §5 do generatora, zregenerowac wektory, mutanty E12/E16/E27/E32
      musza byc zabite; potem Evaluator r2
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, allowlista, zakazy

* Baza galezi Operatora: `git merge-base rust-port-wip/bsetupunits-r1 origin/rust-port/parity-v2` = `789d49bd8…` = SHA z
  dispatchu (parity-v2 przesunela sie od tego czasu na `25ce36748…`, nie dotyczy oceny).
* `git diff --name-only 789d49bd8 253a5565c`: tylko `battle_setup_units.rs`, `battle_setup_units_formation.rs`, 2 linie
  `pub mod` w `domain/mod.rs`, `tests/p6_battle_setup_units.rs`, `p6_battle_setup_units_gen.mjs`,
  `p6_battle_setup_units_vectors/{vectors,renderer_parity}.json`, raport runu. Zgodne z allowlista; T5a `battle_setup*.rs`,
  `siege_tactics_loop.rs`, `renderer/`, `view-model/`, `bridge.rs`, `Cargo.*`, `gra/**`, `REJESTR-RUST.md` nietkniete.
  Dispatch nie ma sekcji „Pliki spoza allowlisty"; brak plikow spoza.
* Brak `#[ignore]` w nowych plikach; brak oslabionych asercji (porownanie pelnych struktur `PlacedUnit` i wpisow
  `occByKey`). Trailery commitow: tylko `Claude-Session:`.

## 2. Bramki odtworzone (`rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target w scratchpadzie)

| Bramka | EXIT | Wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | — |
| `cargo test --test p6_battle_setup --test p6_battle_setup_units --test bridge_contract` | 0 | 15 + 7 + 9 passed |
| pelny `cargo test --all-targets --no-fail-fast` (9 partii `--test` po 60 + `--lib --benches`, binarki usuwane po partii, dysk 8,7-8,9 GB) | 0 | 538 binarek, 4051 passed, 0 failed, 1 ignored (istniejacy) |
| `node rust-port/engine/tests/p6_battle_setup_units_gen.mjs` (straznik SHA plikow i wycinkow przechodzi) | 0 | `git status` czysty, MD5 `aa7920a4…` / `ab288df6…` = raport Operatora |

Renderera nie budowano (temat go nie dotyka; brak bramki renderera w dispatchu).

## 3. Zgodnosc z pinem (czytane `git show 07d2fbd72:…`)

Przeczytane linia po linii: `_placeUnits` `:5276-5553`, `_placeSiegeDefenders` `:4442-4744`, `_repositionSiegeAttackers`
`:4427-4434`, `isMounted`/`isPrimaryRanged`/`initialBattleRoleOf`/`isSiegeUnit`/`normName`/`_isCatapult`,
`attackRange`/`isRanged`, `DEPLOY_*`, `formationRules.ts` (`classifyInitialBattleRole`, `initialBattleSlots` z
`wingRank`, `initialBattleFormation`). Port jest wierny: kolejnosc warunkow, pasma skrzydel (oba warianty z
`Infinity`), odciecie `140 - 3|dr| <= best`, kandydaci `[fwd]` / `[fwd, back]`, `formationRank = |idealCol - frontCol|`,
`Math.round` / `Math.floor` w rzedach korony, `placeOne` (`+dr` przed `-dr`, petla kolumn `dc < 5` po `rLo..rHi`),
semantyka `Map.set` w `Occupancy`, `slice(0, 500)`. Nie znalazlem rozbieznosci kodu z pinem.

Generator: wykonuje TEKST pinu (transpilacja TS, `new Function`, `require` zablokowany), straznik SHA-256 4 calych plikow
i wycinkow `battleScene.ts` z kontrola pierwszej/ostatniej linii; stuby tylko 3D/paski/statystyki nieczytane przy wyborze
pola; `Math.random` rzuca wyjatek (0 wywolan, D-BS-3). Zakresy wycinkow T5a identyczne z `p6_battle_setup_gen.mjs`.
Mur we wszystkich polach wektorow = `{wallCol 40, rowLo 0, rowHi 155, gateRow 77}` (jedyna geometria osiagalna w pinie),
co potwierdza argument rownowaznosci M19 Operatora.

Decyzje dispatchu: `RollSource` niepotrzebny (brak RNG — sprawdzone wykonaniem), no-op `_repositionSiegeAttackers`
zachowany i wolany, galaz polowa w zakresie (wspolna `place`), producent DTO / adapter / `FieldMoveTerrain` poza zakresem
(dlugi D-T5b-1..7). `arrangeFlankCavalry` w pinie istnieje tylko w komentarzu — potwierdzam.

## 4. Mutanty Evaluatora (wlasne, rozne od M01-M28 Operatora; skrypt `scratchpad/bsetupunits/ev/mut.py`, kazdy = jedna podmiana + `cargo test --test p6_battle_setup_units` + przywrocenie; `git status` czysty po przebiegu)

Zabite (23): E01 brak galezi dowodcy; E02 korona bez `!isSiegeUnit`; E04 reszta z katapultami; E06 katapulty zawsze w
pierwszym rzedzie; E07 krok korony bez `-1`; E08 `round`→`floor` w rzedzie korony; E09 rozstawienie gracza bez warunku
strony; E11 korpus liczony z jazda; E13 `Occupancy.set` przenosi klucz na koniec; E15 `floor`→`ceil` w `layBand`;
E17 `wingRowCount` max 2; E18 skrzydla gora/dol zamienione; E19 archer przed javelin; E20 `isPrimaryRanged` bez listy
wykluczen; E21 `isMounted` bez `Typ mount`; E22 jazda szuka w zlym kierunku; E23 `freeOk` bez `passable`; E24 reszta
bez `% span`; E25 `placeOne` `dr < 10`; E28 limit tylko dla atakujacego; E29 katapulta korony bez `isSiegeUnit`;
E31 `wingRank` nigdy nieaktualizowany; E33 `siegeMode` ignorowany.

Rownowazne / niewazne (bez zarzutu):

| ID | Mutant | Dlaczego |
|---|---|---|
| E14 | `DEPLOY_ATK_COL_STEP` → `ATK_COL_STEP` | obie stale = -1 (mutant bez zmiany wartosci) |
| E10 | `topWing`: `<` → `<=` | jazda dostaje rzad `< mainRowStart <= MID` (gora) albo `> mainRowEnd >= MID` (dol); `idealRow == MID` dla jazdy nieosiagalne |
| E30 | gorne skrzydlo: `min(…, ir+3)` usuniete | z korpusem `bodyMin = mainRowStart` (najszersze pasmo zaczyna sie tam), `ir + 3 >= mainRowStart > bodyMin - 1`; bez korpusu `ir + 3 >= MID > MID - 1` — `ir+3` nigdy nie jest minimum |
| E03 | `placeOne`: `-dr` przed `+dr` | indukcja: reszta idzie rzedami `rLo, rLo+1, …` w kolumnie `wallCol+2(+k)`; wszystkie rzedy ponizej celu sa juz zajete albo nieprzechodnie, a atakujacy nie siegaja kol. 42+, wiec `cr0-dr` nigdy nie jest wolne gdy `cr0+dr` jest |

**Przezyly, NIE-rownowazne (zarzuty):**

| ID | Mutant | Dlaczego nierownowazny | Brak w wektorach |
|---|---|---|---|
| **E16** | `linesForBand`: `playableRows = playRow1 - playRow0 - 1` → bez `-1` | `PLAYABLE_ROWS = 110`: pin 108, mutant 109. Pasmo dokladnie 109 piechoty przy `meleeLines = 1`: pin `lineCount = max(1, ceil(109/108)) = 2`, `per = 55` (dwie linie); mutant `per = 109` (jedna linia) — inne pozycje. To realna granica pinu (dlugie armie 500 v 500) | zadne pasmo o licznosci 109 / 217-218 / 325-327 / 433-436 (max widziane: 107, 111, 154, 160) |
| **E12** | dolne skrzydlo bez korpusu: `bodyMax === -Infinity ? PLAY_MID_ROW + 1` → `PLAY_MID_ROW` | strona z sama jazda (>= 2 jednostki): druga (dolna) jazda ma pasmo od `max(MID+1, ir-3)`; mutant dopuszcza rzad `MID`, wybrany gdy rzedy `MID+1..` w zasiegu sa zablokowane | F8 pokrywa tylko GORNE skrzydlo bez korpusu (zabija M14); lustrzanej granicy dolnej brak (1 przypadek „sama jazda >= 2", bez blokady rzedow) |
| **E32** | `mainBandWidth` bez pasma dowodcow | gdy dowodcow jest wiecej niz jednostek najszerszego innego pasma i jest jazda, `bandWidth` (a z nim rzedy skrzydel `topRows/bottomRows`) sie zmienia | 115 przypadkow ma >= 2 dowodcow i jazde, ale nigdy pasmo dowodcow nie jest najszersze |
| **E27** | `classifyInitialBattleRole` javelin: `haystack` (`kategoria + nazwa`) → sama nazwa | pin dopasowuje regex takze na kategorii (np. `kategoria = 'Javelinmen'`/`'oszczepnicy'`, nazwa bez slowa kluczowego) | `KATEGORIE` generatora maja tylko dokladne nazwy kategorii; galaz „kategoria zawiera, ale != kategorii" (javelin/archer/slinger) nie jest wykonana |

Kryterium dispatchu „mutanty … wszystkie zabite albo jawnie rownowazne" Operator spelnil dla swojego zestawu (26 zabitych,
M19/M28 rownowazne — argumenty sprawdzone i poprawne), ale adwersarialnie znalazlem 4 nierownowazne mutanty na
granicach galezi pinu, ktorych wektory nie wykonuja. Kod jest poprawny (§3) — brakuje dowodu wektorami, stad FAIL.

## 5. Wymagane w rundzie 2 (Operator, ten sam ID; tylko generator + wektory + ewentualnie progi licznikow)

1. Scenariusze z pasmem piechoty o licznosci dokladnie 109 i 217 (albo 218) przy `meleeLines = 1` (siegeMode i polowe) —
   zabija E16; najlepiej takze pasmo lucznikow 109 przy `archerLines = 1`.
2. Lustro F8 dla DOLNEGO skrzydla: strona z sama jazda (>= 2, druga jednostka na dole), pole syntetyczne z rzeka w
   rzedach `MID+1..MID+k` przy slocie — zabija E12.
3. Armia z pasmem dowodcow szerszym niz pozostale pasma (np. 3 dowodcow + 1 wojownik + 2 konnica) — zabija E32.
4. Jednostki z kategoria zawierajaca slowo kluczowe, ale rozna od kategorii dokladnej (np. `'Javelinmen'`, `'lucznicy'`,
   `'slinger corps'`) i nazwa bez slowa — zabija E27 i analogiczne mutanty archer/slinger.
5. Dopisac do raportu argumenty rownowaznosci E03/E10/E30 (albo zabic je wektorami) i liczniki pokrycia dla 1-4 z progami.

## 6. Uwagi (nie blokuja)

* N1: `fikstura_renderera_max_per_side` czyta `../renderer/src/battle/field.rs` w czasie testu silnika — to nie jest
  zaleznosc crate'u, ale dispatch mowi „tylko przez fiksture JSON"; test pada przy checkoutcie bez `renderer/`.
  Do rozwazenia: sprawdzac linie tylko w generatorze (fikstura JSON) albo jawnie zaakceptowac w FC.
* N2: wejscie `SetupUnit.ranged` = gotowy `isRanged(bu)` z pinu; `attackRange` nie jest portowany — dlug D-T5b-1 (T6)
  jawny, akceptowalny.
* N3: `place_siege_defenders` jest publiczne i przyjmuje dowolne `SiegeWallRows`; poza geometria pinu
  (`rowLo 0, rowHi 155, gate 77`) `debug_assert` + `max(1)` rozni sie od dzielenia JS przy `rowHi < rowLo` —
  nieosiagalne w pinie, warto opisac w doc-komentarzu (dotyczy tez rownowaznosci M19).
* N4: komentarz generatora przed S18 („siegeMode bez muru") nie pasuje do S18/S19/S20/S22 (to pola z murem) — kosmetyka.

## 7. Dysk i sprzatanie

Wolne na starcie 9,3 GB, w trakcie 8,7-8,9 GB. Target Evaluatora (`scratchpad/bsetupunits/ev/target`) usuniety po bramkach.
