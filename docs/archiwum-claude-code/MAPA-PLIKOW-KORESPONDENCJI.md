# Mapa plików korespondencji

Indeks operacyjny korespondencji MASTER↔lane w projekcie Civ. Źródło: przeszukanie `dyspozycje/`, `_handoff/` i folderów lane'ów (2026-06-26).

---

## 1. Jak działa korespondencja (Claude Code / multi-agent)

Schemat z `PLAYBOOK-operacyjny-Civ.md` §4 i §12:

```
Maciej
  └── MASTER
        ├── pisze:  dyspozycje/<LANE>.md           [MASTER → lane]
        ├── czyta:  dyspozycje/<LANE>-DO-MASTERA.md [lane → MASTER]
        └── tablica: dyspozycje/DZIENNIK-MASTERA.md [stan cross-lane]

Lane ↔ Lane (bez gadania wprost):
  dyspozycje/_handoff/<NADAWCA>-do-<ODBIORCA>_<temat>.md
```

**Reguły:**

- `*-DO-MASTERA.md` = append-only (historia Q&A + raporty)
- `_handoff/` = jednokierunkowe paczki (spec/kontrakt/dane), nie dyspozycje
- Integracja do `main.ts` / kanonu = wyłącznie MASTER (SILNIK)

---

## 2. Ścieżki bazowe (absolutne)

| Rola | Ścieżka |
|---|---|
| Hub MASTER | `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\dyspozycje\` |
| Dziennik cross-lane | `...\dyspozycje\DZIENNIK-MASTERA.md` |
| Handoff między lane'ami | `...\dyspozycje\_handoff\` |
| Playbook operacyjny | `...\PLAYBOOK-operacyjny-Civ.md` |
| Analiza stanu dyspozycji | `...\docs\analiza\06-DYSPOZYCJE-stan.md` |

---

## 3. Tabela lane'ów

| Lane | Dyspozycja (MASTER→lane) | Raport (lane→MASTER) | Status | Co wchłonięte / uwagi |
|---|---|---|---|---|
| **SILNIK** | `dyspozycje/SILNIK.md` | `dyspozycje/SILNIK-DO-MASTERA.md` | **Zamknięty** (2026-06-24) | Sesja SILNIK przekazana MASTER; handover: `SILNIK/SILNIK-HANDOVER-DO-MASTERA.md`. Kanał `SILNIK*.md` zostaje pod stałą ścieżką (self-check). |
| **MASTER** (= integracja) | `DZIENNIK-MASTERA.md` | — | **Aktywny** | Wchłonął rolę SILNIK (main.ts, kanon). Ostatnia aktualizacja dziennika: **2026-06-25**. |
| **EKONOMIA** | `dyspozycje/EKONOMIA.md` | `dyspozycje/EKONOMIA-DO-MASTERA.md` | **Aktywny** | **Wchłonął MIASTO** (2026-06-25): ekonomia miasta, okolica, terytorium, oblężenie (flaga), Wealth. Model: `EKONOMIA/EKONOMIA-model-scalony.md`. |
| **MIASTO** | `dyspozycje/MIASTO.md` | `dyspozycje/MIASTO-DO-MASTERA.md` | **Scalony → EKONOMIA** | Kod nadal w `cities.ts`, `production.ts` itd., ale koordynacja i raporty idą przez EKONOMIA. Ostatni wpis MIASTO: **2026-06-25**. |
| **UNITS** | `dyspozycje/UNITS.md` | `dyspozycje/UNITS-DO-MASTERA.md` | **Aktywny** | Bitwa, oblężenie, modele jednostek. Folder: `Civ-UNITS/`. Ostatni wpis: **2026-06-25** (kontrakty w `_handoff/` z **2026-06-26**). |
| **UI** | `dyspozycje/UI.md` | `dyspozycje/UI-DO-MASTERA.md` | **Aktywny** | v0.1 komplet. Folder: `UI/`. Ostatni wpis: **2026-06-26** (minimapa, drzewko). |
| **MAPA** | `dyspozycje/MAPA.md` | `dyspozycje/MAPA-DO-MASTERA.md` | **Aktywny** | Generator świata, ruch, terytorium. Folder: `Civ-MAPA/`. Ostatni wpis: **2026-06-26 ~08:25**. |
| **CYWILIZACJE** | `dyspozycje/CYWILIZACJE.md` | `dyspozycje/CYWILIZACJE-DO-MASTERA.md` | **Aktywny** | **Wchłonął DANE** (2026-06-24): `civs.json`, tech, roster 9 cyw, bonusy. **Przejął też dużo AI+dyplomacji** (buildy w `ai.ts`/`diplomacy.ts`). Folder: `Civ-CYWILIZACJE/`. Ostatni wpis: **2026-06-25 15:00**. |
| **DANE** | `dyspozycje/DANE.md` | `dyspozycje/DANE-DO-MASTERA.md` | **Scalony → CYWILIZACJE** | Sesja zamknięta **2026-06-24**; handoff w `CYWILIZACJE-DO-MASTERA.md` §2026-06-24 21:57. Pliki zostają (self-check `civ-dane-self-check` — do przepięcia!). Folder: `Civ-DANE/`. Ostatni wpis: **2026-06-24**. |
| **AI** | `dyspozycje/AI.md` | `dyspozycje/AI-DO-MASTERA.md` | **Legacy / częściowo CYW** | Osobny lane nadal istnieje, ale ciężka robota AI (fight/flee, ekspansja klastrowa, archetypy 7→9) poszła przez **CYWILIZACJE** od 2026-06-25. Folder: `Civ-AI/`. Ostatni wpis AI: **2026-06-24 21:15**. |
| **DYPLOMACJA** | `dyspozycje/DYPLOMACJA.md` | `dyspozycje/DYPLOMACJA-DO-MASTERA.md` | **Legacy / częściowo CYW** | Model relacji + `diplomacy.ts` rozwijane też w CYWILIZACJE (Respekt, tickDiplomacy, T1–T4). Folder: `Dyplomacja/`. Ostatni wpis: **2026-06-24 07:56**. |

**Historia scalenia (z PLAYBOOK + `docs/analiza/05-AI-CYWILIZACJE-DANE.md`):**

- **DANE → CYWILIZACJE** (2026-06-24): roster, religie, exporty Excel→JSON
- **MIASTO → EKONOMIA** (2026-06-25): ekonomia miasta, okolica, zasięgi, oblężenie (kontrakt)
- **AI + DYPLOMACJA**: lane'y formalnie istnieją, ale od 2026-06-25 **CYWILIZACJE** dostarczał buildy `ai.ts` + `diplomacy.ts` (handoffy `CYWILIZACJE-do-MASTER_diplo-ai-api.md`, `waveAB-done.md` itd.)

---

## 4. Rola `_handoff/` (~91 plików)

**Co to jest:** paczki lane→lane lub lane→MASTER, **nie** pełne chaty. Nazewnictwo: `<OD>-do-<DO>_<temat>.md`.

**Typy:**

| Wzorzec | Znaczenie | Przykład |
|---|---|---|
| `*-do-MASTER_*` | Gotowe do wpiecia / decyzja dla MASTER | `UNITS-do-MASTER_kontrakt-walka-multi.md` |
| `*-do-SILNIK_*` | Instrukcja wpiecia (legacy, teraz MASTER) | `MIASTO-do-SILNIK_integracja.md` |
| `EKONOMIA-do-UI_*` | Kontrakt cross-lane | `EKONOMIA-do-UI_okolica-nastroje.md` |
| `BRIEF-UX_*` | Brief UX (Maciej/master) | `BRIEF-UX_faza-rozstawiania.md` |

**README:** `dyspozycje/_handoff/README.md` — zasady jednokierunkowości.

**Podział `_handoff/` po nadawcy (szacunek):**

- EKONOMIA→*: ~25
- UNITS→*: ~18
- CYWILIZACJE→*: ~15
- MAPA→*: ~12
- UI→*: ~12
- MIASTO→*: ~10
- AI→*: 1 (`AI-do-MASTER_zaleznosci.md`)
- BRIEF-UX: 2

---

## 5. Wszystkie `*-DO-MASTERA.md` — ostatnia data

| Plik | Ostatni widoczny wpis |
|---|---|
| `UI-DO-MASTERA.md` | **2026-06-26** (minimapa, drzewko bez przecięć) |
| `MAPA-DO-MASTERA.md` | **2026-06-26 ~08:25** (generator świata, defaulty nowej gry) |
| `EKONOMIA-DO-MASTERA.md` | **2026-06-26** (Warsztat oblężniczy=Żelazo, lazaret fix) |
| `UNITS-DO-MASTERA.md` | **2026-06-25** (QA verify, galeria 46 jednostek) |
| `CYWILIZACJE-DO-MASTERA.md` | **2026-06-25 15:00** (T1–T4 zamknięte, bonusy) |
| `MIASTO-DO-MASTERA.md` | **2026-06-25** (splitOutput, auto-manage) |
| `SILNIK-DO-MASTERA.md` | **2026-06-24 16:55** (handover do MASTER) |
| `DANE-DO-MASTERA.md` | **2026-06-24** (porządki Civ-DANE/, sesja zamknięta) |
| `AI-DO-MASTERA.md` | **2026-06-24 21:15** (profil AI zostaje w panelu AI) |
| `DYPLOMACJA-DO-MASTERA.md` | **2026-06-24 07:56** (reorg do Dyplomacja/) |
| `SILNIK/SILNIK-HANDOVER-DO-MASTERA.md` | **2026-06-24** (pełny handover sesji SILNIK) |

---

## 6. Foldery lane'ów (dokumentacja + panele Excel)

| Folder | Lane | Uwaga |
|---|---|---|
| `Civ-AI/` | AI | Spec, AI-parametry.xlsx |
| `Civ-CYWILIZACJE/` | CYWILIZACJE | PROPOZYCJA-dyplomacja-AI-v0.1.md |
| `Civ-DANE/` | DANE (legacy) | INDEX.md, DOKUMENTACJA-DANE |
| `Civ-MAPA/` | MAPA | Generator, podglądy HTML |
| `Civ-UNITS/` | UNITS | Galeria, Dokumentacja-UNITS-BITWA |
| `EKONOMIA/` | EKONOMIA | model-scalony, panele |
| `MIASTO/` | MIASTO (legacy) | Zasieg-miasta-okolica.html |
| `Dyplomacja/` | DYPLOMACJA | Dyplomacja.xlsx, DEV doc |
| `UI/` | UI | Spec-UI, makiety |
| `SILNIK/` | SILNIK (legacy) | ARCHITEKTURA, HANDOVER |

**Kanały dyspozycji zostają w `dyspozycje/`** (stałe ścieżki dla self-checków Claude Code).

---

## 7. Co wklejać do `raw/` vs co już jest w `dyspozycje/`

| Źródło | Gdzie jest | Czy wklejać do `raw/`? |
|---|---|---|
| Raporty lane'ów (status, Q&A) | `*-DO-MASTERA.md` | **NIE** — już skondensowane |
| Decyzje Macieja ABC | `DZIENNIK-MASTERA.md`, `docs/MACIEJ-KARTA-DECYZJI.md` | **NIE** |
| Kontrakty integracyjne | `_handoff/*-do-MASTER_*.md` | **NIE** |
| Kontrakty cross-lane | `_handoff/*-do-*_*.md` | **NIE** |
| Pełne transkrypty chatów Claude Code | **brak w repo** | **TAK, tylko te** — jeśli chcesz archiwum „surowe" |
| Chaty sprzed 22.06 (przed systemem plików) | nie znalezione | **TAK** — jeśli istnieją lokalnie |
| Self-checki / powtarzalne wpisy techniczne | końcówki `SILNIK-DO-MASTERA` (dehydratacja) | **Opcjonalnie** — niski priorytet |

**Rekomendacja:** zacznij od **braku wklejania** — `dyspozycje/` + `_handoff/` + `DZIENNIK-MASTERA.md` to już **operacyjne archiwum korespondencji**. Do `raw/` wrzucaj wyłącznie eksporty chatów, których **nie ma** w tych plikach (np. wczesne sesje, rozmowy bez raportu w DO-MASTERA).

---

## 8. Pliki pomocnicze (poza dyspozycjami)

- `dyspozycje/_ANALIZA-MATERIALY.md` — meta-analiza materiałów
- `dyspozycje/MIASTO-ZAKRES-I-PLAN.md` — plan MIASTO (legacy)
- `docs/analiza/06-DYSPOZYCJE-stan.md` — snapshot stanu **2026-06-26**
- `docs/analiza/05-AI-CYWILIZACJE-DANE.md` — synteza AI/CYW/DANE

---

## 9. Liczby końcowe

| Kategoria | Liczba |
|---|---|
| Pliki w `dyspozycje/` (bez `_handoff/`) | **23** |
| Pliki w `_handoff/` | **~91** (90 `.md` + README) |
| Pliki `*-DO-MASTERA.md` | **11** (10 w dyspozycje + 1 handover SILNIK) |
| Aktywne lane'y (dyspozycja + raport) | **7** (UI, MAPA, EKONOMIA, UNITS, CYWILIZACJE, SILNIK-legacy, MASTER) |
| Scalone / legacy | **3** (DANE→CYW, MIASTO→EKONOMIA, SILNIK→MASTER) |
| Częściowo przekazane | **2** (AI, DYPLOMACJA → CYWILIZACJE) |

**Wniosek:** System plikowy **już jest archiwum korespondencji**. Eksporty chatów do `raw/` są opcjonalne — przydatne głównie dla luk sprzed 22.06 lub rozmów bez wpisu w DO-MASTERA.
