# Rozejm i pokój

## Metadane

| Pole | Wartość |
|------|---------|
| id | `rozejm-pokoj` |
| tytuł | Rozejm i pokój |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII §79.3 |
| json_ref | `diplomacy-war-peace-params.json`, `diplomacy-peace-lock.ts` |
| stan | Stan na 2026-11-13 (weryfikacja w kodzie) |

---

## Wiki‑S

**Rozejm** kończy wojnę na określony czas (5, 10 albo 15 tur). Po jego upływie można zaproponować **pokój**. **Pokój** kończy wojnę na stałe i daje karencję, w której nie można wrócić do ataku.

---

## Wiki‑M

### Rozejm

- Do wyboru są rozejmy na **5, 10 albo 15 tur**; domyślnie **10**.
- Po zakończeniu rozejmu pojawia się propozycja pokoju; zgoda oznacza pokój, brak zgody oznacza wznowienie wojny.
- Zawarcie rozejmu ustawia Zaufanie pary na **10** (od razu, `diplomacy.json:rozejm_zaufanie_ustawienie`).

### Pokój

- Zawarcie pokoju ustawia Zaufanie pary na **20** (od razu; także przy pokoju po rozejmie, `diplomacy.json:pokoj_zaufanie_ustawienie`).
- Pokój jest stały. Po pokoju następuje **karencja** 40 tur; dla chronionego przegrywającego (patrz hasło **Zmęczenie wojną**) karencja trwa 100 tur.
- Pokój z przegrywającym może kosztować miasta: przegrywający, który jest już wyczerpany wojną, oferuje miasta.

### Bramki pokoju (obecnie w grze)

Pokój proponowany przez gracza przechodzi przez bramki AI (runda 2, zarzut 6):
- **Minimalny czas wojny**: od 1 do 8 tur zależnie od profilu cywilizacji (domyślnie 5). Przed tym czasem AI odrzuca pokój zawsze (`diplomacy-war-peace-params.json:minTurWojny`).
- **Przewaga militarna powyżej 20%**: AI silniejsza o więcej niż 20% nie przyjmuje pokoju, dopóki zmęczenie wojną nie osiągnie progu chęci **0,5**. W kodzie ta blokada nie ma limitu tur; zdejmuje ją tylko zmęczenie.
- **„Czuje się silniejsze”**: przez pierwsze **10** tur wojny AI odrzuca pokój, gdy jej udział siły wynosi co najmniej **0,55** i nie straciła żadnego miasta w tej wojnie.
- **Mnożnik ceny**: cena pokoju zależy od siły i od profilu cywilizacji. Po **20** turach wojny bramka „czuje się silniejsze” i mnożnik siły przestają działać, a mnożnik cywilizacji jest ograniczony do 1.

### Kiedy AI proponuje rozejm, a kiedy pokój

AI na początku wojny proponuje **rozejm**. Pokój stały proponuje, gdy spełni się jeden z warunków: zmęczenie wojną osiągnie pełny poziom (około 20 tur wojny), gotowość do pokoju wynosi co najmniej 0,7 albo Zaufanie wynosi co najmniej 60.

### Plusy i minusy

**Dla gracza**
- Plus: rozejm daje krótką przerwę w walce z jasno określonym końcem.
- Plus: pokój kończy wojnę na stałe i otwiera drogę do dalszej współpracy.
- Minus: po zakończeniu rozejmu wojna może wrócić, jeśli druga strona odrzuci pokój.
- Minus: pokój z przegrywającym bywa kosztowny w miastach, jeśli ten je oferuje.

**Dla AI**
- Plus: rozejm daje AI przerwę bez stałego pokoju.
- Minus: pokój stały zamyka możliwość zdobycia miast, dlatego AI proponuje go dopiero przy spełnionych warunkach.

### Zasady zatwierdzone, jeszcze niewdrożone

> **DECYZJA WŁAŚCICIELA 2026-11-13, wdrożenie w toku.** Ten blok NIE opisuje obecnego stanu gry.

- Słabsza strona proponuje pokój, silniejsza (o co najmniej 20%) odrzuca.
- Pokój wyrównuje wyłącznie oddanie miasta; siła militarna wynosi 20% (miasto jako jedyny słodzik).
- Zmęczenie wojną kończy wojny tylko miastami.
- Znika warunek „czuje się silniejsze” i mnożnik ceny od siły; zostaje minimalny czas wojny.

---

## Przykład liczbowy

Wojna trwa 12 tur. Gracz proponuje rozejm na 10 tur. Po 10 turach pojawia się propozycja pokoju; jeśli AI zgodzi się, wojna kończy się pokojem i zaczyna karencja 40 tur.

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
| 0 | `diplomacy-war-peace-params.json:pokojAiAi.minBilansPW` |
| 40 | `war-weariness-params.json:przegrywajacy.karencjaPoPokojuTur` |
| 100 | `war-weariness-params.json:przegrywajacy.karencjaChronionegoTur` |
| 20 | `diplomacy-war-peace-params.json:cenaPokoju.turyBezOgraniczenAi` |
| 5 | `diplomacy-war-peace-params.json:minTurWojny.baza` |
| 1 | `diplomacy-war-peace-params.json:minTurWojny.min` |
| 8 | `diplomacy-war-peace-params.json:minTurWojny.max` |
| 0.55 | `diplomacy-war-peace-params.json:cenaPokoju.odrzucenieRwProg` |
| 10 | `diplomacy-war-peace-params.json:cenaPokoju.odrzucenieMaxTurWojny` |
| 0.5 | `war-weariness-params.json:zmeczenie.progChetnosci` |

---

## Historia / decyzje

Hasło zweryfikowane w kodzie 2026-11-13 (R-WEB-DIPLO-CIVPEDIA-Q1). Zasady niewdrożone: DECYZJA WŁAŚCICIELA 2026-11-13. Wartości 5/10/15 i progi AI są w kodzie jako stałe, nie w JSON. Runda 2 (zarzut 6): dopisano bramki pokoju z kodu (`diplomacy-war-peace-profile.ts`, `evaluatePeaceAiGate`) i wiersze minTurWojny / odrzucenie.
