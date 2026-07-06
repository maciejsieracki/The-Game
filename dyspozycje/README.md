> ⛔ NIEAKTUALNE OD 2026-07-06 — NIE STOSUJ TEGO PROCESU.
> Obowiązujący obieg: dyspozycje/START-TU.md → dyspozycje/OBIEG-KOMUNIKACJI-2026-07-06.md
> → dyspozycje/ROLE-I-ZAKRESY-2026-07-06.md. Kanał pracy: dyspozycje/_handoff/KANAL-PRACA.md.
> Wersje/md5 wyłącznie w dyspozycje/WERSJE.md. Roboczą publikuje tylko INTEGRATOR (Cowork);
> kanon/finalną tylko Grupa G (Cursor) z pakietu DO-KANONU. Zasada: TYLKO DO PRZODU (zero restore).
> Treść poniżej = HISTORIA (kontekst), nie instrukcja do wykonania.

# dyspozycje/ — kanoniczny workspace operacyjny Civ

**Jedna ścieżka:** `Civ/dyspozycje/` — tu żyją wszystkie dyspozycje, meldunki lane'ów i handoffy.

Workflow (2026-06-26): **Master Silnik** (hub) + **czaty tematyczne** (ABC + Composer w miejscu). Bez osobnego Master Work. Protokoły: `docs/MASTER-SILNIK.md`, `docs/CZAT-TEMATYCZNY-PROTOKOL.md`.

---

## Kto co czyta

| Rola | Pliki startowe |
|------|----------------|
| **Maciej** | `docs/decyzje/README.md`, `MASTER-DELEGACJA-LANE-2026-06-28.md` (mapa czatów) |
| **Master Silnik** | `docs/MASTER-SILNIK.md`, `DZIENNIK-MASTERA.md`, `MASTER-DELEGACJA-LANE-2026-06-28.md` |
| **Czat tematyczny** | `docs/CZAT-TEMATYCZNY-PROTOKOL.md`, `docs/decyzje/<ID>.md`, `<LANE>.md`, `_handoff/` |
| **Subagent lane (Composer)** | `<LANE>-STAN.md` (jeśli istnieje) → `<LANE>.md` → kontrakt `_handoff/` |
| **Opus (review)** | deliverable + AC z dyspozycji, **nie** edytuje plików lane |

---

## Aktywne lane'y (6)

Każdy lane ma parę plików: **dyspozycja** (`<LANE>.md`) + **meldunki** (`<LANE>-DO-MASTERA.md`).

| Lane | Dyspozycja | Meldunki | Uwagi |
|------|------------|----------|-------|
| **SILNIK** | `SILNIK.md` | `SILNIK-DO-MASTERA.md` | jedyny editor `main.ts` + kanon |
| **EKONOMIA** | `EKONOMIA.md` | `EKONOMIA-DO-MASTERA.md` | + `EKONOMIA-STAN.md` (STAN) |
| **UNITS** | `UNITS.md` | `UNITS-DO-MASTERA.md` | |
| **UI** | `UI.md` | `UI-DO-MASTERA.md` | |
| **MAPA** | `MAPA.md` | `MAPA-DO-MASTERA.md` | |
| **CYWILIZACJE** | `CYWILIZACJE.md` | `CYWILIZACJE-DO-MASTERA.md` | dane per-cyw + AI + dyplomacja |

---

## Scalone lane'y (archiwum)

Te lane'y **nie są już aktywne** — treść przeniesiona do lane'a docelowego. Pliki zachowane w `_scalone/` (MOVE, nie delete).

| Stary lane | Wchodzi w | Pliki w `_scalone/` |
|------------|-----------|---------------------|
| **MIASTO** | **EKONOMIA** | `_scalone/MIASTO/` (MIASTO.md, MIASTO-DO-MASTERA.md, MIASTO-ZAKRES-I-PLAN.md) |
| **DANE** | **CYWILIZACJE** | `_scalone/DANE/` |
| **AI** | **CYWILIZACJE** | `_scalone/AI/` |
| **DYPLOMACJA** | **CYWILIZACJE** | `_scalone/DYPLOMACJA/` |

Nowe dyspozycje dla miasta/ekonomii → **EKONOMIA**. Dla danych/AI/dyplomacji → **CYWILIZACJE**.

---

## Struktura folderu

```
dyspozycje/
├── README.md                 ← ten plik (mapa)
├── DZIENNIK-MASTERA.md       ← rejestr przepływów (MASTER aktualizuje)
├── <LANE>.md                 ← dyspozycja aktywnego lane'a
├── <LANE>-DO-MASTERA.md      ← meldunki lane → MASTER (append-only)
├── <LANE>-STAN.md            ← opcjonalnie, ≤12 linii (progressive disclosure)
├── _handoff/                 ← kontrakty jednokierunkowe między lane'ami
├── _scalone/                 ← zarchiwizowane pliki scalonych lane'ów
└── _archiwum/                ← notatki robocze / materiały analityczne
```

---

## _handoff/

Kontrakty: `<NADAWCA>-do-<ODBIORCA>_<temat>.md` — jednokierunkowe paczki (spec, API, dane). Zasady: `_handoff/README.md`.

Historyczny handover SILNIK: `_handoff/SILNIK-handover-do-MASTER_2026-06-24.md` (dawniej `SILNIK/SILNIK-HANDOVER-DO-MASTERA.md`).

---

## Zasady operacyjne (skrót)

1. MASTER pisze dyspozycje w `<LANE>.md`; subagent czyta i wykonuje.
2. Subagent melduje w `<LANE>-DO-MASTERA.md` + raport do MASTER (w tym samym czacie).
3. Cross-lane: tylko przez `_handoff/` — **nigdy** bezpośrednia edycja cudzego pliku.
4. Decyzje gameplay (ABC) → Maciej → dopiero MASTER rozsyla dyspozycje.
5. Pełne reguły: `.cursor/rules/civ-workflow.mdc`, `PLAYBOOK-operacyjny-Civ.md`.

---

*Audyt i reorganizacja: 2026-06-26.*
