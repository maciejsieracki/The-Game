# R-RAPORT-7-KATEGORII-ABC-PLAYTESTY-Q1

**Status:** 🟢 **KANON PROCESU — obowiązuje od 2026-08-18**
**Zakres:** raport właściciela o stanie pracy na bazie najnowszej ROBOCZEJ.
**Rodzaj zmiany:** docs-only; bez zmian w `gra/src`, `gra/data`, bundlach,
`dyspozycje/WERSJE.md` i bez deployu.

To jest kanon raportu, a nie pytanie gameplayowe. Nie trafia do aktywnej listy
ABC w `PYTANIA-OTWARTE.md`.

## 1. Format raportu

Raport ma zawsze dokładnie siedem kategorii, w tej kolejności:

1. **Gotowe do integracji/deployu.**
2. **W trakcie — Operator.**
3. **W trakcie — Evaluator.**
4. **Zapomniane — do dispatchu.**
5. **Świadomie odłożone.**
6. **Otwarte ABC.**
7. **Playtesty.**

Każdy punkt jest zwięzły: **ID — jedno zdanie statusu — dowód lub następna
czynność**. Pusta kategoria otrzymuje `— (brak)`.

## 2. Źródła i kolejność weryfikacji

Raport powstaje ze źródeł, nie z pamięci ani z samych powiadomień:

1. `dyspozycje/PYTANIA-OTWARTE.md` — pytania, statusy, cytaty i powody
   odłożenia;
2. `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — status próśb i zadań;
3. `docs/decyzje/<ID>.md` — ECHO, litera/jawna decyzja, zakres i status;
4. `dyspozycje/WERSJE.md` — najnowsza ROBOCZA, jej zawartość i jedyny wpis
   `Playtest — na co patrzeć`;
5. `dyspozycje/_handoff/KANAL-PRACA.md` — meldunki, `CZEKAM-NA` i stan
   przekazania;
6. właściwy handoff/audyt — synteza bieżącej fali i zastrzeżenia.

`WERSJE.md` pozostaje jedynym rejestrem wersji. Raport go odczytuje, ale nie
kopiuje ani nie aktualizuje md5/stempli.

## 3. Reguły klasyfikacji

### 1. Gotowe do integracji/deployu

Wpis trafia tutaj, gdy istnieje konkretny artefakt do wpięcia lub publikacji
oraz dowód wykonania (commit, testy lub handoff). „Gotowe lokalnie” nie znaczy
„zdeployowane”; następny gate musi być nazwany w jednym zdaniu.

### 2. W trakcie — Operator

Tylko temat z jawnym dispatch’em Operatora i bez dostarczonego raportu
wykonania. Sam katalog worktree, branch lub plik zmieniony w przeszłości nie
jest dowodem żywego procesu. Jeżeli procesu nie można potwierdzić, raport
pisze to wprost zamiast udawać aktywność.

### 3. W trakcie — Evaluator

Temat, dla którego Operator dostarczył wynik, a niezależny Evaluator nie
zakończył jeszcze werdyktu. W tej kategorii zawsze podaj: czego brakuje do
werdyktu i gdzie jest dowód Operatora.

Raport zawiera osobne podsumowanie:
`Operator: <ID/status/dowód>` oraz
`Evaluator: <ID/status/dowód>`; brak potwierdzonego procesu zapisuje jako
`brak aktywnego procesu`, niezależnie od istniejących worktree.

### 4. Zapomniane — do dispatchu

Temat jest zarejestrowany, ale nie ma aktywnego Operatora, zakończonego
Evaluatora ani jawnego cytatu właściciela o odłożeniu. To jest kolejka do
dispatchu, nie ukryta kategoria „niepilne”. Dla każdego wpisu podaj następny
dispatch lub brakujący kontrakt.

### 5. Świadomie odłożone

Tylko wpis z jawnym powodem właściciela albo wcześniejszą decyzją „później”,
„do kolejnego etapu”, „do odnowienia limitu” itp. Nie wolno dopisać tematu
tutaj wyłącznie dlatego, że agent uznał go za niepilny.

### 6. Otwarte ABC — filtr po ECHO

Ta kategoria obejmuje **wyłącznie** pytania, na które właściciel nie
odpowiedział żadną literą ani inną jawną decyzją.

Przed pokazaniem każdego ID trzeba:

1. odszukać `docs/decyzje/<ID>.md` albo równoważny dokument ECHO;
2. sprawdzić, czy nie ma tam statusu zamkniętego, litery A/B/C, odpowiedzi
   łączonej (`A+C`) ani jawnego rozstrzygnięcia;
3. porównać wynik z `PYTANIA-OTWARTE.md` i rejestrem próśb.

Jeżeli właściciel odpowiedział A/B/C lub podjął jawną decyzję, pytanie znika
z aktywnego ABC i może być pokazane wyłącznie jako **ZAMKNIĘTE**,
**GOTOWE**, **W TOKU** albo **DO INTEGRACJI** — z zachowaniem historii w
rejestrach i dokumentach. Status w samym `PYTANIA-OTWARTE.md` nie wystarcza,
gdy dokument decyzji mówi inaczej.

Jeżeli nie istnieje dokument ECHO/statusu, temat nie jest zgadywany jako
„otwarte ABC”; trafia do dispatchu audytu/rejestracji, aż da się wykonać tę
weryfikację.

### 7. Playtesty

Raport bierze **wyłącznie** najnowszą ROBOCZĄ pozycję zatytułowaną
`Playtest — na co patrzeć` w `dyspozycje/WERSJE.md`. Lista obejmuje tylko
zmiany tej fali i ich skutki.

Nie wolno do tej kategorii przenosić historycznej pełnej kolejki PT,
starszych wpisów `WERSJE.md`, tematów z `PYTANIA-OTWARTE.md` ani ogólnych
zaległości. Jeżeli najnowsza ROBOCZA nie ma takiej pozycji, wynik brzmi
`— (brak wpisu Playtest — na co patrzeć dla najnowszej ROBOCZEJ)`; nie wolno
uzupełniać go starszą falą.

## 4. Snapshot referencyjny dla najnowszej ROBOCZEJ

Baza: **FALA 294**, ROBOCZA `a0f804d7`, audyt
`dyspozycje/_handoff/AUDYT-DOKUMENTACJI-FALA291-294-2026-08-18.md`.

1. **Gotowe do integracji/deployu**
   - `P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1` — implementacja i testy są gotowe
     lokalnie, bez deployu; następny krok: niezależny Evaluator, potem
     integracja.
2. **W trakcie — Operator**
   - `P-JEDNOSTKI-KARTA-3D-INFO-Q1` — generyczna karta z Hastati jako
     wzorcem jest na osobnym branchu/worktree; przed publikacją trzeba
     domknąć testy i ocenę.
   - Stan procesu Operatora nie może być wywiedziony z samego worktree;
     handoff/rejestr muszą potwierdzać, czy proces nadal działa.
3. **W trakcie — Evaluator**
   - `— (brak potwierdzonego aktywnego Evaluatora)` — worktree tematów nie
     jest dowodem żywego procesu; ostatni audyt czeka na niezależny werdykt
     dokumentacji.
4. **Zapomniane — do dispatchu**
   - `P-BITWA-PODSUMOWANIE-NIGDY-NIE-WIDOCZNE`,
     `P-BITWA-SCENA-REJESTRACJA-PRZED-WYJATKIEM`,
     `P-BITWA-ATAK-MIASTO-MGLA-BRAK-SPRAWDZENIA` — zarejestrowane bez
     potwierdzonego dispatchu; uruchomić osobne recony.
   - `P-AI-PANSTWA-MIASTA-REKRUTACJA-JAKO-BUDYNKI`,
     `P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA`,
     `P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA` — brak aktywnego
     wykonawcy; przygotować dispatch zgodnie z zakresem wpisów.
   - `P-TOOLTIP-CIV-UNIT-PANEL-SCOPE-MARTWY-W-GRZE`,
     `P-CUD-WONDER-EARLY-RETURN-STALE-HIGHLIGHT`,
     `P-KOPALNIA-PODSWIETLENIE-KOSMETYKA`,
     `P-SANDBOX-MAPGEN-WYDAJNOSC-LIMITY` — zaległości z audytu, nie
     dopisywać ich do ostatniej fali; nadać właściciela albo jawnie odłożyć.
5. **Świadomie odłożone**
   - `R-USTROJE-RODZAJE-PRZYSZLOSC`,
     `R-SUROWCE-12-PROPOZYCJA-WZGORZA-GORY-Q1`,
     `R-PLATFORMA-DESKTOP-ROADMAP-Q1` — późniejsze etapy zgodnie z cytatami
     właściciela.
   - `P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1` — osobna kolejka wydajności,
     bez mieszania z bieżącym audytem.
   - `P-BITWA-ATAK-DYSTANSOWY-TELEPORT-Q1` — pytanie zachowane, ale
     świadomie odłożone do przeglądu tematów bitewnych; nie przerywać
     bieżącego wątku.
6. **Otwarte ABC**
   - `P-TECHNOLOGIA-POPUP-KARTA-ODKRYCIA-Q1` — ogólny prototyp nadal nie
     ma odpowiedzi właściciela; przed wdrożeniem rozstrzygnąć źródło listy
     jednostek i „Popalnię brązu”.
   - Nie pokazywać tu `P-EPOKA-BRAZU-ODKRYCIE-KOMUNIKAT-Q1=C`,
     `P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1=A` ani
     `P-AI-BRAK-POJECIA-MGLY-Q1=A+C`: mają jawne ECHO i należą odpowiednio
     do stanu wdrożonego lub toku prac.
7. **Playtesty**
   - `— (brak wpisu Playtest — na co patrzeć dla FALI 294)` — najnowsza
     ROBOCZA zawiera zakres i notę o braku Chromium, ale nie zawiera
     dedykowanej pozycji playtestowej; nie przenosić wpisów FALI 291–293.

## 5. Zasada utrzymania

Po każdej nowej ROBOCZEJ raport odczytuje aktualny wpis, ale nie zmienia
historii. Odpowiedzi właściciela pozostają w `PYTANIA-OTWARTE.md`,
`REJESTR-PROSB-I-ZADAN.md` i `docs/decyzje/`; z aktywnego ABC są usuwane
przez zmianę statusu, nigdy przez kasowanie historii.
