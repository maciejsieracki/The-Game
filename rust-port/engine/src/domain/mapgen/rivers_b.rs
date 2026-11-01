//! Szkielet P6.M00 (pusty). Temat wlasciciel: R-RUSTPORT-P6-M07B-RZEKI-B-TRACE-Q1.
//! Zakres web (P6-25 §6): gen-helpers.ts:6069-7249.
//! Zadnego kodu w M00; kolejne tematy edytuja wylacznie swoje pliki.

/// P6.M07B-Q3 partia 3b: A* do morza z kopcem (gen-helpers.ts:6341-6484).
pub mod astar;
/// P6.M07B-Q2 partia 2: wzrost rzeki od ujscia na brzegu (gen-helpers.ts:6081-6232).
pub mod coast_grow;
/// P6.M07B-Q2 partia 1: krawedzie rzek, obwod heksa, uproszczenie sciezki (gen-helpers.ts:7122-7249).
pub mod edges;
/// P6.M07B-Q3 partia 3c: meandry, wydluzanie, ogon ujscia (gen-helpers.ts:6526-6706).
pub mod extend;
/// P6.M07B-Q2 partia 2: krok meandru ku celowi (gen-helpers.ts:6485-6519).
pub mod meander;
/// P6.M07B-Q4 partia 4c: limit kwot rzek (gen-helpers.ts:6943-6958).
pub mod quotas;
/// P6.M07B-Q4 partia 4b: zrodla rzek (gen-helpers.ts:6866-6987).
pub mod sources;
/// P6.M07B-Q4 partia 4a: pelne trasowanie rzeki (gen-helpers.ts:6707-6853).
pub mod trace;
/// P6.M07B-Q3 partia 3a: trasowanie od wybrzeza i zjazd zachlanny (gen-helpers.ts:6233-6340).
pub mod trace_coast;
/// P6.M07B partia 1: geometria okna skretu (gen-helpers.ts:7051-7086).
pub mod turn;
/// P6.M07B-Q2 partia 1: sanityzacja sciezki pod okno skretu (gen-helpers.ts:7094-7121).
pub mod window;
