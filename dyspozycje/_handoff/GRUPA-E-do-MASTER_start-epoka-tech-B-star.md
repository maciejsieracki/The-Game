# GRUPA-E → MASTER (SILNIK): start epoki + tech wcześniejszych (ABC 2=B*)

> **Status:** CZEKA — wpiecie batch E1 **ABC 1–4** (priorytet P0)  
> **Decyzje Macieja:** 2026-06-27 · patrz `docs/grupa-e/decyzje/E1-nowa-gra.md`

---

## Co przesyłam

**Reguła produktowa (kanon):**

| `epochId` w kreatorze | `player.era` | `player.zbadane` na starcie |
|----------------------|--------------|-------------------------------|
| `kamien` | 1 | **pusta** — badasz Kamień od zera |
| `braz` | 2 | **wszystkie** tech z `tech.json` gdzie `Epoka === "Kamień"` |
| `zelazo` | 3 | **wszystkie** tech gdzie `Epoka === "Kamień"` **lub** `"Brąz"` |

- W **wybranej** epoce gracz **nie** dostaje tech z tej epoki — bada od zera.
- **Brak** starter-packa jednostek/budynków — odblokowania wyłąnie przez zbadane tech (istniejący `production.ts`).
- v1.0: tylko epoki z menu (`kamien`, `braz`; `zelazo` gdy odblokowane).

**Źródło epok w danych:** pole `"Epoka"` w `gra/data/tech.json` (Kamień / Brąz / Żelazo).

---

## Co MASTER ma zrobić

1. W `doStartGame` (po resecie `player.zbadane` z ABC **1=A**):
   - wywołać helper np. `grantTechEpokWczesniejszych(data.tech, epochId)` → uzupełnić `Set<string>` id tech.
2. Mapowanie id tech: jak w `research.ts` / loader (pole `Technologia` → slug/id — użyć istniejącej konwencji projektu).
3. **Nie** dodawać jednostek startowych poza obecnym flow (osadnik gracza, rywale AI).

---

## DoD

- [ ] Nowa gra **Brąz**: HUD Epoka 2, picker badań pokazuje tylko tech Brązu (Kamień ukryty/zbadany), produkcja budynków/jednostek kamiennych **dostępna**.
- [ ] Nowa gra **Kamień**: bez zmian vs dziś (pusta lista tech).
- [ ] **3=A:** Ziemia — bez zmiany generatora (weryfikacja smoke).
- [ ] **4=A:** menu rywali ±1 — bez zmiany UI (weryfikacja Standard 5–7).
- [ ] Test regresji: `node tools/research-test.cjs` (jeśli dotyczy) + smoke start Brąz.
- [ ] Po wpieciu: meldunek w `SILNIK-DO-MASTERA.md` + aktualizacja `E1-nowa-gra.md` (kod TODO → GOTOWE).

**Cross-lane:** audyt cywilizacji startowych → **Grupa D** (`docs/grupa-e/handoff/E1-do-GRUPA-D_cywilizacje-startowe.md`) — może iść równolegle; nie blokuje tech B*.

**Flaga:** **WPIĘTE** SILNIK 2026-06-27 (F-E1 grantTech w doStartGame)
