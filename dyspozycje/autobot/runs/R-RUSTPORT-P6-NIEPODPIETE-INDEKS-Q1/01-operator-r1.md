STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1
GOAL: Napisac dyspozycje/rust-port/NIEPODPIETE-MODULY.md: (1) grepem znalezc moduly domain/*.rs i funkcje pub fn bez produkcyjnego wolajacego, z plik:linia; (2) przypisac temat wpiecia z listy (#96–#140, #106, #114, #115, #120) lub "brak tematu" z propozycja nazwy; (3) kolejnosc zaleznosci; (4) liczba pozycji zgodna z komenda.
ZMIANY/COMMIT: allowlista: dyspozycje/rust-port/NIEPODPIETE-MODULY.md, dyspozycje/autobot/runs/R-RUSTPORT-P6-NIEPODPIETE-INDEKS-Q1/** (dowody/skrypt-niepodpiete.py, dowody/gen-raport.py, dowody/niepodpiete-surowe.tsv, 01-operator-r1.md). Baza: 1027c2aa1 (detach). Commit lokalny, bez pusha. SHA: w odpowiedzi orkiestratorowi (SHA commitu nie da sie wpisac do jego wlasnej tresci).
TESTY: brak cargo (temat dokumentacyjny). Pomiar: `python3 -I dowody/skrypt-niepodpiete.py . dowody/niepodpiete-surowe.tsv` -> pliki domain 243; definicje pub fn w domain (bez cfg(test)) 3255; pub fn bez wolajacego produkcyjnego 886; moduly domain bez wolajacego 46. Zgodnosc: `awk -F'\t' '$1=="FN"' dowody/niepodpiete-surowe.tsv | wc -l` = 886 = wiersze tabeli §3; `awk -F'\t' '$1=="MOD"' ... | wc -l` = 46 = wiersze tabeli §2. Spot-check: find_path, terrain_movement_cost, qualify_tile (pathfinding.rs) — brak wolan poza definicjami i testami (git grep / Grep, bez tests/benches).
BLOKADY:
- Przypisanie tematow jest heurystyka po nazwie modulu; dispatch nie podaje wiazania modul->zadanie. Oznaczone jako "propozycja" w kolumnie TEMAT.
- Liczne moduly (np. state, recruitment, production_units, mapgen/*) nie maja wlasnego tematu w liscie #96–#140 -> "brak tematu" z propozycja nazwy (§3–§4).
- Kolejnosc zaleznosci (§5) opiera sie na tematach z listy, nie na grafie wywolan: pelny graf NIE_ZMIERZONO.
- Zaniżenie/zawyzenie: nazwy wspolne dla kilku typow (np. from_tiles) sa liczone jako wolane (zaniza liste; kierunek bezpieczny). Metoda liczy po nazwie, nie po typie. Wolania z makr, build.rs, src/bin i FFI: NIE_ZMIERZONO.
- Lista modulow (46) rozni sie od AUDYT-PARYTETU-RANO §2 (34): inna metoda (komentarze usuniete, #[cfg(test)] blankowane, nie obcinanie po pierwszym). Roznice nie sa rozstrzygane; obie metody podane.
- Pytanie do wlasciciela: czy brak-tematu (ok. 60 propozycji nazw) ma stac sie nowymi zadaniami — decyzja poza tym tematem.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) weryfikuje liczby komenda i 3–5 losowych pozycji grepem; Final Control po PASS. Integracja i push poza tym tematem.
DEPLOY/PUSH: NIE WYKONANO
