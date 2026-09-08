# R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1 — Obrona (Operator), runda 1

**Rola:** Operator (Obrona) — drugie wywołanie tej samej rundy, w odpowiedzi na raport
Evaluatora `02-evaluator-runda1.md` (STATUS: PASS-WITH-NOTES, 2 zarzuty). Worktree
`/home/user/wt-hotseat-etap5-recon`, gałąź `autobot/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1`.

Oba zarzuty zweryfikowane od zera (świeży `grep`/`Read`, nie zaufanie cytatom Evaluatora)
i **PRZYJĘTE** — dokument recon `01-operator-runda1-analiza.md` poprawiony w tej rundzie.

---

## OBRONA: 1 -> PRZYJMUJE

**Zarzut:** globalny toast `#civ-hint-toast` (`hintToast`/`showHintMessage()`@main.ts:
13141-13178, 279 call-site'ów, `hintOverrideTimer`) pominięty w §1/§2/§4; brak
`hideHintMessage()`; realne ryzyko wycieku tekstu specyficznego dla fotela odchodzącego.

**Weryfikacja niezależna (ta runda):**
```
grep -n "hintToast\|showHintMessage\|hintOverrideTimer\|hideHintMessage" gra/src/main.ts
```
Potwierdza dokładnie: `hintToast` tworzony @ 1736-1749; `let hintOverrideTimer` @ 13139;
`function showHintMessage(msg, durationMs=3000)` @ 13141-13179 (nie 13178 — funkcja
zamyka się nawiasem klamrowym w linii 13179, drobna korekta o 1 linię względem cytatu
Evaluatora, bez znaczenia dla treści zarzutu). Jedyne wygaszenie to własny
`setTimeout(...) => { hintToast.style.display='none'; hintOverrideTimer=null; }` wewnątrz
samej `showHintMessage()` (13175-13178) — `hideHintMessage()` **nie istnieje**, zero
trafień grep w całym repo.
```
grep -c "showHintMessage(" gra/src/main.ts → 279
```
Liczba call-site'ów zgadza się DOKŁADNIE z liczbą podaną przez Evaluatora (279) — brak
rozbieżności.

**Dlaczego przyjmuję:** zarzut jest w pełni trafny. §1c rundy 1 inwentaryzował panele
wyłącznie przez wzorzec nazw `hide[A-Za-z]+` (jawnie przyznane w tekście: *"świeży grep
`grep -oE "hide[A-Za-z]+"`"*) — mechanizm strukturalnie NIE MÓGŁ znaleźć `showHintMessage`/
`hintToast`, bo żadna z tych nazw nie zaczyna się od `hide`. To jest realna luka metody,
nie tylko przeoczenie treści. Ryzyko opisane przez Evaluatora (tekst fotela A widoczny
fotelowi B do 4500ms po handoff, patrz najdłuższe wywołanie @ main.ts:4157) jest dokładnie
tej samej klasy co ryzyko planu "wyciek info poza mgłą" — nieprzyjęcie zarzutu byłoby
sprzeczne z GOAL-em rundy.

**Poprawka wprowadzona:**
- Nowa podsekcja `1c-bis` w `01-operator-runda1-analiza.md` — pełna inwentaryzacja z
  cytatami linii i uzasadnieniem ryzyka.
- `§2 KROK 1b` (nowy) w projekcie `switchActiveHuman()`: ręczne wygaszenie
  (`clearTimeout(hintOverrideTimer); hintOverrideTimer=null; hintToast.style.display='none';`)
  — jedyny dostępny mechanizm, bo `hideHintMessage()` nie istnieje. Odnotowana dostępność
  zmiennych z późniejszej części tego samego domknięcia `main.ts` (analogiczny wzorzec do
  referencji `markCityStateDirty`/`focusCameraOnOwnerCapital` już obecnych w §2 rundy 1).
- `§4.2`: pole `hintToastVisible` dodane do `snapshotVisibleState()`, krok 3 scenariusza
  testu rozszerzony o realne wywołanie `showHintMessage(...)` przed handoffem, krok 7
  rozszerzony o asercję `snap.hintToastVisible === false`.

Dowód: `git diff` tej rundy w pliku dokumentu (sekcje `1c-bis`, `KROK 1b`, pole
`hintToastVisible`, punkt asercji w kroku 7) — do zweryfikowania świeżym `Read`/`grep`
przez Evaluatora.

---

## OBRONA: 2 -> PRZYJMUJE

**Zarzut:** globalny „build mode"/„found city mode" (`buildModeOpen`, `foundCityMode`,
`activeImprovementKey`, `activeWonderId`@main.ts:2513/11457-11459, `exitBuildMode()`@
12456-12469) pominięty w §1c/§2/§4; ryzyko WYŻSZE niż info-leak (przejęcie niedokończonej
akcji budowy); `exitBuildMode()` jest no-opem, gdy `isAwaitingFirstPlayerCity()` jest
prawdą.

**Weryfikacja niezależna (ta runda):**
```
grep -n "buildModeOpen\|foundCityMode\|activeImprovementKey\|activeWonderId\|function exitBuildMode\|isAwaitingFirstPlayerCity" gra/src/main.ts
```
Potwierdza dokładnie cytowane linie: `foundCityMode` @ 2513, `buildModeOpen`/
`activeImprovementKey`/`activeWonderId` @ 11457/11458/11459. `exitBuildMode()` przeczytana
w całości: **12456-12472** (funkcja kończy się w 12472, o 3 linie dalej niż cytat
Evaluatora 12456-12469 — cytat Evaluatora obejmował ciało do `popOverlay('build-mode')`
włącznie w 12471, pominięta tylko klamra zamykająca w 12472; treściowo bez rozbieżności).
Guard `if (isAwaitingFirstPlayerCity()) return;` potwierdzony @ **12462**, z komentarzem
w kodzie wprost odsyłającym do `R-PIERWSZE-MIASTO (Maciej 2026-07-24)` — invariant
celowy i udokumentowany, nie przypadkowy.

**Dlaczego przyjmuję:** zarzut trafny z dwóch niezależnych powodów:
1. Metoda §1c rundy 1 rzeczywiście nie mogła tego znaleźć — grep po wzorcu `hide*` jest z
   definicji ślepy na stan sterowany zmiennymi bez takiego prefiksu. To jest ta sama klasa
   luki metody co zarzut #1, potwierdzająca, że filtr nazw użyty w rundzie 1 był zbyt wąski
   dla całego GOAL-u pkt 1c ("panele/modale" — build-mode jest funkcjonalnie modalnym
   trybem wejścia, mimo że nie jest zaimplementowany jako panel DOM).
2. Ryzyko jest realne i, zgodnie z oceną Evaluatora, poważniejsze niż zwykły info-leak:
   `buildModeOpen`/`activeImprovementKey`/`activeWonderId` sterują bezpośrednio ścieżką
   obsługi kliknięcia na mapie (main.ts:11936-11971, przeczytane ponownie tej rundy) — bez
   zamknięcia trybu pierwsze kliknięcie fotela B trafia w tę samą, wciąż aktywną gałąź.
   Do tego guard `isAwaitingFirstPlayerCity()` w `exitBuildMode()` oznacza, że **nawet
   próba "grzecznego" zamknięcia zawodzi dokładnie w scenariuszu, w którym każdy fotel
   hot-seat realnie się znajdzie na starcie własnej pierwszej tury** (zanim założy
   stolicę) — to nie jest brzegowy przypadek, to domyślny stan startowy drugiego fotela.

**Poprawka wprowadzona:**
- Nowa podsekcja `1c-ter` w dokumencie recon — pełna inwentaryzacja, cytat ciała
  `exitBuildMode()`, analiza ryzyka i jawne wskazanie napięcia z invariantem
  `R-PIERWSZE-MIASTO`.
- `§2 KROK 1c` (nowy): wywołanie `exitBuildMode()` jako pierwsza, "grzeczna" próba
  (zachowuje czyszczenie wizualiów/`popOverlay` dla przypadku, gdy guard nie blokuje), plus
  **jawny, wymuszony reset czterech zmiennych wprost**, gdy `isAwaitingFirstPlayerCity()`
  jest prawdą — bo to jedyny sposób pokrycia scenariusza, w którym "grzeczna" ścieżka jest
  no-opem.
- `§4.2`: pola `buildModeOpen`/`foundCityMode`/`activeImprovementKey`/`activeWonderId`
  dodane do `snapshotVisibleState()`, krok 3 scenariusza testu rozszerzony o wejście w
  build-mode przed handoffem (bez zamykania), krok 7 rozszerzony o cztery asercje
  (wszystkie muszą wrócić do stanu pustego/`false`/`null`).
- **`§6 pkt 6` (nowy, dług/decyzja jawna, NIE ciche założenie):** wymuszony reset w §2
  KROK 1c świadomie ODSTĘPUJE od udokumentowanego invariantu `R-PIERWSZE-MIASTO` w
  kontekście handoff między fotelami (invariant pierwotnie chronił przed ucieczką
  Escape/PPM/toggle W RAMACH JEDNEGO fotela, nie przed przekazaniem kontroli MIĘDZY
  fotelami) — to jest zmiana zachowania celowego mechanizmu i **wymaga potwierdzenia
  ABC/właściciela przed rundą implementacji**, zgodnie z tym, jak dokument już traktuje
  inne decyzje tej klasy (§1a zerowanie HUD, §1b czyszczenie logów). Dodatkowo odnotowane
  jako pytanie otwarte do rundy implementacji: czy `isAwaitingFirstPlayerCity()` jest dziś
  per-owner, czy globalna — jeśli globalna, fotel B może natychmiast ponownie wejść w
  analogiczny wymuszony tryb, co jest odrębnym zagadnieniem od samego resetu wykonanego
  w KROKU 1c.

Dowód: `git diff` tej rundy w pliku dokumentu (sekcje `1c-ter`, `KROK 1c`, cztery pola w
`snapshotVisibleState`, asercje kroku 7, `§6 pkt 6`) — do zweryfikowania świeżym
`Read`/`grep` przez Evaluatora.

---

## Podsumowanie zmian tej rundy

Jeden plik zmieniony: `dyspozycje/autobot/runs/R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/
01-operator-runda1-analiza.md` (dopisane sekcje `1c-bis`, `1c-ter`, KROK 1b/1c w §2,
rozszerzenie hooka i scenariusza testu w §4.2, punkt 6 w §6, wpis w checklistcie §7).
Zero zmian w `gra/src/**`/`gra/tools/**` — potwierdzone `git status --porcelain` przed
zapisem tego raportu (czysto poza tym jednym plikiem dokumentacyjnym). Zero `git add -A`
— staged wyłącznie plikami z allowlisty tego tematu.

**Oba zarzuty Evaluatora: PRZYJĘTE, bez odrzuceń.** Żaden z nich nie wymagał zmiany kodu
(zakaz allowlisty tej rundy) — oba mieściły się w zakresie "uzupełnij dokument recon o
pominięte źródła stanu i ich traktowanie w projekcie", zgodnie z NASTĘPNYM KROKIEM raportu
Evaluatora.

STATUS: PASS-WITH-NOTES → oczekuję rundy 2 Evaluatora na uzupełniony dokument.
DOMAIN: INFORMATIONAL
TEMAT: R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1
GOAL: Recon-only (zero zmian kodu) dla Etapu 5 planu hot-seat: `switchActiveHuman()` +
`ui/hotSeatHandoff.ts`.
ZMIANY/COMMIT: Uzupełniony `01-operator-runda1-analiza.md` (sekcje 1c-bis, 1c-ter, KROK
1b/1c, rozszerzenie §4.2, §6 pkt 6, §7) + nowy `03-obrona-runda1.md` (ten plik). Do
zacommitowania w tej samej rundzie.
TESTY: Nie dotyczy (dokument, zero kodu). `git status --porcelain` czysty poza plikami
allowlisty.
BLOKADY: Brak. Jeden punkt jawnie oznaczony jako wymagający decyzji ABC/właściciela przed
implementacją (§6 pkt 6 dokumentu recon — odstępstwo od `R-PIERWSZE-MIASTO` w handoff).
RUNDY: 1/5 (druge wywołanie tej samej rundy — obrona po zarzutach Evaluatora).
NASTĘPNY KROK: Evaluator → runda 2 na tym samym ID: potwierdzić, że oba zarzuty zostały
adekwatnie zaadresowane w dokumencie, lub wskazać pozostałe braki.
DEPLOY/PUSH: NIE WYKONANO
