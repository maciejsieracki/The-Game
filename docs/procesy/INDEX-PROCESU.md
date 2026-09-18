# INDEX PROCESU — mapa źródeł prawdy i artefaktów AutoBot

Ten dokument jest mapą „co gdzie jest" — nie punktem startowym. Uniwersalny,
niezależny od narzędzia punkt startowy to [`README.md`](../../README.md); ten
indeks czyta się jako jego krok 2. Nie przechowuje bieżących statusów,
decyzji ABC ani wyników runu. Aktualny stan przejęcia jest zawsze w
[`dyspozycje/_handoff/HANDOFF-AKTUALNY.md`](../../dyspozycje/_handoff/HANDOFF-AKTUALNY.md).

## 1. Start sesji

Pełna kolejność czytania jest w [`README.md`](../../README.md) — ten indeks jej
nie powtarza, żeby nie rozjeżdżała się w dwóch miejscach. Skrót: `README.md` →
ten indeks → `R-PROC-AUTOBOT.md` → `playbook.md` w całości → `HANDOFF-AKTUALNY.md`
→ `KANAL-PRACA.md` → rejestr/ABC/decyzja → dopiero na końcu Git i kod.

Jeśli temat jest zmianą samego AutoBota, dodatkowo przeczytaj mapę warstw
[`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`](../../dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md).

Nie zaczynaj od starego handoffu, płaskiego logu ani samego czatu. Nie czytaj i nie
zmieniaj `gra/` dla paczki dokumentacyjnej.

## 1a. Tożsamość bieżącego snapshotu

P5 dotyczy wyłącznie poniższej, jawnie wybranej granicy. Nie jest ona globalnym
fallbackiem dla innych strumieni The-Game ani projektów companion:

| Pole | Wartość |
|---|---|
| Profil wykonawczy | `default` |
| Projekt | `the-game` / `The Game Box` |
| `project_id` | `p_9ae9ac64` |
| Board | `the-game-real24` |
| Tenant | `the-game` |
| Worktree audytu | `/home/ubuntu/projects/The-Game-docs-audit-worktrees/R-DOCS-CONSOLIDATION-Q1` |
| Temat/faza | `t_518149f7` / `R-DOCS-P5-INDEX-CONSOLIDATION-Q1` / P5 Operator |
| Run odczytany przed przekazaniem | `328`, `running` |

Świeży native readback `hermes -p default project show the-game` wskazuje
`board=the-game-real24`. Wzmianka `the-game-bugs` w historycznej mapie P1B jest
faktem tamtego snapshotu, nie bieżącym bindingiem; nie należy jej przepisywać do
nowego routingu. Historyczny `project_id=p_09e13254` pozostaje orphanem legacy.

## 2. Hierarchia źródeł prawdy

| Zakres | Źródło aktywne | Zapis / dowód |
|---|---|---|
| Norma procesu | ten indeks + `R-PROC-AUTOBOT.md` + reguła `alwaysApply` | korekta w kanonie procesu |
| Stan przejęcia | `HANDOFF-AKTUALNY.md` wskazany także przez `STAN-PRACY-HANDOFF.md` | bieżący handoff |
| Temat i status | `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | jeden status z listy zamkniętej |
| Aktywne ABC | `dyspozycje/PYTANIA-OTWARTE.md` | pełne ABC; po odpowiedzi ECHO i odsyłacz decyzji |
| Decyzja właściciela | `docs/decyzje/<ID>.md` | wariant, data, kryteria i konsekwencje |
| Przebieg AutoBot | `dyspozycje/autobot/runs/<ID>/` | `00-dispatch` → `01-operator` → `02-evaluator` → `03-final-control` → `04-integration` |
| Przekazanie | `dyspozycje/_handoff/KANAL-PRACA.md` | krótki wpis + `CZEKAM-NA:` |
| Publikacja | `dyspozycje/WERSJE.md` | tylko po wykonanym deployu: fala, md5, stempel, commit, zakres, status |
| Pamięć procesu | `playbook.md`; `playbook.json` jest generowany | zmieniaj Markdown, JSON tylko generatorem |
| Historia | `docs/archiwum-procesu/` i oznaczone snapshoty | nie nadpisuje aktywnego routingu |
| Audyt procesu | `dyspozycje/autobot/tools/process-docs-audit.cjs` | linki, statusy, runy, stare routingi i zakaz zmian w `gra/` |

Przy konflikcie nie wybieraj po cichu starszego tekstu. Zatrzymaj interpretację,
porównaj najnowsze ECHO, handoff i dowód na dysku, a rozjazd zapisz do korekty.

## 3. Gdzie zapisywać każdy artefakt

| Artefakt | Obowiązkowe miejsce | Minimalna zawartość |
|---|---|---|
| Zgłoszenie / pełne ID | `REJESTR-PROSB-I-ZADAN.md` | ID, data, GOAL, status kanoniczny, dowód/następny gate |
| Otwarte pytanie ABC | `PYTANIA-OTWARTE.md` | pełne ID, sytuacja, cel, powód, A/B/C, za/przeciw, rekomendacja |
| Odpowiedź właściciela | ECHO w `PYTANIA-OTWARTE.md` + `docs/decyzje/<ID>.md` | literalna decyzja, wariant, data, kryteria i konsekwencje |
| Dispatch | `runs/<ID>/00-dispatch.md` | GOAL, SCOPE, allowlista, worktree, plan i kryteria |
| Raport Operatora | `runs/<ID>/01-operator.md` | zmiany, testy, commit, status, blokady, następny krok |
| Raport Evaluatora | `runs/<ID>/02-evaluator.md` | niezależny diff/scope, testy, werdykt i warunki poprawki |
| Final Control | `runs/<ID>/03-final-control.md` | kompletność śladu, bramki, „gotowość do integracji: TAK/NIE” |
| Integracja | `runs/<ID>/04-integration.md` | faktyczny zakres, commit, testy, `READY_FOR_DEPLOY` i deploy/push |
| Handoff bieżący | `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` | stan, pakiety, blokady, następny krok |
| Kanał pracy | `dyspozycje/_handoff/KANAL-PRACA.md` | ≤ krótki meldunek między sesjami, `CZEKAM-NA:` |
| Publikacja | `dyspozycje/WERSJE.md` | dopiero po deployu/pushu; nie wpisuj samego READY |
| Postmortem | `dyspozycje/autobot/logs/postmortems.jsonl` | append-only JSONL zgodny z playbookiem |
| Kryteria STRICT Evaluatora | `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT*.md`, `-SCOPE.md` | happy-path, parytet gracz/AI, save/load — trzy twarde FAIL-e domeny gry |
| Turniej ABC | `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md` | obowiązkowy dla każdego NOWEGO pytania ABC; `playbook.md` → C-018 |
| Format raportu „raport" | `docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md` | dziesięć kategorii statusu, wyzwalane hasłem `raport` |
| Bezpieczna edycja AutoBota | `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` | mapa wszystkich warstw mechanizmu; czytaj przed zmianą reguł samego AutoBota |

`dyspozycje/autobot/logs/` pozostaje miejscem historycznych raportów legacy. Nowego
raportu nie zapisuj wyłącznie w logu ani w czacie; run jest kanonicznym śladem.

Po zmianach dokumentacyjnych uruchom `node dyspozycje/autobot/tools/process-docs-audit.cjs`.
Audyt nie zastępuje Evaluatora ani Final Control; jest powtarzalną bramką techniczną
spójności dokumentacji.

## 3a. Zamrożone wyniki P2/P3/P4

P2 zamroziło 84 308 rekordów Markdown-like na granicy
`2026-09-14T17:37:55Z`: 76 084 rekordy lokalne i 8 224 rekordy z trzech
odczytów GitHub, łącznie 32 source roots. Poniższe liczby są dowodem snapshotu,
nie deklaracją bieżącej zawartości wszystkich checkoutów.

| P2 klasyfikacja | Rekordy |
|---|---:|
| `CANONICAL` | 13 740 |
| `EVIDENCE` | 33 217 |
| `HISTORY` | 2 759 |
| `SEPARATE_PROJECT` | 181 |
| `UNKNOWN` | 34 411 |
| **Razem** | **84 308** |

P3 dostarczyło mapę 12 kategorii oraz rejestr 10 konfliktów. Otwarte dla decyzji
właściciela pozostają konflikty `1, 4, 5, 6, 7`; precedencja nie została wybrana.
P4 zachowało każdą linię macierzy i nadało dokładnie jeden status:

| P4 status | Rekordy |
|---|---:|
| `ACTIVE_CANONICAL` | 34 896 |
| `HISTORY` | 18 693 |
| `STALE_CANDIDATE` | 651 |
| `DUPLICATE_CANDIDATE` | 124 |
| `OWNER_DECISION` | 13 181 |
| `SEPARATE_PROJECT` | 181 |
| `UNKNOWN_NEEDS_REVIEW` | 16 582 |
| **Razem** | **84 308** |

P4 zachowało 21 ścieżek/651 rekordów z jawnym markerem stale jako kandydatów,
124 grupy dokładnych duplikatów w tym samym root, 2 764 grupy replik między
rootami oraz 433 unikalne ścieżki objęte decyzją właściciela. Żaden kandydat nie
został usunięty, scalony, przemianowany ani zarchiwizowany.

P4 odczytało primary jako 2 757/2 757 obecnych rekordów; dwa bieżące drifty
(`dyspozycje/PYTANIA-OTWARTE.md` i `dyspozycje/REJESTR-PROSB-I-ZADAN.md`)
pozostają wyłącznie rozjazdem względem zamrożonego snapshotu. Ich dokładne
pochodzenie nie jest ustalone i P5 nie rozstrzyga ich treści.

## 3b. Lokalne i zdalne granice odczytu

P2 użyło 29 lokalnych rootów oraz trzech referencji GitHub. Zamrożone referencje
P2 były: `HEAD/main=32bbc72741e21a3bcda2f05e580b55512ca5dd33`,
`docs/agent-documentation-index-20260914=da493eeebfaa90d47140ba7892ea2578b7f50ea7`
i `autobot/real24-staging=d387754f530af202ef285f7a27727ea1b1009cd9`.

P5 wykonało osobny, read-only `git ls-remote` readback: `HEAD/main` wskazał
`30409fdb2938fea93287af9df66a18adc048af26`, a dwie pozostałe referencje
pozostały odpowiednio `da493eeebfaa90d47140ba7892ea2578b7f50ea7` i
`d387754f530af202ef285f7a27727ea1b1009cd9`. To późniejszy fakt live, nie
retroaktywna zmiana P2. Nie wykonano fetch ani pull.

Primary lokalny pozostaje checkoutem `main` z HEAD
`a99f7de59ce643441b641d3b7b11404b6cbdcd82` i dirty worktree; ten worktree
audytu ma branch `hermes/R-DOCS-CONSOLIDATION-Q1` z HEAD
`d3689535ce7a7bf210f187c43448a49716774bfa`. Żaden z tych odczytów nie dowodzi
integracji ani deployu.

P2 oznaczyło zdalne `ignored/not_ignored` jako `N/D_REMOTE`, bo GitHub tree nie
ma lokalnej projekcji ignore. Companion `/home/ubuntu/projects/Autoboot-Monitor`
pozostaje osobnym projektem; jego 181 rekordów nie jest kanonem The-Game.

## 4. Obowiązujący obieg i ten sam ID

```text
Operator GPT-5.6 Luna High
  → Evaluator GPT-5.6 Luna High
  → Final Control GPT-5.6 Luna High (osobny subagent)
  → integracja orkiestratora GPT-5.6 Luna Medium
  → READY_FOR_DEPLOY
  → osobna autoryzacja deploy/push
```

`FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS`, błąd izolacji, brak dowodu albo niegotowość Final Control wracają bez czekania do Operatora → Evaluatora → Final Control tylko po wykonaniu guarda licznika rund przed dispatchiem i wyłącznie dla rund 1–5. Próba 6 zostaje zatrzymana statusem `LIMIT-5-EXCEEDED`; zachowaj pełne ID. Wznowienie po limicie wymaga jawnej decyzji orkiestratora/właściciela i nie resetuje licznika. `ZWIS` nie anuluje pracy — watchdog sprawdza Git i artefakty.

Jedyną pauzą jest `ABC-OCZEKUJE` wymagające decyzji właściciela. Decyzje prowadzi się
wyłącznie w głównym czacie orkiestratora (C-043), a zapisuje plikowo. `READY_FOR_DEPLOY`
może wystawić wyłącznie orkiestrator po faktycznej integracji. Deploy/push jest osobną
bramką i nie wynika z raportu, commita ani samego READY.

## 5. Statusy kanoniczne

Rejestr używa dokładnie jednej wartości dla bieżącego tematu:

`NOWE` · `ABC-OCZEKUJE` · `OPERATOR` · `EVALUATOR` · `FINALNA-KONTROLA` ·
`DO-INTEGRACJI` · `ZINTEGROWANE` · `DEPLOY-ROBOCZA` · `ZAMKNIĘTE` · `BLOCK` ·
`ODŁOŻONE` · `ODRZUCONE` · `DUPLIKAT`.

Stare etykiety w historycznych sekcjach pozostają historią. Nie uznawaj statusu bez
raportu/dowodu za zakończenie. `READY_FOR_DEPLOY` jest bramką procesu, nie zamiennikiem
statusu rejestru i nie oznacza wykonanego deployu.

## 6. Kontrakt raportu i integracji

Każdy etap zapisuje:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA | LIMIT-5-EXCEEDED | DECISION_REQUIRED | INTEGRATION_PENDING
DOMAIN: GAME | PROCESS | INFRA | INFORMATIONAL
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładne wyniki albo powód pominięcia>
BLOKADY: <jawna lista albo brak>
RUNDY: <nr tej rundy>/<5; po limicie także liczba zużytych rund, ostatni werdykt i decyzja wymagana>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

`DECISION_REQUIRED` (konflikt dispatch/kod/testy, playbook C-054) i `INTEGRATION_PENDING`
(kod gotowy, integracja czeka na rozdzielenie współdzielonego pliku, playbook C-059) nie są
`BLOCK` — pierwszy nie zwiększa licznika rund, drugi nie jest błędem tematu. Integracja z
drzewa współdzielonego z inną pracą jest allowlist-only, per plik i per hunk — zakaz
`git add -A`/`git add .` (playbook C-059).

Przed integracją orkiestrator sprawdza wszystkie trzy raporty, GOAL, allowlistę,
faktyczny diff, commit, testy, blokady, run i brak zmian w `gra/` dla docs-only. Po
integracji zapisuje wynik w `04-integration.md`; `WERSJE.md` dopiero po publikacji.

## 7. P5, decyzje i granica niedestrukcyjna

P5 skorygowało dwa wejściowe artefakty tylko w zakresie potwierdzonym przez
P2/P3/P4: wskazało aktualną tożsamość routingu, zastąpiło nieaktualny opis
bramki P1B bieżącą fazą P5 i dodało linki do zachowanych dowodów. Nie wybrało
precedencji w konfliktach P3. P3-owy pointer do
`docs/decyzje/R-PROC-AUTOBOT-HERMES-KANBAN.md` nie istnieje w tym worktree;
P5 nie tworzy aliasu ani nie linkuje do nieistniejącego pliku. Obowiązujący
opis procesu jest w `R-PROC-AUTOBOT.md`, a wykonawczy odsyłacz w
`dyspozycje/autobot/README.md`.

Artefakty tej fazy są addytywne i pozostają w katalogu runu:

- [dispatch P5](../../dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/23-dispatch-p5-index-consolidation.md)
- [raport P5](../../dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-index-consolidation.md)
- [evidence P5](../../dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-evidence.json)
- [transition receipt P5](../../dyspozycje/autobot/runs/R-DOCS-CONSOLIDATION-Q1/P5-transition-receipt.json)

`OWNER_DECISION`, `UNKNOWN_NEEDS_REVIEW`, `STALE_CANDIDATE` i
`DUPLICATE_CANDIDATE` są klasyfikacjami audytu. P6 może przygotować wyłącznie
niedestrukcyjny plan po terminalnym P5 i niezależnym Evaluatorze/Final Control;
nie może usuwać ani scalać źródeł bez osobnej decyzji, allowlisty i readbacku.

## 8. Historia i zakres indeksu

Pakiet 2 zachował snapshoty aktywnych dokumentów i reguł w
[`docs/archiwum-procesu/`](../archiwum-procesu/). Starsze procedury, handoffy i płaskie
raporty są referencyjne lub historyczne, jeśli nie są wskazane w tabeli powyżej.
Ten indeks nie wpisuje statusów, nie podejmuje decyzji właściciela, nie integruje,
nie deployuje, nie pushuje i nie dotyka `gra/`.
