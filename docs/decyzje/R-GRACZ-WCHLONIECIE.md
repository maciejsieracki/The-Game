# R-GRACZ-WCHLONIECIE — dyplomatyczne wchłonięcie miasta przez gracza

**Status:** CZEKA-NA-DECYZJĘ (ABC)  
**Data:** 2026-08-03  
**Powiązane:** `R-AI-MP-WASAL-WCHLONIECIE` Q3 (odłożone A+B) · D3-PROG-G2 (Respekt ≥ 90, nigdy nie wdrożone jako akcja) · `progWasalizacjaRespekt` = 70

## Stan dziś

| Ścieżka | Gracz |
|---------|--------|
| Wojna / oblężenie / puste miasto | TAK — przejęcie miasta |
| Wasalizacja (audiencja) | TAK — Respekt ≥ 70; miasto zostaje u partnera |
| Dyplomatyczne **wchłonięcie** | **NIE** (UI odłożone; AI→MP ma timer) |

JSON `diplomacy.json` nadal opisuje akcję 12 jako „Wasalizacja / wchłonięcie”, ale silnik robi tylko wasala.

## Szkic Macieja (2026-08-03)

Po **wasalizacji** przez okres **~10 tur** dostępna opcja wchłonięcia, z progami (np. **Respekt ≥ 90**).

## Paczka ABC `[PACZKA 1/1 — 3 pytania]`

Zobacz czat + `dyspozycje/PYTANIA-OTWARTE.md` § R-GRACZ-WCHLONIECIE.

| ID | Temat | Rekomendacja |
|----|-------|--------------|
| **R-GRACZ-WCHLONIECIE-Q1** | Kiedy dostępne | **A** — po wasalu, od tury N (domyślnie 10) |
| **R-GRACZ-WCHLONIECIE-Q2** | Progi | **A** — Respekt ≥ 90 |
| **R-GRACZ-WCHLONIECIE-Q3** | Koszt / zgoda | **A** — drogo + zgoda partnera (kontynuacja Q3 z R-AI-MP) |

**Odpowiedź Macieja:** wpisz np. `R-GRACZ-WCHLONIECIE Q1A Q2A Q3A` (albo mieszankę liter).
