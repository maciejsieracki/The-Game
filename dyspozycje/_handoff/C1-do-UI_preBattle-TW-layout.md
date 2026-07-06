# Handoff C1-Q2 → UI (preBattle TW layout)

**Status:** Mockup **AKCEPTOWANY** Maciej 2026-06-26 — **GOTOWE** do implementacji w `preBattle.ts`  
**Nadawca:** Grupa C (decyzje)  
**Odbiorca:** UI lane (`preBattle.ts`)

---

## Co przesyłam

- Mockup: `UI/Makieta-preBattle.html` (kanoniczny; `Civ-UNITS/Makieta-przed-bitwa.html` → redirect)
- Decyzja C1-Q2: layout Total War (3 kolumny + generałowie + 4 akcje)
- Checklist: `docs/MACIEJ-C1-CHECKLIST-preBattle-TW.md`

## Co Odbiorca ma zrobić

1. Po zamknięciu **C1-Q2b…Q5** (lub równolegle) — przepisać `gra/src/ui/preBattle.ts` według mockupu
2. Rozszerzyć API:

```ts
export interface PreBattleCallbacks {
  onAuto: () => void;
  onBattlefield: () => void;
  onCancel: () => void;  // Wycofaj
  onSave?: () => void;   // NOWY — quick-save przed bitwą
}
```

3. Opcjonalnie w `PreBattleSide`: `wodz?: string`, `portretEmoji?: string` (v1 placeholder).
4. Przycisk **Wycofaj** — `disabled` gdy `canRetreat === false` (C1-Q5).
5. **NIE** edytować `main.ts` — handoff do SILNIK: podpięcie `onSave` + blur mapy w tle.

## DoD

- [ ] Layout zgodny z mockupem (generals row, 3 cols, 4 buttons)
- [ ] `showPreBattle` / `hidePreBattle` bez regresji
- [ ] Keyboard: Escape = Wycofaj (jeśli dostępne); Enter = domyślny (decyzja Macieja)
- [ ] Brak zmian w `main.ts` w tym batchu

**Flaga:** ZROBIONE (implementacja UI) · SILNIK CZEKA
