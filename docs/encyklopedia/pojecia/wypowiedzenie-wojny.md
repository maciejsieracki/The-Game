# Wypowiadanie wojny

## Metadane

| Pole | Wartość |
|------|---------|
| id | `wypowiedzenie-wojny` |
| tytuł | Wypowiadanie wojny |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §79.1 |
| json_ref | `diplomacy-war-peace-params.json`, `war-rules-params.json`, `diplomacy.json` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Wojnę wypowiada się** wobec innej cywilizacji. Gracz decyduje sam; AI wypowiada wojnę, gdy spełni swoje warunki (relacja poniżej progu, przewaga siły, wiek gry). Wojna wymuszona przez epokę ma własne zasady startu.

---

## Wiki‑M

### Kiedy AI może wypowiedzieć wojnę

Próg wojny zależy od profilu cywilizacji: wyjściowo **10**, rośnie do **70** wraz z jej skłonnością do wojny, ekspansją i podboju (granice 10–70). Próg kryzysu to próg wojny **minus 15**. Gdy Relacja spada poniżej progu kryzysu, rozpoczyna się **hamulec relacji**: licznik kryzysu trwa od 3 do 7 tur (zależnie od profilu) i dopiero po nim AI może wypowiedzieć wojnę.

### Bramki wojen wymuszonych przez epokę

- Wojny wymuszone przez epoki (Kamień, Brąz, Żelazo) startują dopiero od **tury 40** (licząc od wejścia właściciela w epokę).
- W epoce **Kamienia** może trwać tylko **jedna** wojna naraz.
- Każda cywilizacja może mieć **jedną** wymuszoną wojnę na epokę.

### Plusy i minusy

**Dla gracza**
- Plus: wojnę możesz wypowiedzieć, kiedy chcesz, więc masz pełną kontrolę nad momentem ataku.
- Plus: bramki epokowe chronią przed falą wojen na starcie gry.
- Minus: wypowiedzenie wojny bez ostrzeżenia kosztuje **−10 Wiarygodności** i karencję jednej tury.
- Minus: wojna zeruje Zaufanie wobec wroga, więc odbudowa relacji trwa długo.

**Dla AI**
- Plus: AI, która ma przewagę, może wypowiedzieć wojnę, gdy relacja jest zbyt niska.
- Minus: hamulec relacji opóźnia wojnę o kilka tur od chwili spadku Relacji poniżej progu kryzysu.

### Zasady zatwierdzone, jeszcze niewdrożone

> **DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku.** Ten blok NIE opisuje obecnego stanu gry.

- Wypowiedzenie wojny możliwe przy Zaufaniu poniżej **30**; silniejsza strona może, ale nie musi.
- Przy Zaufaniu **0** silniejsza strona wypowiada wojnę (po kilku turach od zera, z ostrzeżeniem).
- Cywilizacja słabsza o ponad **20%** siły militarnej nigdy sama nie wypowiada wojny (poza wojną epoki).
- Gracz nigdy nie zostaje wciągnięty automatycznie.
- Etykiety nastawienia: Wrogi poniżej 10, Nieufny 10–29 (patrz hasło **Relacja**).

---

## Przykład liczbowy

Dwie cywilizacje o Relacji 25 i progu wojny 30 (w kolejnej turze relacja spada do 25, czyli poniżej progu): hamulec startuje, a AI może wypowiedzieć wojnę dopiero po zakończeniu kryzysu (3–7 tur wg profilu).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.1

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 10 | `diplomacy-war-peace-params.json:progWojnyRelacji.baza` |
| 5 | `diplomacy-war-peace-params.json:progWojnyRelacji.wagaProgWojny` |
| 10 | `diplomacy-war-peace-params.json:progWojnyRelacji.min` |
| 70 | `diplomacy-war-peace-params.json:progWojnyRelacji.max` |
| 30 | `diplomacy-war-peace-params.json:progWojnyRelacji.bazaBrakDanych` |
| 15 | `diplomacy-war-peace-params.json:hamulecRelacji.progKryzysuMinusPunkty` |
| 8 | `diplomacy-war-peace-params.json:hamulecRelacji.bazaN` |
| 3 | `diplomacy-war-peace-params.json:hamulecRelacji.minN` |
| 7 | `diplomacy-war-peace-params.json:hamulecRelacji.maxN` |
| 40 | `war-rules-params.json:delayInterCivWarsUntilTurn` |
| 1 | `war-rules-params.json:maxConcurrentWarsStone` |
| 1 | `war-rules-params.json:maxEraForcedWarsPerCivPerEra` |
| -10 | `diplomacy.json:params.wiarygodnoscN1BezOstrzezenia` |
| 1 | `diplomacy.json:params.wiarygodnoscN1KarencjaTur` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Progi przewagi (20%, 30 Zaufania, 10 przy zerze) z DECYZJI WŁAŚCICIELA 2026-11-13 są w bloku niewdrożonym. Liczby przesłanek AI (siła względna, agresja) nie zostały zweryfikowane w tej rundzie i nie są podane w haśle.
