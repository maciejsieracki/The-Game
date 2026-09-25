# 02-evaluator.md — R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922

STATUS: PASS
ROLE: Evaluator (niezależny — bez dostępu do rozumowania Operatora)
TOPIC: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
DOMAIN: GAME

## Metoda

Zero zaufania do deklaracji Operatora. Każdy z 9 punktów zadania zweryfikowany
od zera: programowy diff Python (civ-matrix.json vs INPUT + vs origin/main),
ręczne czytanie CAŁYCH diffów city-defense.ts/main.ts/battleScene.ts/
siegeMachines.ts, ręczny grep kontekstu civIconId i isSiegeUnit/ru.side, własne
uruchomienie wszystkich testów (nowego + 6 istniejących), własny git stash +
rerun dla 2 testów z deklarowanymi pre-istniejącymi failami, własny
`npx tsc --noEmit`, własny `git diff --check`/`git status --short`, własny
`git show origin/main:...` dla dowodu pre-istnienia metod.

## 1. civ-matrix.json — 45 komórek (programowy diff Python)

POTWIERDZONE. Załadowano `gra/data/civ-matrix.json` (obecny), `origin/main`
wersję pliku i `INPUT-converted-values.json`, porównano programowo:
- Stare wartości (origin/main) dla `obl_obrona_miasta_proc`/`obl_mur_proc`/
  `obl_machines_proc` — WSZYSTKIE 0 dla wszystkich 15 cywilizacji (0 wyjątków).
- Nowe wartości: 45/45 komórek identyczne 1:1 z `INPUT-converted-values.json
  → values` (0 mismatchy, sprawdzone pętlą po wszystkich 3 parametrach × 15
  cywilizacji).
- Zero innych zmian: porównano `_meta`, `paramDefs`, `defaults`, kolejność i
  liczbę cywilizacji, wszystkie pola civ poza `params`, oraz wszystkie klucze
  `params` OPRÓCZ tych 3 — 0 różnic wykrytych.

## 2. PARYTET city-defense.ts / main.ts / battleScene.ts — NAJWAŻNIEJSZE

POTWIERDZONE, brak rozjazdu.

`city-defense.ts` diff (51 linii, przeczytany w całości): `murCivProc` i
`obronaMiastaCivProc` to dwa NOWE opcjonalne parametry (domyślnie `0`) na
końcu sygnatury `cityWallDefenseBonusPercent`. Jedyna zmiana logiki:
`total *= (1 + murCivProc) * (1 + obronaMiastaCivProc);` DOPISANA na końcu, PO
całym istniejącym addytywnym sumowaniu (`total += ...` dla
mur/cytadela/baszta/palisada) — mnoży wynik, nie zastępuje. Domyślne `0` →
mnożnik `1.0` → wywołania 2-argumentowe bez zmian (potwierdzone też testem
"wsteczna zgodność" niżej).

`main.ts` diff (56 linii, przeczytany w całości): nowa funkcja
`civMurObronaProcFor(ownerId)` czyta `civKeyForOwnerId(ownerId)` i zwraca oba
mnożniki. Podłączona w OBU wywołaniach `cityWallDefenseBonusPercent` w tym
pliku (`cityWallStatusAtHex` i `structureDefenseBonusFor`), zawsze z
`cityOnHex.ownerId` — czyli WŁAŚCICIEL miasta (obrońca).

`battleScene.ts` diff (98 linii, przeczytany w całości): blok liczący
`wallDefenseMult`/`wallDefenseTotalProc` w konstruktorze wywołuje TĘ SAMĄ
funkcję `cityWallDefenseBonusPercent` z `civMatrixParam(this._defenderCivIconId,
'obl_mur_proc'/'obl_obrona_miasta_proc')` jako dodatkowe argumenty.

Rezultat: obie ścieżki wywołania (main.ts i battleScene.ts) przechodzą przez
JEDNĄ współdzieloną funkcję `cityWallDefenseBonusPercent` i przekazują
mnożniki civ-matrix dla TEGO SAMEGO civKey (właściciel/obrońca miasta). Dla
identycznej sytuacji (te same `builtBuildingIds`, ten sam civKey obrońcy)
wynik matematyczny jest identyczny w obu trybach — parytet zachowany
strukturalnie (jedna implementacja arytmetyki, nie duplikat w dwóch
plikach), więc nie ma miejsca na rozjazd wartości. Brak zarzutu blokującego.

## 3. `_defenderCivIconId` — poprawność strony (OBROŃCA)

POTWIERDZONE. Kontekst konstruktora `BattleScene` (linie 2617–2621, przeczytany
in extenso): `this._defenderCivIconId = opts.defenderCivIconId ??
civIconIdFromLabel(civRows, this._defenderCivLabel)`. Blok liczący civ-matrix
mnożniki muru jest PO tym przypisaniu (celowe przesunięcie udokumentowane w
komentarzu diffu — sensowne, bo civIconId musi istnieć przed użyciem).
Sprawdzono też call site'y `defenderCivIconId:` poza battleScene.ts —
wszystkie w `main.ts` przekazują `pbInfo.obronca.civId` ("obronca" = polskie
słowo "obrońca") — jednoznacznie strona broniąca miasto, nie atakująca.
Brak pomyłki strony.

## 4. `siegeMachines.ts` / `_siegeStructureDamage` / `_attackWallTile` — strona ATAKUJĄCA

POTWIERDZONE. Diff `siegeMachines.ts` (czysty, 15 nowych linii): pure funkcja
`civSiegeMachinesMult(civKey?)` zwraca `1 + civMatrixParam(civKey,
'obl_machines_proc')`, `1` (neutralny) gdy brak civKey.

Sprawdzono SAMODZIELNIE (nie zaufano deklaracji), grepem po całym pliku,
warunek dostępu do `_attackGate`/`_attackWallTile`: linia 5886 —
`if (isSiegeUnit(ru.bu) && ru.side === 'atk' && this.siegeWallCol >= 0)` —
to JEDYNA ścieżka wywołania tych dwóch metod w całym pliku (potwierdzone
grepem `_attackGate(ru,|_attackWallTile(ru,` — tylko to jedno miejsce
wywołania obu). Machiny oblężnicze w tej scenie ataku muru/bramy są więc
strukturalnie ZAWSZE po stronie `atk` — `this._attackerCivIconId` (właściciel
maszyny) jest poprawnym civKey. Brak pomyłki strony.

## 5. Nowy test — własne uruchomienie + ręczne przeliczenie 3 asercji

`node tools/civ-matrix-oblezenie-wiring-test.cjs` → **75 pass, 0 fail**
(potwierdzone identyczną liczbą jak deklaracja Operatora).

Ręczne przeliczenie (Python, niezależnie od kodu testu):
- Grecy mur: `200 * (1 + 0.2) = 240` ✓ (200%→240%)
- Zulusi mur: `200 * (1 + -0.2) = 160` ✓ (200%→160%)
- Taran wallAttack=14: Grecy `round(14 * 1.2) = 17` ✓, Zulusi
  `round(14 * 0.8) = 11` ✓ (14→17/11 jak deklarowano)

## 6. Istniejące testy — własne uruchomienie + własny git stash dla 2 z failami

Uruchomione samodzielnie, WSZYSTKIE 6:
- `city-defense-terrain-gate-test.cjs` → 34 pass, 0 fail ✓
- `defense-breakdown-test.cjs` → 44 pass, 0 fail ✓
- `fortify-pole-test.cjs` → 41 pass, 0 fail ✓
- `mur-paradoks-test.cjs` → 29 pass, 0 fail ✓
- `empire-panel-miasto-obywatele-content-test.cjs` → 115 pass, 1 fail
- `koszty-surowcowe-test.cjs` → 126 pass, 3 fail

Dla ostatnich dwóch wykonano NIEZALEŻNĄ weryfikację: `git stash push -u`
(schowało wszystkie 5 zmodyfikowanych plików + 5 nieśledzonych, w tym nowy
test), ponowne uruchomienie obu testów na czystym `origin/main`-stanie —
IDENTYCZNE faile (te same komunikaty, te same liczby: 115/1 i 126/3),
`git stash pop` (przywrócono, `git status --short` po pop identyczny jak
przed stash). Faile są pre-istniejące i niezwiązane z tym tematem — brak
regresji, brak zarzutu blokującego.

## 7. `npx tsc --noEmit`

**PASS** — brak błędów, exit 0.

## 8. `git diff --check` / `git status --short`

- `git diff --check` → czyste (exit 0, brak trailing whitespace/konfliktów).
- `git status --short` → dokładnie 5 zmodyfikowanych plików
  (`gra/data/civ-matrix.json`, `gra/src/battle/battleScene.ts`,
  `gra/src/game/city-defense.ts`, `gra/src/game/siegeMachines.ts`,
  `gra/src/main.ts`) + 5 nieśledzonych (4 raporty w
  `dyspozycje/autobot/runs/.../` + nowy `gra/tools/civ-matrix-oblezenie-wiring-test.cjs`)
  — dokładnie zgodne z allowlistą z `00-dispatch.md`/`01-evidence.json`. Zero
  plików spoza zakresu.

## 9. Pre-istnienie `_attackWallTile`/`_siegeStructureDamage`

POTWIERDZONE: `git show origin/main:gra/src/battle/battleScene.ts | grep -n
"_attackWallTile\|_siegeStructureDamage"` zwraca 4 trafienia (deklaracja +
wywołanie obu metod) w wersji SPRZED tego diffu — metody nie zostały
wymyślone, istniały już wcześniej. Diff tylko dodaje mnożnik do istniejącej
arytmetyki.

## Podsumowanie ryzyk (pkt 2 i 3 — najwyższy priorytet)

Oba najbardziej ryzykowne punkty (parytet trybów i poprawność strony civKey)
zweryfikowane z maksymalną starannością: przeczytano CAŁE diffy trzech
plików, sprawdzono definicję i JEDYNE miejsce przypisania
`_defenderCivIconId`/`_attackerCivIconId`, potwierdzono zewnętrznymi call
site'ami (`pbInfo.obronca.civId`) i logiką `ru.side === 'atk'`. Brak
znalezionego rozjazdu, brak pomyłki strony.

## Werdykt

**STATUS: PASS** — brak zarzutu blokującego. Wszystkie 9 punktów zadania
zweryfikowane niezależnie od zera, zgodne z deklaracjami Operatora co do
liczb i logiki; własna analiza kodu (nie tylko powtórzenie komend) potwierdza
poprawność parytetu i strony civKey.

## NEXT PHASE

PASS bez zarzutu blokującego → pomiń Obronę → Final Control.

PUSH/DEPLOY: NIE WYKONANO (brak commit/push/merge/deploy — working tree
niescommitowane, zweryfikowane `git status`/`git log`).
