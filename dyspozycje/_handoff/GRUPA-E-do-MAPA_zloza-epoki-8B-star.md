# GRUPA-E → MAPA (+ EKONOMIA): złoża metali per epoka (ABC 8=B*)

> **Status:** CZEKA lane MAPA  
> **Decyzja Macieja:** 2026-06-27 · pyt. **8 = B*** (rozszerzona reguła)

---

## Reguła produktowa (kanon)

### Moment pojawienia się na mapie

| Złoże | ID techniczne (propozycja) | Aktywacja |
|-------|---------------------------|-----------|
| **Ruda miedzi** | `miedz` lub rozdzielenie od generycznej `ruda` | Przy **wejściu w epokę Brąz** (koniec Kamienia) |
| **Ruda żelaza** | `zelazo` | Przy **wejściu w epokę Żelazo** (koniec Brązu) — **nie wcześniej** |

- Złoża **nie leżą** na mapie od generacji w poprzedniej epoce (albo są niewidoczne do momentu awansu — **pyt. 9 OTWARTE**; preferencja z 8: *pojawiają się* przy granicy epok).
- **Stal** — przetworzenie z żelaza (D14); **osobne złoże stali nie** (bez ABC).

### Teren — wyłącznie góry

```
allowedOn: h.terenBazowy === TerenBazowy.Gory
```

- **Wykluczone:** Wzgorza, Równina, Laka, Pustynia, Wybrzeże, Morze…
- Dotyczy **miedzi i żelaza** (nie zmieniać gliny/koni/owiec bez osobnej decyzji).

---

## Co MAPA ma zrobić

1. Rozdzielić generyczną regułę `ruda` (Wzgorza+Góry) na:
   - **miedź** — tylko Góry, spawn/reveal epoka ≥ 2
   - **żelazo** — tylko Góry, spawn/reveal epoka ≥ 3
2. Albo: trzymać współrzędne w seed, ale **nakładka widoczna** dopiero przy `awansEpoki` (kontrakt z SILNIK/EKONOMIA).
3. Test generatora: `tools/` — heksy miedzi tylko `Gory`; zero miedzi/żelaza przed epoką na smoke.
4. Sync z `resources.json` (Żelazo = złoże Ruda żelaza; Brąz z Huty = miedź).

---

## Co EKONOMIA ma zrobić (handoff cross-lane)

- Flaga **dostęp do wydobycia** per epoka (boolean v0.1).
- Huta / Kuźnia żelaza — prereq tech bez zmiany produktowej.

---

## Kod dziś (delta)

| Element | Stan | Delta |
|---------|------|-------|
| `DEPOSIT_RULES` `ruda` | Wzgorza **+** Góry, od gen. | **ZMIEŃ** → miedź/żelazo, **Góry only**, epoka |
| `zelazo` w rules | brak | **DODAJ** |
| `resources.json` | OK | bez zmiany |

---

## DoD

- [ ] Kamień t=1: **brak** widocznych złoż miedzi/żelaza na mapie
- [ ] Awans Brąz: **pojawia się** ruda miedzi **tylko na Górach**
- [ ] Awans Żelazo: **pojawia się** ruda żelaza **tylko na Górach**; miedź bez regresji
- [ ] **Zero** rud metali na Wzgorzach
- [ ] Meldunek MAPA-DO-MASTERA + aktualizacja `E3-surowce-epoki.md`

**Flaga:** **→ INTEGRATOR: GOTOWE** (MAPA 2026-06-29)
