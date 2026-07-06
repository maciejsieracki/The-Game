> ⛔ NIEAKTUALNE OD 2026-07-06 — NIE STOSUJ TEGO PROCESU.
> Obowiązujący obieg: dyspozycje/START-TU.md → dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md
> → dyspozycje/ROLE-I-ZAKRESY-2026-07-06.md. Kanał pracy: dyspozycje/_handoff/KANAL-PRACA.md.
> Wersje/md5 wyłącznie w dyspozycje/WERSJE.md. Roboczą publikuje tylko INTEGRATOR (Cowork);
> kanon/finalną tylko Grupa G (Cursor) z pakietu DO-KANONU. Zasada: TYLKO DO PRZODU (zero restore).
> Treść poniżej = HISTORIA (kontekst), nie instrukcja do wykonania.

# Czat tematyczny — protokół (obowiązkowy)

> **Jeden czat = jeden temat** (A1, B4, C2, …). Tu: **pytania ABC + implementacja** (Composer).  
> **Master Silnik** = spinanie, weryfikacja, `main.ts`, kanon — **osobny czat**.

**Start czatu:** wklej **`docs/decyzje/DYSPOZYCJA-STALA.md`** (universal)  
**Charter grupy:** **`docs/czaty/README.md`** → plik dla twojej zakładki (A–E)  
**Komenda Macieja:** `master` → czytaj **`docs/czaty/OD-MASTERA.md`** (swoja Grupa)  
**Raport do Silnika:** dopisuj **`docs/czaty/DO-MASTERA.md`** (swoja Grupa)  
**Indeks tematów:** `docs/decyzje/README.md`  
**Hub:** `docs/MASTER-SILNIK.md` → `weryfikuj` / `czaty`

---

## Pytania ABC — format

**JEDYNY wzór:** [`docs/obieg/_ABC-JAK-PYTASZ.md`](obieg/_ABC-JAK-PYTASZ.md) · stary „O co chodzi i dlaczego" **WYCOFANY**

Przed każdą paczką czytaj: `_ABC-JAK-PYTASZ.md` · `ABC-FORMAT-KANON-MACIEJ.md` · `SZABLON-PYTANIA-ABC.md` · `abc-pelna-forma.mdc`

Maciej: **`format`** / **`ABC`** → przepisz natychmiast w pełnej formie.

---

## Co robisz w tym czacie

| Krok | Działanie |
|------|-----------|
| 1 | Czytasz plik tematu `docs/decyzje/<ID>-*.md` + ekran z README |
| 2 | Pytasz Macieja (max 5 ABC, nagłówek `[EKRAN: …]`) |
| 3 | Po odpowiedzi → **zapisujesz decyzje** do pliku tematu + skrót w `MACIEJ-KARTA` jeśli nowe D* |
| 4 | **Od razu implementujesz** w lane'ach tematu (Composer `composer-2.5-fast`, Task) |
| 5 | **Raportujesz** (patrz niżej) + backup przed edycją |
| 6 | Jeśli potrzeba `main.ts` → handoff + flaga `→ SILNIK:` — **nie edytujesz main.ts** |

---

## Lane'y przypisane do tematu

Edytuj **tylko** pliki swoich lane'ów (`.cursor/rules/civ-workflow.mdc` §3).  
Mapa temat → lane: `docs/decyzje/README.md` (sekcja „Lane per temat”).

| Lane | Pliki (skrót) |
|------|----------------|
| UI | `gra/src/ui/*` |
| MAPA | `gra/src/map/*`, `gra/src/render/*` |
| UNITS | `units`, `combat`, `battle/*` |
| EKONOMIA | `economy`, `cities`, `production`, `wealth`, … |
| CYWILIZACJE | `gra/data/*`, `ai.ts`, `diplomacy.ts` |
| **SILNIK** | `main.ts`, `Gra-podglad.html` — **tylko Master Silnik** |

Cross-lane: `dyspozycje/_handoff/<OD>-do-<ODBIORCA>_<temat>.md` — nigdy cudzy plik lane.

---

## Raportowanie (OBOWIĄZKOWE po każdej turze)

**Pełna kolejność kroków:** `docs/decyzje/DYSPOZYCJA-STALA.md` (Maciej wkleja na start czatu).

### A — Decyzje Macieja
- `docs/decyzje/<ID>-<slug>.md` — append, data, litera ABC, implikacje
- Status tematu: `OTWARTE` / `CZĘŚCIOWO` / `ZAMKNIĘTE`

### B — Praca techniczna (każdy lane dotknięty) — **2 pliki, oba obowiązkowe**

1. **`dyspozycje/<LANE>-DO-MASTERA.md`** — append na dole, szczegóły lane (pliki, testy)
2. **`docs/czaty/DO-MASTERA.md`** — append w **sekcji swojej Grupy** (skrót dla Silnika)

Format: data, decyzja Macieja, zrobione, testy, `→ SILNIK:`  
Krótki raport w czacie do Macieja (KROK G) — ten sam skrót.

### C — Gotowe do wpięcia w silnik
- `dyspozycje/_handoff/<LANE>-do-MASTER_<temat>.md` jeśli kontrakt cross-lane
- W pliku tematu: sekcja `→ SILNIK: GOTOWE DO WPIĘCIA` + lista plików

### D — Blokada / coś nie działa
- W `*-DO-MASTERA.md`: `BLOK: …` + `→ SILNIK: …`
- W `docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md`: szczegół pytania technicznego (format w `_SZABLON-PYTANIA-DO-SILNIKA.md`)
- Master Silnik zgłasza Maciejowi; Silnik lub Maciej dopisuje w `<LANE>.md`
- Czat tematyczny czyta pliki od nowa i kontynuuje

### E — Pytanie do Master Silnika (nie gameplay)
- Plik: **`docs/decyzje/<ID>-PYTANIA-DO-SILNIKA.md`** (append, numer `<ID>-S1`, …)
- Szablon: `docs/decyzje/_SZABLON-PYTANIA-DO-SILNIKA.md`
- Silnik odpowiada w tym pliku; Maciej w czacie Silnika: `pytania <ID>`

**Master Silnik:** procedura `weryfikuj` w `docs/MASTER-SILNIK.md` → aktualizuje `STATUS.md` + `DZIENNIK`.

---

## Backup (przed każdą edycją pliku)

```bash
cp plik plik.bak-<LANE>-<YYYYMMDD>
```

Np. `hud.ts.bak-UI-20260626`. Reguła z PLAYBOOK + `civ-workflow.mdc`.

---

## Composer / subagenci

- Model: **`composer-2.5-fast`** (Task tool)
- **1 lane = 1 Task = 1 AC** — nie mieszaj lane'ów w jednym agencie
- Worker czyta: `<LANE>.md` (jeśli jest dyspozycja) + `_handoff/` + pliki własnego lane
- **MAX 3** przebiegi build/test → STOP + raport
- **NIE** czytaj całego `main.ts`

---

## Zakazy czatu tematycznego

- Pytania o **inny temat** / inny ekran
- Edycja **`main.ts`** lub publikacja **`Gra-podglad.html`**
- Pytania gameplay **poza** zakresem tego `<ID>`
- Kasowanie historii w `*-DO-MASTERA.md`

---

## Lektura obowiązkowa (pierwsze otwarcie czatu)

1. **`docs/czaty/<CHARTER-GRUPY>.md`** — zakres, tematy, jakie pytania ABC (A–E)
2. Ten plik (`CZAT-TEMATYCZNY-PROTOKOL.md`)
3. `docs/decyzje/DYSPOZYCJA-STALA.md` — Maciej wkleja na start
4. `docs/decyzje/README.md` — Twój `<ID>` + lane'y
5. `.cursor/rules/civ-workflow.mdc` — własność plików, build `/tmp`

---

*2026-06-26 · Model: Master Silnik + czaty tematyczne (bez osobnego Master Work)*
