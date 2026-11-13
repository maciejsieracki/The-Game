STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1
GOAL: Rozpoznanie pól i migracji zapisu pin 07d2fbd72 vs Rust (P6.20-P6.22, plan §0b), bez zmian kodu.
ZMIANY/COMMIT: ocena Evaluatora (ten plik); weryfikowany commit Operatora e94867080 (potomek bazy 5e8b116e8, 2 nowe pliki dokumentacji, brak zmian w rust-port/**, gra/**, testach, Cargo.*).
TESTY: NIE DOTYCZY dla bramek cargo (temat bez kodu; fmt/clippy/test nie mają przedmiotu; Operator nie ruszył rust-port). Zamiast tego odtworzono dowody: git diff --stat 5e8b116e8..e94867080 (tylko 2 pliki .md); git grep na pinie 07d2fbd72 i bazie 5e8b116e8 dla ok. 25 twierdzeń plik:linia. Zgodne: save.ts:116/705-706/575/759, main.ts:38138/47024-47031/46462-46463/46690/47163/47190/37434/37451, save_load.rs:62/792/203-205 (flatten tylko w SaveMeta, SnapshotWire bez flatten), save_migrations.rs:221/224/282/344, war_forced_waves.rs:469/522, battleScene.ts:721 (MAX_PER_SIDE=500). Brak #[ignore]/osłabionych asercji (brak kodu). Zależność od W8: brak.
BLOKADY: brak blokad technicznych. Decyzje D1-D3 wymagają ABC właściciela (poza zakresem oceny).
RUNDY: 1/5 (Evaluator r1)

ZARZUTY (ponumerowane, żaden nie jest FAIL-em dla dokumentu rozpoznawczego):

1. Mylące BRAK dla migracji farm-na-lesie. Doc §3 i §5 poz. 6 / T5 piszą "BRAK (0 trafień 'farm' w save_load/save_migrations)". Rust ma już port helperów: improvement_build.rs:304-312 (`is_legacy_farm_on_forest_layer`, `strip_legacy_farm_on_forest`). Brakuje wyłącznie wpięcia w migrate_loaded_state; zakres T5 jest przez to przeszacowany (port vs wpięcie). Grep ograniczono do dwóch plików.

2. Mylące BRAK dla mapSnapshot. Doc §2a/§5 poz. 5 podaje `mapSnapshot` jako "0 trafień w modułach zapisu / BRAK". Rust ma pełny port: domain/map_snapshot.rs (P6.M17, `serialize_map_for_save` :318, buildGameMapFromSnapshot, `is_valid_map_snapshot`). Brak jest tylko pola w kopercie SnapshotWire. Status powinien brzmieć CZĘŚCIOWO (moduł jest, niewpięty).

3. `eliminatedOwners`: doc §2b pisze "0 odczytów w Rust". W Rust istnieją jawne wejścia i logika (eliminacja.rs:4-26, brake_inputs.rs:178). Prawdziwe tylko dla SaveMeta; sformułowanie zbyt silne.

4. `rallyPoints`: doc podaje "3 trafienia w domenie"; mój git grep -c pokazuje 5 w pathfinding.rs (i żadnych gdzie indziej). Liczba niezgodna; sens (brak w kopercie) bez zmian.

5. Kryterium 1 dispatchu ("każdy element zakresu: pin -> Rust -> status, z dowodem") nie spełnione w całości: `tura`, `seed`, `units`, `cities` bez porównania typów (NIE_ZMIERZONO), ok. 40-180 kluczy `meta` zbiorczo jako "zakres main.ts:37193-37440" bez linii na klucz. Operator uczciwie to oznaczył (§2b uwaga, §8), więc to nota, nie FAIL; dalsze tematy wykonawcze muszą to domknąć.

6. NIE_ZMIERZONO tam, gdzie da się zmierzyć w jednym kroku: doc §3 mówi "limit 500 zgodny z pinem? NIE_ZMIERZONO (nie czytano BATTLE_MAX_PER_SIDE)". Sprawdzone: battleScene.ts:721 `MAX_PER_SIDE = 500`, main.ts:4358-4359 `armyStackLimit()` zwraca BATTLE_MAX_PER_SIDE. Wartość zgodna z save_migrations.rs:221 (500). Także cytat "limit BATTLE_MAX_PER_SIDE main.ts:4358-4359" dotyczy funkcji armyStackLimit, a definicja stałej jest w battleScene.ts:721.

7. Kryterium 3 (szacunek rund "uzasadniony") dostarczone jako NIE_ZMIERZONO dla wszystkich T1-T6, mimo że plan §0c poz. 8 (R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1) podaje szacunek 2-3 rundy dla całości, a doc sam cytuje tę pozycję w §4 bez przeniesienia szacunku. Operator mógł podać zakres planu jako punkt odniesienia z zaznaczeniem źródła.

8. Rekomendacja D1=C ("najmniejszy zakres") bez dowodu; to opinia, nie pomiar. Warto oznaczyć jako rekomendację bez oszacowania zakresu (T4 ~12 pól top-level + mapowanie nie policzone).

9. Higiena: tabela §2b przy `playerEpochWarEnabled`/`autoBuildEnabled` cytuje linie pinu zgodnie ze stanem pinu (47163/47190, zweryfikowane), natomiast komentarze Rust cytują 46701/46706 (stare numery); nie błąd Operatora, ale dokument nie ostrzega o dryfie numeracji.

Ocena ogólna: ustalenia kluczowe (D1 format web v3 nieczytany przez Rust; brak siatki stosu na starcie tury; forcedWarWaves niewpięte; brak producentów zapisu; wonderBuildSites brak po obu stronach) potwierdzone dowodami. Zarzuty 1-2 to realne przeszacowanie luk (sugeruję korektę przed użyciem listy braków do podziału tematów); reszta to noty.

NASTĘPNY KROK: Final Control; sugerowana drobna poprawka dokumentu (zarzuty 1, 2, 6, 7) przez Operatora lub przyjęcie z notami.
DEPLOY/PUSH: NIE WYKONANO
