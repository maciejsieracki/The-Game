# CLAUDE.md — Civ „The Game"

**Status:** łącznik specyficzny dla Claude Code. Uniwersalny, niezależny od
narzędzia punkt startowy to [`README.md`](README.md) — przeczytaj go najpierw,
w całości. Ten plik istnieje osobno wyłącznie dlatego, że jest jedynym plikiem
w tym repo ładowanym automatycznie do kontekstu Claude Code na starcie każdej
tury — więc niesie dodatkowo jedną komendę wymagającą stałej, automatycznej
obecności (§0c niżej), nieduplikowaną nigdzie poza analogiczną regułą Cursor
(`.cursor/rules/komendy-raport.mdc`).

## Start

1. Przeczytaj [`README.md`](README.md) w całości — pełna kolejność czytania jest tam.
2. Bramki (komendy testowe i punkty odniesienia): [`R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md) §Bramki.
3. Stan tematu potwierdzaj w rejestrze, ABC/ECHO, runie i faktycznym Git; czat,
   UI, nazwa brancha ani sam status nie są dowodem.

## §0c — kontrola kompletności zgłoszeń (C-031, obowiązkowa na starcie sesji)

Po każdej serii rejestracji w `dyspozycje/PYTANIA-OTWARTE.md`, przed zmianą
wątku — uruchom:

```bash
grep -nE 'STATUS:[[:space:]]*\*{0,2}OTWARTE' dyspozycje/PYTANIA-OTWARTE.md
```

**Ta komenda zastąpiła 2026-09-05 poprzednią wersję `grep -n 'STATUS: \*\*OTWARTE'`,
która była ŚLEPA na większość pliku.** Stara forma łapała wyłącznie kanoniczne
`STATUS: **OTWARTE` (pogrubienie zaczyna się PO dwukropku) — a w pliku istnieją też,
i to w porównywalnej liczbie, formy `**STATUS: OTWARTE …**` (pogrubienie od słowa STATUS)
oraz nagłówkowa `## … · STATUS: OTWARTE`. Zmierzone na dzień zmiany: **stara komenda
31 trafień, nowa 71**. Audyt narzucony jako „twarda reguła" po cichu pomijał ponad połowę
realnie otwartych pozycji od momentu wprowadzenia. Historia: `P-AUDYT-STATUS-OTWARTE-REGEX-SLEPOTA`.

Nowa komenda **celowo nadmiarowo** łapie też linie audytowe i cytaty samej komendy —
nadmiar jest bezpieczny (sprawdzasz i odrzucasz), niedomiar gubi tematy. Nie zawężaj jej
z powrotem „dla czystości wyniku".

(Bez kotwicy `^## ` — gubi nagłówki `### `.) Dla każdego trafienia potwierdź:
subagent w locie / pytanie ABC zadane / udokumentowany powód odłożenia. Brak
któregokolwiek → zgłoszenie zgubione. Ta komenda żyje TAKŻE w
`.cursor/rules/komendy-raport.mdc` — dwa niezależne, zawsze ładowane nośniki,
bo `playbook.md` i `README.md` wymagają świadomego `Read` i po kompaktowaniu
długiej sesji potrafią zniknąć z pola widzenia. Historia incydentu: `playbook.md` → C-031.

## ⚠ ZASADA MODELI — ZRÓŻNICOWANIE RÓL (właściciel, 2026-11-12; ZMIENIONA 2026-11-27 ~10:05; NIE WYMAGA PRZYPOMINANIA; czytaj przed KAŻDYM uruchomieniem Workflow)

Limit zużycia schodzi szybko, więc role MAJĄ być zróżnicowane. **Obowiązuje wersja z 2026-11-27 (zastępuje tabelę Haiku z 2026-11-12):**

| Rola | Programowanie wokół 3D (silnik, wektory, wpięcia, DTO, mosty, audyty) | Same modele/grafika 3D (kod `rust-port/renderer`: rysowanie, siatki, shadery, animacje) |
|---|---|---|
| Operator | **SONNET 5.5** | **OPUS 5.5** |
| Obrona Operatora | **ZAWSZE TEN SAM MODEL CO OPERATOR** (Sonnet 5.5) | **ZAWSZE TEN SAM MODEL CO OPERATOR** (Opus 5.5) |
| Evaluator | SONNET 5.5 | SONNET 5.5 |
| Final Control | SONNET 5.5 | SONNET 5.5 |
| Integracja orkiestratora (merge-tree, FF, rejestry) | model sesji | model sesji |

- **Obrona nigdy na niższym modelu niż Operator** (Obrona poprawia kod; słabszy model niczego nie naprawi, a może zepsuć). Haiku nie jest używany w pętli 3D.
- **Evaluator i Final Control zawsze Sonnet** — nie wykonują pracy, tylko wskazują błędy; nie idą na Opus nawet przy grafice. Gdy Sonnet da FAIL przez zbyt płytką ocenę, kolejna runda TEGO SAMEGO ID może podnieść ten etap o stopień (powód w dispatchu).
- **Praca zawsze w dwóch częściach** (właściciel, 2026-11-27): każdy temat implementacyjny = dispatch `...-A` i `...-B`, osobne Workflow, jedna część naraz, B po integracji A (najniższy koszt). Rozpoznania tylko do odczytu i porządek są jednoczęściowe.
- Skrypty Workflow (`workflows/scripts/`): `r-rustport-generic-sonnet-wf.js` (Operator/Obrona/Evaluator/FC = Sonnet) oraz `r-rustport-generic-opus-op-wf.js` (Operator/Obrona = Opus; Evaluator/FC = Sonnet), args `{"id": "<ID>"}`. Stary `r-rustport-generic-opus-wf.js` (Opus na wszystkich etapach) i skrypty z Haiku na Operatorze/Obronie są wycofane. Przed każdym `Workflow` sprawdź, czy Obrona ma ten sam model co Operator.
- Wątpliwy temat (granica silnik/renderer) rozstrzyga orkiestrator: zmiana w `rust-port/renderer` = grafika (Opus), inne crate'y = Sonnet; powód wpisz do dispatchu.
- Nie startuj tematów „dla zapełnienia”; 3D wykonuje się po jednym temacie naraz (decyzja właściciela 2026-11-26).

## ⚠ RAPORTOWANIE BACKGROUND TASKÓW (właściciel, 2026-11-12; obowiązkowe w KAŻDYM raporcie statusu)

Nie podawaj samych numerów/ID. W każdym raporcie statusu wypisz tabelę trwających Workflow: **temat po polsku (co jest robione i po co) | etap (Operator/Evaluator/Obrona/FC, np. 2/4) | model aktualnego etapu (SONNET/OPUS) | od jak dawna**. Przy zakończeniu tematu: werdykt FC, co zostało dostarczone (jedno zdanie, co to daje w grze/porcie) i co dalej.
Workflow uruchamiaj z czytelną nazwą: `scripts/mkwf.sh <ID> "<opis po polsku>"` generuje skrypt `topic-<ID>.js` z nazwą tematu i opisem modeli (Operator=SONNET lub OPUS · Evaluator=SONNET · Obrona=jak Operator · FC=SONNET); potem `Workflow({scriptPath: <wynik>, args:{id:<ID>}})`.

## STAŁE ZASADY ORKIESTRATORA (właściciel przypomina je co sesję — czytaj PRZED każdą decyzją)

1. **Cała praca merytoryczna przez Workflow** (Operator → Evaluator → Obrona → Final Control, max 5 rund,
   FAIL wraca do TEGO SAMEGO ID). Orkiestrator tylko: pisze dispatch, uruchamia Workflow, czyta wyniki,
   integruje po Final Control, deployuje na ROBOCZĄ, robi `git push`, rejestry i sprzątanie dysku.
   NIGDY nie poprawiam kodu gry ręcznie, nie rozwiązuję konfliktów w kodzie ręcznie, nie „robię szybko sam".
2. **Modele (zmienione 2026-11-27, patrz tabela „ZASADA MODELI” wyżej):** Operator = SONNET 5.5 dla programowania
   wokół 3D, OPUS 5.5 tylko dla samych modeli/grafiki 3D; **Obrona zawsze tym samym modelem co Operator**;
   Evaluator i Final Control = SONNET. Haiku nie w pętli 3D. `opModel` w args Workflow ustawiaj ŚWIADOMIE.
3. **Decyzje produktowe i liczbowe progi → pytanie ABC do właściciela** (AskUserQuestion, po polsku, opcje
   z rekomendacją). Nie wybieram progów/balansu sam. Błędy webowe wykryte w testach naprawiam jako osobny
   temat R-WEB-* bez pytania (stała zgoda z 2026-11-01).
4. **Deploy wyłącznie na ROBOCZĄ** (nigdy KANON/FINALNA), po Final Control: merge FC do main, build poza repo,
   `finalize.sh`, push, odczyt GitHub Raw + MD5, wpis w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` i `WERSJE.md`.
   Log buildu `/tmp/vbuild.log` sprawdzaj pod kątem BIEŻĄCEGO merge'a (stary log daje fałszywe BUILD_DONE).
5a. **Po KAŻDYM wykonanym kroku: `git push` i sprzątanie** (właściciel, 2026-11-08, wiążące): po zakończeniu tematu/integracji/deployu
   najpierw `refs/keep/<ID>-fc` + gałąź `*-wip/*`, `git push` dokumentacji, usunięcie worktree (`git worktree remove --force`),
   `node_modules`/`target`/`/tmp` tematu, sprawdzenie `df -h /` — DOPIERO POTEM start kolejnego tematu. Do 4 tematów naraz.
   Dla web wolne ≥ 4 GB przed startem (FC/Evaluator tworzą świeże worktree ~0,6–1 GB; przy 0 GB workflow pada).
   Integrując kod: sprawdź `git merge-base --is-ancestor <kod operatora> <SHA do integracji>` i `git diff --stat` (incydent 2026-11-08: merge FC z rodzicem `main` zamiast kodu operatora).
5. **Dysk jest wąskim gardłem**: sprzątaj worktree zakończonych tematów (po zapisaniu `refs/keep/<ID>-fc` i
   push gałęzi `*-wip/*`), nie startuj nowego tematu z kodem Rust przy < 8 GB wolnego, web przy < 4 GB.
6. **Dispatch zapisany i wypchnięty PRZED uruchomieniem Workflow**; kolejne rundy jako dopisek w
   `00-dispatch.md` z BAZĄ (SHA/gałąź FC). Raport końcowy: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/
   BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH.
7. **Rust: ZAWSZE co najmniej 4 operatorów równolegle** (właściciel, 2026-11-08: „wykorzystuj całe dostępne
   zasoby"), (model wg zasady 2; **dla tematów 3D obowiązuje jednak decyzja właściciela z 2026-11-26: po jednym naraz**). Gdy kolejka jest krótsza niż 4 — dopisz tematy z planu
   (`PLAN-PORT-RUST-TAURI-20261020.md` §0c, `REPIN-DELTA-5*.md`) i rozpisz dispatche; nie czekaj na zwolnienie
   „limitu 2 worktree" (to stara reguła). Dysk godzi się przez: worktree `--no-checkout` + `git sparse-checkout`
   (tylko `rust-port`, `dyspozycje`), zasoby weba przez `git show`, `CARGO_INCREMENTAL=0
   CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w worktree i jego usuwanie po
   każdej bramce, tematy dokumentacyjne (bez `cargo`) liczą się do czterech. Przy < 2 GB wolnego wstrzymaj
   NOWE starty, nie kończące się rundy.
8. **Komunikacja z właścicielem po polsku**, krótko, uczciwie: NIE_ZMIERZONO tam, gdzie nie zmierzono;
   żadnych zapewnień bez dowodu (SHA, liczby, MD5).
9. **Gameplay = parytet z wersją webową (właściciel, 2026-11-13; wiążące).** Wdrażaj 1:1 wg pina
   (`gra/src` przy `07d2fbd72`). NIE pytaj, czy coś ma być jak w webie. Pytaj WYŁĄCZNIE o świadome
   odstępstwa od webu albo o zakres, którego web nie rozstrzyga. Decyzje techniczne podejmuj sam
   i zapisuj w `dyspozycje/rust-port/REJESTR-RUST.md`.
10. **Pytania ABC do właściciela (wiążące; właściciel, 2026-11-14).** Każde pytanie ABC zawiera:
   (a) **na początku** dokładny opis przedmiotu pytania: co jest zablokowane, co konkretnie działa
   albo nie działa, z numerami plików/linii i pinu oraz co dokładnie zmieni każda odpowiedź (nie zakładaj,
   że właściciel zna kontekst); (b) **przy każdej opcji** zalety i wady; (c) **zawsze** oznaczoną
   rekomendację z uzasadnieniem (opcja z `(Recommended)` i dlaczego).
11. **Web najpierw, Rust potem (właściciel, 2026-11-15; wiążące, na stałe).** Gra jest przepisywana
   z kodu webowego na Rust, więc zasady gry są identyczne — różni się tylko kodowanie. Przed każdą
   decyzją gameplay i przed każdym dispatchem struktury danych NAJPIERW czytasz kod webowy
   (pin `07d2fbd72`, `gra/src/**`, `git show`/`git grep`), dopiero potem przygotowujesz odpowiednik
   w Rust. Pytasz właściciela (pytanie ABC wg zasady 10) WYŁĄCZNIE, gdy web nie rozstrzyga sprawy
   gameplay. Zasady, których nie ma w webie, nie wymyślasz.

## Bariery krytyczne

- Każdy temat ma pełne ID, `GOAL`, kryteria końca, allowlistę i izolowany worktree.
- Obowiązuje obieg:
  `Operator GPT-5.6 Luna High → Evaluator GPT-5.6 Luna High → Final Control GPT-5.6 Luna High → integracja orkiestratora GPT-5.6 Luna Medium → READY_FOR_DEPLOY`.
- `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS` wracają do Operatora,
  następnie do Evaluatora i Final Control, zawsze z tym samym ID. ABC pauzuje
  tylko temat wymagający decyzji właściciela.
- Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora (C-043).
  Subagenci są kanałami technicznymi.
- Operator, Evaluator i Final Control nie integrują, nie deployują i nie pushują.
  Deploy/push wymaga osobnej autoryzacji po `READY_FOR_DEPLOY`.
- Nie zmieniaj `gra/` ani `gra/`-zależnych artefaktów przy paczce dokumentacyjnej.
  Przed zapisem sprawdź allowlistę, `git status`, diff i `git diff --check`.
- Pełna lista granic, których naruszenie oznacza natychmiastowy `FAIL` niezależnie
  od jakości reszty pracy (m.in. zakaz `npm run build`/`dev` w `gra/`, zakaz
  `git add -A`, zakaz aktualizacji `WERSJE.md` przed deployem, wymóg realnej
  weryfikacji w przeglądarce dla tematów wizualnych):
  [`R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md) §9.
- Raport `PASS`, nazwa gałęzi, commit ani status w UI **nie są dowodem
  zakończenia** — dowodem jest faktyczny stan w `main` z zielonymi bramkami
  (§1b tamże).

## Minimalny kontrakt raportu

Każdy etap zapisuje w `dyspozycje/autobot/runs/<ID>/`:

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

`READY_FOR_DEPLOY` może wystawić wyłącznie orkiestrator po Final Control i faktycznej
integracji. Historyczne routingi i snapshoty są tylko w
[`docs/archiwum-procesu/`](docs/archiwum-procesu/).
