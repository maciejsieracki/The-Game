# R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1 — rozpoznanie ekonomii miast: żelazo i dostęp do zasobów (P6.6–P6.8)

Status: ROZPOZNANIE (bez zmian kodu). Baza: `5e8b116e8` (czubek `origin/rust-port/parity-v2`).
Pin (tylko odczyt): `07d2fbd72` (`gra/src/**`).
Dowody: `plik:linia` po stronie pina (`gra/src/...` @07d2fbd72) i Rust (`rust-port/engine/src/...` @5e8b116e8).
Zakres skanowania: pin `gra/src/game/{zelazo-access,converters,production,economy,economy-upkeep,ai}.ts`,
Rust `domain/{resource_access,turn_economy_resources,economy_yield,improvements,production_units,auto_improvements,turn_economy_inputs_native}.rs`.

## 0. Uwaga o etykiecie „8I2”

Ciąg `8I2` NIE występuje w kodzie pina (`git grep 8I2 07d2fbd72 -- gra/src`: wyłącznie dwa trafienia binarne w plikach mp3,
czyli fałszywe dopasowania) ani w dokumentacji `dyspozycje/` poza nie-powiązanymi dowodami. Etykieta pochodzi z trackera
(#180 w liście zadań). Rozpoznanie przyjęło więc zakres opisany w dispatchu: reguły żelaza i dostępu do zasobów miast
(zgodnie z `dyspozycje/rust-port/p6/P6-8F-EKONOMIA-MIASTA.md` i `P6-8H2-DOSTEP-ZASOBOW-B.md`). Co dokładnie znaczy „zestaw 8I2”
w trackerze: NIE_ZMIERZONO.

## 1. Tabela: element → pin → Rust → status

| # | Element | Pin (plik:linia) | Rust (plik:linia) | Status | Dowód / uwagi |
|---|---|---|---|---|---|
| 1 | Stałe: `KOPALNIA_ZELAZA_KEY`, `ODLEWNIA_ZELAZA_BUILDING_ID`, `ZLOZE_ZELAZO_KEY` | `zelazo-access.ts:16,22,25` | `resource_access.rs:40-41` (`ZLOZE_ZELAZO_KEY`); `improvement_build.rs:54,67,694` (kopalnia_zelaza / zloze) | JEST | Wartości zgodne: `kopalnia_zelaza`, `odlewnia_zelaza`, `zelazo`. |
| 2 | `empireHasKopalniaNaZlozuZelaza` (kopalnia żelaza na złożu gdziekolwiek w imperium; legacy `kopalnia`) | `zelazo-access.ts:50-66` | `resource_access.rs:166-191` (`empire_has_kopalnia_na_zlozu_zelaza`); legacy `kopalnia` w `:186-189` | JEST | Sprawdzone: złoże `zelazo` (`:177`), klucz `kopalnia_zelaza` przez `keys_with_legacy_migration`, legacy `kopalnia` (`:186-189` ↔ pin `:62-63`). |
| 3 | `cityHasOdlewniaZelaza` (odlewnia żelaza lub wielka odlewnia w TYM mieście) | `zelazo-access.ts:71-74` | `resource_access.rs:194-198` (`city_has_odlewnia_zelaza`) | JEST | Oba warianty (`odlewnia_zelaza`, `wielka_odlewnia`). |
| 4 | `hasZelazoAccess` (stock `zelazo` > 0 AND odlewnia w mieście; `boolean`/brak budynków = legacy) | `zelazo-access.ts:79-89` | `resource_access.rs:201-210` (`has_zelazo_access`) | JEST | Legacy `boolean` odwzorowane jako `None` (`:200`). |
| 5 | `ownerHasNativeZelazoAccess` (kopalnia gdziekolwiek AND którekolwiek miasto ownera z dostępem) | `zelazo-access.ts:101-111` | `resource_access.rs:215-226` (`owner_has_native_zelazo_access`) | JEST | Wywołanie produkcyjne: `turn_economy_inputs_native.rs:186` (import `:33`). |
| 6 | Konwerter `odlewnia_zelaza__braz` (1 ruda + 1 drewno + 0.1 ruda_cyny → 1 brąz) | `converters.ts:100` | `turn_economy_resources.rs:89-96` (`id` `:90`, wejścia `:92`) | JEST | Wejścia zgodne; klucz przepustowości `budynek_huta_przepustowosc` (fallback 50). |
| 7 | Konwerter `odlewnia_zelaza__zelazo` (1 ruda_zelaza + 1 drewno → 1 żelazo) | `converters.ts:101` | `turn_economy_resources.rs:98-105` (`:99`, wejścia `:101`) | JEST | Klucz `budynek_odlewnia_zelaza_przepustowosc` (pin `:101` i Rust `:104` zgodne), fallback 50. |
| 8 | Konwerter `wielka_odlewnia__zelazo` | `converters.ts:103` | `turn_economy_resources.rs:116-123` (`:117`, wejścia `:119`) | JEST | Zgodne. |
| 9 | Konwerter `wielka_odlewnia__stal` (1 żelazo + 1 drewno → 1 stal) | `converters.ts:104` | `turn_economy_resources.rs:125-132` (`:126`, wejścia `:128`) | JEST | Zgodne. |
| 10 | Konwerter `wielka_odlewnia__braz` (linia pina 102) | `converters.ts:102` | `turn_economy_resources.rs:107-114` (`:108`) | JEST (strukturalnie) | Linii 102 nie czytałem wprost w tym przebiegu (wzorzec `grep` jej nie złapał); wpis Rust odpowiada tabeli nagłówka `converters.ts:14-15`. Założenie pina „ta sama rodzina” (`converters.ts:15`) jest jawnie oznaczone jako założenie. |
| 11 | Bramka rekrutacji: jednostka wymagająca żelaza ukryta przy braku zapasu `zelazo` (stan państwa) | `production.ts:1161`, `production.ts:1295` | `production_units.rs:2607-2608`, `production_units.rs:3041-3042` | JEST | Dwa miejsca po obu stronach (widok panelu i ścieżka zwykła) zgodne. |
| 12 | Ruda żelaza z kopalni (ore yield) | `economy.ts:268-269` (typy), `:437`, `:476-477` (suma), `:847-859` (`rudaZelazaTerenu`) | `economy_yield.rs:866,879` (`ruda_zelaza` w ore), `:912-941`, `:975` (`ruda_zelaza_terenu`); `improvements.rs:410` (`Production::resource("ruda_zelaza", 20)`), `improvements.rs:947` | JEST (struktura) | WARTOŚCI liczbowe (`20` z `improvements.rs:410`, progi kopalni) NIE_ZMIERZONO względem pina. |
| 13 | Kredyt terytorium `ruda_zelaza` do puli miast | pin: `economy.ts:1050-1051` (`rudaZelazaTerenu`) | `turn_economy_resources.rs:547`, `turn_economy_territory.rs:182`, `turn_economy_preview.rs:187` | JEST | Obecne we wszystkich trzech ścieżkach (tura, podgląd, terytorium). |
| 14 | Mapowanie „zelazo → ruda_zelaza → kopalnia_zelaza” (auto-ulepszenia) | `ai.ts:2727,2737` (pola `zelazo: ['odlewnia_zelaza']`, `zelazo: ['ruda_zelaza']`) | `auto_improvements.rs:222` (`("ruda_zelaza", &["kopalnia_zelaza"])`) | JEST (nazwy) | Semantyka wyboru ulepszenia po stronie AI NIE_ZMIERZONO (nie czytano `ai.ts:2320-2345`, `:2828`). |
| 15 | Ceny żelaza i rudy (parametry ekonomii) | param. `cena_zelazo`, `cena_ruda_zelaza` (pin: `economy-params` — ścieżka NIE_ZMIERZONO) | `economy_society.rs:367-368`, `:381-382` | JEST (pola) | Wartości NIE_ZMIERZONO. |
| 16 | Przepustowość odlewni żelaza (param. `budynek_odlewnia_zelaza_przepustowosc`) | pin `converters.ts:101,103` | `economy_society.rs:182-183` (pole), `turn_economy_resources.rs:104` (odlewnia żelaza) | JEST (pola) | Wartość NIE_ZMIERZONO. |
| 17 | Wzór fallbacku surowca w `citizen-resource-upkeep.ts` (zelazo w liście, `economy-upkeep.ts:407`) | `economy-upkeep.ts:407`, `:316` (komentarz) | NIE_ZMIERZONO (nie sprawdzono `citizen_resource_upkeep` w Rust) | NIE_ZMIERZONO | Do rozstrzygnięcia w temacie T2. |
| 18 | Wybór konwertera przez AI (budowa odlewni, brak konwertera przy zapasie) | `ai.ts:2320-2345` | NIE_ZMIERZONO (nie sprawdzono `ai_resource_needs.rs` pod kątem tej reguły) | NIE_ZMIERZONO | Do rozstrzygnięcia w temacie T1. |

## 2. Lista brakujących elementów (z dowodem)

W zbadanym zakresie (pozycje 1–16) NIE stwierdzono brakującego odpowiednika Rust. Każda pozycja ma wskazany wpis po obu stronach.
Pozycje 17 i 18 pozostają NIE_ZMIERZONO (nie zostały sprawdzone), więc NIE są potwierdzonymi brakami ani potwierdzonym parytetem.

Dodatkowo, na poziomie nazw i struktury, pozycje 12–16 wymagają porównania wartości liczbowych (NIE_ZMIERZONO) przed
uznaniem parytetu ekonomicznego.

## 3. Propozycja podziału na tematy wykonawcze (szacunek, nie pomiar)

| Temat | Zakres | Zależności | Szacunek rund | Uzasadnienie |
|---|---|---|---|---|
| T1 — AI konwertery i budowa odlewni | pinowe `ai.ts:2320-2345` i `:2828` vs `ai_resource_needs.rs` | brak | 2 | Reguła ma co najmniej dwa warunki (konwerter zbudowany / zapas surowca) i wymaga wektorów; 2 rundy na jedną reguła z wektorem. Szacunek. |
| T2 — obciążenie obywateli żelazem (upkeep) | `economy-upkeep.ts:407`, `citizen-resource-upkeep.ts` vs `citizen_resource_upkeep` Rust | brak | 1–2 | Jedna lista surowców w pinie; wymaga sprawdzenia zgodności listy i progów epok. |
| T3 — wartości liczbowe rudy żelaza i przepustowości | pinowe wartości `ruda_zelaza`, `budynek_odlewnia_zelaza_przepustowosc`, `cena_*` vs `improvements.rs:410` i `economy_society.rs` | zależne od T1/T2 (dane) | 2 | Wymaga odczytu wartości z pinowego JSON-a parametrów (NIE_ZMIERZONO w tym przebiegu); decyzja właściciela, jeśli wartości się różnią (zasada 3 CLAUDE.md). |
| T4 — weryfikacja wiersza `wielka_odlewnia__braz` i założenia „ta sama rodzina” | `converters.ts:102,15` vs `turn_economy_resources.rs:107-114` | brak | 1 | Pojedynczy wiersz i jedno jawne założenie pina. |

Kolejność: T4 (1 runda, niezależny), T1 i T2 równolegle, T3 po T1/T2. Razem szacunek 5–7 rund.
Rundy są szacunkiem na podstawie liczby reguł do wektorowania; NIE są pomiarem.

## 4. Granice rozpoznania

- Brak zmian w `rust-port/**`, `gra/**`, testach, `Cargo.*`; brak push do `rust-port/parity-v2`.
- Niepewne twierdzenia oznaczono NIE_ZMIERZONO. Nie podano wartości liczbowych bez odczytu.
