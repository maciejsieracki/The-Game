# Szlaki handlowe

## Metadane

| id | `szlaki-handlowe` |
| tytuł | Szlaki handlowe |
| kategoria | Ekonomia imperium |
| poradnik_ref | Część VIII (Ekonomia imperium) |
| json_ref | `econ-params.json`, silnik `game/trade-routes.ts` |

---

## Wiki‑S

**Szlak handlowy** to automatyczne połączenie (lądowe lub morskie) między **Twoim miastem** a miastem **obcej cywilizacji**, wykryte co turę. Wymaga **pokoju** ze stroną (wojna zrywa trasę), budynku handlowego po obu stronach (limit tras = liczba zbudowanych budynków w mieście) i — dla tras morskich — Portu. Daje **dochód w złocie zależny od dystansu** oraz może odblokować **dostęp do brązu, żelaza lub konia**, jeśli partner ma je, a Ty nie masz własnego złoża.

---

## Wiki‑M

### Jak powstaje trasa

Co turę silnik (`refreshTradeRoutes`) sprawdza połączenia **TYLKO zewnętrzne** (miasto gracza ↔ miasto obcej cywilizacji; własne↔własne nigdy nie tworzy trasy) dla par w stanie **pokoju**. Połączenie lądowe liczy dystans + BFS po lądzie; morskie wymaga **Portu handlowego** po obu stronach + BFS po wodzie. Limit tras **na miasto** = liczba zbudowanych budynków handlowych w tym mieście (0 budynków = 0 tras). Trasy z poprzedniej tury, które nadal spełniają warunki, są priorytetowo zachowywane („stabilność"); nowe kandydatury wypełniają wolne sloty w kolejności rosnącego dystansu.

### Dochód dystansowy

Dochód trasy = funkcja dystansu (`tradeRouteDistanceIncome`, `econ-params.json`) — im dalej miasto partnera, tym więcej złota/turę z tej jednej trasy. Aktywna trasa daje też **+5% Handlu** (kumulatywnie za każdą trasę) obu stronom.

### Dostęp do surowców przez trasę (Temat #4, „Handel E3b")

Jeśli masz aktywną trasę z cywilizacją, która ma dostęp do **brązu**, **żelaza** lub **konia**, a Ty własnego złoża/budynku nie masz — dostajesz ten dostęp **przez trasę** (civ-wide, nie per miasto). W panelu miasta źródło takiego dostępu jest podpisane „szlak handlowy z **[nazwa cywilizacji]**". Warunki bazowe (np. Piec hutniczy dla brązu) nadal obowiązują — trasa daje surowiec, nie sam budynek.

### Umowa Handlowa (traktat, nowość 2026-07-23)

Osobno od automatycznych tras istnieje **stały traktat „Umowa Handlowa"** w warstwie dyplomacji: AI **proaktywnie proponuje** go graczowi (i innym AI), gdy geometryczne połączenie handlowe jest możliwe i relacja jest wystarczająco dobra. Aktywna Umowa Handlowa podnosi zaufanie co turę (czynnik `aktywnyHandel` w tick dyplomacji); jej zerwanie kosztuje mniej zaufania (**−10**) niż zerwanie innego traktatu (**−15**). *Uwaga redakcyjna: wg audytu kodu z 2026-07-23 sama trasa handlowa (dochód + dostęp do surowców) dziś technicznie wymaga tylko pokoju — Umowa Handlowa jest osobnym budulcem zaufania. Jeśli intencją jest, by trasa formalnie WYMAGAŁA aktywnej Umowy Handlowej, to osobna zmiana silnika do potwierdzenia z właścicielem.*

**Powiązane:** [[Bogactwo]] · [[Suwak handlu]] · Cywilizacje (dostęp do surowców)

---

## Przykład liczbowy

Miasto A (Twoje) i miasto B (obca cywilizacja) w pokoju, oba mają Targowisko → limit **1 trasa** po każdej stronie. Dystans 6 heksów lądem → trasa aktywna, dochód z tabeli dystansowej + **+5% Handlu** obu stronom. Jeśli cywilizacja B ma dostęp do **konia**, a Ty nie — dostajesz koń **przez tę trasę**, podpisany w panelu miasta jako „szlak handlowy z [B]".

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md`

---

## Historia / decyzje

Handel E1–E3/E3b (2026-07-20/21): Mennica, per-city surowce, `findCityConnection`, dochód dystansowy + dostęp do brązu/żelaza/konia przez trasę. E6 (2026-07-23): Umowa Handlowa jako stały traktat, AI proaktywnie oferuje. Hasło dodane 2026-07-23 (audyt CIVPEDII).
