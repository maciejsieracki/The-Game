> ⛔ NIEAKTUALNE OD 2026-07-06 — NIE STOSUJ TEGO PROCESU.
> Obowiązujący obieg: dyspozycje/START-TU.md → dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md
> → dyspozycje/ROLE-I-ZAKRESY-2026-07-06.md. Kanał pracy: dyspozycje/_handoff/KANAL-PRACA.md.
> Wersje/md5 wyłącznie w dyspozycje/WERSJE.md. Roboczą publikuje tylko INTEGRATOR (Cowork);
> kanon/finalną tylko Grupa G (Cursor) z pakietu DO-KANONU. Zasada: TYLKO DO PRZODU (zero restore).
> Treść poniżej = HISTORIA (kontekst), nie instrukcja do wykonania.

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

## Krok 2: Decyzje — czaty tematyczne (nie jeden worek)

1. Otwórz czat z folderu **Grupa A–E** (np. `Civ — T-A2 Jednostka mapa`).
2. Wklej szablon: **`docs/decyzje/_SZABLON-OTWARCIA-CZATU.md`**
3. Protokół: **`docs/CZAT-TEMATYCZNY-PROTOKOL.md`** · indeks: **`docs/decyzje/README.md`**
4. Po ABC agent **od razu koduje** w lane'ach tematu i raportuje do `*-DO-MASTERA.md`.
5. **Master Silnik** (osobny czat) — `status`, `weryfikuj`, wpięcie `main.ts` — **`docs/MASTER-SILNIK.md`**

Skrót decyzji: **`docs/MACIEJ-KARTA-DECYZJI.md`**

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

## Krok 4: Master Silnik — spinanie i wpięcie (nie osobny Work)

W czacie **`Civ — Master Silnik`**:

```
status
weryfikuj
test
wpięcie B3
```

Master Silnik czyta raporty z czatów tematycznych (`docs/decyzje/`, `*-DO-MASTERA.md`), wpina `main.ts`, odpala bramkę testów.

---

## Krok 5: Skonfiguruj Cursor na przyszłość

1. **Reguły** — `.cursor/rules/civ-workflow.mdc` (alwaysApply) mapuje role + token rules + STAN files ✅
2. **OneDrive** — ustaw `gra/` na „Zawsze zachowuj na tym urządzeniu" (zielony ptaszek)
3. **Git** — rozważ `git init` na poziomie `Civ/` (teraz tylko `gra/.git`) — po v1.0
4. **Playbook** — `PLAYBOOK-operacyjny-Civ.md` + `~/Projects/game-dev-playbook/AGENTS.md`
5. **User rule** (opcjonalnie) — dodany pointer do MASTER-PLAN (patrz Cursor Settings → Rules)
6. **Archiwum czatów** — na końcu sesji: agent zapisuje podsumowanie w `docs/archiwum-czatow/<rola>/` (szablon: `_szablon-eksportu.md`); Ty możesz wkleić pełny eksport z Cursor (⋯ → Export)

---

## Szybka nawigacja

| Chcę… | Idź do… |
|-------|---------|
| **Główny plan operacyjny** | **`docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md`** ← START TU |
| **Rozstrzygnąć decyzje ABC** | **`docs/decyzje/README.md`** + czat tematyczny |
| **Hub / weryfikacja / silnik** | **`docs/MASTER-SILNIK.md`** |
| **Protokół czatu tematycznego** | **`docs/CZAT-TEMATYCZNY-PROTOKOL.md`** |
| Skrót kart decyzji | **`docs/MACIEJ-KARTA-DECYZJI.md`** |
| Schemat workflow + multitask | `docs/CURSOR-WORKFLOW-SCHEMAT.md` |
| Pełny stan projektu (1 strona) | `docs/CURSOR-RAPORT-KONCOWY.md` |
| Task list z ID/priorytetami/AC | `docs/CURSOR-BACKLOG.md` |
| Architektura techniczna | `docs/CURSOR-ARCHITEKTURA.md` |
| Plan sprintów (szczegóły) | `docs/CURSOR-PLAN-DZIALANIA.md` |
| Audyt per lane | `docs/analiza/01-08` |
| Operacje multi-agent | `PLAYBOOK-operacyjny-Civ.md` |
| **Mapa dyspozycji (lane'y, handoffy)** | **`dyspozycje/README.md`** ← kanoniczny workspace |
| Stan operacyjny live | `dyspozycje/DZIENNIK-MASTERA.md` |
| **Archiwum czatów Cursor** | **`docs/archiwum-czatow/README.md`** ← eksport rozmów, pamięć trwała |
| Wysokopoziomowy backlog M0-M7 | `BACKLOG-PELNY.md` (archiwum) |

---

## Co zrobiła sesja planowania (2026-06-26)

- ✅ `docs/CURSOR-MASTER-PLAN-DOKONCZENIA.md` — **główny dokument** (rola Macieja, 3 role, fazy A-F, decyzje D1-D15, prompty, harmonogram)
- ✅ `docs/MACIEJ-KARTA-DECYZJI.md` — prosta karta 15 decyzji ABC
- ✅ `docs/CURSOR-WORKFLOW-SCHEMAT.md` — wizualny schemat + multitask rules
- ✅ `dyspozycje/README.md` — mapa 6 aktywnych lane'ów + `_scalone/` + `_handoff/`
- ✅ `.cursor/rules/civ-workflow.mdc` — jeden czat MASTER, subagenci przez pliki, 6 lane'ów
- ✅ `docs/CURSOR-START-TUTAJ.md` — ten plik (pointer do MASTER-PLAN)
- ✅ `docs/archiwum-czatow/` — archiwum czatów Cursor (workflow + pierwszy plik OPS)
- ✅ User rule (opcjonalnie) — pointer do MASTER-PLAN
- ⚠️ Bez zmian w `gra/src` (zgodnie z zasadą docs-only)

**Powodzenia — gra czeka na Twoje decyzje ABC! 🎮**
