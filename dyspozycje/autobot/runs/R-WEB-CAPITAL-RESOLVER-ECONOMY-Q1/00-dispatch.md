# R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1 — MINTDEBT (#165): efekty stolicy w ekonomii tury według autorytatywnej stolicy (nie „pierwsze miasto w tablicy”)
STATUS: DISPATCH | DOMAIN: GAME (spójność, bez zmiany wartości) | tag MINTDEBT
GOAL: wszystkie efekty zależne od stolicy w gra/src/game/turn-economy.ts (advanceCityEconomy i pre-pass D2) używają tej samej stolicy co UI i Mennica (setOwnerCapitalCityResolver / capitalCityIdForOwner z main.ts, FALA 914), a nie heurystyki „pierwsze miasto właściciela w tablicy cities”. Zero zmian wartości balansu — tylko wybór miasta.
