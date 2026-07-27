# Status wdrożenia — dla innych agentów (2026-07-28)

> **Aktualna ROBOCZA:** FALA 44 · md5 `95021308` · commit `65e3ddd` · wejście `gra-robocza/START.html` (Ctrl+F5 + Nowa gra)  
> **Źródło deploy:** `dyspozycje/WERSJE.md` · potwierdzenie: `dyspozycje/_handoff/KANAL-PRACA.md` [00:05]

## Legenda

| Symbol | Znaczenie |
|--------|-----------|
| ✅ GOTOWY | Kod w `gra/src/`, testy lane zielone |
| ✅ DEPLOY | W `gra-robocza/` w wskazanej FALI |
| ⏸ CZEKA DEPLOY | Kod gotowy lokalnie, **nie** w ostatnim publishu |
| ❌ BRAK KODU | Tylko decyzja — czeka implementacja |

---

## Ostatnie FALE (sesja 2026-07-27/28)

| FALA | md5 | Temat | Status |
|------|-----|-------|--------|
| **41** | `c1e7a596` | PYTANIE-85 żywność + podatek + ulepszenia | ✅ DEPLOY |
| **42** | `6714d76f` | Spichlerz U-12/U-25B + Garncarnia R7-C | ✅ DEPLOY |
| **43** | `33c49486` | C-OBCE-JEDN-Q2 żeton (medalion + koszary/kuźnia) | ✅ DEPLOY |
| **44** | `95021308` | C-UPGRADE-TRIGGER bonus przy wejściu do miasta + toast | ✅ DEPLOY |

---

## Decyzje zamknięte w tej sesji

| ID | Decyzja | Deploy | Pliki kluczowe |
|----|---------|--------|----------------|
| **C-OBCE-JEDN-Q2** | TW — portret/sygnet lewo + ikony koszar/kuźnia | FALA 43 | `unitOwnerMedallion.ts`, `unitPathFlankBadges.ts`, `unitUpgradeBadges.ts` |
| **C-UPGRADE-KUMULACJA** | 1A — najlepsze odwiedzone miasto (bez zmian) | wcześniej | `unit-building-bonuses.ts` |
| **C-UPGRADE-TRIGGER** | Natychmiast przy heksie miasta + toast graczowi | FALA 44 | `unit-building-bonuses.ts`, `main.ts` |
| **P84-SPICHLERZ** | U-12 Zdrowie+wzrost %; U-25B racja ×0,75/×0,50 | FALA 42 | `population-growth.ts`, `economy-upkeep.ts`, `cityPanel.ts` |
| **P84-R7C-GARN** | Nadwyżka Ceramiki → Zadowolenie | FALA 42 | `culture-religion.ts`, `cityPanel.ts` |

---

## Własność sesji — nie duplikować

| Temat | Status |
|-------|--------|
| C-OBCE-JEDN Q1–Q3 + Q2 render | ✅ w FALI 43 — **IDLE** |
| Bonus budynków — trigger + toast | ✅ w FALI 44 — **IDLE** |
| Spichlerz / Garncarnia P84 | ✅ w FALI 42 — **IDLE** |
| Generał u góry żetonu (C-OBCE-JEDN-Q2) | ⏸ poza zakresem v1 |

---

## Start sesji (checklist)

1. `git pull --ff-only origin main`
2. Przeczytaj `STAN-PRACY-HANDOFF.md` §1 + §3a-6
3. Sprawdź `ROBOCZA-MANIFEST.json` md5 = `95021308eb1eb918bc95149d6928a8ef`
4. Ostatni wpis `KANAL-PRACA.md` — FALA 44

---

## Powiązane pliki

- `STAN-PRACY-HANDOFF.md` — punkt wejścia sesji
- `docs/decyzje/C-UPGRADE-TRIGGER.md` — decyzja triggera bonusu
- `docs/decyzje/C-UPGRADE-KUMULACJA.md` — skąd bierze się %
- `docs/decyzje/C-OBCE-JEDN-Q2.md` — żeton na mapie
- `docs/MACIEJ-GOTOWE.md` — skrót dla Macieja
- Poprzedni snapshot: `docs/decyzje/STATUS-WDROZEN-AGENT-2026-07-27.md` (przestarzały — FALA 38)
