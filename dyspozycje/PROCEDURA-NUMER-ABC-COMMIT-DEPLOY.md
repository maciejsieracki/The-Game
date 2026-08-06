# PROCEDURA: NUMER → ABC → COMMIT → DEPLOY

**Obowiązuje od: 2026-08-03** · **Decyzja Macieja** (kanon procesu dla WSZYSTKICH agentów / sesji)  
**ID zgłoszenia procedury:** `R-PROC-NUMER-ABC`  
**Status:** **OBOWIĄZUJE** — superseduje wcześniejsze „działaj od razu” / autonomiczny deploy bez hasła.

---

## Cel

1. Każdy case Macieja ma **numer** i żyje w plikach (nie tylko w czacie).
2. Agent **nie koduje od razu** — najpierw proponuje rozwiązanie (± ABC).
3. Commit dopiero po decyzji Macieja: **`numer + litera`** (np. `42 A` / `R-STAWKI-STROJENIE B`).
4. Deploy do ROBOCZA **wyłącznie** gdy Maciej powie **`deploy`** (lub równoważne: „deploy do robocza”, „publish robocza”).

---

## 1. Co dostaje numer (ZAWSZE)

Natychmiast nadaj ID i zapisz, gdy Maciej:

| Typ | Przykład |
|-----|----------|
| Pytanie o konkretny case | „czy w Brązie jest info o Żegludze?” |
| Zgłoszenie błędu | „jednostka ma pełne HP w bitwie, a na mapie mało” |
| Prośba o poprawkę | „u zwiadowców brakuje przycisku zwiedzaj” |
| Zmiana / innowacja | „triumf po pokonaniu miast-państw naszej cywilizacji” |
| Reguła procesu | ten dokument |

**Nie numeruj** czystych haseł operacyjnych bez nowego tematu: `raport`, `sprawdź`, `deploy` (to komenda), `status`.

---

## 2. Gdzie zapisywać (pliki = prawda)

| Co | Plik |
|----|------|
| **Prośba / zadanie / case** | `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — wiersz z ID + status `CZEKA-NA-DECYZJĘ` / `NOWE` |
| **Bug / problem AI / regresja** | `dyspozycje/REJESTR-PROBLEMOW-AI.md` — ID `P-AI-###` **oraz** wpis / link w REJESTR-PROSB |
| **Pytanie otwarte / ABC w toku** | `dyspozycje/PYTANIA-OTWARTE.md` — pełny kontekst + opcje |
| **Szczegóły decyzji** (gdy potrzeba) | `docs/decyzje/<ID>.md` |
| **Meldunek między sesjami** | `dyspozycje/_handoff/KANAL-PRACA.md` (krótko) |

W czacie **zawsze** podaj ID przy pierwszym odzewie: np. „Zapisałem jako **R-ZEGLUGA-TOOLTIP**”.

### Numeracja ID

- Preferuj czytelne ID: `R-<TEMAT-KROTKI>` albo kontynuacja `P-AI-###` dla bugów.
- Unikaj kolizji — przed nadaniem sprawdź grep w obu rejestrach.
- Stare ID (`C-…-Q…`, `BUG-…`) zostają ważne; nowe case’y i tak dostają wpis w REJESTR-PROSB.

---

## 3. Po rozpoznaniu tematu — ZAKAZ automatycznej naprawy

Agent:

1. **Nadaje numer** + zapisuje w rejestrze.
2. **Diagnozuje** (krótko: przyczyna / gdzie w kodzie).
3. **Przedstawia rozwiązanie** — co chce zrobić (pliki, skutek w grze).
4. Gdy jest wybór — **pełne ABC** (format: `PAMIEC-ROBOCZA-CIV.md` §1 / `.cursor/rules/abc-pelna-forma.mdc`).
5. **STOP** — czeka na odpowiedź Macieja.

**Zakaz:** edycja `gra/src`, `gra/data`, deploy, „przy okazji naprawię” — **zanim** padnie `numer + A|B|C` (albo jednoznaczne „rób X” z numerem).

**Wyjątki (wąskie):**

| Wyjątek | Warunek |
|---------|---------|
| Sam zapis procedury / docs na wyraźne „zapisz do plików” | jak ta dyspozycja |
| Literówka w **właśnie tworzonej** dokumentacji tematu | bez zmiany gry |
| Maciej napisał wprost **`deploy`** / **`commit`** z numerem | wykonaj tylko to |

---

## 3a. PEŁNE ID PYTANIA — zakaz gołego Q1 (Maciej 2026-08-03)

**ID reguły:** `R-PROC-ABC-FULL-ID`

W grze leci **wiele wątków naraz**. Agenci i Maciej gubią się, gdy w czacie/Ask pada samo „Q1” / „a / q3b”.

| ZAKAZ | WYMAGANE |
|-------|----------|
| `Q1`, `Q2`, `Q3` bez tematu | `R-AUTO-BUDOWA-LISTA-Q2`, `P-SCOUT-EXPLORE-Q1`, `R-AI-MP-WASAL-WCHLONIECIE-Q3` |
| Nagłówek `[PACZKA 1/1 — 2 pytania]` bez ID | `[PACZKA 1/1 — R-FOO-Q2, R-FOO-Q3]` |
| ECHO „przyjąłem A i Q3=B” | ECHO `R-FOO-Q2=A · R-FOO-Q3=B` |
| Ask `id: "q1"` | Ask `id: "R-FOO-Q1"` (pełny string) |

**Zasada:** każde pytanie ABC = **`<ID-TEMATU>-Q<n>`**. Litera odpowiedzi Macieja zawsze z tym samym pełnym ID.

---

## 4. Odpowiedź Macieja → commit

Format decyzji (równoważne):

```
R-STAWKI-STROJENIE B
R-AUTO-BUDOWA-LISTA-Q2 A
R-AUTO-BUDOWA-LISTA-Q3 B
P-AI-017 A
```

**Preferuj** pełne ID pytania (`…-Q2`), nie samo ID tematu, gdy w temacie jest kilka ABC.

Agent **w tej samej sesji**:

1. **ECHO** — „Przyjąłem **\<pełne-ID\> = \<litera\>** …” (wszystkie ID z paczki)
2. Zapis odpowiedzi w pliku decyzji / rejestrze (status → `W TOKU` / `WDROŻONE (kod)`).
3. **Dopiero wtedy** implementacja + testy lane.
4. **`git commit`** (+ push branch) — **bez** deployu do `gra-robocza/`, **bez** edycji `WERSJE.md` jako AKTUALNA FALA.

Hasła historyczne **`działaj` / `wdrażaj`** = zgoda na wdrożenie **bieżącego** otwartego ID (jeśli jeden); przy wielu otwartych — dopytaj o **pełny numer** albo wdróż tylko ten, o którym mowa w wątku.

---

## 4a. NIE UWSTECZNIAJ — bramka przed commit (Maciej 2026-08-04)

**ID:** `R-PROC-NO-REGRESS`

Przy wdrażaniu **jednej** rzeczy łatwo zepsuć **inną** (nadpisanie hunka, usunięcie „przy okazji”, konflikt między PR na `main.ts`).

**Obowiązkowo przed `git commit` / przed `deploy`:**

1. Przejrzyj **`git diff`** — co **zmienione** i co **usunięte** (nie tylko „co dodałem”).
2. Dla każdego skasowanego / przepisano bloku: czy to **świadoma** część tego ID, czy **cofnięcie** wcześniejszego fixa (FALA / inny PR / inny R-*)?
3. Gdy ten sam plik ruszają **inne otwarte PR** (zwłaszcza `main.ts`) — sprawdź overlap; rebase / kolejność merge, żeby nie wymazać cudzego fixa.
4. Odpal **testy tego obszaru** + krótki smoke powiązanych tematów (np. Zwiedzaj + chatka + fog), nie tylko nowy test.
5. W raporcie do Macieja: 1 linia **„regresja: nie stwierdzono / ryzyko: …”** jeśli był overlap.

**Zakaz:** „przy okazji posprzątam” w cudzym obszarze · `git add -A` bez przeglądu · merge batcha bez kolejności zależności.

---

## 4b. AUTOBOT — TWARDA REGUŁA: każda praca tylko tędy (Maciej 2026-08-05)

**ID:** `R-PROC-AUTOBOT`

**KAŻDA praca agenta** po decyzji Macieja (`działaj` / implementacja) **musi** iść przez AutoBot — **ZAKAZ** pracy poza pętlą.

| Krok | Rola | Kto u nas | Co |
|------|------|-----------|-----|
| **1** | **Operator** | `composer-2.5` | Task + `playbook.json` + akcja (bez merge/deploy) |
| **2** | **Evaluator** | Adwokat diabła + twarde metryki | Score KPI → postmortem → win/loss / RETIRED / prune |
| **3** | **Final** | Grok 4.5 | Kontrola; dopiero potem „gotowe” / czekaj na `deploy` |

Guardrails: zakaz merge→`main`; deploy tylko hasło Macieja; winner dopiero po significance + time-delay; win_rate &lt; 30% → `RETIRED`.

Kanon: [`autobot/README.md`](autobot/README.md) · `.cursor/rules/autobot-evaluator-operator.mdc` · [`docs/decyzje/R-PROC-AUTOBOT.md`](../docs/decyzje/R-PROC-AUTOBOT.md).  
Potrójna warstwa = kroki 1–3 AutoBot (nie osobny opcjonalny rytuał).

---

## 5. Deploy — TYLKO na hasło Macieja

| Hasło | Skutek |
|-------|--------|
| **`deploy`** / **`deploy do robocza`** / **`publish robocza`** | Build + `gra-robocza/` + `WERSJE.md` + `KANAL-PRACA.md` + push (runbook `STAN-PRACY-HANDOFF.md` §6) |
| Sam commit / merge PR | **NIE** jest deployem |
| Stare „AUTONOMIA=A” / C-ORG-Q17 | **NIE** uprawnia do deployu bez hasła (nadpisane 2026-08-03) |

Po deployu: stempel md5 w `WERSJE.md`, meldunek w kanale, status zadania → `ZDEPLOYOWANE`.

---

## 6. Skrót dla agenta (checklist)

```
[ ] Case Macieja? → NADANIE ID + wpis REJESTR (+ PYTANIA jeśli ABC)
[ ] Przedstaw rozwiązanie (± ABC z **pełnym** ID pytania, nie gołe Q1) — BEZ kodu gry
[ ] Czekaj: „<pełne-ID> A|B|C”
[ ] ECHO z pełnymi ID + zapis plikowy → kod → commit (bez deploy)
[ ] Przed commit: diff — nic nie uwstecznia (§4a R-PROC-NO-REGRESS)
[ ] Deploy TYLKO po „deploy” (+ ponowny check overlap PR)
[ ] Koniec wiadomości: „Następny krok” (pełna lista; bez limitu 3)
```

---

## 7. Powiązane pliki

- Ten kanon: `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`
- Reguła Cursor (alwaysApply): `.cursor/rules/numer-abc-commit-deploy.mdc`
- Start: `dyspozycje/START-TU.md` · `CLAUDE.md` · `dyspozycje/PAMIEC-ROBOCZA-CIV.md`
- Hasła: `dyspozycje/KOMENDY.md`
- Rejestry: `REJESTR-PROSB-I-ZADAN.md` · `REJESTR-PROBLEMOW-AI.md` · `PYTANIA-OTWARTE.md`
