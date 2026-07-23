# Bród (Ford) w bitwie

## Metadane

| id | `brod` |
| tytuł | Bród (Ford) w bitwie |
| kategoria | Jednostki i walka |
| poradnik_ref | Część X (Walka) |
| json_ref | `combat-params.json` (`brod`) |

---

## Wiki‑S

**Bród** to przejście przez rzekę na planszy bitwy taktycznej. Jednostka brodząca: **ruch ×0,5** (połowa szybkości) i **−25% do ataku i obrony**, dopóki walczy stojąc w brodzie. Obrońca stojący na suchym brzegu, gdy atakujący brnie w sąsiadującym brodzie, dostaje **+15% obrony** („obrona brzegu").

---

## Wiki‑M

### Mechanika (`battleScene.ts`, dane `combat-params.json` → `brod`)

| Parametr | Wartość | Efekt |
|----------|---------|-------|
| `ruchMult` | **0,5** | Wejście na/z heksu brodu kosztuje **2×** normalnego ruchu (dodatkowo do zwykłej tabeli kosztu terenu) |
| `karaAtak` | **0,25** | **−25% Atak** dla jednostki walczącej stojąc w brodzie |
| `karaObrona` | **0,25** | **−25% Obrona** dla jednostki walczącej stojąc w brodzie |
| `bonusObronaBrzegu` | **0,15** | **+15% Obrona** dla jednostki broniącej suchego brzegu, gdy jej atakujący brnie w sąsiadującym brodzie |

Kara ruchu i kara walki są **niezależne** i się kumulują z resztą modyfikatorów terenu (nie zastępują tabeli kosztu ruchu, tylko dokładają mnożnik). Efekt uruchamia się **wyłącznie na planszach z rzeką/brodem** — bitwy bez brodu (brak presetu rzeki) zachowują się dokładnie jak dawniej (zero regresji).

### W UI bitwy

Etykieta na jednostce: „**W brodzie: −25% atak/obrona, ruch ×0,5**" (czerwonawy kolor) gdy jednostka stoi w brodzie, albo „**Obrona brzegu: +15% obrony**" (zielonkawy) gdy broni brzegu sąsiadującego z brodem.

### Strategia gracza

- **Atakujący:** unikaj walki *stojąc w* brodzie — przejdź na drugi brzeg i dopiero wtedy atakuj (kara znika, gdy nie stoisz w wodzie).
- **Obrońca:** trzymaj linię **na brzegu** naprzeciw brodu — dostajesz premię obrony, a atakujący traci ruch i siłę wchodząc w wodę. Bród to naturalne „wąskie gardło" — broń go jak przeprawy mostowej.
- Kawaleria/rydwany na tafli brodu tracą przewagę mobilności (ruch ×0,5) — dobry moment na kontratak piechotą.

**Powiązane:** Walka · Teren bitwy · Rzeka

---

## Przykład liczbowy

Jednostka o **Ataku 20** wchodzi w bród i atakuje: efektywny atak = 20 × (1 − 0,25) = **15**.

Obrońca o **Obronie 16** na brzegu, atakowany przez jednostkę brnącą w sąsiednim brodzie: efektywna obrona = 16 × (1 + 0,15) = **18,4**.

Ruch **4** (piechota w bitwie) wchodząc na heks brodu: koszt wejścia liczony normalnie z tabeli terenu, **dodatkowo ×2** za bród — dwa razy wolniej niż po suchym lądzie.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/10-walka.md` (rozdział Walka — sekcja terenu)

---

## Historia / decyzje

Decyzja **C-BTL-BROD-Q1, wariant C** — mechanika brodu na planszy bitwy taktycznej, niezależna liczbowo (ale dziś tożsama wartościowo) od starszego, świata-poziomu `river_attack_mult` używanego w `resolveCombat`/instant-resolve poza bitwą taktyczną; oba mogą być strojone osobno w przyszłości. Hasło dodane 2026-07-23 (audyt CIVPEDII) — mechanika działała w grze, ale nie miała dotąd hasła w encyklopedii.
