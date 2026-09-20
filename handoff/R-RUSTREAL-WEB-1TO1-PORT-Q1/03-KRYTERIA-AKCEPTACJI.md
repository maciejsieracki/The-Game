# R-RUSTREAL-WEB-1TO1-PORT-Q1 — kryteria akceptacji

Każdy punkt ma wynik PRAWDA/FAŁSZ. Brak dowodu oznacza FAŁSZ, nie „prawdopodobnie
spełnione". Kryteria dotyczą przyszłego portu; ten dokumentacyjny run ich nie
zamyka.

## A. Zakres i proweniencja

- [ ] **A1** HEAD, baza, branch i manifest zgadzają się z odczytem Git; web jest
  `reference_read_only`, a `src-tauri/frontend/**` ma status `REPLACE_OR_REWIRE`.
- [ ] **A2** Żaden patch Rust/Tauri nie zmienia `gra/**`, `gra-robocza/**`, danych
  weba ani procesu publikacji.
- [ ] **A3** Każdy użyty plik webowy, danych, assetu i workflow ma ścieżkę,
  rolę i SHA-256 w manifestach; dynamiczne zasoby mają osobny dowód runtime.

## B. Start i cywilizacje

- [ ] **B1** Żywy runtime otwiera dokładnie flow `Intro → Epoka → Cywilizacja →
  Ustawienia → Generowanie` zgodny z webem.
- [ ] **B2** Lista cywilizacji pochodzi z pełnego kontraktu/danych weba, nie z
  ręcznie wpisanej listy Tauri.
- [ ] **B3** Scenariusz początkowy pokazuje i umożliwia wybór **dziewięciu**
  wymaganych opcji; dowód zawiera listę ID, kolejność i viewport.
- [ ] **B4** Etykiety, ikony, opisy, disabled states, selekcja i przejście do
  generowania są zgodne z webem; Unicode/placeholder nie zastępuje brand assetu.

## C. Mapa i renderer

- [ ] **C1** Wynik generowania jest prawdziwą mapą świata, nie prostokątną siatką
  przycisków HTML i nie płaskim testowym placeholderem.
- [ ] **C2** Działa oryginalny kontrakt sceny/rendererów dla terenu, rzek, granic,
  miast, jednostek, dekoracji, overlayów i HUD.
- [ ] **C3** Picking, kamera, kliknięcia i zaznaczenie używają kontraktu webowego;
  współrzędne debugowe nie są substytutem mapy.
- [ ] **C4** Real-browser evidence obejmuje co najmniej ustalone viewporty i
  porównanie screenshot/DOM/tekst/asset z referencją.

## D. Stan i zachowanie

- [ ] **D1** Adapter Rust nie gubi heksów, terenu, miast, jednostek, civ,
  komunikatów ani kolejki tury.
- [ ] **D2** Ruch, selekcja, koniec tury oraz błędy obserwowane w Tauri mają te
  same skutki i komunikaty co web.
- [ ] **D3** Save/load zachowuje stan przed i po przejściu przez wizard; dowód
  obejmuje gracza, AI i dodatkowe wymagane klasy, jeśli są w zakresie.
- [ ] **D4** Żaden test nie opiera się wyłącznie na fake DOM, bridge JSON/status
  ekranie albo zielonym teście silnika bez realnego renderera.

## E. Jakość dowodu i bramki

- [ ] **E1** Testy runtime zawierają negatywną kontrolę/mutację: celowo zmieniona
  ścieżka powoduje czerwony wynik.
- [ ] **E2** Zapisano console/page errors, viewport boundaries i wynik porównania;
  brak błędu nie jest domniemany z samego startu procesu.
- [ ] **E3** Evaluator niezależnie czyta worktree i wydaje ponumerowane zarzuty
  albo pustą listę po sprawdzeniu wszystkich punktów; Final Control orzeka per
  zarzut.
- [ ] **E4** Integracja jest osobnym krokiem. `READY_FOR_DEPLOY`, push, merge,
  Windows packaging i owner-side install następują dopiero po akceptacji.

## Natychmiastowy FAIL

1. testowa siatka HTML zamiast mapy świata;
2. trzy hard-coded civ przy wymogu dziewięciu;
3. Unicode/placeholder zamiast oryginalnych ikon/assetów;
4. ręcznie uproszczone karty lub teksty niezgodne z webem;
5. fake DOM jako jedyny dowód;
6. „web parity" wywnioskowane tylko z nazw przycisków;
7. zmiana `gra/**` zamiast lane Rust/Tauri;
8. instalator zbudowany przed zamknięciem parytetu.
