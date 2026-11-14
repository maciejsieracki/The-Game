STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B1-AI-PEACE-GATE-TRACE-Q1
GOAL: rozstrzygnąć w żywej grze, dlaczego AI nie wysyła graczowi bezwarunkowego `zaproponuj_pokoj` przy zmęczeniu wojną >= 0,8 (od tury 16 wojny).
ZMIANY/COMMIT: (runda 2, na bazie 081bcba43)
- gra/src/main.ts (tylko hak pod ?civTest=1 i ślad read-only):
  - ślad w filtrach komend dla gracza (ok. l.43463-43487), odczyty bez wstawiania do Map (trRel, trMeta, contactSet przez diplomaticContactEstablishedByHuman.get);
  - znaczniki kroku stołu `ptr(...)` w enqueueNegotiationFromAiCmd (l.20802-21038; zapis tylko gdy peaceTraceState.on);
  - __aiTradeWiringTestDebug: peaceTraceStart/Stop/Rows/Pair (l.~30496-30515), nnsGateBlocked (l.30525, odczyt), grantPlayerGold / grantPlayerFood (l.30518-30524, tylko dodatnie dosypki; test-only).
- gra/tools/live-verify-wave-689-697-b1-peace-trace.cjs (runner: checkpoint JSON po każdej turze, odrzucanie wiszących ofert blokujących, dosypka NNS, digest stanu, NOTRACE=1 = bez wywołań haka).
- Evidence (runs/.../): evidence-r2-seed271828-hak-on.json, evidence-r2-seed314159-hak-on-pre-readonly.json, evidence-r2-seed271828-hak-on-pre-readonly.json, evidence-r2-seed271828-bez-haka.json, evidence-r2-seed271828-bez-haka-powtorka.json, gate-*.log.
- Brak zmian logiki gry, gra/data, WERSJE.md, gra-robocza/, rust-port/.
- SHA: patrz pole sha w odpowiedzi orkiestratorowi (commit tej rundy).

TESTY:
- tsc --noEmit -p gra/: exit 0, 0 błędów (po ostatniej zmianie kodu).
- tools/logic-test.cjs: LOGIC OK (213/213)
- tools/tech-tree-test.cjs: tech-tree-test: 20 pass, 0 fail
- tools/research-test.cjs: ALL GREEN
- tools/unit-replace-test.cjs: [unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)
- tools/combat-test.cjs: All sanity checks passed.
- git diff --check: exit 0 (czysto).
- Build bundle: vite build do katalogu poza repo (scratchpad/b1-dist), exit 0.
- Przebiegi live (Chromium headless, ?playtest=mapa&civTest=1&civSeed=N, setFastMode(true), wojna realnie przez __truceTestDebug.declareWar = ownerDeclareWarOn, AI 1 -> gracz 0):
  - seed 271828, hak ON (wersja finalna): 22 zakończone tury, turnsAtWar 1..22 (tury 2..23), 0 pageerror, 0 console.error.
  - seed 314159, hak ON (wersja przed ostatnią zmianą read-only): 22 tury, turnsAtWar 1..22, 0 błędów.
  - seed 271828, bez haka (NOTRACE=1), dwa uruchomienia tą samą paczką: wynik niżej w kryterium 3.
- Kandydaci a-e, dane z hooka (tury 2-23, oba ziarna):

| kandydat | status | dowód z hooka |
|---|---|---|
| (a) filtr contactedOwners / dipLayer (filtry main.ts ~43440-43460) | PASS-odrzucony | dla zaproponuj_pokoj: raw = afterPlayerFacing = afterLayer = afterContact; dipLayer='full'; w tur 17-23 na obu ziarnach (wiersz "filtry-warstwy") |
| (b) diplomaticContactEstablishedSet przed enqueue (main.ts:20765) | PASS-odrzucony | contactSet=true w każdym wierszu tur 2-23 (oba ziarna); w turze 17 wpis wstawiony na stół (krok "wstawiono-na-stol", main.ts:21038) |
| (c) off-by-one turnsAtWar vs próg 0,8 | PASS-odrzucony dla tego pomiaru | odczyt w fazie AI (wiersz filtrów) = 16 w turze 17; odczyt po endTurn (pair) w turze 17 = 16; 16 x 5% = 0,80 i propozycja pojawia się dokładnie w tej turze, na obu ziarnach. Zastrzeżenie: numer tury w wierszach to numer po endTurn |
| (d) wojna wymuszona epoki bez turnsAtWar | NIE_ZMIERZONO | nie uruchamiano: wojna deklarowana ręcznie (declareWar), bez powodu epoki |
| (e) dedup / cooldown / wygaśnięcie (main.ts:21015, 21019) | częściowo | "dedup-oczekuje" w turach 18-22 (propozycja wisi na stole, kolejna nie dublowana); "cooldown-odrzucenia" nigdy nie wystąpił; wpis zniknął przed turą 23 na ziarnie 314159 i został wstawiony ponownie: PRZYCZYNA zniknięcia NIE_ZMIERZONO |

Wynik zasadniczy: w tym harnessie AI WYSYŁA i wstawia na stół bezwarunkowy `zaproponuj_pokoj` już przy turnsAtWar=16 (tura 17), na obu ziarnach. Nie odtworzono symptomu z W80B ("0 propozycji w 20/20 tur"). Nie wiem, dlaczego W80B tego nie widział (inne warunki sondy/kolejki); tego nie rozstrzygam.

Kryteria:
(1) PARTIAL: przyczyna braku propozycji NIE wskazana (bo w tym przebiegu propozycja powstaje). Widoczność propozycji dla gracza: NIE_ZMIERZONO (nie zrobiono zrzutu panelu Dyplomacja w turze 17+).
(2) SPEŁNIONE: 2 ziarna (271828, 314159), 22 tury wojny każde (turnsAtWar do 22 >= 18).
(3) NIE_ZMIERZONO z blokadą: pomiar neutralności haka przez digest stanu (__detHarness.digest, FNV-1a per tura) nie daje rozstrzygnięcia, bo sam przebieg BEZ haka nie jest powtarzalny:
  - bez haka, ta sama paczka, ziarno 271828, dwa uruchomienia: digesty zgodne 17 z 22 tur, rozjazd od tury 19 (zgodność 17/22 zachowana do tury 18);
  - hak ON vs bez haka (ta sama paczka): rozjazd od tury 19 (17/22);
  - pola dyplomacji (turnsAtWar, relTotal, queuedPeace) IDENTYCZNE we wszystkich przebiegach na każdą turę; rozjazd jest w skrócie stanu jednostek/miast.
  Wniosek: niedeterminizm przebiegu przy tym samym ziarnie i tej samej paczce (ok. tury 19) - patrz UWAGI-DLA-ORKIESTRATORA.
(4) tsc + 5 bramek zielone (patrz TESTY); diff --check czysty.
(5) git diff --check czysty.
(6) raport i evidence w runs/.../ (ten plik + evidence-r2-*.json + gate-*.log).

Zakłócenia harnessu (założenia, nie czysta gra):
- Bramka NNS (main.ts:39571, nnsGateForPlayer l.39491) blokowała endTurn od tury 11. Runner dosypuje raz na turę (tura 11 we wszystkich przebiegach) +200000 złota i +100000 żywności, tylko DODATNIE (grantPlayerGold / grantPlayerFood). Zmienia to przebieg gry względem normalnej rozgrywki.
- Runner odrzuca wiszącą ofertę blokującą koniec tury (rozejm AI->gracz w turze 11; rejectedByScript).
- Runner uzupełnia pustą kolejkę miasta (prod-empty-city0) 5 budynkami w turze 11.
- Hak: peaceTracePair (l.~30496-30515) nadal używa getDiploRelation / diplomaticContactEstablishedSet, które mogą dopisać brakujący wpis Map. Wpisy istniały w tych przebiegach, więc nie zmieniły wyników; do poprawy przy następnej rundzie haka.

RUNDY: 2/5
NASTĘPNY KROK: (a) zrzut UI panelu Dyplomacja w turze 17 na seed 271828 (czy pozycja "pokój" jest widoczna dla gracza); (b) wskazać plik:linia usunięcia wpisu między turami 22 a 23 na seed 314159 (wygaśnięcie / czyszczenie stołu); (c) kryterium 3 wymaga najpierw deterministycznego przebiegu bazowego (osobny temat, patrz niżej).

DEPLOY/PUSH: NIE WYKONANO

## Dane z przebiegów (turnsAtWar = odczyt po endTurn; kolumna filtry = wiersz w fazie AI)

| tura | turnsAtWar | relTotal | queuedPeace | komendy zaproponuj_pokoj po filtrach | krok stołu |
|---|---|---|---|---|---|
| 2-16 | 1-15 | 50->32 | [] | [] | - |
| 17 | 16 | 33 | [pokoj] | [zaproponuj_pokoj/bezw/pokoj] | wstawiono-na-stol |
| 18-22 | 17-21 | 34-40 | [pokoj] | [zaproponuj_pokoj/bezw/pokoj] | dedup-oczekuje |
| 23 | 22 | 44 | [pokoj] | [zaproponuj_pokoj/bezw/pokoj] | wstawiono-na-stol (ziarno 314159: poprzedni wpis zniknął) |

Tura 11 (ziarno 271828): oferuj_miasto_za_pokoj/rozejm, odrzucony przez runner. Ziarno 314159 ma ten sam kształt (pierwsza zaproponuj_pokoj w turze 17).

## Uwagi
- Oceny kandydatów (a)-(c) są oparte na przebiegach z hakiem; zmiana kodu hooka w trakcie rundy nie zmieniła wierszy dla tur 2-18 (pola zgodne).
- Pozostałe pliki z tej rundy: 30-obrona-claude.md (runda 2 Obrony sprzed tej odpowiedzi) pozostaje bez zmian.

## UWAGI-DLA-ORKIESTRATORA
1. Niedeterminizm przebiegu bez haka (ziarno 271828, ta sama paczka, dwa uruchomienia): skrót stanu rozjeżdża się od tury 19, mimo identycznych pól dyplomacji. To może być regresja względem zgłoszeń #346/#349/#362/#373 (determinizm) albo zjawisko harnessu (czas/kolejność asynchroniczna UI). Wymaga osobnego tematu (nie ten).
2. Przebiegi bazowe i hak są w evidence-r2-*.json; porównanie digestów w polu turns[].digest.
3. Zgłoszenie W80B "0 propozycji w 20/20 tur" nie jest odtwarzalne w tej paczce; przed dalszym tematem warto potwierdzić, z jakiej paczki/ziarna W80B korzystał.
