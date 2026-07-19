# CLAUDE.md — Civ „The Game"

Gra strategiczna 4X (heksy, cywilizacje, epoki Kamień → Brąz → Żelazo). Kod w `gra/`.

## ZACZNIJ TUTAJ
**Przeczytaj najpierw [`STAN-PRACY-HANDOFF.md`](STAN-PRACY-HANDOFF.md)** (korzeń repo) — to punkt wejścia KAŻDEJ sesji: co zrobione, co w toku, co zostało do zrobienia, podjęte decyzje (żeby nie pytać drugi raz) i zasady bezpieczeństwa. Ten plik (`CLAUDE.md`) to tylko skrót zasad krytycznych; **pełny, aktualny stan jest w handoffie** — i to handoff się aktualizuje po każdej większej zmianie.

To jest projekt **Civ**, **NIE Planify**. Jeśli widzisz odniesienia do „Fazy A", `organizationId`, planu E0–E8, hubu pracy NASTER — to Planify (inny projekt), zignoruj przy pracy nad Civ.

## ⛔ ZASADY KRYTYCZNE (złamanie = utrata pracy)
1. **NIGDY `npm run build` ani `npm run dev`** w `gra/` — `prebuild`/`predev` uruchamia `tools/export-data.py`, który **NADPISUJE ręcznie edytowane pliki JSON** w `gra/data/`. Cała praca nad danymi (drzewko, jednostki, cywilizacje) żyje w JSON. Buduj **wyłącznie** z katalogu `gra`:
   `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`
2. **Źródłem prawdy są JSON-y w `gra/data/`.** Panele Excel (`panele-sterowania/`) DOGANIAMY do JSON — kierunek **JSON→Excel** przez `gen-panel-*.py`, NIGDY odwrotnie. **Nie uruchamiaj `export-*.py` na żywym `gra/data`** (nadpisze grę starym Excelem). Round-trip zawsze na kopii (`--data-dir <tmp>`).
3. **Repo jest trunk-based na `main`** (brak feature-branchy). Deploy do wersji roboczej ma potwierdzony runbook — **handoff §6**. NIE używaj `publish-robocza-bundle.ps1`.
4. **KAŻDY deploy MUSI zostać zalogowany — natychmiast, w dwóch miejscach:**
   (a) **`dyspozycje/WERSJE.md`** — jedyny rejestr wersji: md5 + stempel + co weszło + status (poprzednią pozycję oznacz `ZASTĄPIONA`);
   (b) **`dyspozycje/_handoff/KANAL-PRACA.md`** — meldunek dla drugiego integratora (format `## [HH:MM] OD → DO — temat`, na końcu `CZEKAM-NA:`).
   **Narracja w czacie NIE jest meldunkiem** — właściciel nie przenosi treści między rozmowami. Nad `gra-robocza` pracuje **dwóch integratorów**; niezalogowany deploy = ktoś nadpisuje cudzą pracę, nie wiedząc co nadpisał (zdarzyło się realnie: `d2a346ff`, a potem trzy moje deploye 2026-07-11/19 — uzupełnione wstecznie).
5. **Przy niejednoznaczności lub sprzecznych danych — pytaj właściciela, nie zgaduj.** Ta zasada uchroniła projekt przed kilkoma kosztownymi błędami.

## JAK PRACOWAĆ Z WŁAŚCICIELEM (przeniesiona pamięć robocza)
Właściciel: **Maciej**, product owner w NASTER S.A. Rozmawia **po polsku — odpowiadaj po polsku**. Podejmuje decyzje produktowe/gameplayowe; od Ciebie oczekuje architektury, analizy i wykonania. Woli **ustrukturyzowany, analityczny wywód** (tabele, numerowane sekcje) niż ściany tekstu.

1. **KAŻDA decyzja gameplayowa/produktowa/architektoniczna → PEŁNA FORMA ABC.** Struktura pytania, dokładnie w tej kolejności: nagłówek `[TEMAT: …]` + **ID** (np. `C-MAP-Q1`) · **Sytuacja** (co jest DZIŚ w grze, pełne nazwy, zero skrótów) · **Cel pytania** · **Dlaczego teraz** (blokada/ryzyko) · **A / B / C** — każda opcja z opisem + **Za (≥2)** + **Przeciw (≥2)** · **Rekomendacja** (zawsze litera + jedno zdanie) · **formularz Ask na samym końcu** (tylko krótkie etykiety, rekomendacja pierwsza z dopiskiem „(Rekomendacja)"). **Max 3 pytania na turę** (dłuższa kolejka → `[PACZKA 1/N]`, następna dopiero po odpowiedzi). Po odpowiedzi: **ECHO** → potwierdź „wdrażaj?" → działaj po „Tak". Hasło **`format`** lub **`ABC`** = natychmiast przepisz pytanie w pełnej formie. Pełna specyfikacja: `dyspozycje/PAMIEC-ROBOCZA-CIV.md`.
2. **Deleguj wykonanie subagentom na Sonnet 5** (`Agent`, `model: "sonnet"`; `general-purpose` do pracy w repo, `Explore` do read-only reconu). Opus rezerwuj dla wyjątkowo złożonych zadań. Główna pętla zostaje do: rozmowy, dekompozycji, syntezy i decyzji ABC. Subagentowi dawaj samodzielny prompt: ścieżki, bramki, zakaz `npm run build`, zakaz commita/deployu.
3. **Publikacja tylko na wyraźny sygnał.** `git push` i deploy do wersji roboczej **wyłącznie** gdy Maciej powie („pushuj", „deploy", „wdrażaj") — on jest jedyną bramką publikacji i jedynym playtesterem.
4. **Nie zgaduj przy niejednoznaczności** — zrób resztę, a sporny punkt opisz i zapytaj. Ta zasada wielokrotnie uchroniła projekt przed kosztownymi błędami.
5. **Nie twórz problemów, których nie ma.** Maciej kilkakrotnie korygował nadmierne komplikowanie („znajdujesz problemy, których nie ma"). Najprostsze rozwiązanie spełniające wymaganie wygrywa.

## STRUKTURA
- `gra/src` — kod TS (`game/`, `map/`, `render/`, `ui/`) · `gra/data` — JSON (kanon danych gry)
- `gra-robocza` — zbudowane, samodzielne bundle HTML do playtestów (cel deployu)
- `panele-sterowania` — panele Excel do balansowania (interfejs właściciela)
- `dyspozycje` — notatki/plany robocze · **`STAN-PRACY-HANDOFF.md`** — żywy stan pracy

## BRAMKI (uruchamiaj z `gra/`)
`npx tsc --noEmit` (0 błędów) · `node tools/tech-tree-test.cjs` · `node tools/research-test.cjs` · `node tools/unit-replace-test.cjs` · `node tools/map-gen-regression-test.cjs` (determinizm A=B + 0 rzek bez ujścia).

**Znane PRE-ISTNIEJĄCE porażki (NIE regresja, nie „naprawiaj przy okazji"):** `logic-test.cjs` (~21 porażek — nieaktualne fixtury Brązownictwa), `combat-test.cjs` (rzuca wyjątek — zepsuty harness `counterTyp`). Szczegóły i pełna lista znanych problemów: **handoff §7**.

## Login demo (do playtestu)
Bundle z `gra-robocza/` (np. `START.html`) — otwiera hub playtestów.
