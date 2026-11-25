# Audyt zużycia żywności przez jednostki (po UPKEEPMULT / UPKEEPPACE) — 2026-11-25

Temat: R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1 · baza: origin/main `ee0f73c325a7a35597c7211f8aad8636190d741b` · kod gry NIE zmieniany (zero zmian w `gra/src`, `gra/data`).
Dane: `dyspozycje/autobot/runs/R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1/dane/upkeep-food-audit.jsonl.gz` (SHA256 `6e914b670b554bffad7c3b384b4e61fe36c688759f6bbe26c068e1ac3f09f548`, zapisane też w `dane/upkeep-food-audit.jsonl.gz.sha256`). Narzędzie: `gra/tools/upkeep-food-audit.cjs`.

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

Warunki: seed 4242, mapa Mała, 2 rywali, poziom Normalny; zmienny parametr = tempo „Koszty jednostek” (oraz warunek `base` vs `army`). Pierwsze miasto gracza zakładane hakiem `foundFirstCity`; przed każdą turą +2000 złota (§4). Przed **każdą** z 3 tur zapas żywności państwa ustawiany wprost na 950 (`setPlayerGranary`), zakończenie tury, odczyt zapasu. Delta = netto (produkcja − zużycie) tury; ujemna = ubytek.

**2a. Wartości na kartach jednostek (`__settingsLive.unitCosts`, pole `foodPerTurn`, własne terytorium):**

| Jednostka | Niski | Normalny | Wysoki | Wzór (§1) Niski / Normalny / Wysoki |
|---|---|---|---|---|
| Wojownik | 4 | 8 | 16 | 4 / 8 / 16 |
| Procarz | 16 | 32 | 64 | 16 / 32 / 64 |
| Konnica | 64 | 128 | 256 | 64 / 128 / 256 |
| Zwiadowca | 0 | 0 | 0 | 0 / 0 / 0 |

Zgodność kart z wzorem: 100%. To odczyt wartości z kodu przez hak, nie pomiar zużycia.

**2b. Delta zapasu po turze (netto), z 6 biegów.** Każdy bieg ma 3 tury o identycznej delcie, bo zapas jest resetowany do 950 przed każdą turą. Są to więc **3 powtórzenia jednego pomiaru, a nie 3 niezależne próby**. Stolica gracza (`myCity`, q,r) w każdym biegu:

| Bieg | Stolica (q,r) | Delta tury (netto) | Wzór na 9 dosadzonych (192 × tempo ÷ 4 ×…) |
|---|---|---|---|
| `base` · Niski | 17,13 | 0 | — |
| `base` · Normalny | 15,12 | +1 | — |
| `base` · Wysoki | 17,15 | −6 | — |
| `army` · Niski | 17,13 | −185 | −192 |
| `army` · Normalny | 18,14 | −381 | −384 |
| `army` · Wysoki | 9,21 | −774 | −768 |

Wzór dla 9 dosadzonych (4× Wojownik, 3× Procarz, 2× Konnica) przy tempie: Niski 192 · Normalny 384 · Wysoki 768 (= 4·4 + 3·16 + 2·64 razy tempo, §1).

**Porównanie czyste (ta sama stolica).** Jedyna para biegów z identyczną stolicą to `army`/`base` przy Niskim (obie 17,13). Różnica `army − base` = **−185** na turę, wzór = **−192**: różnica −7 (≈ −3,6%). To jedyny czysty wynik w tej rundzie. Przy Normalnym i Wysokim stolice są różne (różnica `army − base` = −382 i −768 wobec wzoru 384 i 768), więc te różnice zawierają zmianę produkcji netto między miastami i **nie są czystym zużyciem jednostek**. Zgodność co do wielkości (−382 ≈ −384; −768 = −768) jest zatem zgodnością nieczystą i nie może być użyta jako potwierdzenie wzoru na poziomie kilku procent.

Nie wyprowadzono nachylenia zużycia (poprzednia wartość 196 była liczona z biegów o różnych stolicach i jest odrzucona). Nie wyprowadzono też pojedynczych liczb „+2…+5” ani szumu bazy: stolica zmienia się między biegami i nie zmierzono jej wpływu na produkcję.

## 3. Werdykt na pytanie 3 (bufor 999 w teście rozejmu, t5)

- **Zużycie jednostek: zgodne z wzorem w jedynej czystej parze (Niski: −185 wobec −192, ok. −3,6%). NIE stwierdzono BŁĘDU-GRY w konsumpcji jednostek, ale nie potwierdzono też zgodności na poziomie 1–2%.** Pozostałe dwa tempa nie są czyste (różne stolice).
- **Czy 999 wystarcza w teście rozejmu: NIE ZMIERZONO.** Test rozejmu (`gra/tools/diplo-truce-live-test.cjs`) nie był odtwarzany. Nie znany jest skład armii w teście, a niedobór „135” obejmuje też obywateli i produkcję, których pomiar nie rozdziela.
- Sam rachunek z wzoru (bez pomiaru): armia 9 jednostek przy Normalnym zjada ok. 384 żywności na turę, czyli bufor 999 wystarcza na ok. 2–3 tury, o ile produkcja netto wynosi zero. To arytmetyka, nie werdykt o teście.
- Klasyfikacja **STARY-PIN** (test) vs **BŁĄD-GRY** (kod) **nie jest rozstrzygnięta**. Obie hipotezy pozostają otwarte, bo brak pomiaru bilansu całego zapasu tury (obywatele + produkcja + jednostki) w scenariuszu testu.

## 4. Granice i NIE ZMIERZONO

- **Zużycie na jednostkę per epoka i ustawienie (wymóg dispatchu pkt 2): NIE ZMIERZONO.** Pomiar dał tylko agregat 9 jednostek (mieszanka) w dwóch biegach ze stolicą wspólną (Niski) i dwóch parach o różnych stolicach. Tabeli PRZED/PO per jednostka nie da się zbudować z tych danych; wartości z §1 są wzorem z kodu, nie zmierzonym zużyciem.
- **Stolica gracza zmienia się między biegami mimo seeda 4242** (17,13 / 15,12 / 17,15 / 17,13 / 18,14 / 9,21 w `dane/`). Przyczyna nieustalona (nie badano, czy losowość przy zakładaniu miasta, czy inny stan). Wpływ na produkcję netto zapasu: NIE ZMIERZONO.
- Składnika obywateli, produkcji i Spichlerza NIE rozdzielono: zmierzono tylko netto zapasu.
- Skład armii startowej NIE odczytany (brak haka w `civTest`); w biegu `base` zużycie startowe jest w praktyce wbudowane w netto (0 / +1 / −6 w różnych stolicach).
- Bramka NNS blokowała koniec tury 1 przez **złoto** (skarbiec 0, po turze −6), nie przez żywność. Dlatego każdy bieg dostał +2000 złota przed turą (`grantPlayerGold`; bez wpływu na zapas żywności). Zob. pytanie ABC #99 („bramka NNS w turze 1”).
- Mnożniki obozu (×0,5), poza terytorium (×2) i Sól/garnizon (×0,5) NIE zmierzone na żywej grze, tylko z kodu.
- AI (darmowe utrzymanie t1–40, FALA 890) NIE zmierzone.
- Kurs 0,2 (Żywność→Podatek) NIE mierzony w tym temacie (poza zakresem wzoru konsumpcji).
- Jeden seed (4242), jedna mapa, 6 biegów, 3 tury na bieg, lecz każda para tur to powtórzenie tej samej delty (§2b).
- Komunikat blokady NNS z liczbą żywności nie został znaleziony w repo ani w danych: nie jest cytowany jako potwierdzenie.
- Dane: `dane/upkeep-food-audit.jsonl.gz` (6 linii: `base`/`army` × `niski`/`normalny`/`wysoki`; pola `turns`, `unitCosts`, `errors`, `myCity`). Errors = 0 we wszystkich biegach.

## 5. Reprodukcja

    node gra/tools/upkeep-food-audit.cjs build <katalog poza repo>
    node gra/tools/upkeep-food-audit.cjs run <katalog poza repo> army normalny <katalog wyjścia>
    node gra/tools/upkeep-food-audit.cjs analyze <katalog wyjścia>

`build` używa `gra/node_modules` (`npm ci --ignore-scripts`) i `/usr/bin/google-chrome`; bez `npm run build` / `dev`. Funkcja `analyze` liczy `army − base` ze wszystkich tempach, więc jej wynik dla Normalnego i Wysokiego nie jest czystym zużyciem jednostek (§2b).
