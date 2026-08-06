# CLAUDE.md — Civ „The Game"

Gra strategiczna 4X (heksy, cywilizacje, epoki Kamień → Brąz → Żelazo). Kod w `gra/`.

## ZACZNIJ TUTAJ
**Przeczytaj najpierw [`STAN-PRACY-HANDOFF.md`](STAN-PRACY-HANDOFF.md)** (korzeń repo) — to punkt wejścia KAŻDEJ sesji: co zrobione, co w toku, co zostało do zrobienia, podjęte decyzje (żeby nie pytać drugi raz) i zasady bezpieczeństwa. Ten plik (`CLAUDE.md`) to tylko skrót zasad krytycznych; **pełny, aktualny stan jest w handoffie** — i to handoff się aktualizuje po każdej większej zmianie.

To jest projekt **Civ**, **NIE Planify**. Jeśli widzisz odniesienia do „Fazy A", `organizationId`, planu E0–E8, hubu pracy NASTER — to Planify (inny projekt), zignoruj przy pracy nad Civ.

## ⛔ ZASADY KRYTYCZNE (złamanie = utrata pracy)
0. **NUMER → ABC → COMMIT → DEPLOY (Maciej 2026-08-03).** Każdy case/bug/poprawka/innowacja → ID w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`. **Nie koduj od razu** — przedstaw rozwiązanie ± ABC. Commit dopiero po **`numer + A|B|C`**. **Deploy tylko na hasło `deploy`**. Kanon: `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`.
0a. **AUTOBOT — TWARDA REGUŁA (Maciej 2026-08-05).** **KAŻDA praca** wyłącznie w systemie AutoBot: Operator (`composer-2.5`) → Evaluator (adwokat + twarde metryki) → Grok final. **ZAKAZ** pracy poza pętlą / „gotowe” bez Evaluatora. Playbook + guardrails. Kanon: `dyspozycje/autobot/` · `.cursor/rules/autobot-evaluator-operator.mdc` · `docs/decyzje/R-PROC-AUTOBOT.md`.
1. **NIGDY `npm run build` ani `npm run dev`** w `gra/` — `prebuild`/`predev` uruchamia `tools/export-data.py`, który **NADPISUJE ręcznie edytowane pliki JSON** w `gra/data/`. Cała praca nad danymi (drzewko, jednostki, cywilizacje) żyje w JSON. Buduj **wyłącznie** z katalogu `gra`:
   `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`
2. **Źródłem prawdy są JSON-y w `gra/data/`.** Panele Excel (`panele-sterowania/`) DOGANIAMY do JSON — kierunek **JSON→Excel** przez `gen-panel-*.py`, NIGDY odwrotnie. **Nie uruchamiaj `export-*.py` na żywym `gra/data`** (nadpisze grę starym Excelem). Round-trip zawsze na kopii (`--data-dir <tmp>`).
3. **Repo jest trunk-based na `main`** (brak feature-branchy). Deploy do wersji roboczej ma potwierdzony runbook — **handoff §6**. NIE używaj `publish-robocza-bundle.ps1`.
4. **Trzy realne poziomy bundli, promowane NIEZALEŻNIE:**
   - **ROBOCZA** (`gra-robocza/`) — praca bieżąca, częste deploye (runbook handoff §6).
   - **KANON** (`gra-kanon/`) — wersja stabilna; promowana z ROBOCZA po teście Master przez `gra/tools/publish-kanon-snapshot.ps1` (WYŁĄCZNIE ROBOCZA→KANON, nic ponadto).
   - **FINALNA** (`Gra-FINALNA.html` w korzeniu) — wersja pewna; promowana z **KANONU** (nie z roboczej) przez osobny `gra/tools/publish-finalna-snapshot.ps1`.

   **FINALNA promowana WYŁĄCZNIE na wyraźne polecenie właściciela, osobnym skryptem, NIGDY „przy okazji" promocji kanonu.** Rzadko i po dłuższym ograniu bieżącego kanonu.
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
   - **„sprawdź"** (lub „sprawdź kanał") = wykonaj `git pull --ff-only origin main`, przeczytaj **nowe wpisy** `KANAL-PRACA.md` + `STAN-PRACY-HANDOFF.md` (może czekać cenny przekaz od drugiej sesji), zrelacjonuj stan i zaproponuj następny krok. **Bez działania na dysku** — samo odczytanie.
   - **„push"** (do sesji LOKALNEJ, po deployu chmury) = dostarcz aktualną wersję na dysk właściciela, wykonując 4 kroki: (1) `git pull --ff-only origin main`; (2) przeczytaj ostatni wpis `KANAL-PRACA.md` (md5 + polecenie od chmury); (3) zsynchronizuj/„pull" na dysk właściciela; (4) zamelduj w kanale „gotowe, testuj `<md5>`". **Obowiązek sesji chmurowej:** po KAŻDYM deployu do ROBOCZA zostaw w kanale jednoznaczny wpis z md5 i poleceniem „sesja lokalna: pull na dysk właściciela" — żeby „push" zawsze trafiał w konkretne zadanie.

   ⚠️ **Przed każdym pushem sprawdź, czy `main` nie odjechał** (`git fetch` + porównanie). Jeśli odjechał — **rebase, NIGDY force-push**; cudza praca ma przetrwać. Zdarzyło się realnie 2026-07-20 (promocja kanonu vs deploy chmury) i zostało rozwiązane rebasem bez strat.
7. **Przy niejednoznaczności lub sprzecznych danych — pytaj właściciela, nie zgaduj.** Ta zasada uchroniła projekt przed kilkoma kosztownymi błędami.

## JAK PRACOWAĆ Z WŁAŚCICIELEM (przeniesiona pamięć robocza)
Właściciel: **Maciej**, product owner w NASTER S.A. Rozmawia **po polsku — odpowiadaj po polsku**. Podejmuje decyzje produktowe/gameplayowe; od Ciebie oczekuje architektury, analizy i wykonania. Woli **ustrukturyzowany, analityczny wywód** (tabele, numerowane sekcje) niż ściany tekstu.

1. **KAŻDA decyzja gameplayowa/produktowa/architektoniczna → PEŁNA FORMA ABC** + **numer ID w rejestrze** (procedura 2026-08-03). Struktura pytania: nagłówek `[TEMAT: …]` + **ID** · **Sytuacja** · **Cel pytania** · **Dlaczego teraz** · **A / B / C** (Za≥2, Przeciw≥2) · **Rekomendacja**. **Max 3 pytania na turę**. Po odpowiedzi Macieja w formie **`ID + litera`**: **ECHO** → zapis plikowy → **kod + commit** (bez deployu). Deploy tylko na **`deploy`**. Hasło **`format`** / **`ABC`** = przepisz pytanie. Szczegóły: `dyspozycje/PAMIEC-ROBOCZA-CIV.md` · `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`.
2. **⛔ ZAKAZ OTWIERANIA NOWYCH WĄTKÓW PYTANIAMI (Maciej, 2026-07-25).** Wolno zadawać **wyłącznie pytania
 doprecyzowujące do wątku, który AKTUALNIE prowadzimy**. Pytań otwierających nowy temat **NIE ZADAJESZ**,
 dopóki Maciej sam nie powie, że można. Znalezione przy okazji problemy **zapisujesz cicho** do
 `dyspozycje/PYTANIA-OTWARTE.md` i **nie wspominasz o nich w czacie** — **każde pytanie/bug Macieja → ten plik zanim zmienisz temat** (2026-07-29). Powód (jego słowa): „ja odpowiadam na jedno,
 a ty generujesz kolejnych pięć… nie jesteśmy w stanie zakończyć jednego, a ty wyciągasz kolejne".
 **Kończymy jeden temat, dopiero potem następny.** Nie mieszaj wątków w jednej odpowiedzi.
3. **KAŻDA LICZBA MUSI MIEĆ NAZWANY PARAMETR I JEDNOSTKĘ (Maciej, 2026-07-25).** Zakaz pisania „baza 16",
   „przyrost +7", „daje 35" bez powiedzenia CZEGO dotyczy liczba. Zawsze: **czego** (Kultura / Praca / Prawo /
   Pieniądz / Zadowolenie / Obrona), **w jakiej jednostce** (pkt na turę, %, pkt Prawa) i **w jakim kontekście**
   (poziom, epoka, poziom trudności). Nagłówek kolumny „Baza" jest zakazany — ma być „Kultura (baza)".
   Jego słowa: „wpisujesz baza, ale baza do czego? potem chodzimy po omacku".
4. **Deleguj wykonanie subagentom na Sonnet 5** (`Agent`, `model: "sonnet"`; `general-purpose` do pracy w repo, `Explore` do read-only reconu). **Opus 5 i Fable 5 wyłącznie za wyraźną zgodą Macieja** (2026-07-25) — domyślnie wszystko na Sonnet 5.
   **WYJĄTEK — ZGODA STAŁA (Maciej, 2026-07-25):** *„Jednostki i render musisz dawać do subagentów Opus 5, bo Sonnet sobie z tym nie poradzi."* → **modele 3D jednostek i cała praca w `gra/src/render/**` idą na Opus 5.**
   Powód praktyczny: Sonnet poprawnie dobiera detale historyczne, ale nie ocenia proporcji i czytelności bryły
   z kąta kamery gry — modele wychodziły za niskie (0,62–0,64 zamiast 0,75 HEX_R), broń nieczytelna albo
   wystająca poza obrys heksu, tarcze niewidoczne. Każdy wymagał 2–3 rund poprawek po oględzinach zrzutu. Główna pętla zostaje do: rozmowy, dekompozycji, syntezy i decyzji ABC. Subagentowi dawaj samodzielny prompt: ścieżki, bramki, zakaz `npm run build`, zakaz commita/deployu.
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
   zmiany kod/dane/docs — max 3). **ZAKAZ** mieszać playtest z kodem w jednym menu.
   Reguła alwaysApply: `.cursor/rules/maciej-nastepny-krok.mdc` · kanon: `docs/decyzje/R-NASTEPNY-KROK-SPLIT.md`.

## STRUKTURA
- `gra/src` — kod TS (`game/`, `map/`, `render/`, `ui/`) · `gra/data` — JSON (kanon danych gry)
- `gra-robocza` — zbudowane, samodzielne bundle HTML do playtestów (cel deployu)
- `panele-sterowania` — panele Excel do balansowania (interfejs właściciela)
- `dyspozycje` — notatki/plany robocze · **`STAN-PRACY-HANDOFF.md`** — żywy stan pracy

## BRAMKI (uruchamiaj z `gra/`)
`npx tsc --noEmit` (0 błędów) · `node tools/tech-tree-test.cjs` · `node tools/research-test.cjs` · `node tools/unit-replace-test.cjs` · `node tools/map-gen-regression-test.cjs` (determinizm A=B + 0 rzek bez ujścia).

**Znane PRE-ISTNIEJĄCE porażki (NIE regresja, nie „naprawiaj przy okazji") — stan 2026-07-26:** `logic-test.cjs` **208/208** — porażka `mapgen: deposits obey terrain rules` NAPRAWIONA (generator, nie test; `R-MAPGEN-GLINA`). **`combat-test.cjs` jest NAPRAWIONY i zielony (6/6)** — harness `counterTyp` naprawiono commitem `496dd53`; stary zapis o „~21 porażkach" i „rzuca wyjątkiem" był nieaktualny. **KOREKTA 2026-07-26 (audyt weryfikacyjny):** `akwedukt-popcap-test.cjs`, `auto-manage-test.cjs`, `growthmult-compound-test.cjs`, `upgrade-budynki-test.cjs`, `deposit-building-gate-test.cjs` były błędnie wpisane tu jako czerwone — **weryfikacja przez uruchomienie potwierdza, że wszystkie są dziś ZIELONE**: upgrade-budynki 48/48, deposit-building-gate 34/34, akwedukt-popcap 5/5, auto-manage 29/29, growthmult-compound 24/24. Realne czerwone testy dziś: `relief-grid-coverage-test.cjs` (2 pass/4 fail) i `fair-play-grid-test.cjs` (3 pass/5 fail) — **W NAPRAWIE na mocy decyzji C-MAPA-Q1=B** (drugi agent dostraja generator w `gra/src/map/**`), punkt odniesienia dziś: 56 gór w komórce przy progu 25, 95 wzgórz przy progu 37; `map-deposits-era-test.cjs` był przestarzały (asercjonował miedź na Górach) — **NAPRAWIONY** 2026-07-26, dziś 16/16. Szczegóły: **handoff §7**.

## Login demo (do playtestu)
Bundle z `gra-robocza/` (np. `START.html`) — otwiera hub playtestów.
