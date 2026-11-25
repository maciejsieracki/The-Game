# Audyt zużycia żywności przez jednostki (po UPKEEPMULT / UPKEEPPACE) — 2026-11-25

Temat: R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1 · baza: origin/main `ee0f73c325a7a35597c7211f8aad8636190d741b` · kod gry NIE zmieniany (zero zmian w `gra/src`, `gra/data`).
Dane: `dyspozycje/autobot/runs/R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1/dane/upkeep-food-audit.jsonl.gz` (SHA256 `6e914b670b554bffad7c3b384b4e61fe36c688759f6bbe26c068e1ac3f09f548`). Narzędzie: `gra/tools/upkeep-food-audit.cjs`.

## 0. Korekty założeń dispatchu

- **FALA 875 (×1/×2/×4 dla żywności) jest ANULOWANA** przez FALĘ 883 (`dyspozycje/WERSJE.md`: „FALA 883 … FALA 875 anulowana”). Obowiązuje geometria x4 na epokę, nie x1/x2/x4.
- **Kurs 0,2 NIE jest składnikiem zużycia jednostek.** To kurs zamiany Żywności na Podatek (`gra/data/econ-params.json`, `targowisko_zywnosc_na_podatek_kurs`, normal = 0,2). Nie wchodzi do wzoru poniżej.
- Darmowe utrzymanie AI t1–40 (FALA 890) dotyczy wyłącznie AI; pomiar prowadzono na graczu.

## 1. Wzór z kodu (konsumpcja żywności przez jednostkę gracza)

Źródło: `gra/src/game/economy-upkeep.ts` `unitFoodPerTurn` (ok. l. 1175–1204), `gra/src/game/econ-era-rebalance.ts` `rebalancedUnitFoodBase`, `gra/src/game/r-stawki-strojenie.ts`, `gra/src/game/unit-cost-tempo.ts`, `gra/src/game/turn-economy.ts` `militaryFoodConsumptionWithSpichlerz`.

1. Baza `direct` = kolumna `żywność/turę` z `gra/data/units.json` (bojowe: 1; Zwiadowca: 0).
2. Flaga rebalansu `eraRebalansAktywny` = true (`gra/data/econ-era-rebalance-params.json`): baza = `round(direct × 4^(epoka jednostki − 1))`, min 1. Epoki: Kamień ×1, Brąz ×4, Żelazo ×16.
3. Obóz (camping): × `zywnoscJednostkaOboz / zywnoscJednostkaRuch` = 0,5 / 1 (econ-params).
4. Terytorium: własne ×1, poza własnym ×2 (`zywnosc_mnoznik_terytorium_wlasne` / `zywnosc_mnoznik_poza_terytorium`).
5. Stały mnożnik `R_STAWKI_FALA1_FALA2_MULT` = 2 × 2 = **×4**.
6. Tempo „Koszty jednostek” (`mnoznikUtrzymaniaJednostek`, ostatni czynnik): Niski ×1 · Normalny ×2 · Wysoki ×4 (FALA 887).
7. Spichlerz / Sól (gdy aktywne): poza własnym terytorium ×0,5 (bonus Sól-armii), garnizon w mieście Sól ×0,5.

**Wynik (własne terytorium, bez obozu, bez Sól):**

    żywność/turę jednostki = f × 4^(epoka−1) × 4 × tempo

| Jednostka (typeId) | Epoka | f | Niski ×1 | Normalny ×2 | Wysoki ×4 |
|---|---|---|---|---|---|
| Wojownik | Kamień | 1 | 4 | 8 | 16 |
| Procarz | Brąz | 1 | 16 | 32 | 64 |
| Konnica | Żelazo | 1 | 64 | 128 | 256 |
| Zwiadowca | Kamień | 0 | 0 | 0 | 0 |

Cytaty decyzji właściciela (`dyspozycje/WERSJE.md`):
- FALA 883 (96011990, 2026-11-19, zaakceptowana tabela): „zywnosc utrzymania wszystkich jednostek = geometria x4 na epoke jednostki przed stalymi stawkami x4 => Kamien 4 / Braz 16 / Zelazo 64 na jednostke z baza 1 (Zwiadowca 0; oboz x0,5; poza wlasnym terytorium x2)”; kurs zamiany Żywności na Podatek 0,2.
- FALA 887 (db18102e, 2026-11-19, ABC A): „ustawienie kreatora Koszty jednostek (Niski x1 / Normalny x2 DOMYSLNY / Wysoki x4) mnozy ostatni czynnik utrzymania jednostek: … zywnosc (unitFoodPerTurn …)”.
- FALA 875 (f6cdd032): ANULOWANA przez FALĘ 883 (nie występuje w kodzie).

## 2. Pomiar na żywo (Chromium, realne moduły gry, bundle poza repo)

Warunki: seed 4242, mapa Mała, 2 rywali, poziom Normalny; jedyny zmienny parametr = tempo „Koszty jednostek”. Pierwsze miasto gracza zakładane hakiem `foundFirstCity`; przed każdą turą +2000 złota (§4). Przed każdą turą zapas żywności państwa ustawiany wprost na 950 (`setPlayerGranary`, cap centralny ok. 1000), zakończenie tury, odczyt zapasu (`grantPlayerFood(1e-9)` z korektą 1e-9). Delta = netto (produkcja − zużycie) tury.

**2a. Wartości na kartach jednostek (`__settingsLive.unitCosts`, pole `foodPerTurn`, własne terytorium):**

| Jednostka | Niski | Normalny | Wysoki | Wzór (§1) Niski / Normalny / Wysoki |
|---|---|---|---|---|
| Wojownik | 4 | 8 | 16 | 4 / 8 / 16 |
| Procarz | 16 | 32 | 64 | 16 / 32 / 64 |
| Konnica | 64 | 128 | 256 | 64 / 128 / 256 |
| Zwiadowca | 0 | 0 | 0 | 0 / 0 / 0 |

Zgodność 100%.

**2b. Zużycie w turze (netto zapasu żywności państwa, 3 tury każdy bieg):**

| Warunek | Niski | Normalny | Wysoki | Nachylenie (U1 na ×1) |
|---|---|---|---|---|
| `base` (jednostki startowe) | 0 | +1 | −6 | −1 (z ×1→×2), +2 (z ×1→×4, /3) |
| `army` (base + 9 dosadzonych: 4 Wojownik, 3 Procarz, 2 Konnica) | −185 | −381 | −774 | **196** (z ×1→×2), **196,3** (z ×1→×4, /3) |

Wyprowadzenie: `army` − `base` ≈ 194 do 197 jednostek żywności na turę na ×1. Wzór dla 9 dosadzonych jednostek = 4·4 + 3·16 + 2·64 = **192**. Różnica +2…+5 (≈1–3%) mieści się w szumie bazy (`base` zmienia się o 1–2 między tempami) i/lub w składzie armii startowej, którego nie odczytano (§4). Nachylenia `army` przy ×2 i ×4 są zgodne ze sobą (196 vs 196,3): zużycie jest liniowe w tempie, jak we wzorze.

**Potwierdzenie z silnika:** komunikat blokady NNS w biegu `army`/Niski w turze 3 podaje „rozwiązanie jednostek (żywność): +196 żywności/turę”. Silnik sam liczy łączne zużycie żywności jednostek na 196, zgodnie z pomiarem nachylenia.

## 3. Werdykt na pytanie 3 (bufor 999 w teście rozejmu, t5)

- **Zużycie jednostek zgadza się z decyzjami właściciela (FALA 883 + 887) w granicach ~2%. NIE stwierdzono BŁĘDU-GRY w konsumpcji jednostek.**
- **Czy 999 wystarcza w teście rozejmu: NIE ZMIERZONO.** Test rozejmu (`gra/tools/diplo-truce-live-test.cjs`) nie był odtwarzany (inna mapa/ziarno, nieznany skład armii; niedobór „135” obejmuje też obywateli i produkcję, których pomiar nie rozdziela). Wzór: armia 9 jednostek (mieszanka Kamień/Brąz/Żelazo) przy Normalny zjada ok. 381 żywności na turę, więc bufor 999 starcza na ok. 2–3 tury. Blokada w t5 jest zgodna z tym rachunkiem, ale to założenie, nie pomiar.
- Klasyfikacja „STARY-PIN” z rundy `R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1` **nie jest ani potwierdzona, ani obalona**: pomiar dotyczy zużycia jednostek, nie całego bilansu zapasu tury w scenariuszu testu.

## 4. Granice i NIE ZMIERZONO

- Składnika obywateli, produkcji i Spichlerza NIE rozdzielono: zmierzono tylko netto zapasu. Wpływ jednostek wyznaczono różnicą tempa i różnicą warunków.
- Skład armii startowej NIE odczytany (brak haka w `civTest`); w biegu `base` zużycie startowe ≈ 0–2 na ×1.
- Bramka NNS blokowała koniec tury 1 przez **złoto** (skarbiec 0, po turze −6), nie przez żywność. Dlatego każdy bieg dostał +2000 złota przed turą (`grantPlayerGold`; bez wpływu na zapas żywności). Zob. pytanie ABC #99 („bramka NNS w turze 1”).
- Mnożniki obozu (×0,5), poza terytorium (×2) i Sól/garnizon (×0,5) NIE zmierzone na żywej grze, tylko z kodu.
- AI (darmowe utrzymanie t1–40, FALA 890) NIE zmierzone.
- 3 tury na bieg, jeden seed (4242), jedna mapa: brak powtórzeń innymi ziarnami.
- Kurs 0,2 (Żywność→Podatek) NIE mierzony w tym temacie (poza zakresem wzoru konsumpcji).
- Dane: `dane/upkeep-food-audit.jsonl.gz` (6 linii: `base`/`army` × `niski`/`normalny`/`wysoki`; pola `turns`, `unitCosts`, `errors`).

## 5. Reprodukcja

    node gra/tools/upkeep-food-audit.cjs build <katalog poza repo>
    node gra/tools/upkeep-food-audit.cjs run <katalog poza repo> army normalny <katalog wyjścia>
    node gra/tools/upkeep-food-audit.cjs analyze <katalog wyjścia>

`build` używa `gra/node_modules` (`npm ci --ignore-scripts`) i `/usr/bin/google-chrome`; bez `npm run build` / `dev`.
