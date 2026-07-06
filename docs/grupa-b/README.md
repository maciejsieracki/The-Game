# Grupa B — Miasto i ekonomia (katalog roboczy)

> **Jeden folder roboczy** dla czatu Grupa B. Kod gry (`gra/src/`) — osobno.  
> Charter operacyjny: `docs/czaty/GRUPA-B-MIASTO-EKONOMIA.md` · protokół ABC: `docs/decyzje/DYSPOZYCJA-STALA.md`

**Ostatnia aktualizacja:** 2026-06-27 (paczka ABC **1–11 ZAMKNIĘTA**)

---

## Status skrót

| Temat | Postęp | Uwaga |
|-------|--------|--------|
| **Paczka ABC 1–11** | **ZAMKNIĘTE** 2026-06-27 | Szczęście, okolica, rush, UI, B5, plony — patrz `B2-spoleczenstwo.md` |
| **B2** Społeczeństwo Q1–Q12 | **ZAMKNIĘTE** · lane + SILNIK wpięte | hex 🔥 → MAPA |
| **B1** Panel budowa + tech | **ZAMKNIĘTE** (1–11 + B1-tech) | **B1-tech-Q3 posterunek = ODŁOŻONE — nie pytaj** |
| **B3** Suwaki | **ZAMKNIĘTE** | — |
| **B4** Wealth + kultura/religia UI | **ZAMKNIĘTE** | 7A/8A |
| **B5** Żywność imperium | **ZAMKNIĘTE** (9A/10A) | tick `advanceEmpireFood` w lane |
| **Moc P-A** | **ZAMKNIĘTA** · w silniku | [`P-A-power-kanon.md`](../decyzje/P-A-power-kanon.md) |

**Lane B:** **GOTOWY** → **`→ SILNIK: GOTOWE`** (batch 2026-06-27) · czeka **Integrator F**.

---

## Mapa plików (czytaj w tej kolejności)

| Plik | Rola |
|------|------|
| [`STAN.md`](STAN.md) | ≤12 linii — start każdej sesji Grupy B |
| [`MACIEJ-PYTANIA-ROZWINIETE.md`](MACIEJ-PYTANIA-ROZWINIETE.md) | Pytania 1–11 — **ZAMKNIĘTE** (archiwum treści) |
| [`MACIEJ-PYTANIA-ABC.md`](MACIEJ-PYTANIA-ABC.md) | Indeks numerów (archiwum) |
| [`REGULA-ABC.md`](REGULA-ABC.md) | Reguła formatu dla agentów |
| [`USUNAC-KANDYDACI.md`](USUNAC-KANDYDACI.md) | Propozycje plików do usunięcia/archiwum |
| [`PANEL-B-SPEC.md`](PANEL-B-SPEC.md) | Spec arkuszy Excel + Status tracker |
| **decyzje/** | |
| [`decyzje/README.md`](decyzje/README.md) | Indeks plików decyzji B1–B5 (kanoniczne ścieżki) |
| **handoff/** | |
| [`handoff/README.md`](handoff/README.md) | Aktywne vs archiwalne handoffy B |

Decyzje kanoniczne pozostają w `docs/decyzje/B*.md` (nie duplikujemy — tylko indeks).

---

## Panele Excel / dane (Maciej)

| Plik | Lokalizacja | Eksport |
|------|-------------|---------|
| `Spoleczenstwo-parametry.xlsx` | `MIASTO/` | → `gra/data/society-params.json` |
| `Panel-przeglad-danych.xlsx` | `MIASTO/` | → `export-panel.py` |
| `Budynki.xlsx` | `MIASTO/` | → `buildings.json` |
| `Ulepszenia-terenu.xlsx` | `MIASTO/` | → `terrain-improvements.json` |
| `Panel-B.xlsx` | `panele-sterowania/` | → `export-b.py` |
| `Status-projektu-The-Game.xlsx` | root | arkusz **`Grupa-B`** |

Spec liczb szczęścia: `MIASTO/Spec-spoleczenstwo.md` + `society-params.json`.

---

## Raportowanie

| Kierunek | Plik |
|----------|------|
| → Master Silnik | `docs/czaty/DO-MASTERA.md` § Grupa B |
| ← Master | `docs/czaty/OD-MASTERA.md` § Grupa B |
| Lane EKONOMIA | `dyspozycje/EKONOMIA-DO-MASTERA.md` |
| Lane UI | `dyspozycje/UI-DO-MASTERA.md` |
| Dziennik | `dyspozycje/DZIENNIK-MASTERA.md` |

**Komenda Macieja:** `master` → czytaj `OD-MASTERA.md` § B.

---

## Mockupy (UI)

| Plik | Ekran | Stan |
|------|-------|------|
| `Gra-podglad-OKOLICA-UX.html` | Panel miasta Civ V (kanon UX) | aktualny |
| ~~`UI/Gra-podglad-MIASTO.html`~~ | **Usunięty** | stary layout |
| `MIASTO/Widok-miasta.html` | Referencja projektowa | starszy |
| `MIASTO/Zasieg-miasta-okolica.html` | Zasięg r5/10/15 | **Przestarzały** vs `min(pop,15)` |
