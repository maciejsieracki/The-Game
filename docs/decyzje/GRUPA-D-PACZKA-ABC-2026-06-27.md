# Grupa D — paczka ABC 2026-06-27 (pytania 4–7)

**Odpowiedź Macieja:** `4C, 5A, 6A, 7B` (+ pytania 1–3 w plikach D3/D4)

## Pytanie 4 — Porządki plików

| Decyzja | **C** — pełne porządki: lock + archiwum PROPOZYCJI + `_scalone/` tylko historia |
| Data | 2026-06-27 |
| Wykonano | lock usunięty; PROPOZYCJA → `_archiwum/`; `_scalone/README.md` = nie edytować |

## Pytanie 5 — AI per nacja (arkusze Cywilizacje.xlsx)

| Decyzja | **A** — CYWILIZACJE wpisuje wartości startowe; Maciej koryguje później w Excelu |
| Data | 2026-06-27 |
| Wykonano | seed + export → `civ-ai.json`, `civ-params.json`, `diplomacy.perNacja`; wpięcie w `diplomacy.ts` |

## Pytanie 6 — Religie 9/9

| Decyzja | **A** — re-eksport z Excelu → JSON |
| Data | 2026-06-27 |
| Wykonano | `society-params.json` uzupełniony o **Celtowie** + **Germanie** (9/9). Excel `Spoleczenstwo-parametry.xlsx` niedostępny na dysku — wpisy zsynchronizowane z `civs.json` + propozycja bonusów. Backup: `society-params.json.bak-CYWILIZACJE-2026-06-27`. |

## Pytanie 7 — Testy

| Decyzja | **B** — pomiń lokalnie; Master uruchamia w bramce ROBOCZA |
| Data | 2026-06-27 |
| Handoff | `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_testy-grupa-d-bramka.md` |
