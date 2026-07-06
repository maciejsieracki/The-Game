# C1 → MAPA (+ C3, SILNIK): kiedy preBattle vs oblężenie na mapie

**Data:** 2026-06-26  
**Od:** Grupa C (decyzja Macieja C1-Q1)  
**Do:** MAPA, C3 (Grupa C), Master Silnik (`main.ts`)  
**Status:** GOTOWE — spec produktowa; implementacja po C3/C1 batchach

---

## Decyzja Macieja (C1-Q1 = A + doprecyzowanie)

**Ekran preBattle (`preBattle.ts`) — ZAWSZE**, gdy dochodzi do **faktycznej bitwy** (rozstrzygnięcie walki):

| Sytuacja | preBattle? | Co na mapie świata |
|----------|------------|-------------------|
| Gracz atakuje **jednostkę/wroga** na heksie | **TAK** | — |
| **Wróg atakuje gracza** (jednostka / armia) | **TAK** (symetria) | — |
| Gracz atakuje **miasto z murem** — tylko **oblężenie** (blokada, głód, machiny), **bez szturmu** | **NIE** | **Stan oblężenia** na mapie (C3): flaga, panel, machiny, tura oblężenia |
| Kapitulacja miasta (zapasy = 0) | **NIE** (auto przejęcie) | Animacja / komunikat na mapie |
| Gracz lub wróg uruchamia **szturm** (przycisk Szturm / jawna akcja) | **TAK** → potem C2 | Oblężenie trwa do momentu szturmu |
| Atak **miasta bez muru** | **TAK** (od razu starcie jak potyczka) | — |

**Zasada jednym zdaniem:** preBattle = most do bitwy; **oblężenie bez szturmu = wyłącznie warstwa mapy świata (C3)**, bez overlay preBattle.

---

## Co MAPA ma pokazać (oblężenie bez preBattle)

Na **mapie świata** (strategicznej), gdy `city.oblegane === true` i **nie** ma aktywnego szturmu:

1. **Wizualnie:** obóz / pierścień wokół miasta, ikona oblężenia, kolor frakcji oblegającego (szczegóły w C3-Q*).
2. **Bez** otwierania `preBattle.ts` ani `battleScene` — gracz zarządza turami oblężenia z mapy.
3. **Panel oblężenia** (overlay na mapie — C3, UNITS dane): machiny 1/turę, status zapasów, atrycja, akcje: Kontynuuj / **Szturm** / Odwrót.
4. Dopiero **Szturm** → `showPreBattle` (C1) → opcjonalnie Pole bitwy (C2).

Referencja kontraktu startu: `UNITS-do-MASTER_kontrakt-start-oblezenia.md` (jawna akcja szturmu gracza vs auto-blokada AI).

---

## Co SILNIK wpina w `main.ts`

- Gałąź **atak miasta z murem:** jeśli gracz wybiera **Oblężaj** (nie szturm) → **nie** wołać `showPreBattle`.
- Gałąź **szturm / potyczka polowa / wróg atakuje gracza** → **zawsze** `showPreBattle` przed resolve/battleScene.
- Spójność z C4 D8 (posiłki) przy szturmie — skład z mapy w `PreBattleInfo`.

---

## DoD (MAPA + C3)

- [ ] Render stanu oblężenia na heksie miasta (bez preBattle)
- [ ] Panel C3 czytelny na mapie świata
- [ ] Szturm z panelu → dopiero C1 preBattle
- [ ] Test: oblężenie 3 tury bez overlay; szturm → preBattle

— Grupa C → MAPA / Master Silnik
