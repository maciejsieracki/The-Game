# Handoff MAPA → UI — toggle zasięgu kultury / religii obok minimapy

**Status:** GOTOWE lane (toggle 3D + minimap UI) · **A1-Q12 overlay** UI lane 2026-07-01  
**Decyzja Maciej:** 2026-06-26 · **MAPA-F2-Q1**  
**NIE dotyczy:** treści panelu po kliku → **Grupa A** `A1-Q12`

---

## Co MAPA dostarcza

1. **Dwa kontrolki obok `#minimap-wrap`** (nie w toolbarze [C], nie w rzędzie [F2] poniżej — **obok** minimapy):
   - ikona **Kultura** — toggle ON/OFF warstwy zasięgu kultury na mapie 3D
   - ikona **Religia** — toggle ON/OFF warstwy zasięgu **religii gracza** na mapie 3D

2. **Render warstw** gdy ON:
   - heksy w zasięgu kultury imperium — overlay (kolor/obrys wg MAPA / D12)
   - heksy w zasięgu religii państwa — overlay (odróżnialny od kultury)

3. **Kontrakt (propozycja):**

```ts
interface CultureReligionMapLayers {
  getCultureRangeVisible: () => boolean;
  setCultureRangeVisible: (on: boolean) => void;
  getReligionRangeVisible: () => boolean;
  setReligionRangeVisible: (on: boolean) => void;
  /** Dane heksów do podświetlenia — MAPA liczy z territory + culture-religion */
  getCultureRangeHexes?: () => Array<{ q: number; r: number }>;
  getReligionRangeHexes?: () => Array<{ q: number; r: number }>;
}
```

---

## Co UI (lane) robi

- Montuje ikony w `minimapHud.ts` / `hud.ts` obok minimapy
- Podpina toggle → kontrakt MAPA (bez logiki zasięgu w UI)
- **Nie** implementuje treści panelu po kliku — czeka **A1-Q12** (Grupa A)

---

## DoD

- [x] Toggle zmienia widoczność overlay na [D] (Integrator F + minimapHud)
- [x] Kultura i religia wizualnie rozróżnialne (CULTURE/RELIGION_RANGE_STYLE)
- [x] Brak duplikatu w toolbarze [C] ani w górnym pasku [A] (osobne ikony przy minimapie)
- [ ] Ikony obok minimapy w mockupie D1B (Figma STOP — czeka UI 00–02)
- [ ] Grupa D / Nauka **nie** edytuje wyglądu toggle (Maciej 2026-06-26)

**Flaga:** GOTOWE (spec)
