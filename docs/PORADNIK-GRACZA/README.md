# Poradnik gracza — tracker postępu

> **Rev. G** (2026-08-04) — przejście po FALA 206–208: brak osadnika (Załóż miasto), min. 4 hex, Manpower ep1=500, Wiarygodność dyplomacji, hub badań + numery planu, pigułka miasta v1, porażka = zero miast.  
> Poprzednio **Rev. F** (2026-07-23) — 12 rozdziałów po sesji tech/Cudów/HUD/dyplomacji/rekrutacji.  
> Spis: [`PORADNIK-GRACZA-SPIS-TRESCI.md`](../PORADNIK-GRACZA-SPIS-TRESCI.md) · handoff rev D: [`HANDOFF-rev-D-2026-07-03.md`](HANDOFF-rev-D-2026-07-03.md)

Legenda: ✅ Poradnik‑L gotowy · 📋 katalog (lista + akapit) · 🔗 Wiki‑S/M

---

## Statystyka rev. G (sesja 2026-08-04)

| Element | Stan |
|---------|------|
| Rozdziały zaktualizowane (FALA 206–208) | **00, 01, 02, 05, 07, 09, 12, 14, 16** |
| Nowe hasła encyklopedii | **3** (Wiarygodność, Manpower, Założenie miasta) |
| wikiBundle | **rev-G-2026-08-04** |

---

## Statystyka rev. E (sesja 2026-07-03)

| Element | Stan |
|---------|------|
| Rozdziały Poradnik‑L (pliki 00–17 + katalogi) | **22/22** ✅ pogłębione |
| **### Przykład liczbowy** (wszystkie pliki) | **~233** sekcji / encji |
| **### Strategia gracza** + **### Typowe błędy** | **~140** par (rozdz. 00–17) |
| Katalogi encji — przykład pod każdą encją | **112** (26+50+17+19) |
| Hasła encyklopedii | **121** (26+50+17+19+9) |
| Część VI §33/§38/§39 | bufor próg **68**, tabele suwaków, scenariusz SP |
| Warstwa Wiki‑S/M | ✅ dla wszystkich haseł JSON |

---

## Pliki poradnika

| Plik | Część | Status |
|------|-------|--------|
| `00-jak-czytac.md` | 0 | ✅ rev. G |
| `01-pierwsze-kroki.md` | I | ✅ rev. G |
| `02-mapa-swiata.md` | II | ✅ rev. G |
| `03-pasek-zasobow.md` | III | ✅ |
| `04-jednostki-mapa.md` | IV | ✅ |
| `05-budowa-mapa.md` | V | ✅ rev. G |
| `06-miasto-spoleczenstwo.md` | VI | ✅ pełny |
| `07-miasto-budowa-rekrutacja.md` | VII | ✅ rev. G |
| `08-ekonomia-imperium.md` | VIII | ✅ |
| `09-nauka-epoki.md` | IX | ✅ rev. G |
| `10-walka.md` | X | ✅ |
| `11-oblezanie.md` | XI | ✅ |
| `12-dyplomacja.md` | XII | ✅ rev. G |
| `13-cywilizacje.md` | XIII | ✅ |
| `14-ai-zagrozenia.md` | XIV | ✅ rev. G |
| `15-kultura-religia-cuda.md` | XV | ✅ |
| `16-zwyciestwo.md` | XVI | ✅ rev. G |
| `17-zaawansowane.md` | XVII | ✅ |
| `28-katalog-ulepszen.md` | V katalog | 📋 17 |
| `45-katalog-budynkow.md` | VII katalog | 📋 26 |
| `57-katalog-jednostek.md` | X katalog | 📋 50 |
| `91-katalog-cudow-antyk.md` | XV katalog | 📋 19 |

---

## Enciklopedia

| Folder | Liczba | Generator |
|--------|--------|-----------|
| `docs/encyklopedia/budynki/` | 26 | `node tools/generate-encyklopedia.cjs` |
| `docs/encyklopedia/jednostki/` | 50 | ↑ |
| `docs/encyklopedia/ulepszenia/` | 17 | ↑ |
| `docs/encyklopedia/cuda/` | 19 | `python gra/tools/gen-poradnik-batch.py` |
| `docs/encyklopedia/cywilizacje/` | 9 | `python gra/tools/gen-cyw-encyklopedia.py` |
| `docs/encyklopedia/pojecia/` | 11 | ręcznie (szczęście, bunt, suwaki, Wiarygodność…) |
| `docs/encyklopedia/indeks.md` | — | indeks A–Z |

---

## Do oceny przez Macieja (po powrocie)

1. Jakość języka gracza — czy coś brzmi „technicznie"?
2. **Część VI** — pełność szczęścia / buntu / Spichlerza vs oczekiwania
3. **Katalogi** — czy każdy budynek/jednostka ma wystarczający opis (Wiki‑M można pogłębić ręcznie)
4. Braki v2 — świadomie oznaczone 🔮 w spisie

---

*Rev. G · 2026-08-04 · Civpedia FALA 206–208 · Master dokumentacja*
