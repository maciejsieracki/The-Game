# Rozejm i pokój

## Metadane

| Pole | Wartość |
|------|---------|
| id | `rozejm-pokoj` |
| tytuł | Rozejm i pokój |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §79.3 |
| json_ref | `diplomacy-war-peace-params.json`, `war-weariness-params.json`, `diplomacy-peace-lock.ts` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Rozejm** kończy wojnę na określony czas (5, 10 albo 15 tur). Po jego upływie można zaproponować **pokój**. **Pokój** kończy wojnę na stałe i daje karencję, w której nie można wrócić do ataku. Jedynym słodzikiem przy pokoju jest **miasto**; złoto i surowce nie kupują pokoju.

---

## Wiki‑M

### Rozejm

- Do wyboru są rozejmy na **5, 10 albo 15 tur**; domyślnie **10**.
- Po zakończeniu rozejmu pojawia się propozycja pokoju; zgoda oznacza pokój, brak zgody oznacza wznowienie wojny.
- Zawarcie rozejmu ustawia Zaufanie pary na **10** (od razu, `diplomacy.json:rozejm_zaufanie_ustawienie`).

### Pokój

- Zawarcie pokoju ustawia Zaufanie pary na **20** (od razu; także przy pokoju po rozejmie, `diplomacy.json:pokoj_zaufanie_ustawienie`).
- Pokój jest stały. Po pokoju następuje **karencja** 40 tur; dla chronionego przegrywającego (patrz hasło **Zmęczenie wojną**) karencja trwa 100 tur.
- Pokój z przegrywającym może kosztować miasta: przegrywający, który jest już wyczerpany wojną, oddaje miasta.

### Zasady pokoju (wdrożone)

- **Słabsza strona szuka pokoju, silniejsza go odrzuca.** Silniejsza strona wg siły militarnej (patrz hasło **Siła militarna**) odrzuca pokój bez miasta. Słabsza strona i strona w paśmie wyrównania rozpatrywane są dalej.
- **Próg różnicy siły w grze wynosi 0**: każda różnica decyduje. Wartość w `diplomacy-war-peace-params.json:progRozniceSilyPokoj` można zmienić bez kodu (np. 20 = różnica ±20% nie wymusza odrzucenia).
- **Miasto jako jedyny słodzik.** Ceny pokoju są płacone wyłącznie miastami. Złoto i surowce nie wchodzą w ofertę pokoju.
- **Minimalny czas wojny** zależy od profilu cywilizacji: od 1 do 8 tur (domyślnie 5). Przed tym czasem AI odrzuca pokój zawsze (`diplomacy-war-peace-params.json:minTurWojny`).
- **Mnożnik ceny cywilizacji**: po **20** turach wojny (`cenaPokoju.turyBezOgraniczenAi`) mnożnik ceny jest ograniczony do **1,0**.

### Zmęczenie wojną a pokój

Licznik zmęczenia (5% na turę od startu wojny, +10% za każde zmienione miasto, patrz hasło **Zmęczenie wojną**) zmienia zasady pokoju:
- **50%** — silniejsza strona obniża cenę pokoju, słabsza szuka pokoju;
- **80%** — silniejsza strona sama proponuje pokój bezwarunkowy (cena 0 = bez miasta);
- **100%** — wojna wygasa.

Pierwsze propozycje pokoju AI pojawiają się od tury 10 wojny.

### Kiedy AI proponuje rozejm, a kiedy pokój

- AI nie proponuje pokoju, gdy jest militarnie silniejsza, ani zanim nie minie minimalny czas wojny.
- AI proponuje, gdy jest słabsza (wobec gracza wyłącznie z miastem), albo gdy zachodzi jeden z sygnałów: utrata miasta w tej wojnie, pat (brak zmiany miast przez 10 tur po 15 turach wojny), zdrowie armii poniżej progu albo zmęczenie wojną co najmniej **0,4**.
- Tryb: **pokój stały**, gdy zmęczenie osiągnęło 1, gotowość AI do pokoju wynosi co najmniej **0,7** albo Zaufanie co najmniej **60**; w pozostałych przypadkach **rozejm**. (Wartości z `diplomacy-peace-lock.ts`.)

### Plusy i minusy

**Dla gracza**
- Plus: rozejm daje krótką przerwę w walce z jasno określonym końcem.
- Plus: pokój kończy wojnę na stałe i otwiera drogę do dalszej współpracy.
- Minus: po zakończeniu rozejmu wojna może wrócić, jeśli druga strona odrzuci pokój.
- Minus: pokój z przegrywającym bywa kosztowny w miastach, jeśli ten je oferuje.

**Dla AI**
- Plus: rozejm daje AI przerwę bez stałego pokoju.
- Minus: pokój stały zamyka możliwość zdobycia miast, dlatego AI proponuje go dopiero przy spełnionych warunkach.

---

## Przykład liczbowy

Wojna trwa 12 tur. Gracz proponuje rozejm na 10 tur. Po 10 turach pojawia się propozycja pokoju; jeśli AI zgodzi się, wojna kończy się pokojem, Zaufanie ustawia się na 20 i zaczyna się karencja 40 tur. Gdyby AI była militarnie silniejsza, odrzuci pokój bez miasta.

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md` §79.3

---

## Parametry

| Wartość | Skąd (plik:klucz) |
|--------:|-------------------|
| 5 | `kod:truce-option-min` (`diplomacy-peace-lock.ts`, `TRUCE_DURATION_OPTIONS`) |
| 15 | `kod:truce-option-max` (`diplomacy-peace-lock.ts`, `TRUCE_DURATION_OPTIONS`) |
| 10 | `kod:truce-default` (`diplomacy-peace-lock.ts`, `TRUCE_DEFAULT_TURNS`) |
| 1 | `kod:truce-ai-fatigue` (`diplomacy-peace-lock.ts`, `TRUCE_AI_FATIGUE_PEACE_MIN`) |
| 0.7 | `kod:truce-ai-willingness` (`diplomacy-peace-lock.ts`, `TRUCE_AI_WILLINGNESS_PEACE_MIN`) |
| 60 | `kod:truce-ai-trust` (`diplomacy-peace-lock.ts`, `TRUCE_AI_TRUST_PEACE_MIN`) |
| 0.20 | `diplomacy-war-peace-params.json:przewagaMilitarna.prog` |
| 0 | `diplomacy-war-peace-params.json:progRozniceSilyPokoj.wartosc` |
| 0 | `diplomacy-war-peace-params.json:pokojAiAi.minBilansPW` |
| 40 | `war-weariness-params.json:przegrywajacy.karencjaPoPokojuTur` |
| 100 | `war-weariness-params.json:przegrywajacy.karencjaChronionegoTur` |
| 20 | `diplomacy-war-peace-params.json:cenaPokoju.turyBezOgraniczenAi` |
| 5 | `diplomacy-war-peace-params.json:minTurWojny.baza` |
| 1 | `diplomacy-war-peace-params.json:minTurWojny.min` |
| 8 | `diplomacy-war-peace-params.json:minTurWojny.max` |
| 0.4 | `diplomacy-war-peace-params.json:zmeczenie.progSygnaluPokoju` |
| 0.5 | `war-weariness-params.json:zmeczenie.progChetnosci` |
| 0.8 | `war-weariness-params.json:zmeczenie.progWzajemnyPokoj` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1, runda 3). Zasady pokoju (siła militarna zamiast Power, miasto jako jedyny słodzik, usunięcie warunku „czuje się silniejsze” i mnożnika ceny od siły) są wdrożone (kroki 4a i 4b, FALA 685). Dawne wiersze tabeli (odrzucenie rw 0,55, odrzucenie po 10 turach) zostały usunięte, bo bramka `evaluatePeaceAiGate` ich nie używa.

Rozbieżność do zgłoszenia: opis w `war-weariness-params.json` (`przegrywajacy`, stopnie 1–3) wspomina złoto i surowce, a kod (`war-weariness.ts`, plan zapłaty eskalowanej) używa wyłącznie miast. Hasło podaje stan z kodu.
