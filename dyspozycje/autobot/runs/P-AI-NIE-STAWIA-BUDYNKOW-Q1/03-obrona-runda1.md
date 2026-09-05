# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — OBRONA Operatora, RUNDA 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
GOAL: miasta AI (duże cywilizacje i państwa-miasta) faktycznie stawiają budynki,
gwarancja barbarzyńska nietknięta, bramka-weryfikator wzrostu `cityBuilt`
ZMIANY/COMMIT: `376887a4` (kod+bramka) + ten raport — `gra/src/main.ts`,
`gra/src/game/empire-city-defaults.ts`, `gra/tools/ai-buduje-budynki-test.cjs`,
`dyspozycje/autobot/runs/<ID>/**`. Cała allowlista dispatchu; `ai.ts`, `owner-utils.ts`,
`cities.ts`, `auto-manage.ts` NIETKNIĘTE.
MODEL+EFFORT: Opus 5, effort high · RUNDA: 1/5 (obrona nie zwiększa licznika)
TESTY: `tsc --noEmit` 0 błędów · `ai-buduje-budynki-test` **PASS=35 FAIL=0** (było 22
asercje) · referencyjne bez regresu: 213/213, 19/19, 33/33, 13/13, 6/6 · powiązane
zielone: empire-city-defaults 53/0, auto-manage 45/45, ai-prod-fallback 17/0,
ai-production-priority 9/0, barb-city-behavior 178/0, barb-city-owner-contract 3/3 ·
czerwienie parytetowe co do liczby jak u Evaluatora (ai-test 287/8, ai-praca-split-parity
21/1, barb-city-capture-cluster 92/1 — dług przed-istniejący)
BLOKADY: brak
NASTĘPNY KROK: Final Control (§3c pkt 3) — werdykt per zarzut
DEPLOY/PUSH: NIE WYKONANO

**Wszystkie 7 zarzutów PRZYJĘTE i poprawione. Zero ODRZUCAM.**

> §11: ok. 620 słów wobec limitu ok. 400. Dalej nie skracam — §3c wymaga dowodu
> z wytworu przy KAŻDYM z 7 zarzutów, a to on zajmuje objętość. Stąd
> `PASS-WITH-NOTES`, nie `PASS`.

## OBRONA

**1 → PRZYJMUJĘ.** ECHO wyprzedza dispatch. `empire-city-defaults.ts:396` brzmi dziś
`if (ownerId < 0 || isBarbarianOwner(ownerId))` (było `<= 0`); `main.ts:4803` seeduje
gracza przez `freshOwnerDefaultBudowaProfilForOwner(0, isBarbarian)`. Dowód z biegu:
kolumna `gracz` — FIX **1**, MUT-A (stan sprzed) **0**. A4/A4b/A4c przepisane na „gracz
ma tryb AUTO"; kontrolę zachowuje per miasto (`onBudowaEnterManual`, `main.ts:7006`,
ustawia `budowaFocusOverride = true`).

**2 → PRZYJMUJĘ.** Nowa `upgradeBudowaProfilAutoDefaultsOnLoad`
(`empire-city-defaults.ts:425`) wołana po `migrateBudowaProfilOnLoad` na OBU ścieżkach:
`main.ts:8208` (ClusterStart) i `:35173` — to drugie WEWNĄTRZ `restoreGameFromSave`,
więc obejmuje też `loadGameFromSlot` (`:34582`). Dowód nie z deklaracji: realny roundtrip
`buildSaveGameSnapshot()` → `restoreGameFromSave()` na zapisie zdegradowanym do postaci
sprzed naprawy — A8/A8b (tryb auto po wczytaniu), A9 (0 → 12 i 0 → 7 w turach 13 → 46);
nietautologiczne przez **M3b** (w MUT-A te same miasta zostają na `'reczny'`). Podnoszona
jest wyłącznie wartość równa staremu defaultowi, miasta z pinem pomijane — globalne
`'reczny'` nie może pochodzić z decyzji gracza, bo jedyny zapis profilu globalnego
(`main.ts:7000`) stoi pod `if (!city.budowaFocusOverride)`.

**3 → PRZYJMUJĘ.** `--outDir` to `os.tmpdir()/civ-ai-buduje-budynki`; asercja **H0**
pilnuje, że katalog leży poza drzewem repo, `fs.rmSync` sprząta. Po biegu zero artefaktów
bramki w `gra/`, `TMP_ROOT` usunięty.

**4 → PRZYJMUJĘ.** Wariant budowany jest z LUSTRA `gra/` w `os.tmpdir()` (kopia `src`,
dowiązania `data`/`node_modules`), mutacja żyje wyłącznie w kopii — `SIGKILL` nie zostawi
worktree z cofniętą naprawą. Asercja **H0b** (bajt w bajt po trzech buildach) zielona.

**5 → PRZYJMUJĘ, szerzej niż zarzut.** Komentarz w `applyCityCaptureToMap` (PL `:26495`,
EN `:26515`) mówi teraz, że reset NIE jest globalny, wskazuje nowego nośnika i zakazuje
jego uproszczenia, powołując się na czerwieniejący MUT-B. Znalazłem **drugi** nośnik tej
samej nieprawdy, spoza zarzutu: `seedCityOwnerDefaults` (`main.ts:4862`) — „reset zostaje
NIETKNIĘTY dla gracza" jest po zarzucie 1 fałszem; poprawione.

**6 → PRZYJMUJĘ.** (a) **A7** mierzy POKRYCIE per miasto: każde miasto dużego AI w wieku
≥15 tur musi mieć ≥1 wpis w `cityBuilt`, z wydrukiem rozkładu. (b) Przebieg
**zdeterminizowany** ziarnowanym `Math.random` (mulberry32, `addInitScript`), kod gry
nietknięty — sprawdzone dwoma pełnymi biegami o **identycznych** liczbach. (c) M1/M2 mają
**margines 3** zamiast gołej nierówności (FIX−MUT-A: 12−4 i 7−1). Draft tej obrony
twierdził, że pokrycie nie rozróżnia wariantów — pomiar to **obalił** (FIX 5/5, MUT-A
2/9), więc dodałem **M6**: mutant musi zostawić długo trzymane miasto AI z zerem
budynków, FIX żadnego.

**7 → PRZYJMUJĘ.** `01-operator-runda1.md` ma `GOAL:` i `ZMIANY/COMMIT:` (SHA `42411540`
+ allowlista); **915 → 550 słów**, surowe rozliczenie 117 bramek i NOTY w
`01-operator-runda1-ZALACZNIK-bramki.md`. Zapisy zdezaktualizowane tą obroną oznaczone
w 01 jako ZASTĄPIONE, nie usunięte po cichu.

## DO DECYZJI CZŁOWIEKA (wytwór sam tego nie rozstrzyga)

1. **Zapis sprzed naprawy z globalnym `'reczny'` GRACZA jest podnoszony do auto** —
   traktuję to `'reczny'` jako ślad starego defaultu, bo kod dowodzi, że nie mogło
   pochodzić z decyzji gracza. Jeśli ECHO miało znaczyć „auto tylko w NOWYCH grach" —
   jedna linia w `upgradeBudowaProfilAutoDefaultsOnLoad` (`if (oid === 0) continue;`).
2. **Skutek uboczny ECHO:** miasta gracza same wkładają budynki do kolejki Pracy, więc
   jego `doBudynkow` przestaje wracać do puli ulepszeń terenu (mechanizm z NOTY 2 R1,
   teraz dotyczy też gracza).
