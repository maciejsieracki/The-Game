# P-AI-NIE-STAWIA-BUDYNKOW-Q1 — Evaluator, RUNDA 2

STATUS: 3 ZARZUTY (Evaluator nie wydaje werdyktu PASS/FAIL — §3c)
DOMAIN: GAME
TEMAT: `P-AI-NIE-STAWIA-BUDYNKOW-Q1`
GOAL (dispatch + RATYFIKACJA 2026-09-05, Decyzja 1): `upgradeBudowaProfilAutoDefaultsOnLoad`
POMIJA ownera 0; migracja AI/miast-państw, gwarancja barbarzyńska i seed nowej gry bez zmian.
MODEL+EFFORT: Opus 5, effort high · RUNDA: 2/5 · oceniane: `9d031c77` + `408b9e33`
ZMIANY/COMMIT: bez zmian w kodzie gry; ten raport (`dyspozycje/autobot/runs/<ID>/**`)
DEPLOY/PUSH: NIE WYKONANO

## TESTY (uruchomione samodzielnie, nie odczytane z raportu)

- `tsc --noEmit` (5.9.3) — **0 błędów**.
- `node tools/ai-buduje-budynki-test.cjs` — **PASS=39 FAIL=0**, mój własny, pełny bieg
  (4 buildy + 4 przebiegi Chromium). Liczby **co do jednego** jak u Operatora:
  FIX 12/7/**0**/1 pokrycie 5/5 · MUT-A 4/1/0/0 pokrycie 2/9 · MUT-B 12/7/**1**/1 ·
  roundtrip legacy: FIX `gracz=["reczny"] duzeAI=["zrownowazone"] PM=["zrownowazone"]`,
  MUT-C `gracz=["zrownowazone"]`. Przebieg jest zdeterminizowany — zero rozjazdu.
- Referencyjne: 213/213, 19/19, 33/33, 13/13, 6/6.
- 22 bramki AI/miast zielone (m.in. empire-city-defaults 53/0, auto-manage 45/45,
  barb-city-behavior 178/0, barb-city-owner-contract 3/3, ai-improvements 52/0,
  production-overflow 201/0, city-orderstate-restore-clear 9/0). Trzy czerwienie
  parytetowe odtworzone **identycznie**: ai-test 287/8, ai-praca-split-parity 21/1,
  barb-city-capture-cluster 92/1 — dług przed-istniejący.
- **Własna mutacja, poza bramką** (esbuild, bundle jednostkowy, worktree nietknięty):
  (i) FIX podnosi `[1,7]`, gracz i barbarzyńcy zostają `'reczny'`; SEED
  `freshOwnerDefaultBudowaProfilForOwner(0)` = `'zrownowazone'` — **dwie różne ścieżki,
  niepomylone**; (ii) po cofnięciu WYŁĄCZNIE `if (oid === 0) continue;` podniesieni to
  `[0,1,7]` i miasto gracza wchodzi w `'zrownowazone'` — asercja A10 realnie czerwienieje;
  (iii) **gwarancja barbarzyńska ma faktycznie DWA nośniki i oba są nośne**: zdjęcie samej
  gałęzi w `freshOwnerDefaultBudowaProfilForOwner` daje barbarzyńcom auto w seedzie, zdjęcie
  samej gałęzi w migracji podnosi `-1` i `-99` przy wczytaniu. MUT-B bramki zdejmuje OBA.
- Diff w allowliście (2 pliki `gra/`, bramka, `runs/**`), zero sekretów, zero usunięć
  poza wycofaniem A4c, `main` nie ruszył tych plików od `05df297a` (brak kolizji §2b).

## ZARZUTY

**1. Komentarz-nośnik w `seedCityOwnerDefaults`/`initOwnerDefaultCityFields` twierdzi
nieprawdę o graczu.** `gra/src/main.ts:4829-4830`: „Gracz (0), barbarzyńcy (-1)
i rebelianci (-99) zostają na 'reczny' — patrz docstring `freshOwnerDefaultBudowaProfilForOwner`".
Kod dwa wiersze niżej (`:4834`) oraz `:4803` dają graczowi `'zrownowazone'`, a przywołany
docstring (`empire-city-defaults.ts:376-378`) mówi wprost `ownerId >= 0 → tryb auto`.
To DOKŁADNIE ta klasa błędu, którą runda 1 zgłosiła jako zarzut 5 (PRZYJĘTY) i którą
runda 2 deklaruje jako zamiecioną („trzy komentarze-nośniki… twierdziły nieprawdę");
sprzątanie jest niepełne, a pominięty egzemplarz stoi na ścieżce SEED — czyli tam, gdzie
mylenie seedu z migracją łamie ECHO „gracz też startowo auto". Poprawka: jedno zdanie
(„gracz 0 dostaje tryb auto; `'reczny'` zostaje ownerom ujemnym; wyjątek WYŁĄCZNIE
w migracji wczytania — Decyzja 1").

**2. Bramka przestała mierzyć ECHO „gracz też startowo auto" na ścieżce PRZEJĘCIA
w nowej partii.** `gra/tools/ai-buduje-budynki-test.cjs:612-616` — A4b, jedyna asercja
pokrywająca „miasto zdobyte przez GRACZA dostaje tryb AUTOMATYCZNY", została odwrócona
na przyjęty skutek Decyzji 1 (przejęcie po roundtripie starego zapisu → `'reczny'`),
a A4c wycofana. Po rundzie 2 żadna asercja nie mierzy przejęcia przez gracza w NOWEJ
partii. Uzasadnienie Operatora (`:607-609`: „A4 pokazuje…, a A6, że…") jest **złożeniem
dwóch asercji, czyli dowodem z wnioskowania**, a ten temat sam ustanowił regułę „dowód
z pomiaru, nie z deklaracji" (dispatch, tryb drugi). Regresja pokrycia wobec rundy 1 na
ECHO wiążącym. Poprawka **bez perturbacji świata** (obawa Operatora o A7 jest zasadna):
wystawić w `dumpBuildings()` (`main.ts:22002`) globalny `ownerDefaultBudowaProfil` i dodać
asercję, że w turze 0 owner 0 ma tryb auto — łącznie z A6 daje pomiar obu połówek,
bez ani jednego dodatkowego przejęcia.

**3. `git diff --check` nie jest czysty.**
`dyspozycje/autobot/runs/P-AI-NIE-STAWIA-BUDYNKOW-Q1/01-operator-runda1-ZALACZNIK-bramki.md:81`
— „new blank line at EOF". Bariera z `CLAUDE.md` („przed zapisem sprawdź allowlistę,
`git status`, diff i `git diff --check`") jest w gałęzi naruszona; plik pochodzi z OBRONY
R1, runda 2 go nie ruszała, ale wejdzie do `main` razem z tą pracą. Poprawka: usunąć
pustą linię na końcu pliku.

## POZA ZARZUTAMI (nie wady pracy)

- **Zakres bramek AI/miast w rundzie 2 jest węższy niż w rundzie 1** (17 wobec 117
  z kryterium końca „uruchom WSZYSTKIE"). Uznaję to za proporcjonalne do zmiany
  jednoliniowej zamkniętej w `upgradeBudowaProfilAutoDefaultsOnLoad` i sam też nie
  powtarzałem pełnych 117; sprawdziłem za to osobno bramki ścieżki wczytania
  (`city-orderstate-restore-clear` 9/0) i budowy (`budowa-lista-szablony` 11/0). Zapisuję,
  żeby Final Control widział lukę, a nie żeby ją naprawiać.
- **§16a pkt 9 (GOAL raportu vs `00-dispatch.md`):** GOAL rundy 2 jest zawężony do
  Decyzji 1 — ale ta Decyzja **żyje w `00-dispatch.md`** (sekcja RATYFIKACJA), więc to
  nie jest utrata kontekstu. Kryteria końca całego tematu potwierdziłem osobno jako wciąż
  zielone (A1/A1b/A2/A2b/A3/A5/A6/A7 w moim biegu).
- Trzy przyjęte skutki z promptu ratyfikacji („tylko nowe partie", „gracz startowo auto
  w nowych partiach", praca gracza nie wraca do puli ulepszeń) **nie są przeze mnie
  zgłaszane jako defekty** — sprawdziłem wyłącznie, czy kod i bramka faktycznie je realizują.

## BLOKADY

Brak. Zarzut 1 to jeden komentarz, zarzut 2 to jedna asercja + jedno pole w haku
diagnostycznym (allowlista wystarcza), zarzut 3 to jedna pusta linia.

## NASTĘPNY KROK

Obrona Operatora (§3c pkt 2) do zarzutów 1-3, potem Final Control na tym samym ID.
