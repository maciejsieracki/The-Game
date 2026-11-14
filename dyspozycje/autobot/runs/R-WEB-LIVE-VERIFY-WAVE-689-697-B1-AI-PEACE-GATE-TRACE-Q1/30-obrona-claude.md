STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B1-AI-PEACE-GATE-TRACE-Q1
GOAL: rozstrzygnąć w żywej grze, dlaczego AI nie wysyła graczowi bezwarunkowego `zaproponuj_pokoj` przy zmęczeniu wojną >= 0,8 (od tury 16 wojny). Ta runda: odpowiedź Obrony na zarzuty Evaluatora 3aa75b56c (kandydat 7f6e1f792).
ZMIANY-COMMIT: gra/src/main.ts (WYŁĄCZNIE hak read-only pod ?civTest=1: poprawka odczytu `peaceTracePair`, nowy wiersz `wejscie-decyzji`, import `warWearinessLevel`); gra/tools/live-verify-wave-689-697-b1-peace-trace.cjs (flaga `NOINTERVENE=1` = wariant kontrolny bez ingerencji); evidence-r3-*.json (7 plików). Brak zmian logiki gry, gra/data, WERSJE.md, gra-robocza/, rust-port/. SHA: patrz pole `sha` w odpowiedzi orkiestratorowi (commit obejmuje wyłącznie wymienione ścieżki).
TESTY:
- `node node_modules/typescript/bin/tsc --noEmit -p .` (gra/): exit 0, 0 błędów (uruchomione po ostatniej zmianie main.ts).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`, exit 0.
- `git diff --check`: czysto (exit 0).
- Przebiegi live (Chromium headless, bundle vite zbudowany poza repo do scratchpad/b1r3/dist, `?playtest=mapa&civTest=1&civSeed=<ziarno>`, setFastMode(true), wojna REALNA przez `__truceTestDebug.declareWar` = ownerDeclareWarOn, 22 tury wojny, checkpoint JSON po każdej turze):
  - seed 271828, hak ON (trace): evidence-r3-seed271828-hak-on.json — 22/22 tur, pageErrors 0, consoleErrors 0.
  - seed 271828, hak OFF (NOTRACE): evidence-r3-seed271828-bez-haka-a.json i -b.json (dwa niezależne przebiegi).
  - seed 314159, hak ON: evidence-r3-seed314159-hak-on.json — 22/22 tur, pageErrors 0, consoleErrors 0.
  - seed 314159, hak OFF: evidence-r3-seed314159-bez-haka-a.json i -b.json.
  - kontrola BEZ ingerencji (NOINTERVENE=1, NOTRACE=1), seed 271828: evidence-r3-kontrola-bez-ingerencji-271828.json — zatrzymanie: `koniec tury zablokowany w turze 11 (bramka gry, bez dosypek)`.

POMIAR KRYTERIUM 3 (skrót stanu `__detHarness.digest()`, FNV-1a, po każdej turze; porównanie per tura):
| porównanie | pierwsza rozbieżna tura | identyczne tury |
|---|---|---|
| 271828: hak ON vs hak OFF (a) | T19 | T2–T18 (17/17) |
| 271828: hak OFF (a) vs hak OFF (b) | T19 | T2–T18 (17/17) |
| 314159: hak ON vs hak OFF (a) | T20 | T2–T19 (18/18) |
| 314159: hak OFF (a) vs hak OFF (b) | T20 | T2–T19 (18/18) |

Wniosek: rozjazd od T19/T20 występuje TAKŻE między dwoma przebiegami bez haka, o tej samej turze. Hak nie przesuwa momentu rozjazdu względem szumu przebiegów. Źródła tego niedeterminizmu nie zlokalizowano (patrz BLOKADY). Kryterium 3 w ścisłym sensie (identyczny skrót przez cały horyzont z hakiem i bez) NIE jest spełnione.

ODPOWIEDZI NA ZARZUTY EVALUATORA (3aa75b56c):

Zarzut 1 (kryterium 3 niespełnione; peaceTracePair nie jest read-only) — PRZYJMUJĘ.
- Poprawka: `peaceTracePair` (gra/src/main.ts ~l.30505) nie woła już `getDiploRelation`, `diploWarStateForRead` ani `diplomaticContactEstablishedSet`. Te funkcje wstawiały brakujące wpisy do Map (`getDiploRelation` ~l.10781 przez `diplomacyRelations.set`, `diplomaticContactEstablishedSet` ~l.10403 przez `set`). Teraz: `diplomacyRelations.get(...) ?? defaultNeutralRelation()`, `diplomacyPairMeta.get(...)`, `warStateFromRecord` (czysta, src/game/diplomacy-war-peace-profile.ts:253), `diplomaticContactEstablishedByHuman.get(ME())?.has(ai) ?? false`.
- Dowód: pomiar powyżej. Przed poprawką (r2) digest po hooku był liczony po wywołaniu wstawiającym wpisy; ta ścieżka jest usunięta. Rozjazd hak ON/OFF nie pojawia się wcześniej niż rozjazd OFF/OFF.
- Część „dwa przebiegi bez haka rozjeżdżają się między sobą” — POTWIERDZAM jako fakt (tabela), źródło NIE_ZMIERZONO (patrz BLOKADY).

Zarzut 2 (hak nie rejestruje turnsAtWar ani zmęczenia widzianego przez AI w chwili decyzji; wynik decideAIDiplomacy nie jest rejestrowany) — PRZYJMUJĘ częściowo, ODRZUCAM w części o wyniku decyzji.
- PRZYJMUJĘ: dodany wiersz `stage: 'wejscie-decyzji'` (src/main.ts ~l.43414, tuż przed `decideAIDiplomacy` ~l.43422): `turnsAtWarAI` = `max(0, relacja.turnsAtWar)` z `diploInp.relacje` (to pole wchodzi do decyzji AI, ai.ts:6975), `stanWojny`, `lostCitiesInWar`, `zdobyteMiastaPartnera`, `fatigueAI` = `warWearinessLevel(...)` na tych samych wejściach co `wearyLevel` w ai.ts:7033–7039. Wynik dla tur 14–23 (oba ziarna identyczne): T14 turnsAtWarAI 13 / fatigueAI 0,65; T16 15 / 0,75; T17 16 / 0,80; T19 18 / 0,90; T21 20 / 1,00.
- Zastrzeżenie: `wearyLevel` jest wewnętrzną zmienną ai.ts, do której hak nie ma dostępu (ai.ts poza allowlistą). Wartość `fatigueAI` to ponowne wyliczenie tą samą czystą funkcją na tych samych wejściach, a nie odczyt zmiennej AI. Zgodność z AI wynika z konstrukcji, nie z odczytu.
- ODRZUCAM część „nie rejestruje wyniku decideAIDiplomacy”: wynik wywołania jest zapisany w wierszu `stage: 'filtry-warstwy'` (src/main.ts ~l.43503–43507, pole `raw: trPlr(Array.isArray(dipCmdsRaw) ? dipCmdsRaw : [])`, gdzie `dipCmdsRaw` to zwrot `decideAIDiplomacy`, ~l.43422). Ten sam wiersz zawiera `afterPlayerFacing`, `afterLayer`, `afterContact`. Dowód: np. evidence-r3-seed271828-hak-on.json, turns[T17].rows, `raw: ["zaproponuj_pokoj/bezw/pokoj"]`.
- Część „wiersz filtry-warstwy liczy turnsAtWar niezależnie” — prawda, ale odczyt jest po decyzji w tym samym endTurn i używa tej samej ścieżki co `diploWarStateFor` (bez zapisu). Wartości zgodne: turnsAtWar w wierszu = turnsAtWarAI w wierszu wejścia (np. T17: 16 = 16).

Zarzut 3 (brak wariantu kontrolnego bez ingerencji; runner dosypuje złoto/żywność, odrzuca oferty i uzupełnia kolejkę) — PRZYJMUJĘ i MIERZĘ.
- Wariant kontrolny: `NOINTERVENE=1` (tools/live-verify-wave-689-697-b1-peace-trace.cjs). Bez dosypek, bez odrzucania ofert, bez uzupełniania kolejki miasta. Wynik (evidence-r3-kontrola-bez-ingerencji-271828.json): koniec tury zablokowany w turze 11 przez bramkę NNS gry (`[EndTurn] blocked: prognoza skarbca/spichlerza < 0 (NNS)`). Dlatego przebieg do T17 bez jakiejkolwiek dosypki jest NIEMOŻLIWY przy obecnej bramce. Kontrola na dłuższym odcinku wymaga dosypki; to jest założenie pomiaru.
- Faktycznie wykonane ingerencje we wszystkich czterech przebiegach z hakiem/bez (liczniki w evidence): `nnsGrants` = [tura 11] (złoto +200 000, żywność +100 000), `rejectedByScript` = 0, `clickedDecisionButtons` = 0, `queuedForEmptyCity` = 0. Harness dodatkowo czyści okna bitew (`clearBattles`) — to jest w kontroli też.
- Korekta mojej r2: r2 wymieniała odrzucenie rozejmu i uzupełnienie kolejki „Kolejka pusta”. W przebiegach na kodzie 7f6e1f792 te gałęzie NIE wystąpiły (liczniki 0). Ta korekta dotyczy wyłącznie tej rundy.
- Wniosek dla zarzutu 3: jedyna ingerencja wpływająca na przebieg to dosypka złota/żywności w T11, identyczna w przebiegach hak ON i OFF. Porównanie hak ON vs OFF jest więc kontrolowane względem ingerencji. Kontrola bez dosypki nie istnieje poza T11 (bramka gry).

Zarzut 4 (drugie ziarno tylko na wersji pre-readonly) — PRZYJMUJĘ i WYKONANO: ziarno 314159 na kodzie końcowym (hak ON, 22 tury) oraz hak OFF dwukrotnie (evidence-r3-seed314159-*.json). Pierwsza rozbieżność: T20; identyczne T2–T19 względem OFF (a).

Zarzut 5 (przyczyna zniknięcia wpisu na stole przed T23 NIE_ZMIERZONO; kandydat e niezbadany) — PRZYJMUJĘ i ROZSTRZYGAM WG KODU + CZASU:
- Wpis `zaproponuj_pokoj` z T17 dostaje `expiresTurn = turn + NEGOTIATION_EXPIRY_TURNS` (src/game/diplomacy-proposals.ts:2649 w `createNegotiation` l.2632; stała `NEGOTIATION_EXPIRY_TURNS = 5`, l.2528).
- `negotiationStillValid` zwraca `valid: false` gdy `world.turn > entry.expiresTurn` (src/game/diplomacy-proposals.ts:2752); wołane z src/main.ts:21067 i :21189.
- T17 + 5 = 22; w turze 23 `23 > 22` → wpis wygasa. Zgodnie z wierszami na obu ziarnach: T22 `dedup-oczekuje`, T23 `wstawiono-na-stol` (AI natychmiast proponuje ponownie, bo wpis już nie blokuje dedupu).
- Zastrzeżenie: sam zdarzenie usunięcia nie jest rejestrowane przez hak; przyczyna = reguła wygaśnięcia + zgodność czasu (T17+5), a nie bezpośredni wiersz z usunięcia. Wpis nie ginie „bez powodu”; pomiar zdarzenia usunięcia — NIE_ZMIERZONO (wymaga dodatkowego wiersza w hooku przy usunięciu, poza tym tematem).
- Kandydat (e) = PRZYCZYNA zniknięcia (wygaśnięcie po 5 turach), nie defekt: zachowanie zgodne z regułą.

Zarzut 6 (gate-*.log nieistniejące; brak zrzutu panelu Dyplomacja T17+; 20 wpisów endTurnInProgress niezanalizowane) — PRZYJMUJĘ.
- Odwołanie do gate-*.log WYCOFANE: takich plików nie ma w runs/<ID>/ i nie są wymagane przez dowód tej rundy.
- Widoczność propozycji dla gracza (zrzut panelu Dyplomacja w T17+): NIE_ZMIERZONO. Runner nie wykonuje zrzutu ekranu ani nie otwiera panelu; w evidence jest tylko stan kolejki `negotiationTable`.
- `endBlocks` (20 wpisów): wszystkie to `[EndTurn] blocked: endTurnInProgress` (zweryfikowane na obu ziarnach). Runner trzyma tylko ostatnie 20 (`if (rep.endBlocks.length > 20) rep.endBlocks.shift()`), więc pełnej liczby nie znam — NIE_ZMIERZONO. Każda tura kończy się (`state().turn` rośnie w `endTurnWait`), więc nie widać zawieszenia; to nie jest przyczyna braku propozycji.

WYNIKI TABELI KANDYDATÓW (a–e), tylko dla ścieżki `zaproponuj_pokoj/bezw/pokoj`:
| kandydat | wynik | dowód |
|---|---|---|
| (a) filtr contactedOwners / dipLayer | PASS-odrzucony | filtry-warstwy T17 (oba ziarna): `raw` = `afterPlayerFacing` = `afterLayer` = `afterContact` = `zaproponuj_pokoj/bezw/pokoj`; `dipLayer: 'full'` |
| (b) diplomaticContactEstablishedSet | PASS-odrzucony | `contactSet: true` w każdym wierszu T2–T23 (oba ziarna) |
| (c) off-by-one turnsAtWar vs próg 0,8 | PASS-odrzucony dla tej ścieżki | wejscie-decyzji T17: turnsAtWarAI 16, fatigueAI 0,80 (≥ progKoncaZmeczenia 0,8, war-weariness.ts:233–234, ai.ts:7053); AI emituje `zaproponuj_pokoj` już w T17, nie T18 |
| (d) wojna wymuszona epoki bez turnsAtWar | NIE_ZMIERZONO | wojna w harnessie deklarowana ręcznie przez ownerDeclareWarOn; ścieżki wymuszonej przez epokę nie wywołano |
| (e) wygaśnięcie wpisu po 5 turach | PRZYCZYNA (zachowanie zgodne z regułą, nie defekt) | diplomacy-proposals.ts:2528, 2649, 2752; wpis T17 → wygasa w T23 → re-insert T23 |

Ustalenie nadrzędne: w tym harnessie (22 tury, dwa ziarna, identyczne dosypki) symptom W80B („0 propozycji `zaproponuj_pokoj` przy zmęczeniu ≥ 0,8”) NIE JEST odtwarzany: AI emituje `zaproponuj_pokoj` w T17 na obu ziarnach, przechodzi wszystkie filtry, trafia na stół (`wstawiono-na-stol`), a potem jest deduplikowany do wygaśnięcia. Czy gracz to widzi (panel Dyplomacja) — NIE_ZMIERZONO. Rozbieżność z W80B może wynikać z warunków gracza (np. stan cooldownów odrzuceń, brak dosypek), których ta ścieżka nie odtwarza — NIE_ZMIERZONO.

BLOKADY:
1. Źródło niedeterminizmu (rozjazd OFF vs OFF od T19/T20 na obu ziarnach): NIE_ZMIERZONO. Hak go nie powoduje (dowód: tabela). Hipoteza do osobnego tematu, NIE sprawdzona: zależność od czasu rzeczywistego w harnessie (`wait()` w clearBattles/endTurnWait) albo w grze (timery animacji w fazie EOT). Nie zmieniałem tego w tym temacie.
2. Bramka NNS (`prognoza skarbca/spichlerza < 0`) blokuje koniec tury w T11 bez dosypki — to jest techniczne ograniczenie kontroli.
3. Widoczność propozycji dla gracza (zrzut panelu) — NIE_ZMIERZONO (runner bez zrzutu).
4. Pełna liczba endTurnInProgress — NIE_ZMIERZONO (cap 20).
5. Kandydat (d) — NIE_ZMIERZONO (brak wojny wymuszonej przez epokę w harnessie).
6. Zdarzenie usunięcia wpisu z kolejki nie jest rejestrowane przez hak (zarzut 5, zastrzeżenie).

UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez działań z mojej strony):
- Niedeterminizm w przebiegach bez haka (T19/T20, oba ziarna) koliduje z zamknięciami #346/#349/#373 w TODO. Warto rozważyć osobny temat diagnostyczny, nie w B1.
- Symptom W80B nie jest odtwarzany w tym harnessie; przy kolejnej rundzie z tym samym ID zaleca się przebieg z warunkami gracza (bez dosypki T11, jeśli bramka na to pozwoli) — to nie mieści się w tym temacie.
- W pliku `runs/` nie ma gate-*.log (zarzut 6); nie tworzyłem ich.

RUNDY: 3/5 (obrona; odpowiedź na zarzuty Evaluatora 3aa75b56c). Poprzednie: r1 BLOCK (analiza statyczna), r2 BLOCK (hak + 1 ziarno, 11 tur).
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje tę odpowiedź; przy PASS — FC; kryteria 1/3 do decyzji orkiestratora (kryterium 3 niespełnione w ścisłym sensie, zgłoszone jako NIE_ZMIERZONO). Poprawka defektu NIE jest wymagana: PRZYCZYNA (e) zgodna z regułą; kandydaty a/b/c odrzucone.
DEPLOY/PUSH: NIE WYKONANO
