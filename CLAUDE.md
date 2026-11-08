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

## STAŁE ZASADY ORKIESTRATORA (właściciel przypomina je co sesję — czytaj PRZED każdą decyzją)

1. **Cała praca merytoryczna przez Workflow** (Operator → Evaluator → Obrona → Final Control, max 5 rund,
   FAIL wraca do TEGO SAMEGO ID). Orkiestrator tylko: pisze dispatch, uruchamia Workflow, czyta wyniki,
   integruje po Final Control, deployuje na ROBOCZĄ, robi `git push`, rejestry i sprzątanie dysku.
   NIGDY nie poprawiam kodu gry ręcznie, nie rozwiązuję konfliktów w kodzie ręcznie, nie „robię szybko sam".
2. **Model Operatora = HAIKU 5.5 domyślnie** (zwykłe tematy: poprawki, testy, dokumentacja, REPIN z gotową
   tabelą, parametry). SONNET na Operatorze tylko z pisemnym UZASADNIENIEM w dispatchu (temat obiektywnie
   trudny: synteza dużego diffu, wiele ścieżek, balans AI, kod Rust > 1 partii) albo po 2 nieudanych rundach
   Haiku. OPUS 5.5 (wszystkie etapy) wyłącznie dla tematów pamięci/GPU/grafiki Rust. Obrona = Haiku;
   Evaluator i Final Control = Sonnet. `opModel` w args Workflow ustawiaj ŚWIADOMIE — nie kopiuj
   „claude-sonnet-5-5" z poprzedniego wywołania z rozpędu.
3. **Decyzje produktowe i liczbowe progi → pytanie ABC do właściciela** (AskUserQuestion, po polsku, opcje
   z rekomendacją). Nie wybieram progów/balansu sam. Błędy webowe wykryte w testach naprawiam jako osobny
   temat R-WEB-* bez pytania (stała zgoda z 2026-11-01).
4. **Deploy wyłącznie na ROBOCZĄ** (nigdy KANON/FINALNA), po Final Control: merge FC do main, build poza repo,
   `finalize.sh`, push, odczyt GitHub Raw + MD5, wpis w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` i `WERSJE.md`.
   Log buildu `/tmp/vbuild.log` sprawdzaj pod kątem BIEŻĄCEGO merge'a (stary log daje fałszywe BUILD_DONE).
5. **Dysk jest wąskim gardłem**: sprzątaj worktree zakończonych tematów (po zapisaniu `refs/keep/<ID>-fc` i
   push gałęzi `*-wip/*`), nie startuj nowego tematu z kodem Rust przy < 8 GB wolnego, web przy < 4 GB.
6. **Dispatch zapisany i wypchnięty PRZED uruchomieniem Workflow**; kolejne rundy jako dopisek w
   `00-dispatch.md` z BAZĄ (SHA/gałąź FC). Raport końcowy: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/
   BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH.
7. **Komunikacja z właścicielem po polsku**, krótko, uczciwie: NIE_ZMIERZONO tam, gdzie nie zmierzono;
   żadnych zapewnień bez dowodu (SHA, liczby, MD5).

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
