STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt treści i danych; bez zmian w gra/**)
TEMAT: R-RUSTPORT-P1-16C-CIVPEDIA-KARAWANSERAJ-Q1
GOAL: Status z dowodem na pinie edb8fb56 dla 3 haseł CivPedii z frazą wariantową (§9.3, 8b) i dla wszystkich miejsc Karawanseraju.
ZMIANY-COMMIT: Dopisano §14 na końcu `/home/user/The-Game/dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` (+64 linie, 0 usuniętych, `git diff --check` czysty). Brak commita. Nie zapisano pliku w `runs/`, bo system nakazuje zwracać wynik w tekście.
TESTY: Tylko `git show`/`git grep` na edb8fb56 oraz odczyt JSON. Bez testów, build, dev i checkoutu.
- PYTANIE 19: WDROŻONE (`PYTANIA-OTWARTE.md:567`; `economy-upkeep.ts:637–656`, decyzja 19=A). Nie pytano ponownie.
- Koszary: NAPRAWIONY (fraza zgodna z danymi utrzymanie 2 / przyrost 1).
- Mury: NAPRAWIONY (fraza zgodna z danymi utrzymanie 2 / przyrost 1).
- Targowisko: NADAL ISTNIEJE, tylko fraza. Liczby są zgodne, ale „+1 na wyższych poziomach” sugeruje stałe +1, a wzór daje poz. 3 = +2 względem poz. 1.
- Karawanseraj, nazwane miejsca: NAPRAWIONY w trade-routes.ts (kod; zostaje komentarz :904), cityPanel.ts (0 trafień; linie 7316/7395 nie dotyczą budynku), tech.json, wikiBundle.json, building-icon-map.json, buildings.json, docs/PORADNIK-GRACZA/* (25 plików).
- Karawanseraj, pozostałe: NADAL ISTNIEJE w `gra/src/ui/icons/brand/buildings/bld-karawanseraj.svg` (osierocony), `gra/Gra-podglad-POLE-BITWY.html`, artefaktach buildu `gra/tools/*` i w plikach poza `gra/**`.
- Zastrzeżenie: fraza wiki podaje wartości bazowe. Mnożniki FALA2 i ery nie zostały porównane z kwotą pobieraną w grze.
BLOKADY: Brak blokad tego tematu. Poza zakresem: korekta frazy Targowiska w `gra/src/data/wikiBundle.json`, usunięcie osieroconego SVG i decyzja o artefaktach HTML wymagają osobnego dispatchu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) przez Workflow, z weryfikacją §14 względem pinu.
DEPLOY/PUSH: NIE WYKONANO