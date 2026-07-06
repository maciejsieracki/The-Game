# EKONOMIA → GRUPA D: Moc (Power P-A) **GOTOWE** — możecie liczyć dyplomację

**Data:** 2026-06-26  
**Status:** 🟢 **ODBLOKOWANE** — moduł Moc w silniku + Panel-B · Respekt = ratio Mocy  
**Od:** EKONOMIA / MASTER (na prośbę Macieja)

---

## TL;DR dla Grupy D

**Nie czekacie już na Power.** Możecie:

1. **Liczyć scenariusze dyplomacji** (Respekt %, progi wasalizacji, AI) na kanonie P-A.
2. **Kręcić balans w Panel-D** (`diplomacy.json`, `ai-params.json`) — progi, delty Zaufanie/Respekt, AI per nacja.
3. **Kręcić skalę Mocy w Panel-B** (Grupa B) — wpływa pośrednio na Respekt przez stosunek sił.

**Nie edytujcie** starych wag „Potęgi 0–100” w `diplomacy.json` → sekcja `panel_sterowania.A` / `respekt_-_czynniki` — **legacy dokumentacja**, silnik tego nie używa od v1 Mocy.

---

## Dwa pojęcia (kanon Macieja)

| Pojęcie | Skala | Gdzie w Excelu | Wzór |
|---------|-------|-----------------|------|
| **Moc** (PL UI) / **Power** (kod) | absolutna (~3020 duże imperium ep.1) | **Panel-B** `Potega-P-A` | suma 9 składników × pkt |
| **Respekt** | 0–100 **relatywny** | **Panel-D** `Dyplomacja` | `round(100 × Moc_A / (Moc_A + Moc_B))` |

- **50** = parytet sił  
- **>50** = ja silniejszy od rozmówcy  
- **<50** = ja słabszy  

Asymetria: `Respekt(A→B) + Respekt(B→A) = 100`.

---

## Współczynniki Mocy (P-A — Panel-B, nie Panel-D)

| Składnik | pkt | Miara w grze |
|----------|-----|--------------|
| Armia | 25 | jednostki na mapie (opcja: bez osadnika — `Potega-opcje`) |
| Wygrane bitwy | 25 | kumulatywne wygrane |
| Ludki | 5 | suma slotów populacji |
| Rekruci | 5 | ekw. jednostek (`floor(rekruci/koszt_werbu)`) |
| Miasta | 50 | liczba miast |
| Terytorium | 0,5 | heksy w zasięgu |
| Budynki | 5 | wybudowane |
| Tech | 20 | zbadane |
| Ulepszenia | 5 | w terytorium |

**Kalibracja:** ep.1, 10 miast, ~100 ludków → **Moc ≈ 3020** (`node gra/tools/power-objective-test.cjs`).

**Wyłączone (nie wracać):** mnożnik × epoka (P-B) · wagi per-cyw (Cyw-12 usunięte z macierzy).

---

## Co liczy silnik dziś (dla Waszych symulacji)

```
Moc_gracza = computeObjectivePower(...)     // power-objective.ts
Moc_AI     = computeObjectivePower(...)
Respekt_gracza_wobec_AI = computeRespekt(Moc_gracza, Moc_AI)
Respekt_AI_wobec_gracza = computeRespekt(Moc_AI, Moc_gracza)
```

Pliki: `gra/src/game/power-objective.ts`, `gra/src/game/diplomacy.ts` (`computeRespekt`), `gra/src/main.ts` (cache co turę).

**Dominacja (zwycięstwo 10=A*):** udział Mocy gracza > 50% sumy Mocy wszystkich — też na objective Moc (Panel-D arkusz Zwycięstwo: `prog_dominacji_power`).

---

## Panel-D — **Wasz** zakres balansu dyplomacji

| Arkusz Panel-D | JSON | Przykłady parametrów |
|----------------|------|----------------------|
| **Dyplomacja** | `diplomacy.json` → `params` | `startRespekt`, `progWasalizacjaRespekt`, `progWchloniecieRespekt`, delty bitwa/trybut/przewaga |
| **Dyplomacja-per-nacja** | `diplomacy.json` per cyw | skłonność sojusze, próg wojny, otwartość handel |
| **Dyplomacja-akcje** | akcje + koszty | T1–T4, trybut, NAP, sojusze |
| **AI-zachowanie** | `ai-params.json` | ekspansja, dyplomacja AI, wycofanie |
| **Zwycięstwo** | `victory.ts` stałe / docelowo JSON | próg dominacji Power % |

**Eksport:** w czacie D → **`eksportuj panel`** → `python panele-sterowania/export-d.py`

**Symulator Mocy (Excel, bez eksportu do gry):** `docs/decyzje/POWER-kalkulator-Maciej.xlsx`  
**Respekt w Excelu:** `Respekt = 100*Moc1/(Moc1+Moc2)` — wklej Moc z kalkulatora lub z playtestu.

---

## Panel-B — tylko gdy chcecie zmienić **skalę siły** (nie progi dyplo)

| Arkusz | Efekt na dyplomację |
|--------|---------------------|
| Potega-P-A | większe pkt → szybszy wzrost Mocy → wyższy Respekt vs słabszych |
| Potega-opcje | osadnik w armii, etykieta HUD |
| Manpower-epoki | rekruci → składnik ekw. jednostek |

Eksport: **`eksportuj panel`** (Grupa B) → `export-b.py` → `power-params.json`.

---

## Specyfikacja (czytaj zamiast starego SPEC-Respekt warstwa 1)

| Dokument | Rola |
|----------|------|
| `dyspozycje/_scalone/EKONOMIA/EKONOMIA-POWER-RESPEKT-SPEC.md` | **KANON** Moc + Respekt |
| `docs/decyzje/P-A-power-kanon.md` | decyzja Macieja P-A |
| `docs/decyzje/P-C3-moc-power-nazwa.md` | UI **Moc**, kod Power |
| `Civ-CYWILIZACJE/SPEC-Respekt.md` | ⚠️ **warstwa 1 przestarzała** (Potęga 0–100) — ratio-share w warstwie 2 nadal aktualne |

Integrator: `dyspozycje/_handoff/EKONOMIA-do-INTEGRATOR_moc-v1-GOTOWE.md`

---

## Testy (odniesienie przy tuningu)

| Test | Wynik |
|------|-------|
| `power-objective-test.cjs` | 9/9 |
| `diplomacy-test.cjs` | 135/135 |
| `victory-test.cjs` | 12/12 |

Po zmianie Panel-D: `node gra/tools/diplomacy-test.cjs` + round-trip `test-panel-d-roundtrip.py`.

---

## Zadania rekomendowane dla Grupy D (teraz)

1. **Excel / symulator:** scenariusze 2–3 nacji — Moc absolutna → Respekt % → czy progi 70/90 (wasalizacja/wchłonięcie) mają sens.
2. **Panel-D:** tuning `startRespekt`, delty jednorazowe, progi AI (`aiDiplomacyStance` — willingness vs Respekt/Zaufanie).
3. **D3-UX:** handoff `CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md` — **bloker Power zdjęty**.
4. **NIE** przywracać Cyw-12-POTEGA w macierzy (decyzja Macieja: tylko globalne współczynniki).

---

## Flagi

- **EKONOMIA → GRUPA D:** 🟢 GOTOWE — liczcie dyplomację  
- **GRUPA D → MASTER:** ✅ tuning v1 2026-06-26 — `D3-moc-respekt-tuning-scenariusze.md`  
- **GRUPA D → INTEGRATOR:** 🟢 `CYWILIZACJE-do-INTEGRATOR_diplomacy-power-ready.md`
