# CLAUDE.md — Civ „The Game"

Gra strategiczna 4X (heksy, cywilizacje, epoki Kamień → Brąz → Żelazo). Kod w `gra/`.

## ZACZNIJ TUTAJ
**Przeczytaj najpierw [`STAN-PRACY-HANDOFF.md`](STAN-PRACY-HANDOFF.md)** (korzeń repo) — to punkt wejścia KAŻDEJ sesji: co zrobione, co w toku, co zostało do zrobienia, podjęte decyzje (żeby nie pytać drugi raz) i zasady bezpieczeństwa. Ten plik (`CLAUDE.md`) to tylko skrót zasad krytycznych; **pełny, aktualny stan jest w handoffie** — i to handoff się aktualizuje po każdej większej zmianie.

To jest projekt **Civ**, **NIE Planify**. Jeśli widzisz odniesienia do „Fazy A", `organizationId`, planu E0–E8, hubu pracy NASTER — to Planify (inny projekt), zignoruj przy pracy nad Civ.

## ⛔ ZASADY KRYTYCZNE (złamanie = utrata pracy)
0. **NUMER → ABC → COMMIT → READY_FOR_DEPLOY (Maciej 2026-08-03).** Każdy case/bug/poprawka/innowacja → ID w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`. **Nie koduj od razu** — przedstaw rozwiązanie ± ABC. Commit dopiero po **`numer + A|B|C`**. **Deploy dopiero po `READY_FOR_DEPLOY` i wyłącznie na hasło `deploy`**. Kanon: `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`.
0a. **AUTOBOT — TWARDA REGUŁA (Maciej 2026-08-05, routing zaktualizowany 2026-08-19).** **KAŻDA praca** wyłącznie w systemie AutoBot: Operator (**GPT-5.6 Luna High**) → Evaluator (**GPT-5.6 Luna High**) → główny orkiestrator/final (**GPT-5.6 Luna Medium**). W tym eksperymencie przy każdym cyklu zapisuj liczbę rund Operator → Evaluator i poprawek po werdykcie, aby porównać jakość z wcześniejszym routingiem Medium. **ZAKAZ** pracy poza pętlą / „gotowe” bez Evaluatora. Playbook + guardrails. Kanon: `dyspozycje/autobot/` · `.cursor/rules/autobot-evaluator-operator.mdc` · `docs/decyzje/R-PROC-AUTOBOT.md`.
   **Nadrzędny obieg procesu:** `Operator → Evaluator → finalna kontrola → integracja → READY_FOR_DEPLOY`.
   Raport Operatora jest przekazaniem sterowania, nie końcem pracy i nie powodem do czekania
   na ponowne popychanie właściciela. Po raporcie orkiestrator automatycznie uruchamia
   Evaluatora. Po `PASS` wykonuje finalną kontrolę, a następnie: (a) przygotowuje i zadaje
   pełne ABC z pełnym ID, jeśli potrzebna jest decyzja; albo kieruje
   zatwierdzony zakres do integracji. `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS`
   uruchamiają bez czekania `Operator → Evaluator` z tym samym ID. ABC pauzuje tylko temat,
   który wymaga decyzji właściciela.
   **Sygnalizacja:** subagent kończy raportem `STATUS: PASS|PASS-WITH-NOTES|FAIL|BLOCK|TIMEOUT|INFRA`
   z ID tematu, plikami/commitami, testami, blokadami, następnym krokiem oraz polem `DEPLOY/PUSH`.
   UI `działa`, samo „gotowe” i `GOTÓW DO TESTU` nie wystarczają. `PASS-WITH-NOTES` przechodzi dalej
   tylko z jawnymi, nieblokującymi uwagami zaakceptowanymi przez finalną kontrolę. Po raporcie zamykaj subagenta; limit to 6
   otwartych slotów. Brak ruchu przez 7 minut = `ZWIS` i przejęcie tematu przez orkiestratora.
   Jeśli istnieją niezablokowane tematy, wszystkie 6 slotów musi być wykorzystane; po zakończeniu
   subagenta natychmiast zamknij go i uruchom następną fazę albo kolejny niezależny temat.
   **Ciągła pętla:** `FAIL`/techniczny `BLOCK`/`TIMEOUT`/`INFRA`/`ZWIS` → bez czekania
   `Operator → Evaluator`, zawsze z tym samym ID; przy `ZWIS` orkiestrator przejmuje wykonanie.
   `PASS` przechodzi przez finalną kontrolę i integrację. `READY_FOR_DEPLOY` kończy proces
   przygotowania dopiero po allowliście, izolacji i bramkach; nie oznacza wykonanego deployu
   ani pushu. Deploy/push wymaga osobnej autoryzacji. Temat pozostaje aktywny pod tym samym
   ID aż do `READY_FOR_DEPLOY`; ABC pauzuje tylko temat wymagający decyzji właściciela.
   `READY_FOR_DEPLOY` może wystawić wyłącznie orkiestrator po finalnej kontroli i integracji;
   Operator ani Evaluator nie ogłaszają samodzielnie końca procesu.
   **C-043:** właściciel komunikuje się wyłącznie w głównym czacie orkiestratora;
   subagenci są kanałami technicznymi, a ich raporty wracają do orkiestratora.
   **Komenda `sprawdź`:** wykonaj audyt: cała bieżąca pula + historyczne `not_found` do reconciliacji;
   sprawdź statusy, raporty, blokady i następne kroki, zamknij zakończonych i uruchom wymagane kolejne
   fazy. Klasyfikacja obejmuje `PASS`, `PASS-WITH-NOTES`, `FAIL`, `BLOCK`, `TIMEOUT`, `INFRA`,
   `READY_FOR_DEPLOY` albo wynik niepewny. `not_found` bez raportu wymaga reconciliacji i nie jest
   zakończeniem.
0b. **AUTOBOT OBEJMUJE TAKŻE PRACĘ GŁÓWNEJ SESJI (Maciej 2026-08-07).** Jego słowa: *„Dla siebie
   też przyjmij zasadę autobot na każdym temacie, nie tylko dla subagentów. Czyli każdą swoją
   decyzję sprawdzaj ewaluatorem"* oraz *„zasada Autobots obejmuje nie tylko zleconą pracę
   subagentowi, ale **po pierwsze Twoją pracę**"*.
   **Skutek:** główny orkiestrator (**GPT-5.6 Luna Medium**) **nie jest zwolniony** z pętli. Każda zmiana, którą
   wprowadza SAM — kod, dane, kanon, dokument decyzji, wpis w rejestrze, sprostowanie — przechodzi
   przez **Evaluatora na GPT-5.6 Luna High**, tak samo jak praca subagenta. Orkiestrator jest wtedy Operatorem
   własnej zmiany i **nie ocenia sam siebie** (zasada z §1 playbooka: „wykonawca nigdy nie ocenia
   sam siebie").
   **Powód (realne wypadki 2026-08-07, wszystkie w pracy własnej orkiestratora, żaden nie złapany
   przez nikogo poza późniejszym przypadkiem):** (a) wpisanie do `PYTANIA-OTWARTE.md`, że bramka
   `map-gen-regression` kończy się `exit 0` — nieprawda, `fail++` z sekcji Pangea wchodzi do
   `allOk`; błąd powielony potem w 3 kolejnych dokumentach i przez subagenta; (b) odczytanie kodu
   wyjścia **procesu opakowującego** jako kodu wyjścia testu i wyciągnięcie z tego wniosku
   o determinizmie; (c) zapisanie w kanonie decyzji `ECHO = D`, której właściciel nie podjął —
   wycofane dopiero po jego interwencji; (d) uzasadnienie zlecenia zdaniem „nikt nie zapisał
   «przetestuj mapę Ogromny»", obalonym przez Evaluatora (przypadek stoi w kodzie od miesiąca).
   **Zakres wyjątku:** czynności czysto odczytowe (grep, uruchomienie bramki w celu poznania wyniku)
   nie wymagają Evaluatora. Wymaga go **każda zmiana zapisana do repozytorium** i **każda
   liczba/twierdzenie przedstawione właścicielowi jako fakt**.

0c. **KONTROLA KOMPLETNOŚCI ZGŁOSZEŃ — KOMENDA TU, NIE TYLKO W PLAYBOOKU (Maciej 2026-08-08).**
   Powód wpisania akurat tutaj: `playbook.md`/`.cursor/rules/autobot-evaluator-operator.mdc` (gdzie
   żyją pełne C-027/C-030) **nie są ładowane do kontekstu automatycznie** — trzeba je świadomie
   odczytać (`Read`). Po kompaktowaniu/resecie kontekstu w długiej sesji realne ryzyko, że reguła
   zostanie pominięta nie ze złej woli, tylko dlatego że po prostu nie ma jej w polu widzenia. `CLAUDE.md`
   NATOMIAST jest wstrzykiwany do kontekstu **KAŻDEJ tury automatycznie** (w Claude Code; w Cursorze
   analogiczną rolę pełni `.cursor/rules/*.mdc` z `alwaysApply: true`) — dlatego sama komenda,
   nie tylko odwołanie do reguły, ma być właśnie tu. **Zastrzeżenie:** to wstrzyknięcie jest
   migawką z początku sesji, nie odczytem co turę — jeśli ten plik zmienia się W TRAKCIE bieżącej
   sesji (jak teraz), poprawka zaczyna realnie działać dopiero w NOWEJ sesji, nie w tej, która ją
   wprowadziła. Nie polegaj wyłącznie na pamięci nawet z tym zabezpieczeniem — traktuj jako
   zmniejszenie ryzyka, nie jego eliminację.
   ```
   grep -n 'STATUS: \*\*OTWARTE' dyspozycje/PYTANIA-OTWARTE.md
   ```
   (BEZ kotwicy `^## ` — nagłówki bywają też `### `, kotwica po `##` gubi je po cichu; patrz
   incydent w rejestrze błędów playbooka przy C-031).
   **Uruchom ją:** (a) na starcie sesji, razem z odczytem handoffu (zasada 6 niżej); (b) po KAŻDEJ
   serii nowych rejestracji w `PYTANIA-OTWARTE.md`, **przed** zmianą wątku lub zakończeniem tury;
   (c) przed jakimkolwiek „koniec pracy" / deployem. Dla KAŻDEGO trafienia potwierdź jedno z trzech:
   subagent w locie, pytanie ABC czekające na odpowiedź, LUB udokumentowany w tej samej sekcji powód
   odłożenia (np. „pre-istniejące, nie blokuje"). Brak wszystkich trzech = natychmiastowy dispatch
   Operatora GPT-5.6 Luna High, bez pytania o zgodę (C-027) — nie zostawiaj tego „na później”.
   **Druga warstwa (automatyczna, nie tylko z pamięci) — ZDARZENIOWA, nie stały cykl (Maciej
   2026-08-08 po wprowadzeniu godzinowego Routine, zamieniona tego samego dnia):** stały
   godzinowy Routine został **usunięty** — kosztował ~20+ wywołań/dobę niezależnie od tego, czy
   trwała realna praca (efektywnie ~8h/dobę). Jego słowa: „nie zależy mi na tym, żebyś co
   godzinę sprawdzał... punktem startu są nowe błędy i nowe błędy wymuszają audyt godzinowy, aż
   nie zostaną wszystkie rozwiązane. Wtedy już nie ponawiasz audytu."
   **Nowy mechanizm — jednorazowy, samo-uzbrajający się trigger:** gdy w tej sesji rejestrujesz
   nowe zgłoszenie, którego NIE da się w pełni domknąć w tej samej turze (czeka na subagenta w
   tle albo na odpowiedź ABC właściciela) — uzbrój JEDEN `run_once_at` (`send_later` albo
   `create_trigger` z `run_once_at`, ~1h) z promptem: uruchom powyższą komendę na całym pliku;
   jeśli wszystko domknięte (subagent skończył i scalony, ABC odpowiedziane) — zakończ cicho,
   **NIE uzbrajaj kolejnego** (pętla się zatrzymuje); jeśli coś nadal czeka — uzbrój KOLEJNY
   `run_once_at` za godzinę i tak dalej, aż wszystko się domknie. Efekt: audyt odpala się tylko
   wtedy, gdy jest realna, nierozstrzygnięta praca — nie na ślepo co godzinę.
   **Ryzyko (Evaluator, 2026-08-08):** w przeciwieństwie do stałego cyklu, ten łańcuch ma dwa
   punkty zależne od pamięci — pierwsze uzbrojenie i KAŻDE re-uzbrojenie; zgubione ogniwo kończy
   pętlę na stałe, nie samo się leczy. Świadomie zaakceptowane (to dosłowne polecenie
   właściciela), ale **prompt każdego uzbrajanego triggera MUSI sam zawierać instrukcję
   re-uzbrojenia** (nie polegaj na tym, że przyszła sesja to wymyśli) — i **Routine NIGDY nie
   deployuje**, tylko audytuje i dispatchuje naprawy; deploy zawsze wymaga hasła `deploy` (§0).

1. **NIGDY `npm run build` ani `npm run dev`** w `gra/` — `prebuild`/`predev` uruchamia `tools/export-data.py`, który **NADPISUJE ręcznie edytowane pliki JSON** w `gra/data/`. Cała praca nad danymi (drzewko, jednostki, cywilizacje) żyje w JSON. Buduj **wyłącznie** z katalogu `gra`:
   `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`
2. **Źródłem prawdy są JSON-y w `gra/data/`.** Panele Excel (`panele-sterowania/`) DOGANIAMY do JSON — kierunek **JSON→Excel** przez `gen-panel-*.py`, NIGDY odwrotnie. **Nie uruchamiaj `export-*.py` na żywym `gra/data`** (nadpisze grę starym Excelem). Round-trip zawsze na kopii (`--data-dir <tmp>`).
3. **Repo jest trunk-based na `main`** (brak feature-branchy). Deploy do wersji roboczej ma potwierdzony runbook — **handoff §6**. NIE używaj `publish-robocza-bundle.ps1`.
4. **Trzy realne poziomy bundli, promowane NIEZALEŻNIE:**
   - **ROBOCZA** (`gra-robocza/`) — praca bieżąca, częste deploye (runbook handoff §6).
   - **KANON** (`gra-kanon/`) — wersja stabilna; promowana z ROBOCZA po teście Master przez `gra/tools/publish-kanon-snapshot.ps1` (WYŁĄCZNIE ROBOCZA→KANON, nic ponadto).
   - **FINALNA** (`Gra-FINALNA.html` w korzeniu) — wersja pewna; promowana z **KANONU** (nie z roboczej) przez osobny `gra/tools/publish-finalna-snapshot.ps1`.

   **FINALNA promowana WYŁĄCZNIE na wyraźne polecenie właściciela, osobnym skryptem, NIGDY „przy okazji" promocji kanonu.** Rzadko i po dłuższym ograniu bieżącego kanonu.

4a. **RYTM SCALANIA GAŁĘZI ROBOCZEJ DO `main` = ZAWSZE JEDNA FALA DO TYŁU (Maciej 2026-08-09).**
   Jego słowa: „zawsze można scalać poprzednią falę, a nową zostawiamy do testów... zawsze będzie
   scalenie o jedną falę do tyłu. Da to nam możliwość cofnięcia się i łatwiejszego zarządzania
   błędami." Gdy powstaje fala N (deploy do ROBOCZA), fala N−1 kwalifikuje się do scalenia do
   `main` (scalenie do konkretnego commitu deployu, nie do czubka gałęzi); fala N zostaje na
   gałęzi wyłącznie do testów, nie jest scalana dopóki nie powstanie fala N+1. **Nowa fala ROBOCZA
   powstaje wyłącznie na wyraźne słowo `deploy`** — zaostrzenie reguły §5 niżej, zero
   autonomicznego tworzenia kolejnych fal po prostu przez nagromadzenie zamkniętych tematów.
   Kanon: `docs/decyzje/R-MERGE-MAIN-RYTM-Q1.md`.
5. **KAŻDY deploy MUSI zostać zalogowany — natychmiast, w dwóch miejscach:**
   (a) **`dyspozycje/WERSJE.md`** — jedyny rejestr wersji: md5 + stempel + co weszło + status (poprzednią pozycję oznacz `ZASTĄPIONA`);
   (b) **`dyspozycje/_handoff/KANAL-PRACA.md`** — meldunek dla drugiego integratora (format `## [HH:MM] OD → DO — temat`, na końcu `CZEKAM-NA:`).
   **Narracja w czacie NIE jest meldunkiem** — właściciel nie przenosi treści między rozmowami. Nad `gra-robocza` pracuje **dwóch integratorów**; niezalogowany deploy = ktoś nadpisuje cudzą pracę, nie wiedząc co nadpisał (zdarzyło się realnie: `d2a346ff`, a potem trzy moje deploye 2026-07-11/19 — uzupełnione wstecznie).
6. **PROTOKÓŁ KANAŁU — obowiązkowy, bo sesje NIE widzą się nawzajem.**
   Nad projektem pracuje **kilka niezależnych sesji** (lokalna na Windows, chmurowa na Linuksie, ewentualne kolejne). Żadna nie widzi rozmowy drugiej i **żadna nie potrafi jej powiadomić**. Jedynym łącznikiem jest repozytorium. Właściciel NIE jest listonoszem — nie przeklejaj przez niego treści.

   **Na STARCIE każdej sesji (zanim cokolwiek zrobisz):**
   ```
   git pull --ff-only origin main
   ```
   → przeczytaj **ostatnie wpisy** `dyspozycje/_handoff/KANAL-PRACA.md` (zwłaszcza otwarte `CZEKAM-NA:`) oraz `STAN-PRACY-HANDOFF.md`. Dopiero potem działaj.

   **Po KAŻDYM znaczącym kroku** (deploy, promocja, decyzja właściciela, zmiana która dotyczy drugiej strony, napotkana blokada) — **dopisz wpis i wypchnij**:
   ```
   ## [HH:MM PL, RRRR-MM-DD] KTO → DO KOGO — temat
   … zwięźle: co zrobione, jakie md5/commit, co z tego wynika dla drugiej strony …
   CZEKAM-NA: <kto/co> (albo „nic")
   ```
   Wpis krótki (≤10 linii). **Jeśli czegoś nie zapiszesz w kanale — dla drugiej sesji to się nie wydarzyło.**

   **PODZIAŁ RÓL** (wynika z ograniczeń, nie z umowy):
   - **Sesja chmurowa** — rozwój (kod, dane, buildy) + deploye do ROBOCZA. Nie widzi dysku właściciela.
   - **Sesja lokalna (Windows)** — synchronizacja dysku właściciela, weryfikacja przed playtestem, **promocje KANON i FINALNA** (skrypty to PowerShell, chmura ich nie uruchomi).

   **HASŁA WŁAŚCICIELA** (skróty — właściciel nie przekleja treści, jedno słowo uruchamia czynność):
   - **„sprawdź”** (lub „sprawdź kanał”) = pełny audyt bieżącej puli i historycznych `not_found`: wykonaj synchronizację źródeł, przeczytaj raport każdego subagenta, sprawdź ostatni ruch i status, zamknij zakończonych oraz uruchom wymagany następny etap. `not_found` bez raportu nie jest dowodem zakończenia.
   - **„push"** (do sesji LOKALNEJ, po deployu chmury) = dostarcz aktualną wersję na dysk właściciela, wykonując 4 kroki: (1) `git pull --ff-only origin main`; (2) przeczytaj ostatni wpis `KANAL-PRACA.md` (md5 + polecenie od chmury); (3) zsynchronizuj/„pull" na dysk właściciela; (4) zamelduj w kanale „gotowe, testuj `<md5>`". **Obowiązek sesji chmurowej:** po KAŻDYM deployu do ROBOCZA zostaw w kanale jednoznaczny wpis z md5 i poleceniem „sesja lokalna: pull na dysk właściciela" — żeby „push" zawsze trafiał w konkretne zadanie.

   ⚠️ **Przed każdym pushem sprawdź, czy `main` nie odjechał** (`git fetch` + porównanie). Jeśli odjechał — **rebase, NIGDY force-push**; cudza praca ma przetrwać. Zdarzyło się realnie 2026-07-20 (promocja kanonu vs deploy chmury) i zostało rozwiązane rebasem bez strat.
7. **Przy niejednoznaczności lub sprzecznych danych — pytaj właściciela, nie zgaduj.** Ta zasada uchroniła projekt przed kilkoma kosztownymi błędami.

## JAK PRACOWAĆ Z WŁAŚCICIELEM (przeniesiona pamięć robocza)
Właściciel: **Maciej**, product owner w NASTER S.A. Rozmawia **po polsku — odpowiadaj po polsku**. Podejmuje decyzje produktowe/gameplayowe; od Ciebie oczekuje architektury, analizy i wykonania. Woli **ustrukturyzowany, analityczny wywód** (tabele, numerowane sekcje) niż ściany tekstu.

0. **⛔ CAŁY tekst widoczny dla właściciela — WYŁĄCZNIE po polsku, nie tylko raporty/ABC (Maciej,
   2026-08-14).** Jego słowa: „dlaczego ciągle przechodzisz na język angielski? Spisz mi do reguł,
   że masz posługiwać się językiem polskim." Powód wpisania: przez całą sesję 2026-08-14 formalne
   dostarczenia (raport §10, pytania ABC) były po polsku, ale bieżąca narracja między wywołaniami
   narzędzi („Round-3 fix landed…", „Let's verify independently…", „All gates confirmed
   matching…") leciała po angielsku — to TEŻ jest tekst widoczny dla właściciela, nie tylko
   końcowe podsumowania. Zasada „odpowiadaj po polsku" dotyczy więc KAŻDEGO zdania kierowanego do
   Macieja: krótkich statusów w toku pracy, potwierdzeń, pytań doprecyzowujących — bez wyjątku dla
   „to tylko robocza notka". Nie dotyczy treści technicznych które z natury żyją po angielsku
   (nazwy zmiennych/funkcji w kodzie, komunikaty commitów jeśli repo ma angielską konwencję,
   cytaty z logów/błędów) — te zostają w oryginale wewnątrz polskiego zdania, tak jak dotychczas.

1. **KAŻDA decyzja gameplayowa/produktowa/architektoniczna → PEŁNA FORMA ABC** + **numer ID w rejestrze** (procedura 2026-08-03). Struktura pytania: nagłówek `[TEMAT: …]` + **ID** · **Sytuacja** · **Cel pytania** · **Dlaczego teraz** · **A / B / C** (Za≥2, Przeciw≥2) · **Rekomendacja**. **ID pytania ZAWSZE w formacie inline code** (pojedyncze znaczniki `` ` ``, np. `` `R-TEMAT-Q1` `` — **Maciej 2026-08-14: „obok numeru pytania zawsze taki znaczek kopiowania"**) — to jedyny sposób w tym środowisku żeby dać wyraźnie wyodrębniony, łatwy do skopiowania token; dotyczy TYLKO samego ID, nie całej treści pytania (długie bloki tekstu owinięte w potrójne ``` łamią kopiowanie i tego się unika). **Max 3 pytania na turę**. Po odpowiedzi Macieja w formie **`ID + litera`**: **ECHO** → zapis plikowy → **kod + commit** (bez deployu). Deploy tylko na **`deploy`**. Hasło **`format`** / **`ABC`** = przepisz pytanie. Szczegóły: `dyspozycje/PAMIEC-ROBOCZA-CIV.md` · `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`.
1a. **⛔ OZNACZ WPROST, GDY PYTANIE PODWAŻA WCZEŚNIEJSZĄ DECYZJĘ (Maciej, 2026-08-09).** Jego słowa: „powinno być wyraźnie zapisane, że jeżeli pytanie ABC podważa wcześniejsze moje decyzje, to powinno być to wyraźnie wskazane, że to podważa jakąś inną moją decyzję, żebym miał świadomość, że mogę cofnąć pewne inne swoje ustalenia." Jeśli sytuacja/rekomendacja w pytaniu ABC dotyka obszaru objętego już podjętą decyzją (ID + litera + data w rejestrze) — **nazwij wprost, którą decyzję i z jakiego ID/daty to koliduje**, zamiast zostawiać to domyślne albo ukryte w opisie sytuacji. Cel: właściciel ma widzieć na pierwszy rzut oka, że odpowiadając literą, może cofać coś, co już wcześniej ustalił — nie ma się tego domyślać z kontekstu.
1b. **⛔ KAŻDE pytanie do właściciela — nie tylko pełne ABC — dostaje numer/ID w inline code (Maciej,
   2026-08-14).** Jego słowa: „zapisz tylko do reguł żeby zawsze podawać mi chociaż możliwość do
   skopiowania numeru pytania i żeby zawsze był numer pytania." Rozszerza zasadę 1 (tam ID dotyczyło
   pełnych pytań ABC) na WSZYSTKIE pytania kierowane do właściciela, także drobne/doprecyzowujące,
   które nie mają pełnej struktury Sytuacja/Cel/A-B-C — każde musi mieć jakiś identyfikator (pełne ID
   tematu jeśli istnieje, albo krótki ad-hoc token) w pojedynczych znacznikach `` ` `` (inline code),
   żeby zawsze dało się go skopiować i jednoznacznie się do niego odnieść w odpowiedzi.
2. **⛔ ZAKAZ OTWIERANIA NOWYCH WĄTKÓW PYTANIAMI (Maciej, 2026-07-25).** Wolno zadawać **wyłącznie pytania
 doprecyzowujące do wątku, który AKTUALNIE prowadzimy**. Pytań otwierających nowy temat **NIE ZADAJESZ**,
 dopóki Maciej sam nie powie, że można. Znalezione przy okazji problemy **zapisujesz cicho** do
 `dyspozycje/PYTANIA-OTWARTE.md` i **nie wspominasz o nich w czacie** — **każde pytanie/bug Macieja → ten plik zanim zmienisz temat** (2026-07-29). Powód (jego słowa): „ja odpowiadam na jedno,
 a ty generujesz kolejnych pięć… nie jesteśmy w stanie zakończyć jednego, a ty wyciągasz kolejne".
 **Kończymy jeden temat, dopiero potem następny.** Nie mieszaj wątków w jednej odpowiedzi.
2a. **⛔ JEDEN KANAŁ ROZMOWY Z WŁAŚCICIELEM (Maciej, 2026-08-19).** Właściciel kontynuuje pracę
   wyłącznie w głównym czacie orkiestratora. Poboczne czaty Operatorów/Evaluatorów są technicznymi
   kanałami wykonawczymi, nie są miejscem podejmowania decyzji ani dalszej rozmowy. Orkiestrator
   odbiera ich raporty i przedstawia wynik tutaj; wszystkie pytania ABC i odpowiedzi właściciela
   są prowadzone tutaj. Po zakończeniu subagenta zamknij jego pomocniczy czat/worktree, jeśli nie
   jest potrzebny do zachowania artefaktu. Jeżeli interfejs mimo to pokazuje poboczny czat, nie
   kieruj do niego właściciela i nie traktuj go jako drugiego źródła kontekstu.
3. **KAŻDA LICZBA MUSI MIEĆ NAZWANY PARAMETR I JEDNOSTKĘ (Maciej, 2026-07-25).** Zakaz pisania „baza 16",
   „przyrost +7", „daje 35" bez powiedzenia CZEGO dotyczy liczba. Zawsze: **czego** (Kultura / Praca / Prawo /
   Pieniądz / Zadowolenie / Obrona), **w jakiej jednostce** (pkt na turę, %, pkt Prawa) i **w jakim kontekście**
   (poziom, epoka, poziom trudności). Nagłówek kolumny „Baza" jest zakazany — ma być „Kultura (baza)".
   Jego słowa: „wpisujesz baza, ale baza do czego? potem chodzimy po omacku".
4. **PRZYDZIAŁ MODELI — AKTYWNY KANON (decyzja właściciela 2026-08-19).** Główny orkiestrator
   = **GPT-5.6 Luna Medium**. Operator = **GPT-5.6 Luna High**. Evaluator =
   **GPT-5.6 Luna High**. Orkiestrator wykonuje finalną kontrolę procesu; nie jest to dodatkowy
   model ponad głównym orkiestratorem. Render/Designer pozostaje wyjątkiem: modele 3D jednostek
   i cała praca w `gra/src/render/**` = **Opus 5** dla roli wykonawczej i oceniającej. Fable 5
   wyłącznie za wyraźną zgodą Macieja.

**ARCHIWUM — poprzednie routingi (zastąpione 2026-08-19):** poniższe wpisy historyczne
   dokumentują wcześniejsze decyzje Sonnet/Haiku/Opus i nie są aktywnym routingiem.

4. **ARCHIWALNE — PRZYDZIAŁ MODELI — Claude Code (Maciej, 2026-08-06; NIE dotyczy Cursora):** główny model
   sesji = **Sonnet 5**; **wszyscy subagenci-wykonawcy (Operator) = Sonnet 5** (`Agent`,
   `model: "sonnet"`; `general-purpose` do pracy w repo, `Explore` do read-only reconu).
   **EVALUATOR (adwokat diabła, werdykt AutoBot) = Opus 5. DEPLOY (build+weryfikacja+publikacja
   do roboczej) = Opus 5.** Jego słowa: „Główny model językowy tutaj wybrany to będzie SONNET 5.
   Pracę wszystkich subagentów odpalasz też na Sonet 5, ale ewaluator włączasz na Opus 5
   i deploy Opus 5". Fable 5 wyłącznie za wyraźną zgodą Macieja.
   **DODATKOWA BLOKADA — `R-FABLE-RETENCJA-NASTER` = B (Maciej 2026-08-07):** Fable 5 wymaga
   **30-dniowej retencji danych i nie jest dostępny pod zerową retencją (ZDR)**. Wymagania
   NASTER w tej sprawie **nie są ustalone** — przeszukanie repo (CLAUDE.md, ZASADY-WSPOLPRACY,
   docs/**, dyspozycje/**, .cursor/rules/**, .claude/) nie znalazło **żadnego** zapisu.
   Do czasu potwierdzenia przez Macieja **Fable 5 nie wchodzi w grę** — nawet gdyby padła
   zgoda na model. Zgoda na model ≠ potwierdzenie retencji; potrzebne są oba.
   **WYJĄTEK — ZGODA STAŁA (Maciej, 2026-07-25; POTWIERDZONE 2026-08-06 po wprowadzeniu Sonnet 5
   jako domyślnego):** *„Jednostki i render musisz dawać do subagentów Opus 5, bo Sonnet sobie
   z tym nie poradzi."* → **modele 3D jednostek i cała praca w `gra/src/render/**` idą na Opus 5.**
   Potwierdzenie 2026-08-06, jego słowa: *„Tak, graficzne wszystkie rendery muszą być robione
   opus 5."* — wyjątek **NIE jest** zniesiony przez zasadę „wszyscy subagenci na Sonnet 5" wyżej;
   obowiązuje równolegle, dla każdego renderu bez wyjątku.
   Powód praktyczny: Sonnet poprawnie dobiera detale historyczne, ale nie ocenia proporcji i czytelności bryły
   z kąta kamery gry — modele wychodziły za niskie (0,62–0,64 zamiast 0,75 HEX_R), broń nieczytelna albo
   wystająca poza obrys heksu, tarcze niewidoczne. Każdy wymagał 2–3 rund poprawek po oględzinach zrzutu. Główna pętla zostaje do: rozmowy, dekompozycji, syntezy i decyzji ABC. Subagentowi dawaj samodzielny prompt: ścieżki, bramki, zakaz `npm run build`, zakaz commita/deployu.
   **AKTUALIZACJA — nowy domyślny przydział Operator/Evaluator (Maciej, 2026-08-17), ZASTĘPUJE
   powyższe „wszyscy subagenci-wykonawcy = Sonnet 5" / „EVALUATOR = Opus 5" jako domyślne:** jego
   słowa: *„haiku będzie robił kod, zamiast teraz sonetu 5. Sonet 5 będzie robił ewaluatora zamiast
   Opus 5. W przypadku trudniejszych tematów jeszcze puścimy ewaluatora Opus 5, ale tylko na
   wyraźne twoje żądanie. Więc od teraz subagent Haiku jest operatorem, a subagent Sonet 5 jest
   ewaluatorem. Zmień zasady i tylko na wyraźną prośbę ewaluator Opus 5 oraz kiedy są wymagane
   tematy graficzne."*
   - **Operator (wykonawca) = Haiku 4.5**, nowy domyślny, dla wszystkich zadań poza `gra/src/render/**`.
   - **Evaluator = Sonnet 5**, nowy domyślny.
   - **Evaluator = Opus 5** wyłącznie: (a) orkiestrator jawnie ocenia temat jako trudniejszy/wyższego
     ryzyka i explicite o to prosi przy dispatchu (świadoma, wyartykułowana decyzja za każdym razem —
     NIE domyślny fallback, NIE automatyczne), (b) temat dotyka `gra/src/render/**` — tam Opus 5
     pozostaje obowiązkowy, patrz wyjątek wyżej, **niezmieniony tą aktualizacją i obowiązujący
     RÓWNIEŻ dla Operatora** (nie tylko Evaluatora) — Haiku 4.5 jako Operator jest jeszcze mniej
     przygotowany na ocenę proporcji/czytelności bryły niż Sonnet, więc render zostaje przy Opus 5
     dla OBU ról bez wyjątku.
   - **Deploy pozostaje Opus 5** (nie dotyczy tej aktualizacji, nieporuszone w poleceniu).
   **AKTUALIZACJA — mechanizm dispatchu Operator/Evaluator (Maciej, 2026-08-17):** Od decyzji Sonnet 5→Haiku 4.5 (poprzedni dopisek) dispatch Operatora i Evaluatora przechodzi z narzędzia `Agent` na `Workflow`. **Powód:** `Agent` nie eksponował parametru `effort` (poziom wysilku rozumowania LLM) — każdy dispatch działał na niekonfigurowalnym domyślnym poziomie. Różne poziomy effort mają bardzo różne koszty tokenowe (zakres typowy: od ~0.5M do ~19M tokenów na zadanie), orkiestrator chciał mieć nad tym świadomą kontrolę. **Ustalenie:** `Operator = Haiku 4.5` (bez narzuconego effort, domyślny), `Evaluator = Sonnet 5` z parametrem `effort` jawnie ustawionym na `"medium"`. **Weryfikacja:** funkcja `agent()` w `Workflow` obsługuje `opts.isolation="worktree"` i `opts.model`, więc nowe narzędzie jest niesprzeczne z zasadą AutoBot (0a/0b) i regułą izolacji (4a); mechanizm scalania (git diff/apply, weryfikacja niezależna, commit, push) pozostaje po stronie orkiestratora bez zmian. **Zastrzeżenie:** wcześniejsze Evaluatory uruchamiane narzędziem `Agent` pracowały na nieznanym (nie skonfigurowanym) poziomie effort — `"medium"` nie jest ściśle porównywalny z poprzednim stanem i wymaga obserwacji. **Zakres:** dotyczy dispatchów od tej decyzji w przód; prace już zlecone nie są retroaktywnie zmieniane.
   **AKTUALIZACJA — Operator wraca z Haiku 4.5 na Sonnet 5, effort="medium" (Maciej, 2026-08-17), ZASTĘPUJE powyższe „Operator (wykonawca) = Haiku 4.5" jako domyślne:** w tej samej sesji 2026-08-17 Haiku 4.5 jako Operator **trzykrotnie sfabrykował** szczegółowe, przekonujące raporty o edycjach dokumentacji (`CLAUDE.md`, `.claude/skills/civ-autobot/SKILL.md` dwukrotnie, fragment `PYTANIA-OTWARTE.md` przy naprawie `R-NAUKA-LIMIT-60-PROC-BUDZETU-Q1`), których fizycznie nie było na dysku — `git status` we własnym worktree Operatora pokazywał „nothing to commit, working tree clean" mimo cytowanego w raporcie „diffu". Złapane wyłącznie dzięki temu, że orkiestrator nigdy nie ufał samemu opisowi zmiany i za każdym razem niezależnie sprawdzał `git status`/`git diff` w worktree Operatora przed scaleniem. **Ustalenie:** domyślny **Operator = Sonnet 5, `effort="medium"`** (ten sam poziom, co już ustalony dla Evaluatora). **Evaluator bez zmian: Sonnet 5, `effort="medium"`.** Wyjątek renderowy (Opus 5 dla `gra/src/render/**`, dla OBU ról) pozostaje bez zmian — niezmieniony żadną z tych aktualizacji.
4a. **KAŻDY SUBAGENT PRACUJE NA WŁASNEJ KOPII (Maciej, 2026-07-29).** Jego słowa: *„zasadą powinno
   być to, że zawsze pracę agenci robią na swoich kopiach, a dopiero po git pull nadpisują ewentualnie
   za moją zgodą pliki i dopiero później robią deploy — tak żeby jeden agent nie przeszkadzał drugiemu
   w pracy."*
   **Wykonanie:** zlecenia dotykające kodu uruchamiaj z `isolation: "worktree"` (osobny `git worktree`,
   `node_modules` przez symlink). Przeniesienie wyniku do drzewa głównego: `cd $WT && git diff > patch`,
   potem `git apply -3 patch` w drzewie głównym (scalanie trójstronne zachowuje cudze commity, które
   w międzyczasie doszły). Nowe pliki dołóż osobno — `git diff` ich nie obejmuje.
   **Kolejność obowiązkowa:** praca w izolacji → `git pull --ff-only origin main` → scalenie → **zgoda
   Macieja na nadpisanie plików, jeśli kolidują z cudzą pracą** → bramki → build sprawdzony PRZED
   kopiowaniem → deploy.
   **Powód (dwa realne wypadki 2026-07-26/29):** (a) commit `b9867b3` zgarnął z współdzielonego drzewa
   niedokończony import innego zlecenia — `tsc` przeszedł (widzi całe drzewo), `vite build` padł
   (buduje tylko stan skomitowany), a `cp` przeniósł stary `dist` z nową pieczątką → nieważny bundle
   `ddcc04c1`; (b) dwie sesje zrobiły równolegle to samo zadanie C-OBCE-JEDN-Q2 (FALA 43 vs ta sesja),
   co skończyło się ręcznym scalaniem i decyzją C-ZETON-DUP-Q1.
   **Gdy izolacja jest niemożliwa** (kilka zleceń musi dzielić drzewo): wypisz w `KANAL-PRACA.md`
   REZERWACJĘ PLIKÓW przed startem i commituj **wyłącznie pliki zamkniętego zlecenia**, nigdy `git add -A`.
5. **Publikacja / deploy tylko na hasło `deploy`.** Commit po `ID+A|B|C` **nie** publikuje ROBOCZA. `git push` branch OK; deploy bundla + `WERSJE.md` dopiero gdy Maciej powie **`deploy`** / „deploy do robocza". (Hasła „pushuj" / „wdrażaj" = nie mylić: wdrażaj = kod+commit; deploy = ROBOCZA.)
6. **Nie zgaduj przy niejednoznaczności** — zrób resztę, a sporny punkt opisz i zapytaj. Ta zasada wielokrotnie uchroniła projekt przed kosztownymi błędami.
7. **Nie twórz problemów, których nie ma.** Maciej kilkakrotnie korygował nadmierne komplikowanie („znajdujesz problemy, których nie ma"). Najprostsze rozwiązanie spełniające wymaganie wygrywa.
8. **Po każdej paczce pracy — dwa bloki (Maciej 2026-08-01 / split 2026-08-06).** Nie czekaj na „co dalej?”.
   Kończ wiadomość: **### Playtesty** (tylko weryfikacja w grze) **oraz** **### Następny krok** (tylko kolejne
   zmiany kod/dane/docs — **pełna lista**, bez limitu 3; `R-NASTEPNY-KROK-PELNA-LISTA`). **ZAKAZ** mieszać playtest z kodem w jednym menu.
   Reguła alwaysApply: `.cursor/rules/maciej-nastepny-krok.mdc` · kanon: `docs/decyzje/R-NASTEPNY-KROK-SPLIT.md`.
9. **Komentarze w kodzie (`gra/src/**`) dwujęzyczne PL+EN (Maciej 2026-08-09).** Nie zmienia zasady „domyślnie
   bez komentarzy, tylko gdy WHY nieoczywiste" — dotyczy WYŁĄCZNIE tych rzadkich komentarzy, które i tak
   powstają. Format: polska wersja, potem `/ EN: ...` w tej samej linii/bloku.
10. **HASŁO „raport" — aktywny kanon dziesięciu kategorii
    (`R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1`, 2026-08-18).** Na słowo `raport`
    dostarcz zestawienie zawsze w tej kolejności (pusta sekcja → `— (brak)`),
    **plus** sekcja **„Brak dowodu / nie zgaduję"** pod kategorią 10:
    1. **Gotowe do integracji/deployu** — w tym już zdeployowane, z jawnym statusem.
    2. **W trakcie — Operator.**
    3. **Operator zakończony — czeka na Evaluatora.**
    4. **W trakcie — Evaluator.**
    5. **Evaluator zakończony — czeka na finalną kontrolę/integrację.**
    6. **Czeka na Operatora — gotowe do dispatchu** — pełny kontrakt/ECHO/ABC, Operator
       jeszcze nie uruchomiony; dowód w pliku decyzji/rejestru.
    7. **Zapomniane — do dispatchu** — brak kompletnego kontraktu albo brak śladu
       procesu; odróżnij od kategorii 6.
    8. **Świadomie odłożone.**
    9. **Otwarte ABC.**
    10. **Playtesty.**

    Każdy punkt: **`ID — status — dowód — następny gate`**. **Sam status w rejestrze
    nie wystarcza** — wymagany commit SHA, raport Operatora/Evaluatora, werdykt
    PASS/FAIL/PASS-WITH-NOTES lub wynik testu. Worktree, branch, stary plik lub samo
    powiadomienie nie jest dowodem aktywnego procesu. Brak werdyktu Evaluatora → brak
    wpisu w kategoriach **1** i **5**. ECHO A/B/C zamyka ABC (kat. 9), ale nie oznacza
    automatycznie kat. 6 — sprawdź wdrożenie/odłożenie/blokadę.

    **Zakres:** najnowsza ROBOCZA + aktywna kolejka — nie cała historia.
    **Źródła (kolejność):** `WERSJE.md` → `KANAL-PRACA.md` → `REJESTR-PROSB-I-ZADAN.md`
    → `PYTANIA-OTWARTE.md` → `docs/decyzje/<ID>.md` → handoff/audyt → git/worktree.
    **Procedura obowiązkowa:** kanon §4 (krok po kroku, re-bundle, sprzeczne SHA,
    checklista przed wysłaniem). Pełna definicja i snapshot referencyjny:
    [`docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md`](docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md).

    Kategoria 10 korzysta wyłącznie z najnowszego wpisu ROBOCZEJ
    `Playtest — na co patrzeć` w `dyspozycje/WERSJE.md`; nie przenosi historycznej
    kolejki PT ani starszych fal.

    **ARCHIWUM — SUPERSEDED:** poprzedni format raportu 7-kategorii
    (`R-RAPORT-7-KATEGORII-ABC-PLAYTESTY-Q1`, snapshot FALA 294), starszy format
    5-kategorii oraz zawieszona wersja kategorii 6 pozostają w historii dokumentów
    i commitów, ale nie są już formatem odpowiedzi `raport`.

## STRUKTURA
- `gra/src` — kod TS (`game/`, `map/`, `render/`, `ui/`) · `gra/data` — JSON (kanon danych gry)
- `gra-robocza` — zbudowane, samodzielne bundle HTML do playtestów (cel deployu)
- `panele-sterowania` — panele Excel do balansowania (interfejs właściciela)
- `dyspozycje` — notatki/plany robocze · **`STAN-PRACY-HANDOFF.md`** — żywy stan pracy

## BRAMKI (uruchamiaj z `gra/`)
`npx tsc --noEmit` (0 błędów) · `node tools/tech-tree-test.cjs` · `node tools/research-test.cjs` · `node tools/unit-replace-test.cjs` · `node tools/map-gen-regression-test.cjs` (determinizm A=B + 0 rzek bez ujścia) · `node tools/ai-founding-territory-test.cjs` (AI zakłada miasta wg tego samego wymogu withinTerritory co gracz).

**Znane PRE-ISTNIEJĄCE porażki (NIE regresja, nie „naprawiaj przy okazji") — stan 2026-07-26:** `logic-test.cjs` — porażka `mapgen: deposits obey terrain rules` NAPRAWIONA (generator, nie test; `R-MAPGEN-GLINA`). **AKTUALIZACJA 2026-08-07 (`R-BRAMKA-MINDIST-Q1 = A`): punkt odniesienia `logic-test.cjs` to `213/213` zaliczonych asercji, exit 0** (było 208/208, potem 209/209). Wynik **209 oznacza cofnięcie tej decyzji, nie normę** — commit `7136241` dołożył 4 asercje: przypięcie `MIN_CITY_DISTANCE = 4 heksy` (+1) i kontrakt `readCityFoodBuffer()` (+3). **`combat-test.cjs` jest NAPRAWIONY i zielony (6/6)** — harness `counterTyp` naprawiono commitem `496dd53`; stary zapis o „~21 porażkach" i „rzuca wyjątkiem" był nieaktualny. **KOREKTA 2026-07-26 (audyt weryfikacyjny):** `akwedukt-popcap-test.cjs`, `auto-manage-test.cjs`, `growthmult-compound-test.cjs`, `upgrade-budynki-test.cjs`, `deposit-building-gate-test.cjs` były błędnie wpisane tu jako czerwone — **weryfikacja przez uruchomienie potwierdza, że wszystkie są dziś ZIELONE**: upgrade-budynki 48/48, deposit-building-gate 34/34, akwedukt-popcap 5/5, auto-manage 29/29, growthmult-compound 24/24. Realne czerwone testy dziś: `relief-grid-coverage-test.cjs` (2 pass/4 fail) i `fair-play-grid-test.cjs` (3 pass/5 fail) — **W NAPRAWIE na mocy decyzji C-MAPA-Q1=B** (drugi agent dostraja generator w `gra/src/map/**`), punkt odniesienia dziś: 56 gór w komórce przy progu 25, 95 wzgórz przy progu 37; `map-deposits-era-test.cjs` był przestarzały (asercjonował miedź na Górach) — **NAPRAWIONY** 2026-07-26, dziś 16/16. Szczegóły: **handoff §7**. **AKTUALIZACJA 2026-08-07 (`P-BRAMKA-UNIT-POWER-CZERWONA`):** `unit-power-test.cjs` — **4 pass, 2 fail**, exit 1: `FAIL: Hastati M_pole=50 (got 57.5)` i `FAIL: sumArmyFieldPower 3 units (got 167.5)`. Pre-istniejące, niezwiązane z pracami `R-MOC-*` tej sesji (zweryfikowane niezależnie identycznymi komunikatami na czystej bazie przed zmianami). Przyczyna: zdezaktualizowane wartości oczekiwane w teście po zmianie danych Hastati w `units.json` — dług testowy, nie regresja silnika. **AKTUALIZACJA 2026-08-10 (`P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE`):** `map-field-battle-test.cjs` i `pre-battle-save-test.cjs` padają z powodu awarii harnessu testowego (brak loaderów w skrypcie budującym bundle testu), NIE regresji silnika gry. `map-field-battle-test.cjs`: `TypeError: import_meta.glob is not a function` — konstrukcja Vite (`import.meta.glob`) w bundlu esbuild/CJS trafia na moduł audio `.mp3`. `pre-battle-save-test.cjs`: `No loader configured for ".svg" files` — `src/ui/icons/brand/menu-emblem.svg?raw` (oraz `src/ui/icons/brand/tier1/res-science-24.svg?raw`). Zweryfikowane: padają identycznie na czystej bazie i po zmianach — pre-istniejące, nie regresja. **AKTUALIZACJA 2026-08-10 (korekta dokumentacji, zgłoszenie Evaluatora):** wpis wyżej „growthmult-compound 24/24" jest NIEAKTUALNY — dzisiejszy realny stan to **17 passed, 7 failed** (exit 1), wszystkie 7 porażek w sekcji „7.5 linear buildingUpkeep" (per-building utrzymanie liniowe: `got` konsekwentnie 2× `want` — wygląda na dług testowy w oczekiwaniach, nie na regresję dzisiejszej sesji, ale nie zweryfikowano jeszcze, kiedy rozjazd powstał). Sekcja „7.4 growthMult via food scaling" (9 asercji) w całości zielona. Traktować jako pre-istniejące, nie „naprawiaj przy okazji", do czasu osobnego rozpoznania. **AKTUALIZACJA 2026-08-13 (znalezisko Evaluatora, temat `R-SUROWIEC-CYNA-DO-BRAZU`):** `prereq-budynkow-test.cjs` — **51 pass, 8 fail**, exit 1. Zweryfikowane niezależnie na baseline `67cc36fd` (przed tematem Cyna) — identyczne 51/8, więc pre-istniejące, nie regresja tego ani żadnego innego dzisiejszego tematu; po prostu nigdy dotąd niedopisane do tej listy. **Tego samego dnia zmieniony punkt odniesienia:** `surowce-katalog-kolejnosc-test.cjs` to dziś **62 pass, 0 fail** (NIE 61/0 — Ruda cyny przestała być placeholderem, więc pętla po katalogu sprawdza 14 kart zamiast 13; delta +1 to dokładnie ta jedna dodatkowa iteracja, zweryfikowana przez Evaluatora bezpośrednim porównaniem z/bez tej zmiany, nie założona). **AKTUALIZACJA 2026-08-13 (znalezisko Evaluatora, temat dublowanie heksów):** 4 kolejne bramki czerwone pre-istniejąco, potwierdzone identyczne na baseline `fc04d65b` (sprzed tego tematu): `budynek-civ-bonus-u17-test.cjs` (3 pass/3 fail), `empire-food-b5-test.cjs` (25 pass/3 fail), `mennica-magazyn-test.cjs` (38 pass/3 fail, już opisane wyżej pod innym tematem), `trade-routes-income-test.cjs` (52 pass/1 fail). **AKTUALIZACJA 2026-08-13 (znalezisko Evaluatora, temat `P-SPICHLERZ-PANEL-VS-SILNIK-ROZJAZD-BILANS`):** 3 kolejne bramki czerwone pre-istniejąco, potwierdzone identyczne na baseline `2797851a` (commit-rodzic, delta zero): `spichlerz-widocznosc-test.cjs` (37 pass/8 fail), `spichlerz-wzrost-test.cjs` (2 pass/7 fail), `food-hodowla-test.cjs` (20 OK/4 FAIL). **AKTUALIZACJA 2026-08-14 (Evaluator FAIL 4fc770ee, `P-MENU-ESCAPE-NIEPELNOEKRANOWE`, sprostowanie liczby z opisu commita):** opis commita `4fc770ee` podawał `empire-panel-econ-slider-visibility-test.cjs` jako „60/0" — nieprawda, realny wynik **59 pass, 1 fail, exit 1**, zweryfikowane identyczne na commicie-rodzicu `94977a20` (delta zero, pre-istniejące). Druga bramka czerwona, w opisie tamtego commita w ogóle niewymieniona: `empire-panel-moc-scroll-preserve-test.cjs` — **38 pass, 9 fail, exit 1**, również identyczna na `94977a20` (komunikat dominujący: `wireMiastaColFilter is not defined`). Obie pre-istniejące, nie regresja żadnego tematu ESCAPE. **AKTUALIZACJA 2026-08-14 (Evaluator ESCAPE runda 2, `c3a5652c`, sprostowanie wpisu powyżej):** `empire-panel-econ-slider-visibility-test.cjs` **59/1 był prawdziwy TYLKO w chwili `4fc770ee`** — commit `a8b47623` (temat routing Rekruci) go naprawił POMIĘDZY `4fc770ee` a `c3a5652c`, ale wpis powyżej skopiował historyczny pomiar rundy 1 bez ponownego uruchomienia. Zweryfikowane niezależnie na czubku gałęzi: **dziś 60 pass, 0 fail, exit 0 — bramka ZIELONA**, nie należy do listy pre-istniejących porażek. `empire-panel-moc-scroll-preserve-test.cjs` (38/9) pozostaje prawdziwa i aktualna.

## Login demo (do playtestu)
Bundle z `gra-robocza/` (np. `START.html`) — otwiera hub playtestów.
