# MASTER → GRUPA F: wykonawca kodu only (2026-06-30)

| Pole | Wartość |
|------|---------|
| **Status** | **AKTYWNE** |
| **Od** | Master Orkiestrator (hub) |
| **Do** | czat Grupa F (Integrator-kod) |
| **Flaga** | CZYTAJ na `start` |

---

## Co się zmieniło

- **Hub Master** (czat z Maciejem) = plan + dyspozycje + weryfikacja — **bez kodu**, **bez `main.ts`**.
- **Ten czat Grupa F** = jedyny wykonawca integracji kodu.

Stary model „MASTER (GLM) edytuje main.ts" **wycofany**. Patrz [`docs/obieg/ROLE-2026-06-30.md`](../../docs/obieg/ROLE-2026-06-30.md).

---

## Twoje obowiązki (Grupa F)

1. Czytaj [`docs/obieg/INTEGRATOR-kolejka.md`](../../docs/obieg/INTEGRATOR-kolejka.md) na `start`.
2. Wpinaj **tylko** batche z dyspozycji Master + handoff `dyspozycje/_handoff/`.
3. Po wpięciu: bramka testów → meldunek append `dyspozycje/SILNIK-DO-MASTERA.md` → flaga **`→ MASTER: GOTOWE-ROBOCZA`**.
4. Aktualizuj sekcję **AKTUALNY KANON** (md5) w `INTEGRATOR-kolejka.md`.
5. **Nie** przyjmuj „dopnij poprawkę lane X" bez nowego handoffu od grupy źródłowej.

---

## Kolejka dziś

**PUSTA** — czekaj dyspozycji Master. Ostatni publish: md5 `2FC4DCA9E55E5FF9515A67233372EC3D`.

---

## Master ACK (2026-06-30)

Przyjęte meldunki: TW-v3-BALANS + UNIT-POWER-M-v1 + MILITARY-RATIO-M-v1 → kanon `2FC4DCA9…`.  
Szczegóły: [`docs/obieg/MASTER-WATCH.md`](../../docs/obieg/MASTER-WATCH.md).

---

## DoD

- [x] Przeczytany ten handoff + ROLE-2026-06-30 (Master ACK 2026-06-30)
- [x] Kolejka pusta potwierdzona w `INTEGRATOR-kolejka.md`
- [ ] Kolejny batch dopiero po dyspozycji Master
