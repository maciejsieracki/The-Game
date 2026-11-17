//! P6-WIRE-R7K7C (#106/#298/#299, runda 1): brama testow R7K7C.
//! Podmodul `apply`: wektory `apply_dipl_deltas_to_state` z pinu i testy atomowosci.
//! Podmodul `wiring`: trzy tury `advance_turn` z przyrostami D6 wojny.

mod apply {
    //! P6-WIRE-R7K7C (#106/#298/#299, runda 1): `apply_dipl_deltas_to_state` wobec wektorow z pinu.
    //!
    //! Wektory: `p6_r7k7c_vectors/apply.json` (generator `p6_r7k7c_vectors/apply_gen.mjs`, wykonuje tekst pinu
    //! 07d2fbd72 `gra/src/main.ts` przez Node). Kazdy wektor niesie `ref` z numerem linii pinu.
    //! Test "brak wpisu = 0": wlasciciel bez wpisu w stanie = zero, nie blad. Test atomowosci: niefinitny przyrost
    //! odrzuca cala aplikacje (zadnej zmiany).

    use std::collections::BTreeMap;

    use civ_engine::domain::playable::{
        PlayableGame, PlayablePlayer, PlayableReplaceEconomy, PlayableState, StartGameParams,
    };
    use civ_engine::domain::turn_war_dipl_steps::apply_dipl_deltas_to_state;
    use civ_engine::domain::PlayerId;
    use serde_json::Value;

    const VECTORS: &str = include_str!("p6_r7k7c_vectors/apply.json");
    const HUMAN: u64 = 0;

    fn base_state() -> PlayableState {
        let game = PlayableGame::new(StartGameParams {
            seed: 11,
            ..StartGameParams::default()
        })
        .expect("scenario");
        let mut state = game.state().clone();
        state.players = vec![PlayablePlayer {
            id: PlayerId::new(HUMAN),
            name: "Czlowiek".to_owned(),
            civilization: "Test".to_owned(),
            is_human: true,
        }];
        state.economy = PlayableReplaceEconomy::default();
        state
    }

    fn obj_u64(v: &Value) -> BTreeMap<u64, f64> {
        v.as_object()
            .map(|m| {
                m.iter()
                    .map(|(k, x)| {
                        (
                            k.parse::<u64>().expect("klucz"),
                            x.as_f64().expect("liczba"),
                        )
                    })
                    .collect()
            })
            .unwrap_or_default()
    }

    fn obj_i64(v: &Value) -> BTreeMap<i64, f64> {
        v.as_object()
            .map(|m| {
                m.iter()
                    .map(|(k, x)| {
                        (
                            k.parse::<i64>().expect("klucz"),
                            x.as_f64().expect("liczba"),
                        )
                    })
                    .collect()
            })
            .unwrap_or_default()
    }

    fn apply(
        state: &mut PlayableState,
        t: &BTreeMap<i64, f64>,
        p: &BTreeMap<i64, f64>,
    ) -> Result<(), String> {
        apply_dipl_deltas_to_state(state, t, p).map_err(|e| e.to_string())
    }

    #[test]
    fn wektory_z_pinu_apply_zgodne() {
        let doc: Value = serde_json::from_str(VECTORS).expect("apply.json");
        assert_eq!(doc["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
        let vectors = doc["vectors"].as_array().expect("vectors");
        assert!(vectors.len() >= 150, "wektorow: {}", vectors.len());
        for v in vectors {
            let id = v["id"].as_u64().expect("id");
            let src = v["ref"].as_str().expect("ref");
            assert!(
                src.starts_with("main.ts:"),
                "wektor {id}: brak plik:linia ({src})"
            );

            let mut state = base_state();
            state.economy.treasury = v["human_treasury"].as_f64().expect("ht");
            state
                .economy
                .praca_pool_by_owner
                .insert(HUMAN, v["human_praca"].as_f64().expect("hp"));
            state.economy.ai_treasury_by_owner = obj_u64(&v["ai_treasury"]);
            for (k, x) in obj_u64(&v["ai_praca"]) {
                state.economy.praca_pool_by_owner.insert(k, x);
            }

            let t = obj_i64(&v["treasury_deltas"]);
            let p = obj_i64(&v["praca_deltas"]);
            apply(&mut state, &t, &p).unwrap_or_else(|e| panic!("wektor {id} ({src}): {e}"));

            let e = &v["expect"];
            assert_eq!(
                state.economy.treasury,
                e["human_treasury"].as_f64().expect("e.ht"),
                "wektor {id} ({src}): skarbiec gracza"
            );
            assert_eq!(
                state.economy.ai_treasury_by_owner,
                obj_u64(&e["ai_treasury"]),
                "wektor {id} ({src}): skarbce AI"
            );
            let mut expect_praca = obj_u64(&e["ai_praca"]);
            expect_praca.insert(HUMAN, e["human_praca"].as_f64().expect("e.hp"));
            assert_eq!(
                state.economy.praca_pool_by_owner, expect_praca,
                "wektor {id} ({src}): pule Pracy"
            );
        }
    }

    #[test]
    fn brak_wpisu_wlasciciela_to_zero_nie_blad() {
        let mut state = base_state();
        // Brak wpisow w stanie (skarbiec AI 2, pula Pracy 3 i 0): traktowane jak 0 (pin `?? 0`).
        let t = BTreeMap::from([(2_i64, 7.5), (0_i64, -3.0)]);
        let p = BTreeMap::from([(3_i64, 4.0), (0_i64, -2.0)]);
        apply(&mut state, &t, &p).expect("brak wpisu nie jest bledem");
        assert_eq!(state.economy.ai_treasury_by_owner.get(&2), Some(&7.5));
        assert_eq!(
            state.economy.treasury, -3.0,
            "gracz bez wpisu startuje od 0"
        );
        assert_eq!(state.economy.praca_pool_by_owner.get(&3), Some(&4.0));
        assert_eq!(
            state.economy.praca_pool_by_owner.get(&0),
            Some(&0.0),
            "pula Pracy nie schodzi ponizej zera (pin setOwnerPracaPool)"
        );
    }

    #[test]
    fn brak_wpisu_w_tabeli_przyrostow_nic_nie_zmienia() {
        let mut state = base_state();
        state.economy.ai_treasury_by_owner.insert(2, 50.0);
        state.economy.praca_pool_by_owner.insert(2, 9.0);
        let before = state.economy.clone();
        apply(&mut state, &BTreeMap::new(), &BTreeMap::new()).expect("pusta tabela");
        assert_eq!(state.economy, before, "brak przyrostow = brak zmiany");
    }

    #[test]
    fn zerowy_przyrost_bez_wpisu_tworzy_zero_jak_pin() {
        // Pin `add` zapisuje `(get ?? 0) + delta` dla kazdego wlasciciela z delty, takze gdy delta = 0.
        let mut state = base_state();
        apply(
            &mut state,
            &BTreeMap::from([(4_i64, 0.0)]),
            &BTreeMap::new(),
        )
        .expect("zero");
        assert_eq!(state.economy.ai_treasury_by_owner.get(&4), Some(&0.0));
    }

    #[test]
    fn niefinitny_przyrost_odrzuca_cala_aplikacje() {
        let mut state = base_state();
        state.economy.ai_treasury_by_owner.insert(2, 10.0);
        state.economy.praca_pool_by_owner.insert(2, 5.0);
        let before = state.economy.clone();
        let t = BTreeMap::from([(2_i64, 5.0), (3_i64, f64::NAN)]);
        assert!(apply(&mut state, &t, &BTreeMap::new()).is_err());
        assert_eq!(state.economy, before, "blad = zero zmian (atomowosc)");

        let p = BTreeMap::from([(2_i64, f64::INFINITY)]);
        assert!(apply(&mut state, &BTreeMap::new(), &p).is_err());
        assert_eq!(state.economy, before);
    }

    #[test]
    fn przepelnienie_salda_odrzuca_aplikacje() {
        let mut state = base_state();
        state.economy.treasury = f64::MAX;
        let before = state.economy.clone();
        let t = BTreeMap::from([(0_i64, f64::MAX)]);
        assert!(apply(&mut state, &t, &BTreeMap::new()).is_err());
        assert_eq!(state.economy, before);
    }
}

mod wiring {
    //! P6-WIRE-R7K7C (#106, runda 1): wiring `apply_dipl_deltas_to_state` w `advance_turn`.
    //!
    //! Scenariusz: danina (trybut) AI 2 -> gracz 1 (fotel czlowieka z `PlayableGame::new`), 40 zlota na ture, skarbiec AI 2 = 100. Pin
    //! (`main.ts:24275-24298` + `diplomacy-economy.ts` `tickDiplomacyPayments`): platnosc gdy saldo platnika >= kwota,
    //! inaczej trybut zerwany i umowa znika. Przewidywany przebieg, wg pinu:
    //!   tura 1: gracz 10 -> 50, AI 100 -> 60 (zaplacone);
    //!   tura 2: gracz 50 -> 90, AI 60 -> 20 (zaplacone);
    //!   tura 3: AI 20 < 40 -> trybut zerwany, umowa usunieta, salda bez zmian.
    //! Przyrosty z raportu wojny (D6) musza dotrzec do `PlayableState` przez `advance_turn`.

    use civ_engine::domain::diplomacy::{ActiveDeal, TreatyEconomy, TreatyKind};
    use civ_engine::domain::playable::{
        PlayableCity, PlayableGame, StartGameParams, FOUNDING_CITY_POPULATION,
    };
    use civ_engine::domain::{CityId, PlayerId, PositionDto};

    const HUMAN: u64 = 1;
    const AI: u64 = 2;

    fn tribute_deal() -> ActiveDeal {
        let mut d = ActiveDeal::new(
            TreatyKind::Vassalization,
            PlayerId::new(AI),
            PlayerId::new(HUMAN),
            1,
            None,
        );
        d.id = "danina".to_owned();
        d.economy = Some(TreatyEconomy {
            payer_owner_id: PlayerId::new(AI),
            receiver_owner_id: PlayerId::new(HUMAN),
            money_per_turn: 40.0,
        });
        d
    }

    fn scenario() -> PlayableGame {
        let mut game = PlayableGame::new(StartGameParams {
            seed: 11,
            ..StartGameParams::default()
        })
        .expect("scenario");
        game.add_player(AI, "AI".to_owned()).expect("ai");
        let mut state = game.state().clone();
        state.cities.push(PlayableCity {
            id: CityId::new(900),
            owner_id: PlayerId::new(AI),
            name: "AI-city".to_owned(),
            position: PositionDto::new(5, 5),
            is_capital: true,
            population: FOUNDING_CITY_POPULATION,
            culture: 0,
        });
        state.economy.treasury = 10.0;
        state.economy.ai_treasury_by_owner.insert(AI, 100.0);
        state.war.diplomacy.add_deal(tribute_deal());
        PlayableGame::from_state(state)
    }

    #[test]
    fn trzy_tury_przyrosty_wojny_trafiaja_do_stanu() {
        let mut game = scenario();
        let mut seen = Vec::new();
        for _ in 0..3 {
            game.advance_turn().expect("advance_turn z danina");
            let s = game.state();
            seen.push((
                s.economy.treasury,
                s.economy.ai_treasury_by_owner.get(&AI).copied(),
            ));
        }
        assert_eq!(
            seen,
            vec![(50.0, Some(60.0)), (90.0, Some(20.0)), (90.0, Some(20.0)),],
            "wiring D6 -> PlayableState"
        );
        assert!(
            game.state()
                .war
                .diplomacy
                .deals
                .iter()
                .all(|d| d.id != "danina"),
            "tura 3: AI bez srodkow = trybut zerwany, umowa usunieta"
        );
    }
}
