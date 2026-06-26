# WRÓCIŁEŚ — zacznij od tego

*Wygenerowano: 2026-06-26 | Zaktualizowano po sesji planowania MASTER (GLM 5.2)*

---

## 👉 Krok 0 (NOWY): otwórz MASTER-PLAN

**`docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md`** — **główny dokument operacyjny** (od 2026-06-26 zastępuje ten plik jako punkt wejścia).

Znajdziesz tam:
- Twoją rolę (decyzje ABC, czego NIE robisz)
- 3 role techniczne (MASTER GLM 5.2 / Composer 2.5 / Opus 4.8)
- Schemat działania (Mermaid)
- 10 lane'ów (% done, co brakuje, następny krok, kto)
- **Fazy A–F do v1.0** (cele, zadania, exit criteria)
- **Decyzje ABC D1–D15** z rekomendacjami MASTERa
- Konkretne prompty do Cursor
- Harmonogram (~8–9 tygodni do v1.0)

**Następnie:** otwórz **`docs/MACIEJ-KARTA-DECYZJI.md`** — prosta karta z 15 decyzjami do rozstrzygnięcia (format ABC, checkboxy).

---

## Krok 1: Przeczytaj syntezę (5 min) — opcjonalnie, jeśli chcesz tło

`docs/CURSOR-RAPORT-KONCOWY.md` — jedna strona stanu + mapa lane'ów + testy.

Gra jest **grywalna end-to-end** (menu → mapa → ekonomia → AI → bitwa → save). Kanon zielony (~762 testów, 1 baseline-red). **15 decyzji czeka na Ciebie** (patrz Karta Decyzji).

---

## Krok 2: Rozstrzygnij decyzje P0 (15 min)

Otwórz **`docs/MACIEJ-KARTA-DECYZJI.md`** — wybierz A/B/C dla D1–D5 (P0, odblokowują Sprint 1), opcjonalnie D6–D15.

Najprościej: skopiuj tabelę z Karty, wpisz litery, wklej w czacie:

```
Jestem Maciej. Rozstrzygam:
D1=C, D2=A, D3=C, D4=A, D5=B, D6=A, D7=B, D8=A, D9=B,
D10=A, D11=A, D12=A, D13=A, D14=A, D15=B.
Zapisz w docs/MACIEJ-KARTA-DECYZJI.md z datą i otwórz nowy chat
jako MASTER, zaplanuj Sprint 1.
```

(Powyższe = wszystkie rekomendacje MASTERa — możesz zaakceptować w całości lub zmienić wybrane.)

---

## Krok 3: Zweryfikuj testy lokalnie (10 min) — opcjonalnie

Sandbox Cursor nie ma `npx` w PATH. U Ciebie:

```powershell
cd "C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\gra"
npx vite build --outDir $env:TEMP\civ-dist --emptyOutDir
node tools/smoke.cjs $env:TEMP\civ-dist\index.html
node tools/logic-test.cjs
node tools/combat-test.cjs
```

Oczekiwany wynik: **~762 pass, 1 baseline czerwony** (koszary-gate-test — świadomy, nie naprawiaj).

Potem dwuklik **`Gra-podglad.html`** — smoke test manualny.

---

## Krok 4: MASTER rusza Sprint 1 (po Twoich decyzjach)

Po rozstrzygnięciu D1–D5, w **nowym chacie** (rola MASTER):

```
Jestem MASTER (GLM 5.2, rola Architekt). Projekt Civ.
Przeczytaj: docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md, docs/CURSOR-BACKLOG.md,
dyspozycje/DZIENNIK-MASTERA.md, docs/MACIEJ-KARTA-DECYZJI.md.
Zaplanuj Sprint 1 (Faza B): listę zadań z AC, zależności, kolejność, kto (Composer lane).
Nie edytuj main.ts — to Composer w osobnym chacie.
```

Pełny zestaw promptów: **`docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` §9**.

---

## Krok 5: Skonfiguruj Cursor na przyszłość

1. **Reguły** — `.cursor/rules/civ-workflow.mdc` (alwaysApply) mapuje role + token rules + STAN files ✅
2. **OneDrive** — ustaw `gra/` na „Zawsze zachowuj na tym urządzeniu" (zielony ptaszek)
3. **Git** — rozważ `git init` na poziomie `Civ/` (teraz tylko `gra/.git`) — po v1.0
4. **Playbook** — `PLAYBOOK-operacyjny-Civ.md` + `~/Projects/game-dev-playbook/AGENTS.md`
5. **User rule** (opcjonalnie) — dodany pointer do MASTER-PLAN (patrz Cursor Settings → Rules)

---

## Szybka nawigacja

| Chcę… | Idź do… |
|-------|---------|
| **Główny plan operacyjny** | **`docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md`** ← START TU |
| **Rozstrzygnąć decyzje ABC** | **`docs/MACIEJ-KARTA-DECYZJI.md`** |
| Schemat workflow + multitask | `docs/CURSOR-WORKFLOW-SCHEMAT.md` |
| Pełny stan projektu (1 strona) | `docs/CURSOR-RAPORT-KONCOWY.md` |
| Task list z ID/priorytetami/AC | `docs/CURSOR-BACKLOG.md` |
| Architektura techniczna | `docs/CURSOR-ARCHITEKTURA.md` |
| Plan sprintów (szczegóły) | `docs/CURSOR-PLAN-DZIALANIA.md` |
| Audyt per lane | `docs/analiza/01-08` |
| Operacje multi-agent | `PLAYBOOK-operacyjny-Civ.md` |
| Stan operacyjny live | `dyspozycje/DZIENNIK-MASTERA.md` |
| Wysokopoziomowy backlog M0-M7 | `BACKLOG-PELNY.md` (archiwum) |

---

## Co zrobiła sesja planowania (2026-06-26)

- ✅ `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` — **główny dokument** (rola Macieja, 3 role, fazy A-F, decyzje D1-D15, prompty, harmonogram)
- ✅ `docs/MACIEJ-KARTA-DECYZJI.md` — prosta karta 15 decyzji ABC
- ✅ `docs/CURSOR-WORKFLOW-SCHEMAT.md` — wizualny schemat + multitask rules
- ✅ `.cursor/rules/civ-workflow.mdc` — zaktualizowany (MASTER jedyny editor main.ts, token rules, STAN files)
- ✅ `docs/CURSOR-START-TUTAJ.md` — ten plik (pointer do MASTER-PLAN)
- ✅ User rule (opcjonalnie) — pointer do MASTER-PLAN
- ⚠️ Bez zmian w `gra/src` (zgodnie z zasadą docs-only)

**Powodzenia — gra czeka na Twoje decyzje ABC! 🎮**
