# R-BUDYNEK-GARNIZON-NOWY-Q1 — Evaluator, runda 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
MODEL+EFFORT: Opus 5, effort high.
ZMIANY/COMMIT: nic w `gra/` ani w `docs/` — Evaluator tylko weryfikuje. Oceniany zakres: `e1bc77b6..a3e4ea6e` (12 plików). Własny artefakt: ten raport.
TESTY: własne uruchomienia (nie przepisane z raportu) — `tsc --noEmit` exit 0; `budynek-garnizon-test` **80/0**; `grupy-budynkow-test` **84/0**; pięć referencyjnych 213/213, 19/0, 33/0, 13/0, 6/0; `civpedia-budynki-historia-test` **138/3 (REGRES)**; sześć pozostałych bramek CivPedii zielonych; `koszty-surowcowe` 126/3 (bez zmiany), `building-happiness` 8/0, `prawo-siatka-v2` 55/0; `ai-buduje-budynki` — faza FIX domknieta (pokrycie 5/5, roundtrip save/load OK), warianty mutacyjne przerwane swiadomie, pelnej liczby nie podaje. Trzy WŁASNE mutacje E1–E3 (inne niż M1–M3 Operatora): 3/3 czerwienią bramkę, każda cofnięta kopią pliku, `git diff --quiet` czysto, md5 zgodne przed/po.
BLOKADY: 6 zarzutów niżej; z tego 2 wymagają decyzji orkiestratora (fix poza allowlistą tematu), 3 są brakami w śladzie (BLOKADY, `decision-abc.md`, rejestr), 1 jest przekroczeniem §11. Żaden nie jest naruszeniem granicy §9 ani FAIL-em `STRICT-PARITY`.
RUNDY: 2/5
NASTĘPNY KROK: Final Control (werdyktu nie wydaję — §16).
DEPLOY/PUSH: NIE WYKONANO

---

## Stan wejściowy (§2b)

`git log -1` = `a3e4ea6e`, drzewo **czyste**, gałąź `autobot/R-BUDYNEK-GARNIZON-NOWY-Q1`.
Prompt wskazywał `e1bc77b6` — to baza rundy 2 (ratyfikacja), a `git merge-base --is-ancestor e1bc77b6 HEAD` → **TAK**;
`a3e4ea6e` to trzy commity rundy 2 na tej bazie. **Nie jest to rozjazd izolacji** — nie zgłaszam `BLOCK`.

## PUNKT KONTROLI 1 — liczby właściciela (własny odczyt `buildings.json`)

| pole | wymagane R2-A | w pliku | zamrożone asercją |
|---|---|---|---|
| `kosztBudowy` | 30 | **30** | `[R2-A]` |
| `przyrostKosztu` | 6 | **6** | `[R2-A]` |
| `utrzymanie` | 2 | **2** | `[R2-A]` |
| `przyrostUtrzymania` | 1 | **1** | `[R2-A]` |
| `koszt_surowce` | drewno 30 | **{drewno: 30}** | `[R2-A]` (pełne `JSON.stringify`, nie sam klucz) |
| `maksPoziom` | 1 | **1** | `[R2-A]` |
| `epokaWejscia` | 1 | **1** | `[R2-A]` |
| `lokalizacja` | region | **region** | `[C]` (runda 1) |
| `techUnlock` | `"-"` | **`"-"`** | `[C]` (runda 1) |
| `dajeSzczescie` | false | **false** | `[C]` (runda 1) |

**Dziesięć na dziesięć zgodnych.** Zamrożenie jest realne, nie deklarowane — sprawdzone mutacją E1 (niżej).
Obok `=== 30` stoją asercje `[N]` na `Number.isInteger`, więc podmiana `30` → `"30"` też czerwieni.

## PUNKT KONTROLI 2 — czy budynek istnieje w żywej grze (obejrzałem 4 zrzuty)

| zrzut | co REALNIE widać | ocena |
|---|---|---|
| `garnizon-kolejka-budowy.png` | „Garnizon" z **aktywnym** przyciskiem `Buduj` w „Dostępne do budowy" miasta regionalnego epoki 1, nad linią „Jeszcze zablokowane" | zgodny z raportem |
| `garnizon-karta-encji.png` | pełna karta, **kolumna wartości w kadrze** (60 pkt Pracy, +6/poziom, 4 Pieniądza + −5 Drewno/t, +1/poziom, 60 Drewno), medalion z własną ikoną, rys historyczny, „Brak wymogu (startowa)" | zgodny; **zarzut 5 rundy 1 (ucięcie) naprawiony** |
| `garnizon-kolejka-budowy-i-karta.png` | oba panele w jednym kadrze | zgodny |
| `garnizon-civpedia-klik-panel.png` | panel CivPedii otwarty na haśle „Garnizon" z treścią Wiki‑M + pomarańczowa ramka: „MOST KLIK→PANEL DOKŁADA TEN TEST, NIE GRA" | **uczciwy, ale nie dowodzi kryterium 3** → zarzut 1 |

Żaden zrzut nie brakuje (§9 poz. 6a spełniony co do formy dowodu). Czwarty zrzut sam siebie ogranicza —
to jest wzorowe zachowanie, ale nie zmienia tego, że kryterium 3 mówiło o kliku w grze.

**Kontrola odtwarzalności dowodu** (nie było w zadaniu, ale dowód, którego nie da się odtworzyć, jest deklaracją):
przegenerowałem komplet czterech zrzutów z obecnego drzewa do katalogu scratch
(`node tools/budynek-garnizon-test.cjs --shots <scratch>`, bramka nadal **80/0**) i porównałem z zacommitowanymi:
442×828, 702×834, 1240×1711, 1240×1801 — **cztery na cztery zgodne co do piksela wymiarów**.
Zacommitowane zrzuty pochodzą więc z tego stanu drzewa, nie z wcześniejszego. `git status` po tej operacji czysty
(bramka bez `--shots` nie pisze nigdzie; z `--shots` pisze wyłącznie tam, gdzie się jej wskaże).

## PUNKT KONTROLI 3 — zakres (`git diff e1bc77b6..HEAD --stat`)

12 plików, **każdy w allowliście rundy 1 + czterech pozycjach ratyfikacji**; zero plików spoza.

- `gra/src/game/ai.ts` — **`1 +`, zero usunięć**, dokładnie jedna linia `'garnizon',` w `infraOrder` (ai.ts:1479). Rejon kolizji §2b (`ai.ts:2517`) **nietknięty**.
- `gra/data/buildings.json` — `2 +-`, wyłącznie tekst pola `uwagi` rekordu `garnizon`; **zero zmian w innych rekordach**.
- `gra/src/data/wikiBundle.json` — programowe porównanie z wersją z `e1bc77b6`: **+1 wpis (`budynki/garnizon`), 0 zmienionych, 0 usuniętych**, `poradnik` identyczny, jedyna inna różnica to stempel `generated` 2026-09-04→05. Twierdzenie Operatora potwierdzone własnym odczytem.
- `gra/tools/grupy-budynkow-test.cjs`, `gra/tools/budynek-garnizon-test.cjs`, `docs/encyklopedia/budynki/garnizon.md`, 4 zrzuty, 2 raporty w `runs/**` — w allowliście.

Zero `git add -A` / `git add .` — potwierdzone kształtem diffu (żadnego pliku obcego tematu).

## PUNKT KONTROLI 4 — trzy WŁASNE mutacje (inne niż M1–M3 Operatora)

Każda przez edycję pliku, cofnięta **kopią ze scratchpada** (`GARNIZON-R2-EVAL-*.bak`, C-036), nigdy `git checkout`.
Po każdej `git diff --quiet` na zmutowanym pliku → czysto; md5 wszystkich trzech plików po zakończeniu **identyczne z md5 sprzed mutacji**.

| # | mutacja (celowo inne pole/plik niż u Operatora) | wynik bramki | co się zaczerwieniło |
|---|---|---|---|
| **E1** | `buildings.json`: `garnizon.utrzymanie` 2 → **3** | `budynek-garnizon` **80/0 → 79/1** | `[R2-A] garnizon.utrzymanie === 2` — `{"jest":3,"oczekiwane":2}` |
| **E2** | `grupy-budynkow-test.cjs`: `expectedCounts['Prawo i administracja']` 9 → **10**, `TOTAL` **bez zmiany** | `grupy-budynkow` **84/0 → 82/2** | `grupa "Prawo i administracja" ma 10 (ma: 9)` **oraz** nowa asercja `suma expectedCounts (43) === TOTAL (42)` |
| **E3** | `wikiBundle.json`: usunięty **wyłącznie** wpis `budynki/garnizon`; plik `.md` **nietknięty** | `budynek-garnizon` **80/0 → 71/6** | `[W4]`, `[CP3]` (`{"panelIstnieje":true,"otwarty":false}`), `[CP4]`, `[CP5]`, `[CP6a]`, `[CP6b]` |

**E2 dowodzi**, że dołożona przez R2-B asercja spójności nie jest ozdobą — łapie dokładnie ten błąd, przed którym ostrzega komentarz.
**E3 jest mocniejsza od M3 Operatora**: usuwa hasło **tylko z wygenerowanego bundla**, zostawiając `.md` na dysku, i mimo to panel realnie **się nie otwiera**. To wyklucza, że `[CP*]` mierzą obecność pliku Markdown zamiast zachowania żywego panelu.

## Pokrycie dziesięciu punktów §16a (dla Final Control, pkt 3 §16b)

| # | punkt §16a | wynik |
|---|---|---|
| 1 | diff w allowliście co do pliku | **TAK** — 12/12 plików, patrz Punkt kontroli 3 |
| 2 | granice §9 | **brak naruszeń** — zero `npm run build/dev` (tylko `tsc --noEmit` i `vite.js` z bramki), zero `git add -A`, `WERSJE.md`/`ROBOCZA-MANIFEST` nietknięte, `playbook.json` nietknięty, brak zmian procesu w allowliście produktowej, zero deploy/push |
| 3 | bramki faktycznie przechodzą (uruchomione niezależnie) | **TAK** — 30 bramek uruchomionych przeze mnie, wyniki wyżej; jedna czerwień z tej rundy → zarzut 2 |
| 4 | save/load, parytet gracz/AI/MP, ścieżki brzegowe | **FAIL #9 (SAVE): nie dotyczy** — temat nie dodaje żadnego nowego trwałego pola stanu; nowy budynek jedzie istniejącą, już serializowaną listą `cityBuilt`. **FAIL #7 (EDGE): spełniony** — bramka ma asercje negacji i wartości brzegowych, nie sam happy-path: `[W7]` resolver **nie** trafia dla nieistniejącego id, `[U]` **żaden** budynek nie ma `upgradeFrom === 'garnizon'`, `[U-silnik]` sanity że mechanizm awansu **faktycznie** usuwa Dom Starszyzny, `[AI2]`/`[CP6a]`/`[D4]` sanity przeciw pusto-zielonym asercjom. **FAIL #8 (PARITY): → zarzut 4**, z klasyfikacją „pre-existing baseline" tamże |
| 5 | sekrety w diffie | **brak** — diff to dane budynku, licznik w bramce, jedna linia listy, tekst hasła i zrzuty |
| 6 | usunięcia, których `GOAL` nie wymagał | **brak** — 21 usunięć to wyłącznie linie zastąpione w `grupy-budynkow-test.cjs`, linia `uwagi` i linia bundla |
| 7 | nakładanie się z drugim aktywnym tematem (§2b) | rejon `ai.ts:2517` **nietknięty**; współdzielenie worktree z Obroną → OBSERWACJE 1 |
| 8 | zrzut z żywej przeglądarki + dowód nietautologiczności | **TAK** — 4 zrzuty obejrzane i odtworzone, 3 własne mutacje E1–E3 czerwienią bramkę |
| 9 | `GOAL` raportu = `GOAL` dispatchu; kryteria końca te same | **TAK** — brzmienie identyczne co do treści; raport adresuje wszystkie siedem kryteriów ratyfikacji po numerach |
| 10 | temat dzielony na węzły | **nie dotyczy** — temat jednowęzłowy |

## ZARZUTY

1. **Kryterium końca 3 NIESPEŁNIONE w brzmieniu dosłownym — klik w grze jest martwy.**
   Ratyfikacja: „klik «Więcej informacji» na karcie Garnizonu **otwiera** je w żywym Chromium".
   Sprawdziłem sam, nie z raportu: `renderer.ts:374-385` tworzy przycisk i ustawia na nim wyłącznie
   `data-civpedia-folder`/`-slug`; jedyny delegowany listener karty (`renderer.ts:434`) łapie
   `button[data-entity-kind]`, którego ten przycisk **nie ma**; `openEncyEntry` (`wikiHubHud.ts:315`,
   wystawione w API `:546`) ma w `gra/src` **zero miejsc wywołania** (`main.ts`: zero trafień na `civpedia`).
   Klik jest martwy dla **wszystkich 42 budynków**. Most klik→panel dokłada bramka i mówi to wprost na zrzucie.
   **Przeczytałem ten most** (`budynek-garnizon-test.cjs:596-608`): to jeden `addEventListener`, który czyta **wyłącznie**
   `data-civpedia-folder`/`-slug` z samego przycisku i podaje je **realnemu** `api.openEncyEntry` z **realnego**
   `__createWikiHubHud` na **realnym** `wikiBundle.json`; klik jest prawdziwym `page.click` Playwrighta, a ostrzeżenie
   wpisywane jest do zrzutu programowo, nie dorysowane po fakcie. Most nie podstawia treści ani nie omija resolvera —
   zastępuje **tylko** brakujące wiązanie. Uczciwość dowodu: bez zarzutu.
   Spełnione są dwie z trzech części kryterium (hasło istnieje, bundle je zawiera, panel realnie renderuje treść po otwarciu).
   **Operator postąpił prawidłowo** — nie wszedł w plik spoza allowlisty i zgłosił `DECISION_REQUIRED` (D1);
   zarzut jest o stan kryterium, nie o pracę. Rozstrzygnięcie należy do orkiestratora, nie do rundy 3.

2. **REGRES: `civpedia-budynki-historia-test.cjs` 136/0 → 138/3.**
   Zmierzone przeze mnie na tym drzewie: **138 pass / 3 fail**, wszystkie trzy to zaszyty licznik `25` vs faktyczne `26`
   (`:75` pliki `.md`, `:123` wpisy `folder=budynki` w bundlu, `:126` niepuste `historia`).
   Potwierdziłem, że bramka **była zielona przed rundą 2**: w `e1bc77b6` katalog ma **25** plików `.md`, a bramka asercjonuje `25`.
   Czyli praca tej rundy zamienia zieloną bramkę w czerwoną. Treść przechodzi w całości — to wyłącznie liczniki,
   ta sama klasa długu co R2-B. Zgłoszone przez Operatora (D2) i wcześniej przez Obronę rundy 1 (BLOKADY 5),
   plik jest poza allowlistą. **Gałąź w obecnym stanie nie może iść do integracji bez rozstrzygnięcia tej pozycji** —
   albo rozszerzenie allowlisty i bump `25 → 26`, albo jawna, zapisana zgoda na czerwoną bramkę.

3. **Pole BLOKADY raportu rundy 2 zgubiło dwie przyjęte i wciąż otwarte blokady rundy 1.**
   Raport rundy 2 wymienia 3 pozycje D + naruszenie izolacji. Brakuje:
   (a) **twardej zależności kolejności deployu** — Garnizon wydany przed `R-PRAWO-PRZEBUDOWA-SKALI-Q1` jest
   dla gracza czystym kosztem bez jednej korzyści (zarzut 3 rundy 1, PRZYJĘTY, Obrona wpisała go do swoich BLOKADY 2);
   (b) **kolizji `prawo_garnizon*`** — cztery klucze o przeciwnej mechanice w `society-params.json` plus zajęte
   `id: 'garnizon'` w `society-breakdown.ts:638-647` (zarzut 4 rundy 1, PRZYJĘTY, Obrona BLOKADY 4).
   Obie nadal nierozwiązane (`society-params.json` i `society-breakdown.ts` nie ma w diffie — słusznie, są zakazane).
   Treść żyje w `03-obrona-runda1.md`, ale orkiestrator czytający **najnowszy** raport etapu ich nie zobaczy,
   a (a) jest kandydatem do decyzji człowieka o kolejności publikacji. Kontrakt raportu wymaga „jawnej listy" w BLOKADY.

4. **Kryterium 4 spełnione co do litery, niespełnione co do skutku, którego chciał właściciel.**
   ECHO: „Dopisać Garnizon do listy AI od razu"; kryterium: „`garnizon` na liście AI + asercja w bramce" — **oba spełnione**
   (`ai.ts:1479`, asercje `[AI1]–[AI3]`, mutacja E-równoważna u Operatora czerwieni).
   Ale zweryfikowałem zakres sam: `infraOrder` leży wewnątrz `if (opts.defensiveCopy)` (`ai.ts:1455`), a `defensiveCopy`
   to `typCityCopyOwners.has(ownerId)` (`main.ts:30032`, `:30150`) — **państwa-miasta**. Cywilizacje AI wybierają budynki
   z osobnych zaszytych list (`ai.ts:~1341` pod zagrożeniem, `~1415` faza mid), w których Garnizonu nie ma.
   **Skutek: Garnizon zbudują państwa-miasta, zwykłe AI nadal go nie widzi.** Operator wykonał dokładnie to, co zleciła
   ratyfikacja („dokładnie jedna linia"), nie improwizował i zgłosił to jako D3 — zarzut jest o stan parytetu gracz/AI,
   nie o wykonanie. Decyzja (druga linia teraz vs. temat `P-AI-LISTA-BUDYNKOW-ZASZYTA-…`) należy do orkiestratora/właściciela.

   **Klasyfikacja wg `R-PROC-AUTOBOT-EVAL-STRICT-PARITY`:** to **nie jest FAIL #8**, tylko wyjątek
   „pre-existing baseline poza tematem" → `PASS-WITH-NOTES`. Uzasadnienie: (a) diff **nie wprowadza** gałęzi
   `ownerId`/`defensiveCopy` — ona istniała przed tym tematem; (b) ta sama luka dotyczy **wszystkich** budynków
   dodanych do gry, nie Garnizonu (dowód: listy `ai.ts:~1341` i `~1415` są zaszyte i nie czytają `availableProduction`);
   (c) przyczyna źródłowa ma już własny zarejestrowany temat; (d) linia diffu niesie ID tematu w komentarzu,
   a bramka dokumentuje zakres łatki wprost w komentarzu sekcji `[AI]`. **Zakaz z STRICT-PARITY („PASS, bo gracz
   działa, AI później") nie jest tu naruszony** — asymetria jest nazwana, zmierzona i eskalowana, a nie przemilczana.

5. **BRAK `decision-abc.md` przy statusie `DECISION_REQUIRED` — playbook C-054 nazywa to wprost FAIL-em dla Evaluatora.**
   Cytat reguły: *„FAIL dla Evaluatora: brak `decision-abc.md` mimo widocznego konfliktu w raporcie Operatora"*.
   Konflikt jest widoczny i nazwany przez samego Operatora (D1: ratyfikacja zakłada, że brakuje tylko hasła — kod mówi,
   że brakuje listenera; kryterium 3 niewykonalne w allowliście). C-054 wymaga **razem**: (a) pliku
   `dyspozycje/autobot/runs/R-BUDYNEK-GARNIZON-NOWY-Q1/decision-abc.md` z opisem konfliktu — po jednym zdaniu
   co mówi dispatch / kod / testy, bez proponowania rozwiązania; (b) ledger `DECISION_REQUIRED`; (c) statusu
   `ABC-OCZEKUJE` w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.
   **Sprawdziłem: pliku nie ma** (`ls` katalogu runu — sześć plików + `dowody/`, żadnego `decision-abc.md`),
   a w repo osiem innych tematów taki plik ma, więc to żywa praktyka, nie martwa litera.
   **Sprawdziłem też rejestr: `R-BUDYNEK-GARNIZON-NOWY-Q1` nie występuje w `REJESTR-PROSB-I-ZADAN.md` ani razu**
   (trafienia na „GARNIZON" to trzy inne, starsze tematy). Ta druga część to zaległość orkiestratora, nie Operatora —
   temat nigdy nie został zarejestrowany, także w rundzie 1. Kierunek naprawy: plik `decision-abc.md` należy do
   Operatora, wpis w rejestrze do orkiestratora. Dotyczy to również rundy 1, która też miała `DECISION_REQUIRED`.
   *Waga: wysoka — to jedyny zarzut wskazany w playbooku imiennie jako FAIL po stronie mojej roli.*

6. **§11 — raport rundy 2 ma 2120 słów przy limicie orientacyjnym ~400, bez noty wyjątku.**
   Runda 1 przekroczyła limit świadomie i **zadeklarowała to** (dispatch zamawiał recon G1 i tabelę pomiarową G3 —
   treści obszerne z natury). Runda 2 nie miała żadnej sekcji obszernej z zamówienia, a jest 5× ponad limit i nie zawiera
   noty §11. Zgodnie z samym §11 to `PASS-WITH-NOTES`, nie `FAIL` — ale wraca do skrócenia.

## Czego NIE zarzucam (sprawdzone, twierdzenia raportu potwierdzone)

- **Liczby na karcie a liczby w danych.** Sprawdziłem łańcuch mnożników: `buildingWorkCost` = baza × tempo ×
  `GLOBAL_BUILDING_PROD_MULT(0.5)` × `FALA1(2)` × `FALA2(2)` = **×2.0 vs JSON** (`production.ts:503-516`), a domyślne tempo
  kreatora to `'niski'` = ×1.0 (`newGameFlow.ts:198`, `main.ts:33076`, `cityPanel.ts:7290`). Hasło CivPedii podaje
  60/60/4 jako wartości ekranowe **i** 30/30/2 jako dane **i** ostrzega, że tempo Normalny/Wysoki mnoży dodatkowo ×2/×4
  (`building-cost-tempo-test.cjs:55-61` potwierdza te mnożniki). **Opis jest poprawny, nie mylący.**
- **`civpedia-gra-id-mostek-test.cjs` nie zabrudził `wikiBundle.json`** — uruchomiłem go, `git status` po przebiegu czysty.
- **Zero regresu w rodzinie CivPedii poza pozycją z zarzutu 2**: cuda 126/0, historia-infra 18/0, jednostki-j1 161/0,
  j2 157/0, wikihubhud-duplikacja ALL GREEN, gra-id-mostek exit 0.
- **`koszty-surowcowe` 126/3 bez zmiany** względem pomiaru rundy 1 — trzy faile pre-istniejące, bez związku z Garnizonem.
- **Rodzina budynków bez zmian względem tabeli rundy 1** — uruchomiłem dziewięć bramek danych na tym drzewie:
  `upgrade-budynki` 48/1, `prereq-budynkow` 51/8, `plony-budynkow` 68/0, `building-tech-gate` 89/0,
  `administracja-stolica` 52/1, `deposit-building-gate` 46/1, `building-queue-refund` 2/3,
  `unit-building-bonuses` 82/0, `building-cost-tempo` exit 0. **Co do liczby zgodne z pomiarem rundy 1** —
  wszystkie czerwienie pre-istniejące, runda 2 nie dołożyła ani jednego faila poza pozycją z zarzutu 2.
- **Rodzina kart encji też bez zmian** — `entity-card-contract` 75/0, `entity-card-historia-section` 31/0,
  `building-detail-card-hover-layout` 11/0, `building-detail-card-entitycard-migration` 51/1 (pre-istniejący),
  `owned-building-detail-side` 17/0, `owned-building-inactive` 4/0, `panel-kolejka-pasek-postepu` 82/0,
  `szczescie-skala-normalizacja` 132/0, `building-gate-audit` exit 0. Zgodne z tabelą rundy 1 co do liczby.
  **Łącznie uruchomiłem 30 bramek** — jedyna różnica względem stanu sprzed rundy 2 to `grupy-budynkow` na plus
  (79/4 → 84/0) i `civpedia-budynki-historia` na minus (136/0 → 138/3, zarzut 2).
- **`garnizon-karta-encji.png` nie jest już ucięty** — zarzut 5 rundy 1 naprawiony u źródła (rusztowanie bramki), nie w opisie.
- **Premisa R2-B potwierdzona z danych, nie z raportu.** Policzyłem rekordy w `buildings.json` na dwóch commitach:
  `d2bbd548` (PRZED rundą 1) — **41** budynków i **7** w „Wojsko i obrona" przy zaszytych `40`/`6`, czyli bramka była
  czerwona **zanim Garnizon powstał**; `e1bc77b6` — 42 i 9 w „Prawo i administracja". To dokładnie tłumaczy 80/3 → 79/4 → 84/0.
  Nota C-058 Operatora (nie odtwarza, który rekord zrobił dług „Wojsko i obrona") jest zasadna — ten dług jest starszy niż
  historia `buildings.json` dostępna w tym worktree.

## OBSERWACJE

1. **§2b — dwie role tego samego ID w jednym worktree.** Potwierdzam z historii Gita: `1132d4cd`/`060bd2d8` (Obrona) i
   `dc355979`/`e633a65c` (Operator rundy 2) powstały równolegle w `/home/user/wt-garnizon`. Skutek uboczny:
   commit `e633a65c` zabrał ze sobą cudzy `03-obrona-runda1.md`. Sprawdziłem — plik w commicie jest **bajt w bajt równy**
   wersji na dysku (md5 `d52942b2…`), nic nie zostało obcięte, a ścieżka i tak leży w allowliście tematu. **Bez szkody**;
   przyczyna jest procesowa (jedno drzewo, dwie role), nie po stronie Operatora. Nie robię z tego zarzutu.
2. **Trzy niespójności zastane z R2-E** — potwierdzam, nietknięte: `trybunal` bez wpisu w `building-icon-map.json`;
   `bld-pretorium.svg` istnieje, a mapa kieruje `pretorium` na `bld-palac`; `civpedia-gra-id-mostek` przepisuje śledzony bundle
   (u mnie bez efektu — stempel już dzisiejszy).
3. **`ai-buduje-budynki-test.cjs` — bramkę dało się uruchomić bezpiecznie BEZ dotykania pliku spoza allowlisty.**
   `TMP_ROOT = path.join(os.tmpdir(), 'civ-ai-buduje-budynki')` (`:81`) czyta `os.tmpdir()`, a ten honoruje `TMPDIR`.
   Uruchomiłem więc `TMPDIR=/tmp/eval-garnizon-tmp-<pid>-<rand> node tools/ai-buduje-budynki-test.cjs` — katalogi buildu
   dostają unikalny prefiks bez edycji bramki, warunek C-001 z promptu spełniony (własna asercja bramki
   „H0: katalogi buildu leżą POZA drzewem repo" zielona). Wynik w §Wynik `ai-buduje-budynki` niżej.
   Odmowa Operatora (D4) była **ostrożna i uzasadniona**, ale rozwiązanie istniało bez łamania allowlisty.
4. **Uczciwa nota o moim wpływie na środowisko.** W trakcie mojego przebiegu tej bramki w systemie działały dwie cudze
   pętle `until pgrep …ai-buduje-budynki-test.cjs` (PID 7941, 8612) czekające na koniec **swojego** przebiegu. Mój proces
   przedłużył ich oczekiwanie. Niczego nie ubijałem (`pkill` nie użyty ani razu).

## Wynik `ai-buduje-budynki` (pozycja D4 rozstrzygnięta pomiarem)

**Wynik częściowy — faza FIX domknięta, trzy warianty mutacyjne przerwane świadomie. Pełnej liczby `X/Y` NIE podaję** (C-058: brak danych to nota, nie zgadywanie).

**Co zmierzone (faza FIX, na drzewie rundy 2, 4 buildy `vite` + 45 tur headless):**

- `H0` / `H0b` zielone — katalogi buildu **poza drzewem repo**, bramka **nie zmieniła żadnego śledzonego pliku** (C-001 spełniony, `git status` czysty po przebiegu).
- `FIX PODSUMOWANIE po 45 turach: duzeAI=11 panstwaMiasta=7 barbarzyncy=0 gracz=1`
- `FIX POKRYCIE (miasta duzego AI w wieku >=15 tur): 5/5 ma >=1 budynek`
- `FIX WCZYTANIE ZAPISU (legacy) w turze 13: duzeAI=0 panstwaMiasta=0 -> na koncu duzeAI=11 panstwaMiasta=7` — roundtrip save/load przeszedł, tryb miast po wczytaniu zachowany.
- Zero sygnałów regresu; obraz zgodny z zieloną 42/0 zmierzoną w rundzie 1.

**Dlaczego przerwałem trzy warianty mutacyjne (`mut-a`/`-b`/`-c`).** Każdy to kolejne 45 tur headless (faza FIX zajęła ~18 min),
a warianty mutacyjne dowodzą **nietautologiczności samej tej bramki**, nie niczego z siedmiu kryteriów tej rundy.
W tym samym środowisku dwie **cudze** pętle czekały na zwolnienie tej bramki (PID 7941, 8612) — trzymanie ich kolejną godzinę
dla wyniku, który i tak nie rozstrzyga D3, byłoby złym rachunkiem. Zatrzymałem **wyłącznie własny PID 11800** (`kill` po PID,
**nigdy `pkill` po wzorcu nazwy** — dokładnie ta pułapka, w którą wpadła runda 2) i sprzątnąłem własny katalog `TMPDIR` (273 MB).

**Rozstrzygnięcie D4 — i ważniejsza obserwacja.** Odmowa Operatora była zbędnie ostrożna: bramkę da się uruchomić
bezpiecznie bez dotykania pliku spoza allowlisty (`TMPDIR=<unikalny>`, OBSERWACJE 3). **Ale wynik tej bramki i tak nie
odpowiada na D3** — jej asercje pytają „czy miasta AI mają **≥1 jakikolwiek** budynek", a log nie wymienia budynków po id
(zero trafień na „garnizon" w całym przebiegu). Runda 1 napisała to samo i miała rację. **Zielona `ai-buduje-budynki`
nie jest i nigdy nie będzie dowodem, że AI buduje Garnizon** — dowodem na to jest wyłącznie analiza gałęzi `defensiveCopy`
z zarzutu 4. Kto po tej rundzie zacytuje tę bramkę jako domknięcie parytetu, popełni dokładnie błąd „budynku-widmo"
przeniesiony o poziom wyżej: z danych na bramkę.

---

Werdyktu nie wydaję — zgodnie z obiegiem robi to Final Control. Powyżej jest **sześć zarzutów**,
z których **żaden nie jest naruszeniem granicy §9** i **żaden nie wynika z improwizacji Operatora**:
dwa są stanem świata poza allowlistą tematu (1, 2), jeden jest długiem architektury AI starszym niż ten temat (4),
trzy są brakami w śladzie i formie (3, 5, 6). Praca merytoryczna rundy 2 — liczby, zamrożenie, bramka grup,
hasło CivPedii, linia AI — jest wykonana i **niezależnie przeze mnie potwierdzona**.

**C-036, nota o własnych plikach roboczych:** kopie zapasowe i log trzymam w scratchpadzie z prefiksem
`GARNIZON-R2-EVAL-` (pierwotnie użyłem słabszego `EVAL-R2-`, bez ID tematu — poprawiłem nazwy przed zamknięciem raportu).
