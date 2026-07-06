# Porządek

## Metadane

| id | `porzadek` |
| tytuł | Porządek |
| kategoria | Miasto i społeczeństwo |
| poradnik_ref | Część VI §36 |
| json_ref | `society-params.json` → `porzadek` |

---

## Wiki‑S

**Porządek** łączy **szczęście** i **prawo** (po 50% wagi każde na normal). Od progu zależą kary ekonomiczne i ryzyko **buntu** — nie tracisz miasta, ale produkcja i wzrost spadają.

---

## Wiki‑M

### Wzór (normal)

**Porządek % ≈ 0,5 × szczęście % + 0,5 × prawo %**

Oba składniki mają własne rozpiski w panelu. **Prawo** podnoszą: wojsko w mieście, sąd, pretorium, niski bunt.

### Progi (orientacyjnie)

| Porządek | Stan | Efekt |
|----------|------|-------|
| ≥ 90% | Ład | bonus pracy i handlu ×1,10 |
| 70–89% | Spokój | normalna gra |
| 50–69% | Napięcie | praca ×0,95 |
| 30–49% | Niepokój | plony ×~0,85, wzrost ×0,75, chip buntu |
| 10–29% | Bunt | kary + migracja ~5%/t |
| 0–9% | Bunt skrajny | grace **2 tury** → rebelia AI |

**Powiązane:** [[Szczęście]] · [[Bunt]] · Garnizon

---

## Przykład liczbowy

**Miasto:** szczęście **56%**, prawo **70%** (garnizon + sąd).

**Porządek = 0,5×56 + 0,5×70 = 28 + 35 = 63%** → tier **Napięcie**.

**Efekt:** produkcja pracy **×0,95**. Miasto dawało **20 pracy/t** → teraz **19 pracy/t** (−1/t). W **10 turach** tracisz **10 pracy** — jakby jedna budowa była dłuższa o turę.

**Podniesienie:** szczęście z 56% → **70%** (teatr, niższe podatki): Porządek = 0,5×70 + 0,5×70 = **70%** → **Spokój**, bez kary ×0,95.

**Prawo bez szczęścia:** szczęście **20%**, prawo **90%** → Porządek = 0,5×20 + 0,5×90 = **55%** — wciąż Napięcie. **Trzeba obu dźwigni.**

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/06-miasto-spoleczenstwo.md` §36
