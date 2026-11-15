# R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1 — Final Control (SONNET), runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1
GOAL: sekcja „Możesz wybrać” na starcie nowej gry: Obróbka drewna, Rolnictwo, Oswojenie zwierząt, Łowiectwo (tylko kolejność wyświetlania).
ZMIANY/COMMIT: kandydat 3de5271101cf1c74898d1e243da96854d250efc5 (potomek bazy cde7cfcbb: merge-base --is-ancestor = TAK). Diff vs baza: gra/src/ui/scienceHubSnapshotLogic.ts (+25), gra/tools/tech-choice-order-test.cjs (nowy), raporty runu + zrzut. Allowlista zachowana; main.ts, tech.json, AI, WERSJE.md, gra-robocza, rust-port nietknięte. git diff --check czysty. git merge-tree kandydata z origin/main (6c1687274) bez konfliktów (plik logiki niezmieniony na main).

ZARZUTY:
1. NIE_ZMIERZONO end-to-end (zrzut z harnessu) -> ODDAL (uwaga informacyjna; ten sam moduł i dane, kod wywoływany tylko z sciencePicker.ts:490).
2. Brak „+ PLAN” na zrzucie -> ODDAL (renderu nie zmieniono: diff scienceHubHud.ts = 0; przycisk za canEnqueue). Zrzut pokazuje „Karta” i „Wkrótce · zablokowane” bez zmian.
3. Tabela w kodzie, brak wzmianki w docs, wikiBundle niezregenerowany -> ODDAL (dozwolone dispatchem; brak opisanej kolejności do synchronizacji).
Brak NAPRAW.

TESTY (własny pomiar, surowe wyjście, gra/ na kandydacie):
- tsc --noEmit: TSC_EXIT=0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0 (5 bramek referencyjnych zielone)
- science-hub 7/0; tech-choice-order 9/0
- Czerwony na bazie: z plikiem logiki z cde7cfcbb test daje 6 pass / 3 fail (kolejność Łowiectwo, Obróbka drewna, Oswojenie zwierząt, Rolnictwo = zrzut właściciela). Po przywróceniu: 9/0.
- AI: git grep buildHubTechEntries/scienceHubSnapshotLogic w gra/src: tylko sciencePicker.ts (UI); AI i drzewko bez zmian.
- Zrzut mozesz-wybrac-po.png obejrzany: kolejność poprawna, 4 badania + 4 „Wkrótce · zablokowane”.

BLOKADY: NIE_ZMIERZONO Chromium/Vite pełnej gry (nowa gra -> panel); zrzut z harnessu Operatora na prawdziwym tech.json (koszt 5 PN w harnessie, nie 40 PN — nie dotyczy zmiany). Brak innych.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora kandydata 3de5271101 (merge z origin/main czysty), deploy ROBOCZA po READY_FOR_DEPLOY.
UWAGI-DLA-ORKIESTRATORA: origin/main (6c1687274) nie zawiera bazy cde7cfcbb jako przodka — przed FF/merge sprawdź ancestry kodu operatora (e9e532b43) wobec docelowego main; merge-tree czysty. Dysk wolny ~2,4 GB — usuń worktree po integracji. Dług Rust: REPIN nie dotyczy.
DEPLOY/PUSH: NIE WYKONANO
