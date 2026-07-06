# E3 — Surowce epok (D14)

> **Grupa E** · `[EKRAN: Mapa świata]` (złoża) + `[EKRAN: Logika]` · **Status:** **8=B***, **9=B** ✅ · implementacja MAPA TODO

---

## Decyzja Macieja

| ID | Decyzja | Data |
|----|---------|------|
| **D14** | **A** — DANE/MAPA definiują łańcuch żelazo/stal; EKONOMIA flaguje dostęp | 2026-06-26 |
| **ABC 8** | **B*** — miedź przy starcie Brązu; żelazo przy starcie Żelaza; **tylko Góry** | 2026-06-27 |
| **ABC 9** | **B** — złoża **niewidoczne** przed właściwą epoką | 2026-06-27 |

---

## Reguła złoż metali (ABC 8, Maciej 2026-06-27)

| Złoże | Pojawia się | Teren |
|-------|-------------|-------|
| **Ruda miedzi** | gdy kończy się **Kamień** → start **Brązu** | **Góry** wyłącznie |
| **Ruda żelaza** | gdy kończy się **Brąz** → start **Żelaza** | **Góry** wyłącznie |

**Nie** na wzgórzach ani innych biotopach. **Stal** = przetworzenie (bez osobnego złoża).

Handoff MAPA: `dyspozycje/_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md`

---

## Wykonanie

| Warstwa | Stan |
|---------|------|
| `gra/data/resources.json` | Wpisy Żelazo/Stal **OK** (weryfikacja CYW handoff) |
| `gen-helpers.ts` `DEPOSIT_RULES` | **`ruda` na Wzgorza+Góry** — **NIE zgodne** z 8=B* | MAPA **TODO** |
| Epoka → pojawienie złoża | **Zdefiniowane** (ABC 8) | MAPA + SILNIK hook awansu epoki |
| Epoka → dostęp wydobycia | reguły epoki + tech | EKONOMIA (po MAPA) |

Handoff: `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_zelazo-stal-D14A.md`

---

## Pytania otwarte

*(brak w E3 — ABC 8–9 zamknięte)*

---

## → SILNIK / MAPA / EKONOMIA

MAPA: handoff `GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` (+ **9=B** brak overlay przed epoką)  
EKONOMIA: dostęp wydobycia per epoka.
