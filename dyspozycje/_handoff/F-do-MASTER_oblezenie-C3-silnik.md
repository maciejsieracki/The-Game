# F → MASTER: oblężenie C3 w silniku (gotowe do testu)

**Status:** **GOTOWE DO TESTU MASTERA**  
**Data:** 2026-06-27  
**Decyzja:** C3-Q1=A (wybór Oblężaj / Szturm / Anuluj)

---

## Co w silniku (`main.ts` + moduły)

| Element | Plik | Opis |
|---------|------|------|
| **Start oblężenia** | `main.ts` | Klik wrogie miasto z murem + jednostka gracza obok → modal **Oblężaj / Szturm / Anuluj** |
| **Panel oblężenia** | `ui/siegeMapPanel.ts` | Kontynuuj (+1 tura) · Szturm→preBattle · Odwrót |
| **Wybór akcji C3-Q1=A** | `ui/cityAttackChoice.ts` | Nowy modal przy pierwszym ataku na miasto z murem |
| **Markery mapy** | `render/siegeMarker.ts` | Czerwony pierścień + etykieta HTML „OBŁĘŻENIE” |
| **Ekonomia obl.** | `turn-economy.ts` | `city.oblegane` → brak żywności z pól, zużycie magazynu |
| **Kapitulacja** | `main.ts` | Głód (magazyn=0) → **przejęcie miasta** przez oblegającego |
| **Szturm** | `main.ts` | preBattle → BattleScene 3D z murem → capture przy zwycięstwie |
| **Playtest** | `playtestWalkaMapy.ts` | Hastati 1v1 + Lucznik przy Atenach (scenariusz B) |

---

## Checklista testu Mastera

**Plik:** `Gra-podglad-PLAYTEST-WALKA.html` (po bramce F) lub `Gra-podglad-ROBOCZA.html`

| # | Scenariusz | Oczekiwane |
|---|------------|------------|
| 1 | Start playtestu | Rzym oblegany (panel AI), mapa bez crash |
| 2 | Hastati → Falanga | preBattle → bitwa 1v1 OK |
| 3 | Lucznik → klik Ateny | Modal: **Oblężaj / Szturm / Anuluj** |
| 4 | **Oblężaj** | Panel dolny, pierścień, Kontynuuj − zapasy |
| 5 | **Szturm** | preBattle → bitwa z murem |
| 6 | Głód (Kontynuuj × N) | Kapitulacja → miasto przejęte przez gracza |
| 7 | **Odwrót** | Koniec oblężenia, brak panelu |

---

## Poza zakresem v1 (lane A/C)

- Machiny oblężnicze 1/tura  
- Pełna atrycja jednostek garnizonu na mapie (dziś: licznik `garnizon`)  
- Chip 🔥 buntu (UI/MAPA B2-Q5)

---

## DoD F

- [x] C3-Q1=A modal  
- [x] Panel + markery + ekonomia  
- [x] Capture z głodu + ze szturmu  
- [x] Bramka + publish ROBOCZA (Master 2026-06-27)  
- [x] Maciej playtest OK → kanon `bf99e18b`  
- [ ] Opus review (opcjonalnie równolegle)

**Flaga:** `→ MASTER: GOTOWE-ROBOCZA` (po publish)
