# Handoff — Poradnik + Wiki rev. E (2026-07-03)

> **Rev. E** = pogłębienie treści + **przykład liczbowy przy każdej sekcji i encji**.

---

## Co się zmieniło względem rev. D

| Warstwa | Rev. D | Rev. E |
|---------|--------|--------|
| Wiki‑M | 1 akapit + dane JSON | + **Strategia**, **Typowe błędy**, **Przykład liczbowy** (tabela) |
| Poradnik § | opis mechaniki | + **Przykład liczbowy** + **Strategia** + **Typowe błędy** pod każdym `##` |
| Katalogi 28/45/57/91 | akapit per encja | + **### Przykład liczbowy** pod **każdym** budynkiem/jednostką/ulepszeniem/cudem |
| Pojęcia `pojecia/` | Wiki‑M ~200 słów | pełne tabele + 2 scenariusze liczbowe (szczęście, bunt, Spichlerz…) |

**Skala:** ~**233** bloków „Przykład liczbowy” w poradniku + **121** w encyklopedii.

---

## Wzory używane w przykładach (trudność normal)

| Temat | Wzór / liczba |
|-------|----------------|
| Próg wzrostu | **20 + N × 16** (N = pop przed awansem) |
| Spichlerz po awansie | **50%** bufora zostaje |
| Magazyn państwa | **100 ×** liczba Spichlerzy |
| Szczęście | netto ÷ SzMax (12 / 18 / 24) × 100% |
| Porządek | **0,5 × szczęście + 0,5 × prawo** |
| Suwaki | handel **70/20/10**, praca **70/30**, żywność **70/30** |
| Głód wojska | **−8%** max HP/t przy zapasach &lt; 0 |

---

## Gdzie ocenić jakość

1. **Mechanika miasta:** [`06-miasto-spoleczenstwo.md`](06-miasto-spoleczenstwo.md) §33.6, §38.6, §39.6  
2. **Pojęcie z liczeniem:** [`encyklopedia/pojecia/szczescie.md`](../encyklopedia/pojecia/szczescie.md)  
3. **Budynek:** [`encyklopedia/budynki/spichlerz.md`](../encyklopedia/budynki/spichlerz.md)  
4. **Jednostka:** [`encyklopedia/jednostki/wojownik.md`](../encyklopedia/jednostki/wojownik.md)  
5. **Katalog:** [`45-katalog-budynkow.md`](45-katalog-budynkow.md) — każdy z 26 ma podsekcję przykładu  

---

## Regeneracja po zmianie JSON

```powershell
node tools/generate-encyklopedia.cjs
python gra/tools/deepen-poradnik-rev-e.py
```

---

*Tracker: [`README.md`](README.md)*
