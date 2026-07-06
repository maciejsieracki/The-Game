# B1 — Panel miasta: budowa i produkcja

| Pole | Wartość |
|------|---------|
| **ID** | B1 |
| **Czat** | Civ — T-B1 Panel budowa |
| **Ekran** | **Panel miasta** (nie mapa świata, nie bitwa) |
| **Status** | **CZĘŚCIOWO** — rdzeń w kodzie; B1.1=A, B1-Q2/3/11 zamknięte 2026-06-27 |
| **Było w „10”** | T5 |

---

## Co decydujesz (Maciej)

- **Produkcja** — co miasto buduje teraz, pasek postępu, ETA
- **Kolejka** — kolejne budynki/jednostki, zmiana kolejności
- **Budynki** — lista wybudowanych, poziomy compound (1.10^(lvl−1))
- **Worked tiles** — które pola pracują dla miasta (okolica)
- **Ulepszanie po epoce** — **tylko z mapy** (A4-Q1=A); panel = podgląd okolicy, bez stawiania ulepszeń

---

## Co już jest (nie pytamy ponownie)

- `cityPanel.ts` — produkcja, kolejka, okolica (podgląd)
- `production.ts`, `advanceProduction`, plaster D2=A (Praca → budynki)
- Kup jednostek za skarbiec — wpięte (SILNIK batch 2026-06-26)

---

## Decyzje zamknięte (2026-06-27)

| # | Temat | Decyzja |
|---|--------|---------|
| ~~B1.1~~ | Ulepszenia z mapy | **A** (A4-Q1=A) |
| **B1-Q2** | Wykup produkcji (rush) | **A** — zostaje budynki + jednostki |
| **B1-Q3** | Auto-zarządca ⚙ | **A** — zostaje + widać ON/OFF (podświetlenie) |
| **B1-Q11** | Ulepszenia → plony v1.0 | **A** — wszystkie 15 typów → `B1-ulepszenia-plony.md` |

---

## Lane

| Lane | Pliki |
|------|-------|
| EKONOMIA | `production.ts`, `order.ts`, `auto-manage.ts` |
| UI | `cityPanel.ts` |
| MAPA | ulepszenia terenu (D4) |

## Powiązania

- `docs/MACIEJ-KARTA-DECYZJI.md` — D4=B
- `UI/Gra-podglad-MIASTO.html` — mockup panelu
