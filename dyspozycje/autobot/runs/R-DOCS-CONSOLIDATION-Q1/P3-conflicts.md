# P3 — konflikty normatywne i braki kanoniczności

Temat: R-DOCS-P3-SOURCES-OF-TRUTH-Q1
Snapshot boundary: 2026-09-14T20:08:36Z
Status: PASS-WITH-NOTES

To jest rejestr rozjazdów znalezionych podczas przypisywania ról. Nie jest to rozstrzygnięcie P4 o stale/duplicate i nie zawiera planu usuwania ani scalania z P6. `OWNER_DECISION_REQUIRED` oznacza potrzebę jawnej decyzji właściciela albo owner-approved harmonizacji; `NO` oznacza, że aktywna hierarchia już wskazuje sposób interpretacji, bez zmiany źródła.

## 1. Dwa punkty wejścia

Status: `OPEN_FOR_P5` · `OWNER_DECISION_REQUIRED: YES`

- `README.md` §1 mówi: „jedyny uniwersalny punkt wejścia”, niezależny od narzędzia.
- `AGENT-START-HERE.md` nagłówek i §2 mówią o „jednym dokumencie wejściowym dla każdego nowego agenta” oraz rozszerzają kolejność o routing Hermes, skille i reguły.
- P3 nie wybiera po cichu jednej wersji. Robocza interpretacja mapy: `README.md` pozostaje uniwersalnym wejściem, a `AGENT-START-HERE.md` jest rozszerzonym indeksem lokalnym.
- `AGENT-START-HERE.md` jest w primary untracked/local-only na granicy snapshotu. Nie oznacza to publikacji na `origin/main` ani prawa do jego edycji w P3.

Decyzja/next gate: P5 ma potwierdzić docelową relację i ewentualną publikację indeksu. P3 nie zmodyfikował żadnego z tych plików.

## 2. Aktywna norma kontra referencyjne AUTOBOT*.md

Status: `INTERPRETATION_RESOLVED_BY_ACTIVE_NORM` · `OWNER_DECISION_REQUIRED: NO`

- `docs/decyzje/R-PROC-AUTOBOT.md` nagłówek oraz §1 nazywają dokument aktywną normą procesu.
- `AGENT-START-HERE.md` §2B mówi, że `AUTOBOT.md` i `AUTOBOT-UNIVERSAL.md` są referencyjne/historyczne i nie mogą nadpisać aktywnej normy.
- `AUTOBOT.md` oraz `AUTOBOT-UNIVERSAL.md` zawierają starsze opisy ról/ścieżek; P2 oznaczył je metadanymi `CANONICAL`, ale P2 sam zastrzega, że metadata nie dowodzi source-of-truth.
- Nie uznaję ich za usunięte ani globalnie stale. Rola `HISTORY` zachowuje kontekst; aktywny R-PROC wygrywa przy routingu.

Podstawa: jawna hierarchia `AGENT-START-HERE.md` §1–§2B i nagłówek R-PROC. Dalsza analiza konkretnych duplikatów/staleness należy do P4.

## 3. Stary `dyspozycje/README.md` kontra aktywny indeks AutoBot

Status: `INTERPRETATION_RESOLVED_BY_EXPLICIT_BANNER` · `OWNER_DECISION_REQUIRED: NO`

- `dyspozycje/README.md` l. 1–6 ma banner „NIEAKTUALNE OD 2026-07-06” i mówi, że treść poniżej jest historią.
- `docs/procesy/INDEX-PROCESU.md` §1–§2 oraz `dyspozycje/autobot/README.md` §Aktywny obieg wskazują aktualną ścieżkę procesu.
- Nie wolno użyć lane’owego modelu z `dyspozycje/README.md` jako bieżącego routingu tylko dlatego, że plik istnieje.

Podstawa: treść banneru i aktywne dokumenty procesu. P3 nie usuwa starego README ani nie zmienia jego oznaczenia.

## 4. Rozjazd wartości routingu/modelu/effort

Status: `OPEN_FOR_OWNER_HARMONIZATION` · `OWNER_DECISION_REQUIRED: YES`

- `docs/decyzje/R-PROC-AUTOBOT.md` §1 i §1a opisują role jako Operator/Evaluator/Final Control na Luna High oraz integrację Luna Medium; §1a dla `multi_agent_v1` wymaga jawnego modelu i `reasoning_effort=high` dla Operatora/Evaluatora.
- `AGENT-START-HERE.md` §4 dla nowych/naprawianych kart podaje `gpt-5.6-luna/openai-codex/max/priority`, a Final Control `ultra/priority`.
- `R-PROC-AUTOBOT-HERMES-KANBAN.md` §2 wymaga jawnych parametrów i natywnego routingu, ale nie usuwa potrzeby rozstrzygnięcia różnicy wartości w dokumentach.
- Live `kanban_show(t_66f79d5e)` pokazuje bieżące parametry tej karty w jej kontrakcie; jest to fakt tego taska, nie uniwersalna decyzja P3 dla wszystkich nowych kart.

Decyzja/next gate: owner-approved tabela routingu powinna określić, czy i gdzie `high/max/ultra` są rozdzielane per narzędzie, rola i faza. Do tego czasu nie normalizować historycznych kart i nie zgadywać brakujących pól.

## 5. `HANDOFF-AKTUALNY.md` kontra późniejsza końcówka kanału

Status: `OPEN_FOR_HANDOFF_REFRESH` · `OWNER_DECISION_REQUIRED: YES`

- `README.md` i `AGENT-START-HERE.md` §2A wskazują `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` jako bieżący stan przejęcia, a końcówkę `dyspozycje/_handoff/KANAL-PRACA.md` jako ostatnie przekazania.
- Odczyt `HANDOFF-AKTUALNY.md` opisuje starszy stan sesji.
- Odczyt końcówki `KANAL-PRACA.md` zawiera późniejsze, datowane wpisy operacyjne.
- P3 zapisuje rozjazd, ale nie ogłasza żadnego pliku „rozwiązanym stale” i nie przepisywał handoffów.

Decyzja/next gate: odświeżyć pointer albo jawnie potwierdzić, który wpis jest bieżący. P4 może sklasyfikować nieaktualność; P5/P6 nie powinny automatycznie kasować historii.

## 6. Główna analiza architektury kontra dokument developerski silnika

Status: `OPEN_FOR_ARCHITECTURE_OWNER` · `OWNER_DECISION_REQUIRED: YES`

- `docs/analiza/README.md` l. 3 wskazuje `ANALIZA-ARCHITEKTURY-Civ.md` jako główną analizę architektury, a §Numeracja 01–08 opisuje jej techniczne deep-dives.
- Ten sam indeks wiersz `08-DOKUMENTACJA` wskazuje lukę i nieaktualność `SILNIK-ARCHITEKTURA`.
- `SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md` jest P2 `UNKNOWN`; sama nazwa/istnienie nie promuje go do kanonu.
- `R-PROC-AUTOBOT.md` §13a rozstrzyga fakty implementacji przez świeży kod, nie przez starą analizę.

Decyzja/next gate: wskazać, czy utrzymywaną dokumentacją jest analiza główna, developer architecture, czy osobne kontrakty. P3 nie aktualizuje architektury i nie orzeka pełnego driftu.

## 7. Baza scenariuszy/playtestów nie ma potwierdzonego właściciela

Status: `UNKNOWN_NEEDS_REVIEW` · `OWNER_DECISION_REQUIRED: YES`

- `docs/master/README.md` opisuje hub Master oraz `REJESTR-PLAYTESTOW.md` jako jedno miejsce playtestów; `LISTA-PLAYTESTS.md` zawiera scenariusze batchy.
- Te pliki są datowane na starszy model Master i w P2 mają klasyfikację `UNKNOWN`.
- Aktualna kolejność startowa `AGENT-START-HERE.md` §2A–§2C nie wskazuje tych plików jako źródła bieżącego routingu Hermes.
- P3 nie promuje ani nie odrzuca kandydatów, nie nazywa ich globalnie stale i nie tworzy nowej bazy.

Decyzja/next gate: owner wskazuje utrzymywaną bazę scenariuszy/playtestów i relację do Kanbana. P4/P6 mogą dopiero potem przygotować analizę/plan.

## 8. Companion Autoboot Monitor pozostaje osobnym projektem

Status: `BOUNDARY_RESOLVED` · `OWNER_DECISION_REQUIRED: YES` tylko przy zmianie cross-project

- `/home/ubuntu/projects/Autoboot-Monitor/AUTOBOT-KANBAN.md` jest dokumentem kontraktu companionu, a polityki w `/home/ubuntu/projects/Autoboot-Monitor/docs/` dotyczą jego projektu.
- `AGENT-START-HERE.md` §2C mówi, że można zastosować zasady ogólne, ale wartości boardu/profilu The-Game nie mogą być przez nie zastąpione.
- P2 zamroził 181 rekordów companionu jako `SEPARATE_PROJECT`; późniejszy drift companionu pozostaje ograniczeniem snapshotu, nie retroaktywną korektą.

Nie ma konfliktu do rozstrzygnięcia w ramach The-Game: companion nie jest kanonicznym źródłem The-Game. Każda zmiana wspólnego interfejsu wymaga osobnego, jawnie przypisanego tematu i readbacku obu projektów.

## 9. Dokumentowy ledger kontra live integracja/deploy

Status: `INTERPRETATION_RESOLVED_BY_LIVE_READBACK_RULE` · `OWNER_DECISION_REQUIRED: NO`

- `dyspozycje/WERSJE.md`, `KANAL-PRACA.md`, `gra-robocza/CLAUDE.md` i procedura deployu opisują, gdzie zapisać ślad.
- `docs/decyzje/R-PROC-AUTOBOT.md` §5 oraz `AGENT-START-HERE.md` §2G mówią, że wpis, commit, branch, raport albo status UI nie dowodzą integracji/deployu.
- Dowód bieżącego stanu to świeży Git/readback, test/build wykonany na właściwym stanie oraz wymagany receipt; P3 żadnego deployu nie wykonywał.

P3 nie poprawia ledgerów ani nie zmienia `gra-robocza/**`; owner decision nie jest potrzebna do zasady, ale deploy wymaga osobnej autoryzacji w przyszłym temacie.

## 10. Rejestr statusów otwartych ma celowo nadmiarowy regex

Status: `INTERPRETATION_RESOLVED_BY_PROCEDURE` · `OWNER_DECISION_REQUIRED: NO`

- `CLAUDE.md` §0c i `AGENT-START-HERE.md` §2A wymagają `grep -nE 'STATUS:[[:space:]]*\*{0,2}OTWARTE' dyspozycje/PYTANIA-OTWARTE.md`.
- Readback granicy snapshotu zwrócił 72 linii. Wynik zawiera również linie audytowe/cytaty, więc nie jest liczbą realnych aktywnych pytań.
- P3 nie zmienia wpisów ani nie rozstrzyga statusów; każdy trafiony temat wymaga osobnej kontekstowej weryfikacji albo jawnego powodu odłożenia.

Podstawa: procedura C-031 celowo preferuje nadmiar nad pominięciem. Szczegółowy audyt wpisów należy do osobnego zakresu.

## 11. Zakres i rozdział faz

P3 wykonuje tylko przypisanie źródeł do ról, rejestr konfliktów i wskazanie decyzji. P4 ma analizować konkretne stale/duplicate, P5 ewentualnie edytować indeks, a P6 przygotować niedestrukcyjny plan konsolidacji. Żadna z tych czynności nie została wykonana jako efekt uboczny P3.
