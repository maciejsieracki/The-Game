# R-RUSTREAL-WEB-1TO1-PORT-Q1 — handoff dla agenta wykonawczego

## Stan odbioru

- HEAD/base: `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`
- branch: `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`
- `origin/autobot/real24-staging`: `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`
- `origin/main`: `f4c89d0081c622c16b207d338b49c8bacafc4553`
- web lane: `gra/**`, **reference_read_only**
- Rust/Tauri lane: `rust-port/engine/**` + `src-tauri/**`
- obecny `src-tauri/frontend/**`: **REPLACE_OR_REWIRE**, nie wzorzec UI
- dziewięć opcji scenariusza początkowego: **wymóg akceptacyjny**, nie sugestia

To jest przekazanie dokumentacyjne. Nie ma tu implementacji parytetu i nie wolno
opisywać obecnego harnessu jako gotowego portu.

## Źródło prawdy

Czytaj `02-MANIFEST-PLIKOW.json` jako pełną, zahashowaną listę wejścia.
`gra/src/ui/**`, `gra/src/render/**`, `gra/src/input/**`, `gra/src/types/**`,
`gra/src/map/**`, entrypoint i tranzytywne pliki stanu są reference web. Dane w
`gra/data/**` oraz ikony/assety są również referencyjne. Nie przenoś poprawek
Rust do weba i nie zmieniaj `gra-robocza/**` w tym temacie.

Manifest rozwiązuje `gra/src/game/**` przez statyczny graf importów od wejść UI,
render, input, types, map i `main.ts`; tylko pliki osiągalne są wymienione jako
wymagane kontrakty. Cztery pliki nieosiągalne statycznie są jawnie odnotowane, a
pełne globy danych/assetów są zachowane, żeby skan statyczny nie ukrył zasobu
ładowanego dynamicznie.

## Co trzeba odtworzyć

1. Frontend: preferowany jest ten sam frontend HTML/CSS/JS weba uruchomiony w
   Tauri; Rust dostaje adapter backendowy, a nie nowy zestaw ręcznie rysowanych
   kart.
2. Wizard: zachowaj kolejność `Intro → Epoka → Cywilizacja → Ustawienia →
   Generowanie`; wartości, etykiety, walidację i dane pobieraj z kontraktu weba.
3. Civ picker: pokaż pełną pulę dostępnych cywilizacji; zmierz dziewięć opcji
   startowych w realnym runtime. Nie wpisuj listy trzech civ ręcznie.
4. Mapa: użyj oryginalnych danych i assetów oraz sceny 3D/Canvas/WebGL; odtwórz
   teren, rzeki, granice, miasta, jednostki, overlaye, HUD i picking.
5. Bridge: mapuj pełny stan webowy — heksy/teren, miasta, jednostki, wybór,
   kolejkę tury, komunikaty, save/load — bez DTO, które gubi dane widoku.
6. Behavior: weryfikuj ruch, selekcję, koniec tury i zapis/odczyt dla gracza,
   AI i dodatkowych wymaganych klas.

## Dowód wymagany od kolejnych tematów

Statyczny grep, fake DOM, nazwy przycisków, zielony test Rust, mock shell lub
istniejący instalator nie wystarczają. Dla wyglądu i flow wymagany jest żywy
Chromium/runtime, screenshot/DOM/tekst/asset comparison, zapis console/page
errors oraz kontrolowana mutacja, która powoduje czerwony test. Każdy claim
parytetu musi wskazywać ekran, viewport, stan, źródło webowe i dowód runtime.

## Znane wcześniejsze artefakty

`t_ea768507/run827` zaakceptował playable slice jako ścieżkę flow, a
`t_8af96c46/run828`, `t_de820725/run829`, `t_a74f8635/run830` odczytały packaging
MSI/NSIS. Żaden z tych artefaktów nie dowodzi zgodności wizualnej, dziewięciu civ
ani oryginalnego renderera świata.

## Następna legalna praca

Utwórz osobny, bieżący temat Kanban dla reference capture/dependency graph z
jawnie ograniczoną allowlistą i bazą. Nie otwieraj packagingu przed zamknięciem
parytetu. Przed każdą implementacją zachowaj Operator → niezależny Evaluator →
warunkowa Obrona → Final Control → integracja; ten handoff nie omija żadnej z
tych bramek.
