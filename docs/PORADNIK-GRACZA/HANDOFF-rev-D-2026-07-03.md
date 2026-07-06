# Handoff — Poradnik + Wiki rev. D (2026-07-03)

> Sesja autonomiczna (~2 h) po akceptacji modelu Wiki‑S / Wiki‑M / Poradnik‑L.

---

## Podsumowanie

Zbudowano **pełny szkielet dokumentacji gracza** z opisem **wszystkich** encji z JSON v1.0:

| Warstwa | Co powstało |
|---------|-------------|
| **Poradnik‑L** | 22 pliki — części 0–XVII + 4 katalogi |
| **Wiki‑S/M** | 121 haseł z danych gry + 8 pojęć miasta (ręcznie) |
| **Spis treści** | rev. C — pełne podpunkty (`PORADNIK-GRACZA-SPIS-TRESCI.md`) |
| **Generatory** | `tools/generate-encyklopedia.cjs`, `gra/tools/gen-poradnik-batch.py`, `gra/tools/gen-cyw-encyklopedia.py` |

---

## Wszystkie budynki (26)

Katalog: [`45-katalog-budynkow.md`](45-katalog-budynkow.md)  
Wiki: `docs/encyklopedia/budynki/*.md` — każdy z kosztem, przyrostem, tech, utrzymaniem.

---

## Wszystkie jednostki (50)

Katalog: [`57-katalog-jednostek.md`](57-katalog-jednostek.md)  
Wiki: `docs/encyklopedia/jednostki/*.md` — rola, epoka, koszt, ruch, moc pola.

---

## Wszystkie ulepszenia terenu (17)

Katalog: [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md)  
Wiki: `docs/encyklopedia/ulepszenia/*.md`

---

## Cuda Antyku (19)

Katalog: [`91-katalog-cudow-antyk.md`](91-katalog-cudow-antyk.md)  
Wiki: `docs/encyklopedia/cuda/*.md` — typ E/R, bonusy, absolut 50% utrzymania (D-CUD2).

---

## Cywilizacje v1 (9)

Poradnik: [`13-cywilizacje.md`](13-cywilizacje.md)  
Wiki: `docs/encyklopedia/cywilizacje/*.md`

---

## Miasto — społeczeństwo (priorytet jakości)

Najgłębszy rozdział: [`06-miasto-spoleczenstwo.md`](06-miasto-spoleczenstwo.md)  
Hasła: `docs/encyklopedia/pojecia/` — szczęście, porządek, bunt, bogactwo, 3 suwaki, Spichlerz (mechanika).

---

## Co można pogłębić w kolejnej iteracji

- Wiki‑M per budynek/jednostka — **strategia gracza** (dziś głównie dane + szablon)
- Drzewko tech — osobna karta per technologia (setki pozycji — poza v1)
- Apendyksy A–F jako osobne pliki (dziś tylko w spisie)
- Wklejenie Wiki‑S do tooltipów w grze (UI lane — osobna dyspozycja)

---

## Następny krok z Maciejem

1. Playtest czytelności — 2–3 rozdziały + losowy budynek/jednostka z Wiki  
2. Lista poprawek językowych  
3. Priorytet pogłębienia Wiki‑M (np. Spichlerz, Falanga, Piramidy)  
4. Decyzja: czy publikować jako stronę HTML / help in-game

---

*Tracker: [`README.md`](README.md)*
