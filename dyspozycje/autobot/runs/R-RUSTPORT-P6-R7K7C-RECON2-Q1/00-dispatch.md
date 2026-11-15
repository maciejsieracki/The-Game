# DISPATCH R-RUSTPORT-P6-R7K7C-RECON2-Q1 (runda 1) — ROZPOZNANIE WERYFIKACYJNE, BEZ ZMIAN KODU

TEMAT: ponowna weryfikacja #106 (R7K7C-WIRING). Poprzednie rozpoznanie (`R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1`, `0515603ee`) zawierało twierdzenie o podłodze Pracy, które się NIE potwierdziło (temat PRACA-FLOOR zamknięty: bramka `buyer_ok` na żywym ledgerze, Rust `turn_war_dipl_steps.rs:548–553` = pin `main.ts:24141–24147`). Ta runda sprawdza pozostałe twierdzenia ZANIM powstanie dispatch wdrożeniowy.
DOMENA: GAME (read-only).
Baza: `origin/rust-port/parity-v2` na chwilę startu (zapisz SHA; oczekiwane `533d46dd3`). Worktree detached.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts`.

## CO WERYFIKOWAĆ (każde twierdzenie: TAK / NIE / NIE_ZMIERZONO z plik:linia)
1. `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs` ok. 1031): czy jest jakikolwiek wołający w `src/` (`git grep`)? Czy `advance_turn` (`playable.rs` ok. 1105) prowadzi do D3 przez `run_dipl_steps` (`turn_war_pipeline.rs` ok. 370)? Gdzie w pinie odpowiada to D3 (`applyCyclicDeliveryOutcome`, ok. 23988–24025) i czy kolejność jest zgodna.
2. Zapas miast (`city_stock`): czy pin zapisuje zapasy miast w D3 (ok. 24008)? Czy Rust D3 (`turn_war_dipl_steps.rs` ok. 136, 1009) zapisuje `city_stock` do stanu, czy tylko raportuje? Jaki jest skutek braku zapisu (reprodukcja na istniejącym stanie: czy zapas miasta różni się od pina)?
3. `barbarian_grace` (pin `main.ts` ok. 6020–6030 oraz zapis ok. 22741–22774): czy Rust ma pole stanu i konsumenta? Jeśli nie — czy to wpływa na grę (pin czyta go w `hasAuthorizedBorderCrossing`)?
4. Brak wpisu właściciela: pin dla AI `?? 0` (ok. 34865–34877), dla człowieka `get(id)!`. Rust `praca_of` (`turn_war_dipl_steps.rs` ok. 343–348) i `apply` (ok. 1089–1093) zwracają błąd dla braku wpisu. Czy da się wywołać ten przypadek w produkcji (czy produkcja zawsze wstawia pulę każdego właściciela)? Jeśli nie da się — NIE_ZMIERZONO i rekomendacja: zostawić błąd (nie zmieniać), czy wdrożyć 0 dla AI.
5. Przepływ D6 (`tick_diplomacy_payments`): potwierdź, że obejmuje tylko złoto (pin `diplomacy-economy.ts` ok. 78–124).

## KRYTERIA KOŃCA
1. Tabela 5 punktów: twierdzenie → TAK/NIE/NIE_ZMIERZONO → dowód (plik:linia pina i Rust) → wpływ na grę (tak/nie, jak zmierzono).
2. Lista tematów wdrożeniowych, każdy: zakres, allowlista, test (co będzie czerwone przed zmianą), zależności — tylko dla punktów potwierdzonych.
3. Co NIE jest tematem (punkty obalone lub bez wpływu) — wprost.
4. Zero zmian w `rust-port/**`, `gra/**`, testach. Nie uruchamiać cargo (dysk).

## ALLOWLISTA
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-RECON2-Q1/**`
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-R7K7C-RECON2-Q1.md` (NOWY)
ZAKAZ: wszystko inne. Bez push do `parity-v2`. Commit na `wip/…`, bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
