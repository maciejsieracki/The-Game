STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-KOSZT-Q1
GOAL: parytet kosztu Pieniadza i max_hp po zamianie jednostki (UNIT-REPLACE L-3 etap 4) z pinem 07d2fbd72; produkcyjna komenda ReplaceUnit korzysta z portow, nie z gołej tabeli bazowej.
ZMIANY/COMMIT: baza 05aaf3922 (FC L3-DEFS, kod c8536bc9e); galaz rust-port-wip/UNIT-REPLACE-L3-KOSZT-Q1; kod 15c99d0a9 + straznik SHA-256 4e5dd02b4; raport 4633c9ca9 (HEAD). Allowlista: src/domain/{mod.rs (rejestracja unit_replace_cost), unit_replace_defs.rs, unit_replace_wiring.rs, unit_replace_cost.rs (nowy), playable.rs}, tests/p6_unit_replace_{defs,l3,l3_state}.rs, tests/p6_unit_replace_cost.rs (nowy), tests/p6_unit_replace_cost_vectors/ (nowy: gen-unit-replace-cost-vectors.mjs + unit-replace-cost-vectors.json). Poza allowlista: brak. Odstepstwo swiadome: playable.rs dostal wariant bledu ReplaceDifficultyUnknown (mapowanie etykiety trudnosci stanu; patrz zalozenia). Cargo.lock nie commitowany. Nie dotykano gra/, data/**, Cargo.toml, origin/main, WERSJE.md.

ZMIERZONY LANCUCH WEBA (pin 07d2fbd72, gra/src):
- replaceUnitMoneyCost: main.ts:7913-7918 -> unitProductionItem(typeId, data, civBonusyForOwnerId(0), player.kosztJednostekPace ?? 'niski', 0, _menuDifficulty).koszt
- unitProductionItem: game/production.ts:443-460 -> itemCost('jednostka', name, data, 1) (= scaleCostByEpoch(unitCostFromDef(u), u.Epoka), production.ts:~370-385) + unitMoneyCost
- unitMoneyCost: production.ts:625-640 (rabat: civRecruitmentDiscount + civMatrixCostDiscount; applyUnitCostPace; applyDifficultyCostMultiplier)
- civMatrixCostDiscount: production.ts:644; civRecruitmentDiscount: production.ts:674; civProductionCostBonusyForCivKey: production.ts:657
- civBonusyForOwnerId: main.ts:9842 (civMatrixBonusyForCivKey + civProductionCostBonusyForCivKey); civKeyForOwnerId: main.ts:9813
- applyUnitCostPace: game/unit-cost-tempo.ts:33 (niski x1 / normalny x2 / wysoki x4, min 1)
- applyDifficultyCostMultiplier: game/difficulty-cost.ts:75; getCostMultiplierForOwner: difficulty-cost.ts:64 (normal 1; easy gracz 1 / AI 2; hard gracz 2 / AI 1)
- newMaxHp: main.ts:8138-8140 (gracz) i main.ts:7548-7550 (AI) = effectiveMaxHp(unitHealth(newDef), unitParametryBonusFrac(u), veteranCombatBonusFrac(u))
- oldMaxHp: main.ts:8137 = effectiveRuntimeUnitMaxHp(u, def) (main.ts:33101) - ta sama formula na bazowym HP starego typu
- unitHealth: main.ts:33093 = normFieldVal(def['health'] ?? def['Health'], 30) (klucz malymi literami wygrywa)
- effectiveMaxHp: game/unit-card-stats.ts:79 (bonusy dodawane przed jednym mnozeniem, roundCardStat); veteranCombatBonusFrac: game/veteran.ts:139; unitParametryBonusFrac: game/unit-building-bonuses.ts:344
- syncHpMax: !humanTreasury (deps zamiany w main.ts, obok newMaxHp) -> dla gracza hpMax NIE jest synchronizowany

ISTNIEJACE PORTY UZYTE (bez duplikacji):
- building_costs.rs:1805 unit_money_cost_web (= unitMoneyCost + rabaty + tempo + trudnosc), :1732 civ_recruitment_discount, :1719 civ_matrix_cost_discount, :1763 civ_production_cost_markers (= civProductionCostBonusyForCivKey), :1853 apply_difficulty_cost_multiplier; recruitment.rs:1355 apply_unit_cost_pace. Wektory B2 (p6_repin_b2_production, 21464 przypadkow z pina 91dc998a) nadal zielone. Sprawdzone grepem: funkcje kosztu (production.ts 577-674, difficulty-cost.ts, unit-cost-tempo.ts) NIE zmienily sie miedzy 91dc998a a 07d2fbd72 (hunki production.ts dotycza innych funkcji).
- unit_health.rs: unit_health_value (klucz health), effective_max_hp, veteran_combat_bonus_frac; combat::unit_building_bonuses::unit_parametry_bonus_frac.
- NIE uzyto production_units.rs:3382 unit_purchase_cost (wymaga UnitCostRow z pelnym ProductionData); baza kosztu to tabela derived/unit-gold-costs.json, ktora dla 64 z 66 jednostek z dodatnim kosztem jest rowna scaleCostByEpoch(raw) z pina (patrz rozbieznosci danych).
- Znany dublet poza allowlista (NIE ruszany): unit_health.rs heal_max_hp = ta sama skladanka dla getMaxHp leczenia.

ZMIANY PORTU:
- unit_replace_cost.rs (nowy): replace_money_cost(base, name, ctx) i replace_max_hp(base_health, progress) - sklejka portow.
- unit_replace_defs.rs: production_replace_defs_with(ctx) i production_replace_defs_for_civ(civ, pace, difficulty); money_cost = pelny koszt Pieniadza z markerami/tempem/trudnoscia; max_hp = health_lc (bylo Health - blad wzgledem web unitHealth).
- unit_replace_wiring.rs: replace_unit_wired dostaje argument progress; old/new max HP przez replace_max_hp (jak web oldMaxHp/newMaxHp).
- playable.rs: replace_unit buduje tabele z params.civ_id, params.advanced.unit_cost_pace i params.difficulty; PLAYABLE_UNIT_PROGRESS = jawnie zerowy postep; replace_difficulty_of: "Normalny"/"normal" -> Normal, "easy", "hard", inna etykieta -> PlayableError::ReplaceDifficultyUnknown (bez zgadywania).

ZALOZENIA STANU (jawne, nie ciche domyslne):
- Wlasciciel gracza (owner 0) = params.civ_id (domyslnie "rzymianie"), zgodnie z web civKeyForOwnerId(0). NIE_ZMIERZONO: dopasowanie civ_id -> wiersz macierzy dla WSZYSTKICH cywilizacji (zmierzone tylko dla klucza domyslnego i wektorow B2).
- Tempo kosztu = params.advanced.unit_cost_pace (domyslnie "niski" = web fallback).
- Trudnosc = etykieta params.difficulty (domyslnie "Normalny" -> Normal). Stan nie ma walidacji tej etykiety (NOT_IMPLEMENTED w StartGameParams), wiec nieznana etykieta daje blad zamiany.
- Postep jednostki (battlesSurvived, parametryBonusProc) - PlayableState tego nie niesie; przyjete jako brak (0). Do zrobienia gdy stan dostanie te pola.
- Gracz: hpMax nie jest synchronizowany (web syncHpMax=false) - test e2e to asertuje; HP po zamianie = newMaxHp.

TESTY (wszystko EXIT 0, lokalnie, CARGO_TARGET_DIR poza repo):
- cargo fmt --check: 0 roznic (po rustfmt na zmienionych plikach).
- cargo clippy --all-targets -- -D warnings: czysto.
- cargo test --lib: 60 passed, 0 failed.
- p6_unit_replace_defs 7; p6_unit_replace_l3 8; p6_unit_replace_l3_state 12 (w tym nowy e2e produkcyjna_zamiana_ustawia_kategorie_hp_i_koszt_z_tabeli: koszt = tabela, kategoria, hpMax=None dla gracza, HP = newMaxHp); p6_repin_unit_replace_pure 7; p6_repin_unit_replace_execute 1; p6_repin_b2_production 17 (regresja B2); p6_unit_replace_cost 3 (nowy).
- Pelny cargo test: NIE_ZMIERZONO (zgodnie z dispatchem).

WEKTORY POCHODZENIE: generator gen-unit-replace-cost-vectors.mjs wykonuje TEKST pinu 07d2fbd72 w node (stripTypeScriptTypes; wyciagniete funkcje po nazwie, bez przeróbki logiki). Pin wyciagniety przez git archive poza repo. Przypadki: money 22176 (66 jednostek z dodatnim kosztem x 8 zestawow markerow x 7 tempo x 2 wlasciciele x 3 trudnosci), hp 525 (75 jednostek x 7 postepow, obie wersje klucza zdrowia). Spot-check reczny: Wojownik bazowy 5, markery jednostki-0.10, tempo wysoki, AI, hard = 16 (ok); 22 HP z param 20% i weteran 3 = 30.8 (ok). Markery z macierzy nie sa generowane z pliku macierzy: zestawy sa jawne (konstrukcja wierszy macierzy testowana osobno w B2).
Straznik: meta.textSha256 = 6d734a83d43db62b2a95ef0cbb2c1d1995b2a2b78d7dc227a0440e9941569e69 (SHA-256 tekstu wyciagnietych funkcji pinu); stala EXPECTED_TEXT_SHA256 w tests/p6_unit_replace_cost.rs wymusza swiadoma zmiane przy regeneracji z innego pina. meta.pinSha = 07d2fbd72f758705f8e1d59cc4968027ffbafe75.

ROZBIEZNOSCI DANYCH (decyzja gameplay, zadanie 27 - NIE rozstrzygane):
- Koszt Pieniadza: Konnica Rust 22 vs pin 44; Jeździec chiński Rust 28 vs pin 56 (dane units.json Rust: Pieniądz (koszt)/Epoka vs pin). Pozostale 64 jednostki z dodatnim kosztem zgodne.
- max_hp (health): brak rozbieznosci dla 75 jednostek.
- Wojownik: units.json Rust ma health 22 i Health 60; web uzywa health (22). Port uzywa health - zgodnie z pinem.
Test tabela_produkcyjna_koszt_i_hp_z_danych_pinu wypisuje te pozycje (eprintln) i nie rozstrzyga ich.

BLOKADY: brak blokujacych w zakresie tematu. Otwarte: (1) dopasowanie civ_id -> macierz dla wszystkich cywilizacji (NIE_ZMIERZONO); (2) postep jednostki w PlayableState (battlesSurvived/parametryBonusProc) - do osobnego tematu; (3) dane Konnica/Jeździec chiński (decyzja gameplay).

RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) na galezi rust-port-wip/UNIT-REPLACE-L3-KOSZT-Q1 @ 15c99d0a9 + Final Control; integracja dopiero po READY_FOR_DEPLOY (orkiestrator). Push i integracja nie wykonywane w tym etapie.
DEPLOY/PUSH: NIE WYKONANO
