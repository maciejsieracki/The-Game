# 01-operator.md — R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922

STATUS: PASS
ROLE: Operator
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
DOMAIN: GAME

## Co zrobiono

### 1. `gra/data/civ-matrix.json` — nadpisanie 45 komórek działu Oblężenie

Stare wartości (placeholdery z 6 lipca 2026) dla `obl_obrona_miasta_proc`,
`obl_mur_proc`, `obl_machines_proc` były wszystkie `0` dla wszystkich 15
cywilizacji (zweryfikowane programowo przed zapisem). Nadpisano wartościami z
`INPUT-converted-values.json → values` — 45/45 komórek zgodnych 1:1 (zero
odchyleń, sprawdzone programowym porównaniem Python po zapisie). Zero innych
zmian w pliku — diff to dokładnie 45 zmienionych linii (`git diff --check`
czyste, JSON round-trip identyczny format co oryginał — 2-spacjowy indent,
`ensure_ascii=False`).

### 2. `gra/src/game/city-defense.ts` — `cityWallDefenseBonusPercent`

Dodano dwa nowe, OPCJONALNE parametry na końcu sygnatury (wzorzec identyczny
z WIRING-MANPOWER): `murCivProc` (civ-matrix→`obl_mur_proc`) i
`obronaMiastaCivProc` (civ-matrix→`obl_obrona_miasta_proc`). Oba SKŁADAJĄ SIĘ
(mnożą) z istniejącym bonusem addytywnym mur/cytadela/baszta/palisada:

    total = (structural addytywny mur/cytadela/baszta/palisada)
            * (1 + murCivProc) * (1 + obronaMiastaCivProc)

Zgodnie ze SCOPE zadania ("finalny % = structural_pct * (1 + obl_mur_proc)").
`obl_obrona_miasta_proc` potraktowany jako DODATKOWY, niezależny mnożnik na
tym samym wyniku — kod nie miał dotąd osobnego rozróżnienia "bonus murów" vs
"ogólna obrona miasta" (jedna funkcja, jeden wynik procentowy używany
identycznie w obu miejscach wywołania main.ts/battleScene.ts), więc oba
parametry mnożą tę samą liczbę, każdy niezależnie. Domyślnie oba `0` →
mnożnik 1.0x, więc WSZYSTKIE istniejące wywołania 2-argumentowe (w tym
wszystkie istniejące testy w `tools/*.cjs`: city-defense-terrain-gate-test,
defense-breakdown-test, empire-panel-miasto-obywatele-content-test,
fortify-pole-test, koszty-surowcowe-test, mur-paradoks-test) zachowują
DOKŁADNIE stare zachowanie bez zmian — zweryfikowane uruchomieniem wszystkich
sześciu, zero nowych regresji (patrz sekcja Testy niżej).

### 3. `gra/src/main.ts` — konsument dla trybu mapy świata / auto-bitwy

Nowa funkcja `civMurObronaProcFor(ownerId)` czyta `civKeyForOwnerId(ownerId)`
(istniejący mechanizm, ten sam co w temacie Manpower) i zwraca oba parametry
civ-matrix dla WŁAŚCICIELA MIASTA (nie atakującego — obrona miasta to zawsze
bonus obrońcy). Podłączona w obu miejscach wywołania
`cityWallDefenseBonusPercent` w tym pliku: `cityWallStatusAtHex` (gating
bonusu terenu) i `structureDefenseBonusFor` (rzeczywisty bonus %
konsumowany przez `effectiveDefenderM`/auto-bitwę/podgląd tabliczki mocy —
wszystkie te call site'y idą przez `structureDefenseBonusFor`, więc automat.
odziedziczyły nowy mnożnik bez dodatkowych zmian).

### 4. `gra/src/battle/battleScene.ts` — konsument dla trybu interaktywnej bitwy/oblężenia

**Mur/obrona miasta (PARYTET z main.ts):** blok liczący `wallDefenseMult`/
`wallDefenseTotalProc` w konstruktorze `BattleScene` przesunięty ZA
przypisanie `this._defenderCivIconId` (wcześniej liczony PRZED — civIconId
jeszcze nie istniał w tym miejscu), żeby móc odczytać
`civMatrixParam(this._defenderCivIconId, 'obl_mur_proc'/'obl_obrona_miasta_proc')`
i przekazać jako nowe argumenty do `cityWallDefenseBonusPercent` — DOKŁADNIE
ta sama funkcja, te same argumenty struktury co main.ts, więc PARYTET między
trybem mapy świata a trybem interaktywnym jest zachowany automatycznie przez
wspólny moduł (nie duplikowano arytmetyki w dwóch miejscach — zgodnie z
ostrzeżeniem strukturalnym w dyspozycji). `_defenderCivIconId` to civKey
cywilizacji BRONIĄCEJ SIĘ (ustawiany z `opts.defenderCivIconId` albo
`civIconIdFromLabel`) — poprawny wybór, bo to broniące się miasto (właściciel)
dostaje bonus muru, nie atakujący.

**Machiny oblężnicze (`obl_machines_proc`):** nowa pure funkcja
`civSiegeMachinesMult(civKey)` w `gra/src/game/siegeMachines.ts` (jednostkowo
testowalna niezależnie od Three.js/`BattleScene`), zwraca
`1 + civMatrixParam(civKey, 'obl_machines_proc')` (neutralny 1.0 gdy brak/
nieznany civKey). Podłączona w `_siegeStructureDamage` (atak Taranu na bramę)
i `_attackWallTile` (atak Katapulty na kafel muru) przez nową prywatną metodę
`BattleScene._civMachinesMult()` = `civSiegeMachinesMult(this._attackerCivIconId)`.
`_attackerCivIconId` jest poprawny, bo machiny oblężnicze w obu miejscach
wywołania (`_attackGate`/`_attackWallTile`) są ZAWSZE po stronie atakującego
(`isSiegeUnit(ru.bu) && ru.side === 'atk'`) — właściciel machiny to zawsze
strona atakująca tej sceny bitwy, więc nie trzeba przenosić civKey per
jednostkę przez `RuntimeBattleUnit`/`BattleUnit` (które go dziś nie niosą) —
przebudowa poza zakres nie była potrzebna.

**BEZ DECISION_REQUIRED** — wszystkie 3 parametry podłączone realnie, w obu
trybach bitwy (main.ts auto-bitwa NA MAPIE + battleScene.ts interaktywna
bitwa/oblężenie), zgodnie z wymogiem parytetu z ostrzeżenia strukturalnego.

### 5. `gra/tools/civ-matrix-oblezenie-wiring-test.cjs` — nowy test

esbuild-bundlowany test (wzorzec z civ-matrix-manpower-wiring-test.cjs,
usuniętego z tego worktree wraz z branchem WIRING-MANPOWER — odtworzony wg
identycznego wzorca z `git show 87ce2daf`). 75 asercji, wszystkie PASS:

  - 45/45 komórek civ-matrix.json zgodnych z INPUT-converted-values.json.
  - `obl_mur_proc`: Grecy (+0.2, mur 200%→240%) vs Zulusi (-0.2, mur
    200%→160%) — REALNIE różny wynik, kierunek zgodny ze znakiem.
  - `obl_mur_proc` na pełnym stacku Mury+Cytadela+Baszta (400%→480% Grecy).
  - `obl_obrona_miasta_proc`: Grecy (+0.2, 200%→240%) vs Rzymianie (0.0,
    200%→200% neutralny) — REALNIE różny wynik.
  - Oba parametry SKŁADAJĄ SIĘ multiplikatywnie (Fenicjanie: 200%→288%,
    1.2×1.2), nie zastępują się nawzajem.
  - Kontrola negatywna: nieznana cywilizacja → `civMatrixParam` = 0 →
    mnożnik neutralny 1.0.
  - Miasto BEZ żadnego budynku obronnego: civ-matrix NIE tworzy bonusu z
    niczego (0 × mnożnik = 0).
  - Wsteczna zgodność: wywołanie 2-argumentowe (bez civKey) = stare
    zachowanie bit-for-bit.
  - `obl_machines_proc`: Grecy (mnożnik 1.2) vs Zulusi (mnożnik 0.8) —
    symulacja dokładnie tej samej arytmetyki co
    `_siegeStructureDamage`/`_attackWallTile` na Taranie (wallAttack=14 z
    units.json): Grecy 17 dmg vs Zulusi 11 dmg — REALNIE różne.
  - Kontrola negatywna: nieznana/brak civKey → `civSiegeMachinesMult` = 1.0
    neutralny.

## Testy

```
node tools/civ-matrix-oblezenie-wiring-test.cjs   → 75 pass, 0 fail (NOWY)
node tools/city-defense-terrain-gate-test.cjs     → 34 pass, 0 fail (istniejący, bez regresji)
node tools/defense-breakdown-test.cjs             → 44 pass, 0 fail (istniejący, bez regresji)
node tools/fortify-pole-test.cjs                  → 41 pass, 0 fail (istniejący, bez regresji)
node tools/mur-paradoks-test.cjs                  → 29 pass, 0 fail (istniejący, bez regresji)
node tools/empire-panel-miasto-obywatele-content-test.cjs → 115 pass, 1 fail
                                                     (PRE-ISTNIEJĄCY fail na czystym branchu
                                                      przed jakąkolwiek zmianą tego tematu —
                                                      zweryfikowane git stash + ponowny run:
                                                      identyczny fail bez moich zmian, więc
                                                      niezwiązany z tym tematem)
node tools/koszty-surowcowe-test.cjs              → 126 pass, 3 fail
                                                     (PRE-ISTNIEJĄCE faile, jw. — zweryfikowane
                                                      git stash + ponowny run: identyczne 3 faile
                                                      bez moich zmian)
npx tsc --noEmit                                  → PASS (brak błędów)
```

## Weryfikacja acceptance

1. 45/45 komórek civ-matrix.json zgodne z INPUT-converted-values.json, zero
   innych zmian — POTWIERDZONE (programowy diff Python, `git diff --check`
   czyste, dokładnie 45 zmienionych linii w pliku).
2. `tsc --noEmit` PASS — POTWIERDZONE.
3. Nowy test PASS z realnymi liczbami — POTWIERDZONE (75/75, bez
   DECISION_REQUIRED, wszystkie 3 parametry podłączone).
4. Istniejące testy oblężenia/miasta/city-defense nadal PASS — POTWIERDZONE
   (wszystkie 6 znalezionych przez `grep -rl cityWallDefenseBonusPercent|
   city-defense tools/` uruchomione; jedyne faile są pre-istniejące,
   niezwiązane z tym tematem, zweryfikowane przez git stash).
5. `git diff --check` czyste; diff ograniczony do plików z allowlisty —
   POTWIERDZONE (`gra/data/civ-matrix.json`, `gra/src/game/city-defense.ts`,
   `gra/src/game/siegeMachines.ts`, `gra/src/main.ts`,
   `gra/src/battle/battleScene.ts`, nowy `gra/tools/civ-matrix-oblezenie-wiring-test.cjs`
   + raporty w `dyspozycje/autobot/runs/.../`).
6. Brak commit/push/merge/deploy — POTWIERDZONE (working tree ma
   niescommitowane zmiany, `git log` bez nowych commitów od tego workera).

PUSH/DEPLOY: NIE WYKONANO
