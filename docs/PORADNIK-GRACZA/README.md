# Poradnik gracza — tracker postępu

> **Rev. E** · 2026-07-03 · **pogłębienie + przykłady liczbowe wszędzie**  
> Spis: [`PORADNIK-GRACZA-SPIS-TRESCI.md`](../PORADNIK-GRACZA-SPIS-TRESCI.md) · handoff rev D: [`HANDOFF-rev-D-2026-07-03.md`](HANDOFF-rev-D-2026-07-03.md)

Legenda: ✅ Poradnik‑L gotowy · 📋 katalog (lista + akapit) · 🔗 Wiki‑S/M

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
| `00-jak-czytac.md` | 0 | ✅ |
| `01-pierwsze-kroki.md` | I | ✅ |
| `02-mapa-swiata.md` | II | ✅ |
| `03-pasek-zasobow.md` | III | ✅ |
| `04-jednostki-mapa.md` | IV | ✅ |
| `05-budowa-mapa.md` | V | ✅ |
| `06-miasto-spoleczenstwo.md` | VI | ✅ pełny |
| `07-miasto-budowa-rekrutacja.md` | VII | ✅ |
| `08-ekonomia-imperium.md` | VIII | ✅ |
| `09-nauka-epoki.md` | IX | ✅ |
| `10-walka.md` | X | ✅ |
| `11-oblezanie.md` | XI | ✅ |
| `12-dyplomacja.md` | XII | ✅ |
| `13-cywilizacje.md` | XIII | ✅ |
| `14-ai-zagrozenia.md` | XIV | ✅ |
| `15-kultura-religia-cuda.md` | XV | ✅ |
| `16-zwyciestwo.md` | XVI | ✅ |
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
| `docs/encyklopedia/pojecia/` | 8 | ręcznie (szczęście, bunt, suwaki…) |
| `docs/encyklopedia/indeks.md` | — | indeks A–Z |

---

## Do oceny przez Macieja (po powrocie)

1. Jakość języka gracza — czy coś brzmi „technicznie"?
2. **Część VI** — pełność szczęścia / buntu / Spichlerza vs oczekiwania
3. **Katalogi** — czy każdy budynek/jednostka ma wystarczający opis (Wiki‑M można pogłębić ręcznie)
4. Braki v2 — świadomie oznaczone 🔮 w spisie

---

*Rev. E · 2026-07-03 · pogłębienie + przykłady liczbowe wszędzie · Master dokumentacja*
