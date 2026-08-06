# R-DEFICYT-ZLOTA-KARA-Q1 — kara za deficyt Złota (analogia do głodu wojska)

**Status:** 🟡 **ZAPISANA** · **A** (2026-08-06)
**Zgłoszenie:** Maciej — analogia „taki sam stopień jak przy braku jedzenia" dla braku Złota/żołdu.
**Źródło:** audyt mechaniki dezercji/kar za brak zasobów (2026-08-06) — patrz uzasadnienie niżej.

## Ustalenia audytu (przed decyzją)

Deficyt Pieniądza (`saldo<0`, `upkeepBalance()` w `gra/src/game/economy-upkeep.ts:1042-1061`) jest dziś liczony,
ale jedyna reakcja silnika to `console.warn(...)` w `main.ts:20336-20347` — log deweloperski, niewidoczny
dla gracza, zero konsekwencji w rozgrywce. Skarbiec może zejść nieograniczenie poniżej zera. Sam kod
(`economy-upkeep.ts:1038-1040`) i `Spec-ekonomia.md:358` przyznają wprost, że to niedokończone
(„[PT: mechanizm bankructwa]"), potwierdzone w backlogu jako `B-MIA-4`, status P2.

Wzorzec do skopiowania — mechanika głodu wojska (Żywność), dwuwarstwowa:
- **Warstwa A (natychmiast):** `central < 0` w bieżącej turze → `glodWojskaStatMult` (domyślnie **0,75**,
  bez pancerza) mnoży staty bojowe (`army-starvation.ts:35-52`).
- **Warstwa B (atrycja, po karencji):** deficyt trwa `≥ glodWojskaKarencjaTur` tur z rzędu (domyślnie **3**) →
  `applyArmyStarvationHpLoss()` odejmuje co turę `max(1, floor(maxHp × glodWojskaHpFrac))` HP
  (domyślnie **8%** max HP/turę); przy `hp<=0` jednostka jest trwale usuwana z gry.

## ECHO

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-DEFICYT-ZLOTA-KARA-Q1** | **A** | Deficyt Złota/Pieniądza dostaje DOKŁADNĄ analogię do głodu wojska: natychmiastowa kara staty (mnożnik jak `glodWojskaStatMult`, osobny nazwany parametr — NIE reużywać literalnie tej samej stałej co Żywność, bo to inny zasób) + atrycja HP po karencji N tur deficytu z rzędu (domyślny punkt odniesienia: 3 tury, jak Żywność — do potwierdzenia/dostrojenia w playteście). Dotyczy gracza i AI identycznie (PARYTET AI). |

## Skutek (1–3 zdania)

Skarbiec przestaje być „darmowym" deficytem — trwały brak Złota na żołd osłabia armię tak samo dotkliwie jak
brak jedzenia, z tym samym mechanizmem stopniowej atrycji HP jeśli deficyt się utrzymuje. Nowy, osobny zestaw
nazwanych parametrów (nie reużywanie stałych głodu 1:1), żeby dało się je stroić niezależnie.

## Wdrożenie

Czeka na hasło **`działaj`** → AutoBot Operator (🟡 ekonomia + walka, reużyć wzorca `army-starvation.ts`
jako szablonu architektury, NIE kopiować parametrów Żywności).

---

## DOPRECYZOWANIE — R-DEFICYT-ZLOTA-TRIGGER-Q1 (2026-08-06)

**Status:** 🟢 **ZAPISANA** · **B**

Pierwsza runda AutoBot (Operator→Evaluator, PASS-WITH-NOTES) zaimplementowała próg jako `saldo<0`
(ujemny przepływ TEJ TURY, `upkeepBalance().deficyt`) — Evaluator wskazał, że to NIE jest wierna analogia
do Żywności: głód sprawdza `central = zapasyPanstwa (zapas) + nadwyżki − deficyty − koszt armii`, więc
kara odpala dopiero po wyczerpaniu ZAPASU, nie po jednej złej turze przepływu.

| ID | Odpowiedź | Skutek wdrożenia |
|----|-----------|------------------|
| **R-DEFICYT-ZLOTA-TRIGGER-Q1** | **B** | Próg zmienia się na wyczerpanie Skarbca (`ownerTreasury(ownerId) < 0`), NIE samo saldo bieżącej tury. Dokładna analogia do Żywności: kara startuje dopiero gdy zgromadzony majątek się skończy, nie przy chwilowym gorszym budżecie. Dotyczy obu warstw (staty + atrycja) — licznik tur karencji liczy kolejne tury z ujemnym Skarbcem, nie z ujemnym saldem. |

**Wdrożenie:** poprawka do już zaimplementowanego kodu (`gra/src/game/gold-deficit.ts` + wpięcie w
`main.ts`) — zmienić punkt odczytu z `upkeepBalance().deficyt` na `ownerTreasury(ownerId) < 0`
(`main.ts:18398`, już owner-agnostyczne). Reszta architektury (parametry, atrycja, save, parytet AI,
wpięcie do walki) zostaje bez zmian — była już PASS.
