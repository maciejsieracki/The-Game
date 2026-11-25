# Znikanie sojuszy AI↔AI — którą ścieżką umowy znikają z activeDeals (R-WEB-ALLIANCE-REMOVAL-PATH-Q1)

Data: 2026-11-25 · Baza kodu: origin/main 8f7b4981f (gra/ identyczne w kandydacie 4ba7b5d38; `git diff 8f7b4981f 4ba7b5d38 -- gra` puste) · Bieg: seed 4242, `--harder 0`, ciągły, bez wznowień (`resumed:false`), tury 2–67, 66 wierszy.

## Wynik w skrócie

- Na bazie 8f7b4981f w biegu seed 4242 / harder 0 **pary AI 1-13 i AI 1-19 nie zawarły sojuszu** (sojusz_pelny). Zdarzenie z ALLY66 (utrata sojuszu 1-13 i 1-19 w t62–66) **nie odtworzyło się**, więc jego ścieżka pozostaje **NIE ZMIERZONO** (brak zdarzenia do zalogowania).
- W t62–66 na tym biegu **nie było utraty sojuszu AI 1** (zero wpisów `sojusz_pelny` z AI 1 w tym oknie). W całym biegu sojusz AI 1 zniknął raz: `sojusz_aiai_1_16_t30` przez `odmowa-sojuszu-finalize` w t55 (poza oknem).
- Wszystkie umowy AI 1 znikające w t60–67 to `umowa_szlakow` (szlak handlowy) kończące termin: `expireTreaties`, zgodnie z kodem `wygasaTura <= tura`. To nie są sojusze.
- Instrumentacja działa (96 wpisów `[AA-REMOVE]` w logu biegu). Brak wpisów dla sojuszu w t62–66 jest więc **danymi**, nie brakiem hooka.

## Lista ścieżek usuwania umowy z activeDeals (gra/src, baza 8f7b4981f = 4ba7b5d38)

Usunięcia w trakcie tury (ścieżki, które usuwają umowę z activeDeals w grze):

| Plik:linia | Funkcja / ścieżka | Etykieta w logu `sciezka=` |
|---|---|---|
| gra/src/main.ts:22806 | odmowa obowiązku sojuszu (resolveAllianceWarCall) | odmowa-obowiazku-sojuszu |
| gra/src/main.ts:24644 | breakTreatyVoluntarily (zerwanie dobrowolne) | zerwanie-dobrowolne-breakTreatyVoluntarily |
| gra/src/main.ts:25662 | breakTreatiesOnWar (wojna) | wojna-breakTreatiesOnWar |
| gra/src/main.ts:26224 | finalizeAllianceObligationRefusals (odmowa wejścia do wojny sojusznika) | odmowa-sojuszu-finalize |
| gra/src/main.ts:26615 | expireTreaties w runDiplomacyTurnTick (wygaśnięcie terminu) | wygasniecie-expireTreaties |
| gra/src/main.ts:26678 | tickDiplomacyPayments — płatność niewykonana | platnosc-broken-tickDiplomacyPayments |
| gra/src/main.ts:27104 | applyProposalOutcomeImpl — wchłonięcie wasala | wchloniecie-wasal |
| gra/src/main.ts:40244 | eliminateOwner (filter po stronach właściciela) | eliminateOwner |

Poza tym: `gra/src/main.ts:30637` to wyłącznie hak testowy (`test-domino-alliance`, splice). Resety `activeDeals = []` w main.ts:11802 (start nowej gry), :50607 (start generacji mapy) i :52837 (wczytanie zapisu; po nim :52849 `hydrateActiveDeals`) nie są usunięciami w trakcie tury i nie są logowane; w tym biegu nie wystąpiły (bieg ciągły, bez wczytania). Wywołania `removeTreatiesById` / `expireTreaties` w gra/tools/*.cjs to testy, nie gra.

Kompletność sprawdzono grepem po `activeDeals\s*=`, `removeTreatiesById(`, `removeTreaty(`, `expireTreaties(` w gra/src (wszystkie trafienia powyżej).

## Instrumentacja i jej walidacja

- Patch gry (w kopii poza repo): `runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/instrumentacja-AA-REMOVE.patch`. Zamienia 8 wywołań na wersje `…Logged` (diplomacy-treaties.ts: `removeTreatiesByIdLogged`, `expireTreatiesLogged`). Każde usunięcie loguje `[AA-REMOVE] t<tura> sciezka=<etykieta> id=… rodzaj=… strony=… wygasaTura=… zawarta=…`. Logika usuwania bez zmian (te same filtry).
- Poprawka hooka (zarzut 1): runner `gra/tools/diplomacy-harder-measure-run.cjs` zapisuje do `<TAG>.alliance-log.txt` wiersze zaczynające się od `[ALLIANCE-` **oraz** `[AA-` (`runs/…/runner-hook-AA.diff`). Patch poprzedniej rundy działał tylko w ai-economy-measure-run.cjs, którego ten runner nie używa.
- Walidacja: 96 wpisów `[AA-REMOVE]` w logu biegu, w tym `eliminateOwner`, `wygasniecie-expireTreaties`, `platnosc-broken-tickDiplomacyPayments`, `odmowa-sojuszu-finalize`. Hak działa.

## Wyniki biegu (seed 4242, harder 0, ciągły)

- Pliki: `dane/seed4242-harder0.alliance-log.txt` (13 338 B), `dane/seed4242-harder0-base8f7b4981.jsonl.gz`, `dane/seed4242-harder0.summary.json`, `dane/seed4242-harder0.run.log`.
- Parametry z summary: `harder 0`, `resumed false`, `endTurn 67`, `rows 66`, `wallSec 547`, `playerAi 1`.
- Sojusze AI↔AI w logu: jedyny `sojusz_aiai_1_16_t30` (usunięty t55, `odmowa-sojuszu-finalize`); `sojusz_siostry_*` poza AI 1.
- AI 1 w t60–67: wygasania `umowa_szlakow` (1-22 t60, 1-16 t61, 1-25 t62, 1-26 t63, 1-4 t64, 1-28 t65, 1-31 t66, 1-7 t67) oraz `eliminateOwner` 1-26 t66 (umowa szlakow zawarta t63). Żadna z nich nie jest sojuszem.

## Klasyfikacja

- Ścieżki sojuszu (sojusz_pelny) znikające w tym biegu: tylko `odmowa-sojuszu-finalize` (1-16, t55, poza oknem t62–66) i `eliminateOwner` (sojusze sióstr 11-12, 40-41; nie AI 1). Klasyfikacja: **NIE ZBADANO reguły w rejestrze/przewodniku** (reguły nie cytuję; ścieżka istnieje w kodzie jako odmowa wejścia do wojny sojusznika). Nie stwierdzono ŁAMANIA REGUŁY.
- Utrata sojuszu AI 1 w t62–66: **brak zdarzenia na tym biegu**. Klasyfikacja dla ALLY66 1-13 / 1-19: **NIE ZMIERZONO** (pary nie zawarły sojuszu na bazie 8f7b4981f).
- `umowa_szlakow` wygasające z terminu: ZGODNE z kodem (`expireTreaties`: zostaje tylko `wygasaTura === null || wygasaTura > tura`).

## Odpowiedzi na zarzuty z rundy 1

1. Hak martwy — PRZYJĘTE i naprawione (runner-hook-AA.diff, 96 wpisów w biegu).
2. Brak logu utrat AI 1 w t62–66 z klasyfikacją — PRZYJĘTE częściowo: bieg powtórzony, ale zdarzenie nie wystąpiło. Stan: brak zdarzenia = NIE ZMIERZONO dla ALLY66, nie „zgodne z regułą”.
3. Warunki (harder 0 vs harder 1, segmenty) — PRZYJĘTE: ten bieg to harder 0, ciągły, bez wznowień. Stary bieg harder 1 (`seed4242-harder1*` w dane/) pozostawiony jako artefakt wcześniejszej rundy i NIE jest dowodem dla tego wniosku.
4. Wzorzec „sojusz zastąpiony przez nowy id” (1-13 t33→t40, 1-19 t33→t58) — PRZYJĘTE, NIE ZBADANE: w tym biegu pary nie tworzą sojuszu, więc wzorca nie da się odtworzyć. Hipoteza (nie zweryfikowana): wygaśnięcie terminu `sojusz_pelny` i ponowne podpisanie przez AI. Wymaga biegu z tą parą.
5. SHA256SUMS — PRZYJĘTE: zestaw przeliczony dla plików faktycznie obecnych w `dane/`.
6. Bramki — PRZYJĘTE: uruchomione na kodzie kandydata (kopia gra/ z 4ba7b5d38, poza repo): tsc 0; logic 213/213; ai-test 297 passed / 0 failed.

## Ograniczenia (NIE ZMIERZONO)

- Nie odtworzono warunków ALLY66. Nie zweryfikowano różnicy kodu między bazą ALLY66 (b610e71a wg dispatchu oryginalnego) a 8f7b4981f; logi ALLY66 nie zawierają SHA kodu.
- Kolejność wygaśnięć `sojusz_pelny` (termin ustawiany przy zawarciu) nie była analizowana.
- Pytanie ABC #103 (status „sojusz” po zniknięciu umowy) — opisane, NIE zadane (zgodnie z dispatchem).
- Stary bieg `seed4242-harder1` (w dane/) nie jest objęty tym wnioskiem.

## Pliki

- Analiza: `dyspozycje/analizy/ZNIKANIE-SOJUSZY-AI-2026-11-25.md` (ten plik).
- Patch gry: `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/instrumentacja-AA-REMOVE.patch`.
- Patch runnera: `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/runner-hook-AA.diff`.
- Dane: `dyspozycje/autobot/runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/dane/` (SHA256SUMS.txt).
