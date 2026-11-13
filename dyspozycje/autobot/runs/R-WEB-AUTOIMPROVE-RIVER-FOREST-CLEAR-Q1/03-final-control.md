STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-Q1
GOAL: Automat wycina las na polach obywateli (także przy rzece) pod farmy wg profilu Żywność / Zrównoważony (i AI), z zachowaniem zasad (a)-(d).

WERDYKTY ZARZUTÓW:
1. Cofnięcie decyzji STAGES2-Q1 / założenie operatora: komentarze poprawione w obronie (4533d4d21). Sama zmiana zachowania = DO DECYZJI CZŁOWIEKA (ABC zadaje orkiestrator; podstawa: zgłoszenie właściciela 2026-11-04). Nie blokuje.
2. Martwy przełącznik „Wolno wycinać las” dla Żywności/Zrównoważonego (buildModeHud.ts): ODDAL do osobnego tematu (etykieta/wyszarzenie), poza allowlistą.
3. Bezwzględne liczby farm 41→54 vs 56→69: ODDAL (różnica +13 i wycinki 0→13 zgodne; zależy od środowiska).
4. „7/7” vs 12/12 w komentarzu: poprawione w obronie. Zamknięte.
5. Brak weryfikacji w przeglądarce: ODDAL. Zmiana to czysta logika pickera (parametr getSkipWyrab), bez zmian renderu/UI; `npm run build` w gra/ zakazany; 4 testy live wymagają bundla. Zalecenie: obejrzeć w grze przy deployu (Ostia: Żywność, przełącznik wyłączony, las przy rzece).
Brak NAPRAW -> PASS.

WERYFIKACJA WŁASNA (detached 4533d4d21, npm ci --ignore-scripts, node_modules usunięte):
- git diff --check 6983bbb4d..HEAD: czysty.
- Diff kodu vs baza: tylko gra/src/game/auto-improvements.ts (skipWyrabForFocus + komentarze), gra/src/main.ts (import + getSkipWyrab), 2 nowe narzędzia w gra/tools. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle. Żaden istniejący test nie zmieniony.
- Nowy test: 28 OK, 0 FAIL. tsc --noEmit EXIT=0.
- Regresje: ai-food-only-worked-hexes 81/0, auto-improvements 46/0, autoclear-river-forest-priority 18/0, autoimprove-irrigation-after-farms 43/0, autoimprove-stages-q1 302/0, farma-nie-w-lesie 138/0.
- Logika: skipWyrabForFocus zwraca false tylko dla zywnosc/zrownowazone; Surowce/Infrastruktura nadal wg przełącznika; picker nadal ogranicza do pól obywateli i terenu pod farmę; guard tartak/obóz i lesneMin nietknięte; brak awaryjnego tartaku/jezior.
- NIE_URUCHOMIONO: 4 testy live/render (przeglądarka), ponowne RED/mutacje (opierają się na logach operatora).

ZMIANY/COMMIT: kod f4ef94523, obrona 4533d4d21, raport operatora cherry-pick 212d6efd8 (oryg. e5592f1bf; nie był przodkiem 4533d4d21), ten raport w commicie finalnym. Baza origin/main 6983bbb4d.
BLOKADY: brak (ABC o założenie przełącznika po stronie orkiestratora).
RUNDY: 1/5 (Final Control)
KOLEJNOŚĆ INTEGRACJI: zmiany tylko w gra/ + dyspozycje; origin/rust-port/parity-v2 nie dotyka gra/ -> brak konfliktu; integrować do main (nad 6983bbb4d) niezależnie, kolejność względem parity-v2 bez znaczenia.
NASTĘPNY KROK: orkiestrator: ABC o założenie, temat na etykietę przycisku, integracja SHA końcowego -> READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
