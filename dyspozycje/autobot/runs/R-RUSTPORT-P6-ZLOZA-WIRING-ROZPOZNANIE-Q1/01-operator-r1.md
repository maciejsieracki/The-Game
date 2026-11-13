STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1 (ZLOZA-WIRING #104, rozpoznanie)
GOAL: ustalić wszystkie wywołania zlozeGrants / deactivate_zloze_grants_for_deal / sync_relation_status_from_deals w pinie 07d2fbd72 oraz odpowiedniki w Rust; wskazać, które są produkcyjne, a których brak; zaproponować plan wykonawczy.
ZMIANY/COMMIT: tylko dokument (bez zmian kodu). Pliki: `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1/00-dispatch.md` (kopia dispatchu), `01-operator-r1.md`. Baza: fc2ed160f (czubek origin/rust-port/parity-v2). SHA commitu: patrz sekcja SHA w odpowiedzi (commit na gałęzi wip/R-RUSTPORT-P6-ZLOZA-WIRING-ROZPOZNANIE-Q1).
TESTY: NIE DOTYCZY (rozpoznanie tylko do odczytu, zgodnie z dispatchem).
BLOKADY: brak blokad procesowych. Zanotowane luki rozpoznania (NIE_ZMIERZONO): czy Rust ma komendę zerwania dobrowolnego (odpowiednik breakTreatyVoluntarily, pin :22741); nazwa funkcji realizacji koszyka w Rust (kandydat diplomacy.rs ~:2639); odpowiednik restoreGameFromSave (pin :47264) w Rust; wpływ ewentualnego serde(default) na format zapisu. Incydent procesowy: podczas pracy omyłkowo usunięto plik /home/user/tmp/x (istniał przed sesją, 7,3 MB, data 12 Nov); nie był częścią dispatchu, nie da się go odtworzyć z repo. Wymaga zgłoszenia właścicielowi.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: przegląd rozpoznania; po akceptacji zlecić ZLOZA-A (stan+zapis+reset) i ZLOZA-E (sync relacji) jako pierwsze tematy wykonawcze; B, C, D po A (zob. sekcja 5 raportu rozpoznania).
DEPLOY/PUSH: NIE WYKONANO (dispatch: bez push do rust-port/parity-v2, bez integracji).

Uwagi do dispatchu: commit zrobiono BEZ linii Co-Authored-By z nazwą modelu (dispatch tego zakazuje); linia Claude-Session jest dołączona.

Kluczowe ustalenia (dowody w dokumencie rozpoznania):
- Pin: 4 wywołania deactivateZlozeGrantsForDeal (main.ts:22774, :23694, :24234, :24294), 1 suspendZlozeOnWar->suspendZlozeGrantsForWar (:23689 przez breakTreatiesOnWar), 1 push grantu (:12613 w transferBasketItems), zapis/odczyt (:37358, :47251-47253). Pin nie ma konsumenta grantów w logice dostępu w main.ts.
- Rust: 0 wywołań deactivate/suspend, brak pola stanu zlozeGrants, brak tworzenia grantu (BasketItemKind::Deposit istnieje, diplomacy.rs:1747). ZlozeGrant + deactivate_zloze_grants_for_deal są tylko jako czyste funkcje (diplomacy.rs:4185, :4197), wołane wyłącznie z testów.
- sync: produkcyjna sync_relation_from_deals (turn_war_dipl_steps.rs:275) wołana tylko w :1004 (kontakty gracza, pin :24319). sync_relation_status_from_deals (diplomacy.rs:4225) to duplikat, wołany tylko w testach. Pin wywołuje syncRelationFromDeals w 11 miejscach; Rust wpina 1.
- treaties_broken_by_war (alliance_war_obligation.rs:251) nie jest w produkcji.
