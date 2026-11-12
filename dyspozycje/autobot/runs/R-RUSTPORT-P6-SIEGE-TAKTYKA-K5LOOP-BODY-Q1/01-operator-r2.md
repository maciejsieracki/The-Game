STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1
GOAL: produkcyjne ciało jednostki w pętli oblężenia (ProdBody: activate_unit K5H + single_blow_full K5I) — runda 2, zakres (A)
ZMIANY/COMMIT: baza 1381cfb44 (ancestry ec7a0ff78 -> TAK). Kod: rust-port/engine/src/domain/siege_tactics_loop.rs (+ProdBody, ProdUnit, ProdOps, ProdPending; bez zmian w istniejących siege_tactics_*.rs, brak adapterów API); test nowy: rust-port/engine/tests/p6_siege_tactics_loop_body.rs (4 testy). Wektory i generator NIE zmienione. SHA: patrz sekcja DEPLOY/PUSH (commit na gałęzi roboczej).
TESTY:
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0, bez ostrzeżeń
- cargo test --lib: 88/88 OK
- cargo test --test p6_siege_tactics_loop: 4/4 OK (bez zmian)
- cargo test --test p6_siege_tactics_loop_body: 4/4 OK (nowy):
  * cios_w_zwarciu_daje_wynik_single_blow_full — HP obrońcy i zabicie zgodne z bezpośrednim single_blow_full z tym samym rzutem (0.5); czas ciosu z wejścia adaptera
  * ucieczka_routed_nic_nie_robi_i_jest_zapisana — routed: brak ciosu, wpis "ucieczka-routed"
  * jednostka_znikajaca_nie_ma_efektow_ani_wpisow — fadingOut: brak efektu, brak wpisu
  * doktryna_i_mur_sa_poza_zakresem_i_zapisane — doktryna i oblężenie: brak efektu, wpis w unported
- Uwaga: test cios_w_zwarciu sprawdza spójność składania, NIE zgodność z pinem (brak wektorów pinu dla ciała).
- Dysk: w trakcie sesji df spadł do 130M (współdzielony "/", nie własne artefakty); usunięto własny inkrementalny cache; kompilacja wykonana po zwolnieniu miejsca. Target poza repo: scratchpad/target-body.
BLOKADY / NIE_ZMIERZONO:
1. (B) Generator tests/p6_siege_tactics_loop_gen.mjs NIE rozszerzony: ciało nadal stubowane w wektorach; brak wykonania tekstu pinu _activateUnit/_singleBlow z realnymi funkcjami boju. Pin _activateUnit (battleScene.ts:6048-6299) wywołuje m.in. _doAttack, _fleeStep, _rangedAction, _advanceToward, _executeGroupDoctrineStep, _siegeRamTowerStep, _attackWallTile, których treść nie jest portowana — pełne wykonanie tekstu wymaga ich portu lub zaślepek poza zakresem rundy.
2. (C) Wektory z moveLeft>0 NIE dodane. Ciało nie czyta move_left (ruch = _fleeStep/_advanceStep, nieportowane). Test cover_fading_removed_routed_and_zero_mp z r1 bez zmian (nadal sprawdza pole "mp").
3. Brak wektorów pinu dla gałęzi fadingOut/removed/routed z asercją trace — test jednostki znikającej sprawdza brak efektu i brak wpisu, nie pełny trace z pinu.
4. Ograniczenia zakresu ProdBody (świadome, zapisane w unported zamiast cichego pominięcia):
   * tylko AUTO, bez oblężenia (siegeWallCol < 0), bez strzelca (canShoot), bez doktryny (doctrine_auto=false) — większość jednostek AUTO z doktryną NIE jest obsługiwana;
   * cel melee (_targetInRange) jest wejściem adaptera (ProdUnit::melee_target): pin wybiera cel zależnie od facing/attackDirection (relativeHit), których ten klocek nie niesie;
   * efekty _resolveBlowOutcome (morale, rout po ciosie, efekty sceny) i zbiór engaged NIE są stosowane — zapis w unported "resolveBlowOutcome-efekty" / "engaged-zbior";
   * czas ciosu (body_ms) i zasięg po terenie (apply_terrain_range) są wejściami adaptera, nie zweryfikowane względem pinu;
   * pola ActivateUnit/ActivateScene budowane przez wołającego (brak adaptera z TurnSeqState poza stanem CombatUnit).
5. Gałęzie tower_climb / infantry_to_tower / ram_tower_step traktowane jako bezczynne: w pinie (battleScene.ts:8023, :8057, :8088) pierwszy warunek to `siegeWallCol >= 0`, a ścieżka bez muru jest wykluczona wcześniej przez strażnik "oblezenie". Założenie zweryfikowane czytaniem pinu, nie wektorami.
6. surroundApplied trzymane w ProdBody (brak pola w CombatUnit) — brak wektora potwierdzającego jednorazowość przez wiele aktywacji.
7. Dispatch r2 wymagał „≥ 200 sekwencji end-to-end” z pinem — NIE_ZMIERZONO (punkt 1).
8. Pozostaje otwarte: rozbicie tematu (generator + wektory moveLeft + pełny port _targetInRange/_resolveBlowOutcome) na osobne tematy.
RUNDY: 2/5 (Operator, HAIKU). Poprzedni werdykt Evaluatora r1: FAIL (src bez zmian) — src teraz zmieniony.
NASTĘPNY KROK: Evaluator r2 ma ocenić zakres (A) (ProdBody + testy spójności) i zdecydować o podziale pozostałego GOAL (B, C, port _targetInRange/_resolveBlowOutcome) na osobne tematy; integracja i push wyłącznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej; bez push, bez integracji, bez zmian gra/ i origin/main).
