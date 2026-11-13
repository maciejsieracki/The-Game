# Moc (Power) i jej podział na wojskowy i gospodarczy

## Metadane

| Pole | Wartość |
|------|---------|
| id | `moc-podzial` |
| tytuł | Moc (Power) — wojskowy i gospodarczy |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §74.5 |
| json_ref | `power-params.json` (skladniki), `power-objective.ts` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Moc** to liczba pokazująca siłę całego imperium: armia, ludność, miasta, technologie i budynki sumują się do jednego wyniku. W rankingu można ją oglądać jako całość, jako część **wojskową** (armia i rekruci) albo **gospodarczą** (reszta).

---

## Wiki‑M

### Składniki i punkty

Moc liczona jest jako suma składników pomnożona przez współczynniki (bez mnożnika epoki — ten jest wyłączony).

| Składnik | Punkty | Podział |
|----------|-------:|---------|
| Jednostka w armii | 2,5 | wojskowy |
| Rekrut (ekwiwalent jednostki) | 10 | wojskowy |
| Wygrana bitwa | siła pokonanego składu × 2 | gospodarczy |
| Obywatel (suma slotów populacji) | 5 | gospodarczy |
| Miasto | 50 | gospodarczy |
| Heks terytorium | 1 | gospodarczy |
| Budynek | 5 | gospodarczy |
| Technologia | 80 | gospodarczy |
| Ulepszenie terenu | 5 | gospodarczy |
| Kultura (suma miast) | 0,5 | gospodarczy |
| Jedność religii (miasta z wiarą państwa) | 25 | gospodarczy |
| Zdobycz (eliminacja wroga) | 2 | gospodarczy |

Składnik „Wygrana bitwa” liczy siłę pokonanego składu wojsk **przed walką**, pomnożoną przez 2.

### Plusy i minusy

**Dla gracza**
- Plus: Moc daje czytelny obraz, kto jest silny, i pokazuje, co warto rozbudować.
- Plus: rozbicie na wojskowy i gospodarczy pozwala ocenić, czy przewaga wynika z armii, czy z gospodarki.
- Minus: technologie i budynki są bardzo warte (80 i 5 punktów), więc rozwój gospodarczy szybko podnosi Moc nawet bez armii.
- Minus: Moc nie mówi wprost o sile do walki; to tylko wskaźnik.

**Dla AI**
- Plus: Moc określa, kto jest silniejszy w dyplomacji (z Mocy liczony jest Respekt).
- Minus: Moc to suma wielu składników; duży skok w jednym z nich (np. technologia) potrafi zmienić wynik bez zmiany armii.

### Jak Moc wpływa na dyplomację

Respekt pary to udział Mocy jednej nacji w sumie Mocy obu nacji (patrz hasło **Respekt**). Obecnie decyzje o pokoju i wojnie korzystają z **całkowitej Mocy** (ta sama miara co w rankingu); osobna siła wojskowa do tych decyzji to zasada niewdrożona (patrz niżej).

### Zasady zatwierdzone, jeszcze niewdrożone

> **DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku.** Ten blok NIE opisuje obecnego stanu gry.

- Siła militarna do wojny i pokoju jest osobną miarą: armia + rekruci + wygrane bitwy z bieżącej wojny + czasowy bonus trybutu (+10% na 10 tur). Gospodarka do niej nie wchodzi. Moc (ta z tabeli) pozostaje do rankingu i Respektu.

---

## Przykład liczbowy

Imperium z 10 miastami (500), 100 obywatelami (500), 16 technologiami (1280), 60 budynkami (300) i 10 jednostkami w armii (25) ma Moc (bez rekrutów i bitew) około 500 + 500 + 1280 + 300 + 25 = 2605. Podział: wojskowy 25, gospodarczy 2580.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §74.5

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 2.5 | `power-params.json:skladniki.jednostka_wojskowa.pkt` |
| 10 | `power-params.json:skladniki.rekrut_ekw_jednostki.pkt` |
| 2 | `kod:power-bitwy-coeff` (`power-objective.ts`, `bitwyCoeff` dla modelu `enemy_m_pre_battle`) |
| 5 | `power-params.json:skladniki.ludek.pkt` |
| 50 | `power-params.json:skladniki.miasto.pkt` |
| 1 | `power-params.json:skladniki.heks_terytorium.pkt` |
| 5 | `power-params.json:skladniki.budynki.pkt` |
| 80 | `power-params.json:skladniki.tech_zbadane.pkt` |
| 5 | `power-params.json:skladniki.ulepszenie_terenu.pkt` |
| 0.5 | `power-params.json:skladniki.kultura_imperium.pkt` |
| 25 | `power-params.json:skladniki.religia_jednosc.pkt` |
| 2 | `kod:power-zdobycze-coeff` (`power-objective.ts`, składnik „Zdobycze”) |
| 1 | `power-params.json:mnoznikEpoki.1` (mnożnik epoki wyłączony, wszystkie epoki = 1) |

Uwaga: `skladniki.wygrana_bitwa.pkt` (25) jest nieaktywne; aktywny współczynnik bitwy jest w kodzie (patrz wiersz `power-bitwy-coeff`).

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Zasady niewdrożone: DECYZJA WŁAŚCICIELA 2026-11-13. Podział wojskowy/gospodarczy: `power-params.json` (flaga `wojskowy`), filtr w `power-ranking.ts`.
