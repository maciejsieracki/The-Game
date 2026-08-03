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

## 4. Odpowiedź Macieja → commit

Format decyzji (równoważne):

```
42 A
R-STAWKI-STROJENIE B
P-AI-017 A
R-ZEGLUGA-TOOLTIP: C
```

Agent **w tej samej sesji**:

1. **ECHO** — „Przyjąłem **\<ID\> = \<litera\>** …”
2. Zapis odpowiedzi w pliku decyzji / rejestrze (status → `W TOKU` / `WDROŻONE (kod)`).
3. **Dopiero wtedy** implementacja + testy lane.
4. **`git commit`** (+ push branch) — **bez** deployu do `gra-robocza/`, **bez** edycji `WERSJE.md` jako AKTUALNA FALA.

Hasła historyczne **`działaj` / `wdrażaj`** = zgoda na wdrożenie **bieżącego** otwartego ID (jeśli jeden); przy wielu otwartych — dopytaj o numer albo wdróż tylko ten, o którym mowa w wątku.

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
[ ] Przedstaw rozwiązanie (± ABC) — BEZ kodu gry
[ ] Czekaj: „<ID> A|B|C”
[ ] ECHO + zapis plikowy → kod → commit (bez deploy)
[ ] Deploy TYLKO po „deploy”
[ ] Koniec wiadomości: „Następny krok” (max 3)
```

---

## 7. Powiązane pliki

- Ten kanon: `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`
- Reguła Cursor (alwaysApply): `.cursor/rules/numer-abc-commit-deploy.mdc`
- Start: `dyspozycje/START-TU.md` · `CLAUDE.md` · `dyspozycje/PAMIEC-ROBOCZA-CIV.md`
- Hasła: `dyspozycje/KOMENDY.md`
- Rejestry: `REJESTR-PROSB-I-ZADAN.md` · `REJESTR-PROBLEMOW-AI.md` · `PYTANIA-OTWARTE.md`
