# D-CUD2 — utrzymanie wygasłego cudu

> **Status:** 🔵 **W TRAKCIE** (Maciej **Tak — wdrażaj** 2026-06-26) · **Decyzja:** **C**

---

## Pytanie

Czy cud po epoce absolut (tylko +10 handlu turystycznego) nadal kosztuje utrzymanie ze skarbca?

---

## Decyzja Macieja

**C — Obniżone utrzymanie (50% starej stawki)**

Po wygaśnięciu bonusów utrzymanie = **połowa** wartości z pola `utrzymanie` w danych cudu (zaokrąglenie w dół, minimum 0).

Przykład: Piramidy utrzymanie 2 → po wygasnięciu **1** złoto/turę.

**Cytat:** wybór **C** w formularzu ABC (hub Master, 2026-06-26).

---

## Implementacja (Grupa D)

| Warstwa | Akcja |
|---------|--------|
| `wonders.json` `_meta.absolut.po_absolut` | `utrzymanie_wygasly: "50pct"` · opis decyzji |
| Silnik cudów | `player.era > absolut` → utrzymanie = `floor(utrzymanie / 2)` |
| Panel-D / dokumentacja | notka w opisie yield po absolut |

Powiązane: **D-CUD1** — cud zostaje; bonusy wygasają; jedyny yield = +10 handlu.

---

## Powiązania

- Pytanie kanon: `D-CUD2-pytanie-KANON.md`
- Handoff: `dyspozycje/_handoff/MASTER-do-GRUPA-D_D-CUD2-utrzymanie.md`
- Rejestr: `docs/obieg/REJESTR-DECYZJI.md` · ID **D-CUD2**
