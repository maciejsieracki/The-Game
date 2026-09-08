# HANDOFF SESJA 2026-09-07/08 — pętla nocna AutoBot, FALA 361

Czytaj TEN plik najpierw jeśli wznawiasz pracę po tej sesji. Pełny kontekst
dyskusji z właścicielem (żywe zgłoszenia, ECHO, decyzje) jest w historii czatu
tej sesji Claude Code — ten plik jest DESTYLATEM, nie zastępuje rejestru.

## Co się stało w tej sesji (chronologicznie, skrót)

Właściciel zgłosił żywo (rozmowa + zrzuty ekranu) serię bugów/próśb, każdy
przeszedł pełny cykl recon → (ECHO/AskUserQuestion jeśli decyzja) → dispatch
AutoBot (Workflow, Ścieżka A) → Operator → Evaluator → (Obrona jeśli zarzuty)
→ Final Control → integracja allowlist-only → rejestr. Około godziny 22 UTC
właściciel dał **pełną autonomię na całą noc** z instrukcją: zamknij jak
najwięcej tematów, zrób deploy ROBOCZA, udokumentuj dla innych agentów,
odłóż pytania decyzyjne do ABC rano, potem przejdź do gorącego krzesła
(Etapy hot-seat 4+).

### Tematy zintegrowane tej sesji (chronologicznie)

1. `R-DYPLO-RELACJA-ETYKIETA-BLEDNA-Q1` (`22aea4fc`) — fałszywa etykieta
   „Relacja 100" w Stole negocjacji pokoju naprawiona.
2. `R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1` (`0283fa60`) — bilans zdobycia
   miasta pokazuje wiersz „Surowce zdobyte" (transfer już działał, brakowało UI).
3. `R-PODBOJ-ELIMINACJA-PULA-PRACY-TRANSFER-Q1` (`bcb2ac4b`, **ręczne
   scalenie konfliktu** z tematem #2 — ten sam interfejs `CityCaptureReportInput`) —
   pula pracy całej cywilizacji → do zdobywcy przy eliminacji ostatniego miasta.
4. `R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1` (`ad805957`) — limit
   miast rozróżnia proweniencję (zdobyte od miasta-państwa liczy się,
   odebrane innej cywilizacji nie), częściowe odwrócenie wcześniejszej decyzji.
5. `R-HANDEL-WYMIANA-DAR-DEADLOCK-Q1` (`ed0b518b`) — **⚠️ DECYZJA
   AUTONOMICZNA ORKIESTRATORA W NOCY, DO ABC**: punktowy wyjątek dla
   technologii „Wymiana" w bramce prereq daru technologii (bez tego partner
   bez Garncarstwa/Rolnictwa/Oswojenia zwierząt nigdy nie mógł dostać daru
   odblokowującego handel — realny deadlock kompozycyjny dwóch osobno
   poprawnych, wcześniejszych decyzji).
6. `R-HUD-ZETONY-EKONOMIA-BRUTTO-Q1` (`7147ba87`) — żetony Praca/Skarbiec/
   Nauka pokazują brutto zamiast netto (ECHO właściciela, „wszystkie trzy").
7. `R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1` (`e27418db`) — bramka bilansu PW
   pokoju kierunkowa (partner proponuje → pomijana; gracz proponuje → wymaga
   bilansu ≥0) + AI żąda kompensacji za goły pokój zamiast oddawać za darmo.
8. `R-ULEPSZENIA-FARMA-IRYGACJA-BYDLO-STACK-Q1` (`a3649f23`) — farma+
   irygacja+bydło mogą współistnieć na jednym polu z dostępem do wody.
9. `R-ENTITYCARD-ROZWINIETE-SEKCJE-SCROLLBAR-Q1` (`fb10a248`) — karta
   technologii: sekcje domyślnie rozwinięte + trwały pasek przewijania.
   **Runda 1 poszła błędnie na Sonnet 5** (temat wizualny wymaga §5a Opus 5) —
   Evaluator sam to złapał, runda 2 poprawnie na Opus 5.
10. `R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1` (`2a99ec69`) — nowa bramka dowodu
    no-op (`gra/tools/hotseat-etap4-noop-test.cjs`) pod przyszłą rundę
    rozcięcia `triggerPlayerEndTurn()`. Zero zmian w `main.ts`.
11. `R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1` (`2e57c2dd`) — Część A (bug):
    strażnik wyścigu przy budowie tartak/obóz łowiecki. Część B
    (**⚠️ DECYZJA AUTONOMICZNA ORKIESTRATORA W NOCY, DO ABC**): tartak znika
    razem z lasem (odwraca wcześniejszy, wyłącznie w kodzie/teście
    udokumentowany kanon).
12. Korekta stałego wpisu rejestru: `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1` był
    oznaczony jako `OTWARTE`, recon potwierdził że jest `ROZWIĄZANE` od
    2026-08-22 (T2 `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1`) — brak zmiany kodu.

**Deploy ROBOCZA FALA 361** (`969f49ef`) zawiera tematy #8-11 (farma/irygacja/
bydło, hot-seat noop-harness, entity-card, tartak/las) + wcześniejsze tematy
#1-7 zintegrowane wcześniej tego dnia (FALA 360 miała tylko wojnę wymuszoną,
##1-7 poszły do main między FALA 360 a 361, patrz commity wyżej).

## ⚠️ TRZY POZYCJE DO ABC — właściciel musi potwierdzić/odrzucić rano

1. **`R-HANDEL-WYMIANA-DAR-DEADLOCK-Q1`** — czy zgoda na punktowy wyjątek dla
   technologii „Wymiana" (może być podarowana bez prereqów u odbiorcy)?
   Odwracalne jednym commitem jeśli nie.
2. **`R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1` Część B** — czy zgoda na to, że
   tartak znika razem z lasem (tak jak obóz łowiecki)? Właściciel to
   sygnalizował dwukrotnie żywo ze zrzutami przed/po, więc to prawdopodobnie
   już potwierdzone w duchu, ale formalnie nie miało ECHO. Odwracalne jednym
   commitem (`FOREST_DEPENDENT_IMPROVEMENT_KEYS` w
   `gra/src/map/improvement-build.ts`).
3. **`P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1`** (nowy wpis rejestru,
   linia ok. 100) — sekcja „Jednostki" karty technologii chowa nadmiar za
   przyciskiem „Pokaż pozostałe N" (`previewLimit=3`) mimo że reszta karty ma
   teraz wszystko rozwinięte — dotyczy 5 technologii. Usunąć limit całkowicie
   czy zostawić jako świadomy UX-mechanizm przeciw kartom na 20+ wierszy?

Wszystkie trzy zarejestrowane w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (Indeks
bieżący, szukaj po ID wyżej).

## Znane pułapki/wnioski z tej sesji (dla przyszłych agentów)

- **§5a Opus 5 dla tematów wizualnych jest łatwe do przeoczenia przy
  dispatchu** — klasyfikacja "to jest wizualne" nie zawsze jest oczywista z
  samego zgłoszenia właściciela (np. "rozwinięte sekcje + pasek przewijania"
  brzmi jak drobna zmiana, ale jest to CSS/UX = §5a). Evaluator sam to
  wyłapał tu i w innych tematach — ale lepiej sklasyfikować PRZED dispatchem.
- **Workflow-owe skrypty Operator/Evaluator/Final Control czasem NIE piszą
  własnego raportu na dysk** — zwracają tylko tekst przez `agent()`. Zdarzyło
  się to dwa razy tej sesji (Final Control hot-seat-harness, Operator/
  Evaluator/Obrona tartak/las). Orkiestrator musiał sam dopisać
  `0N-rola-rundaN.md` z tekstu raportu przed integracją, żeby zachować pełny
  ślad w `dyspozycje/autobot/runs/<ID>/`. **Rozważ dodanie do promptu
  jawnego wymogu "zapisz swój raport do pliku i zacommituj PRZED
  zwróceniem wyniku"**, żeby to nie było ręczną łatką orkiestratora za
  każdym razem.
- **Manualne scalanie konfliktów git przy integracji** zdarza się, gdy dwa
  tematy dodają niezależne pola do tego samego interfejsu/wywołania (patrz
  temat #2/#3 wyżej, `CityCaptureReportInput`). Rozwiązanie: zachować OBIE
  strony (nie wybierać jednej), zweryfikować pełnym zestawem bramek po
  scaleniu, udokumentować w commicie że scalenie było ręczne.
- **Diff integracyjny liczony od bazy TEMATU (dispatch), nie od bieżącego
  `origin/main`** — main przesuwa się między dispatchem a integracją.
  Sprawdzaj `git log --oneline` na gałęzi tematu, cofnij się do commita
  `dispatch:` i weź JEGO rodzica jako bazę diffu.
- Bramka `map-improvement-qualify-test.cjs` ma jeden pre-istniejący,
  niezwiązany FAIL ("oboz lowiecki OK on laka+las") — potwierdzony
  wielokrotnie jako stan sprzed wszystkich tematów tej sesji, nie regresja.

## Stan planu hot-seat (2 graczy) — `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md`

- Etap 0 (`94c475ec`), Etap 1 (`87b33da3`), Etap 2 — mgła wojny (`f3c0becf`),
  Etap 3 — akcesory ekonomia (`302ea837`), Etap 4-prep — deferred owner
  guards (`e2c765ac`): wszystkie **ZINTEGROWANE**, behawioralny no-op
  potwierdzony wielokrotnie niezależnie na każdym etapie.
- Etap 4 recon (`72345570`, dokument, zero kodu): kompletna mapa 16 faz
  `triggerPlayerEndTurn()` (4469 linii), plan rozcięcia na
  `endActiveHumanTurn()`/`runWorldEndTurn()`/`advanceSeat()`.
- **Etap 4 noop-harness** (`2a99ec69`, ta sesja): bramka dowodu no-op gotowa
  (`gra/tools/hotseat-etap4-noop-test.cjs`, 30 tur, hash SHA-256 stanu,
  determinizm `Math.random`). Zero zmian w `main.ts`.
- **NASTĘPNY KROK (nie zaczęty)**: właściwe rozcięcie `triggerPlayerEndTurn()`
  na podstawie recon + użycie noop-harness jako bramki regresji PRZED/PO
  rozcięciem. To jest "najwyższe ryzyko całego planu" (cytat z recon) —
  dispatchować jako osobny, uważnie skopowany temat, prawdopodobnie
  wielo-węzłowy (§12 R-PROC-AUTOBOT.md).

## Gdzie szukać więcej

- Szczegóły każdego tematu: `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, sekcja
  „Indeks bieżący" (góra pliku) ma jednowierszowe podsumowanie + link do
  pełnego opisu niżej w tym samym pliku.
- Pełne raporty AutoBot (Operator/Evaluator/Obrona/Final Control) każdego
  tematu: `dyspozycje/autobot/runs/<ID>/`.
- Wersje/deploy: `dyspozycje/WERSJE.md`, sekcja ROBOCZA, FALA 361 na górze.
