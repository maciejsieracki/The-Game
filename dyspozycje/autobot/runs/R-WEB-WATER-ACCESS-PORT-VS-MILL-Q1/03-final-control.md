STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-WATER-ACCESS-PORT-VS-MILL-Q1
GOAL: Port = morze lub rzeka; Mlyn/budynki slodkowodne = tylko rzeka; bez jezior.
ZMIANY/COMMIT: weryfikowany bc1d0b5c0 (baza 46908c1a7 <- 95a4b25ab = origin/main). Diff do allowlisty: tylko gra/tools/water-access-port-vs-mill-test.cjs + pliki w runie. Zero zmian src, gra-robocza, WERSJE.md, rust-port, src-tauri.
TESTY (zmierzone samodzielnie po npm ci --ignore-scripts): water-access-port-vs-mill ALL PASS; freshwater-access 37/0; naval-water-access-gate 34 pass/5 fail; deposit-building-gate 46 pass/1 fail. Logi gate-*.txt z linia EXIT= obecne (0,0,1,1) i zgodne. tsc: NIE_ZMIERZONO (brak zmian src). Mutacji nie powtarzano.
ORZECZENIA:
1. Brak logow gate-*: ODDAL (dodane w bc1d0b5c0).
2. Zero zmian kodu: ODDAL (Port ma juz morze||rzeka; budynku mlyn nie ma w danych, zmiana zakresu).
3. cityHasWaterAccess liczy jezioro: ODDAL (decyzja 2026-11-02; przy definicji Mlyna uzyc bramki rzecznej isRiverAdjacent) - osobny temat.
4. Dlug testowy 5+1 FAIL: ODDAL (odziedziczony, poza zakresem) - osobny temat.
Brak NAPRAW, brak DO DECYZJI CZLOWIEKA.
BLOKADY: brak
RUNDY: Final Control 1/5
NASTEPNY KROK: integracja orkiestratora. SHA do integracji = SHA commitu z tym plikiem (nastepca bc1d0b5c0; zmiany wylacznie docs/test). Kolejnosc: niezalezny od zmian src, integrowac przed lub po origin/rust-port/parity-v2 bez konfliktu; REPIN Rust niepotrzebny (semantyka city_has_water_access bez zmian).
DEPLOY/PUSH: NIE WYKONANO
