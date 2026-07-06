# B1 — Wyrąb vs Tartak + tech gate ulepszeń

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | 2026-06-27 (czat Grupa B) |
| **Status** | **ZAMKNIĘTE (lane)** · silnik: F-B-PILNE + F-B-WYRAB-TARTAK ✅ · micro **F-B-TARTAK-DREWNO** czeka F |
| **Handoff** | `dyspozycje/_handoff/MAPA+EKONOMIA-do-SILNIK_wyrab-tartak-tech.md` |

---

## Wyrąb (wycinka lasu)

- **Koszt:** **0 Pracy** (darmowa akcja).
- **Tech:** **brak** — dostępny od startu na heksie z `nakladka = las`.
- **Efekt:** usuwa las; zostaje **teren bazowy** (łąka/wzgórze…).
- **Bonus tymczasowy:** **+20 Pracy / turę × 3 tury = 60** łącznie do puli Pracy gracza (miasto właściciela terytorium).
- **Po 3 turach:** heks **łyse** — bez lasu, **bez** stałego ulepszenia.

## Tartak (ulepszenie terenu)

- **Osobna pozycja** w panelu Budowa (≠ wyrąb).
- **Koszt:** **25 Pracy** (JSON).
- **Tech:** **Obróbka drewna** (tech.json).
- **Gdzie:** **ląd** w terytorium — **również na lesie** (`nakladka = las`).
- **Las:** tartak **NIE usuwa** lasu (w przeciwieństwie do wyrębu).
- **Bonus stały (obrobione pole / tileYield):**
  - **+3 Pracy** / turę (jednostki produkcji miasta z tego heksa)
  - **Drewno:** tylko **dostęp** (`surowiecOdblokowany: drewno`) — **bez** liczenia ilości w v0.1
- **Koszt budowy:** 25 Pracy (Excel + JSON zsynchronizowane).
- **Porównanie:** wyrąb = **60 Pracy jednorazowo** (3×20 temp), bez surowców; tartak = **+3 Pracy co turę** + flaga „masz drewno” dla budynków.

---

## Tech gate (panel Budowa)

- Każde ulepszenie ma pole `tech` w `terrain-improvements.json`.
- **Bez tech** → szare / nieklikalne do czasu `player.zbadane.has(tech)`.
- **Wyrąb** → zawsze aktywny (tech = null).

### Propozycja powiązań (v1.0)

| Ulepszenie | Technologia (tech.json) | Uwaga |
|------------|-------------------------|--------|
| **Wyrąb** | — | darmowy |
| **Tartak** | Obróbka drewna | NOWY wpis JSON |
| Farma | Rolnictwo* | *dodać do drzewka (patrz propozycja) |
| Pastwisko | Oswojenie zwierząt | ✓ |
| Kopalnia | Murarstwo | ✓ |
| Kamieniołom | Murarstwo | ✓ |
| Obóz łowiecki | Łowiectwo* | *dodać do drzewka |
| Łodzie rybackie | Żegluga | ✓ |
| Droga | Koło | ✓ |
| Posterunek | Brązownictwo | (JSON miał „-”) |
| Irygacja | Gospodarka wodna | alias z „Irygacja” |
| Glinianka | Garncarstwo | ✓ |
| Plantacja | Matematyka | alias z „Kalendarz” |
| Warzelnia soli | Garncarstwo | ✓ |
| Tarasy | — (tylko Inkowie) | archetyp |
| Fort | Budownictwo | ✓ |

**Do uzupełnienia w drzewku (CYWILIZACJE):** `docs/decyzje/B1-tech-ulepszenia-proposal.md`
