# P6-WIRE-WAR-DECLARE-CLEANUP (W4) — deklaracja wojny wymuszonej, sprzątanie przy pokoju, koniec wg miast, zakup AI

Temat: `R-RUSTPORT-P6-WIRE-WAR-DECLARE-CLEANUP-Q1`, runda 1/5. Wiersz W4 w `P6-WIRE-WAR-TURN-PLAN.md`.
Baza Rust: `origin/rust-port/parity-v2` = `d2d533a77` (W1, W2, W3, AI-ZAKUP). Web (pomiar grepem): `origin/main`, `gra/src/main.ts`.
Domena: GAME (Rust).

## Zakres (moduł `domain/war_turn_declare.rs`)

| Funkcja | Web (grep, może dryfować) | Zachowanie |
|---|---|---|
| `declare_forced_wars` / `declare_from_assignments` | `*ForceWarActiveByPairKey.set`, `*CycleOwners.add`, `*PendingOwners.delete` (ok. 41559–41595) | wpis pary `min-max` z `startTurn = turn`, 0/0 miast; cykl bez duplikatów; pending bez napastnika |
| `mark_era_enter_turn` | `bronze/ironEraEnterTurnByOwner.set` (ok. 2448/2466) | upsert; Kamień nie ma mapy, zwraca false |
| `cleanup_forced_war_on_peace` | `cleanup{Stone,Iron,Bronze}ForcedWarOnPeace` (ok. 11590–11619) | usuwa wpis TEJ epoki, zwraca klucz fal do usunięcia, `rest_until = turn + 20` |
| `set_era_peace_lock` / `is_era_peace_blocked` | `forcedEraPeaceUntilNextEraByPairKey.set` (ok. 11690), `isForcedEraPeaceLocked` | blokada `{ownerId, era}`; blokuje gdy `currentEra <= warEra` |
| `register_regular_war_city_loss` | `recordRegularWarCityLoss` (ok. 35620–35660) | próg 2 po obu stronach (D3=1:1); bramka bilansu AI-AI; wpis usuwany przy pokoju |
| `run_ai_purchase_commands` | `shouldAIPurchaseUnit` -> `purchaseRecruitmentUnit` (ok. 42441–42456) | wykonanie przez `ai_try_purchase_unit` na realnym stanie państwa |

## Założenia (ZAŁOŻENIE, nie BLOCK)

- Z1: mapy `regularWarCapturedByPairKey` i `forcedEraPeaceUntilNextEraByPairKey` w JSON to tablice par `[klucz, wartość]`, jak `*ActiveByPairKey` w W1. Brak pola = pusta mapa.
- Z2: wypowiedzenie wymuszone = przypisanie z `assignForcedWarPairings`, którego para została faktycznie wypowiedziana (wołający podaje `declared`).
- Z3: bilans AI-AI liczy wołający (`peaceOfferAiOwnBilans` poza zakresem) i przekazuje `ai_ai_balance_ok`.
- Z4: kolejka rekrutacji i wybór miasta leżą po stronie wołającego; moduł pobiera koszt z magazynu państwa.
- Z5: start pary = tura wypowiedzenia, stan 0/0.
- Z6: dług W3-7 (dedup po ownerId) NIE zamknięty; cykl używa `Vec::contains`.
- Blokada pokoju epoki nie jest zdejmowana w tej partii (zdjęcie przy zmianie epoki poza zakresem W4).

## Testy

- `rust-port/engine/tests/p6_wire_war_declare.rs`: 15 testów (deklaracja, cykl, sprzątanie i odpoczynek, blokada epoki, licznik miast do 2 i bilans, zakup na realnym stanie, odmowa przy braku zasobów i bramce skarbca, round-trip `meta`).
- Wektory z uruchomionego weba: NIE (logika inline w `main.ts`); oczekiwane wartości z odczytanych reguł, NIE_ZMIERZONO względem uruchomionego weba.
