# MAPA → MASTER — handoff zbiorczy (2026-07-03)

**Status:** GOTOWE · **Maciej:** OK (obwódka miast) · **Kolejny krok MASTER:** Opus review → kanon

---

## 1. Obwódka miast na mapie świata ✅ Maciej OK

**Cel:** czytelność miast w terenie (nie dotyczy overlay okolicy w panelu miasta).

| Relacja | Kolor |
|---------|--------|
| Gracz | `#7EC8E8` jasnoniebieski |
| Wojna | `#FF4444` czerwony |
| Neutral | `#5CB85C` zielony |
| Sojusz | `#1A4A8A` ciemnoniebieski |

**Pliki:** `gra/src/render/cityMapOutline.ts` · `cities.ts` · `main.ts` (`cityMapOutlineKindForOwner`, `refreshCityMapOutlines` w `setDiploRelation`)

**Szczegóły:** `_handoff/MAPA-do-MASTER_obwodka-miast-mapa_2026-07-03.md`

---

## 2. Żeton ludność + wojsko nad miastem

**Cel:** nad modelem miasta — `👥` populacja; nad nią `⚔` N gdy jednostki na heksie.

**Pliki:** `gra/src/render/cityMapStatChip.ts` · `cities.ts` (`syncStatChips`) · `main.ts` (`getUnitCountOnHex`, sync po ruchu jednostek)

---

## 3. P0 regresje terenu (playtest — werdykt A nadal otwarty)

**Zakres:** D-B2 las/dżungla · D-COAST-2 · woda na lądzie · hex pod miastem · obwódka zasięgu okolicy · D-RUDY miedź→Wzgórza (gen)

**Pliki:** `mapRenderStyle.ts` · `gen-helpers.ts` · `scene.ts` · `rangeOverlay.ts` · `cityOkolicaOverlay.ts` · `main.ts` (`reapplyCityHexDecorHides`)

**Testy ostatnie:** map-coast-buffer **91/91** · logic **203/203** · smoke baseline-red (znany)

**Maciej:** Ctrl+F5 + **nowa gra** → werdykt faz A/B/C brzegu

---

## MASTER — checklist

- [ ] Playtest zbiorczy `Gra-podglad.html` (już zbuildowany playtest)
- [ ] **Opus Ask** — adversarial przed oficjalnym kanonem
- [ ] Po APPROVE: potwierdzić md5 kanonu w DZIENNIKU
- [ ] Jeśli Maciej zamknie fazę A → domknąć wpis BLOCK A w DZIENNIKU
- [ ] **Brak dalszych zmian `main.ts`** w tym batchu (hooki już wpięte)

## Zmiany SILNIK (`main.ts`) — już zrobione w tym batchu

| Hook | Po co |
|------|--------|
| `getUnitCountOnHex` / `syncStatChips` | żeton wojska nad miastem |
| `getMapOutlineKind` / `refreshCityMapOutlines` | obwódka dyplomacyjna |
| `reapplyCityHexDecorHides` | hex terenu pod miastem po rebuild |

---

*Handoff od sesji MASTER/Maciej 2026-07-03 · lane MAPA + hooki SILNIK*
