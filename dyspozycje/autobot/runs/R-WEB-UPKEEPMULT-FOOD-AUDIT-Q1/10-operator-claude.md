STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/analiza)
TEMAT: R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1
GOAL: Ustalić, czy zużycie żywności przez jednostki w grze zgadza się z decyzjami właściciela (FALA 883 żywność x4/epokę, FALA 887 Koszty jednostek), i odpowiedzieć, czy bufor 999 w teście rozejmu t5 jest niewystarczający zgodnie ze wzorem.
ZMIANY/COMMIT: allowlista: nowe `gra/tools/upkeep-food-audit.cjs`; `dyspozycje/analizy/AUDYT-ZYWNOSC-JEDNOSTEK-2026-11-25.md`; `dyspozycje/autobot/runs/R-WEB-UPKEEPMULT-FOOD-AUDIT-Q1/**` (raport + `dane/upkeep-food-audit.jsonl.gz`). Zero zmian w `gra/src`, `gra/data`. SHA: patrz sekcja DEPLOY/PUSH i pole sha w odpowiedzi. Dane SHA256: `6e914b670b554bffad7c3b384b4e61fe36c688759f6bbe26c068e1ac3f09f548`.
TESTY:
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213), exit 0.
- `node tools/ai-test.cjs`: ai-test: 297 passed, 0 failed, exit 0.
- Pomiar na żywo (Chromium, bundle poza repo, seed 4242): 6 biegów (base/army x niski/normalny/wysoki), 3 tury każdy, errors 0 we wszystkich biegach. Wyniki w `dane/upkeep-food-audit.jsonl.gz`.
- Karty jednostek (live, foodPerTurn Niski/Normalny/Wysoki): Wojownik 4/8/16, Procarz 16/32/64, Konnica 64/128/256, Zwiadowca 0. Zgodne ze wzorem 100%.
- Nachylenie zużycia armii 9 jednostek: 196 (×1→×2) i 196,3 (×1→×4 /3) na turę; wzór dla 9 dodanych = 192; różnica 2–5 (1–3%) w szumie bazy/składzie armii startowej. Silnik (komunikat NNS) podaje „rozwiązanie jednostek (żywność): +196/turę”.
BLOKADY:
- Pytanie 3 (czy bufor 999 w teście rozejmu t5 jest niewystarczający): NIE ZMIERZONO. Test nie był odtwarzany; niedobór 135 obejmuje obywateli i produkcję, których pomiar nie rozdziela. Wzór: zużycie jednostek zgodne z decyzją, więc nie stwierdzono BŁĘDU-GRY w jednostkach. Klasyfikacja STARY-PIN nie potwierdzona ani obalona.
- Składnik obywateli/produkcji/Spichlerza, skład armii startowej, obóz/poza terytorium/Sól, AI t1–40: NIE ZMIERZONO (szczegóły w analizie §4).
- Pomiar: 3 tury, jeden seed i jedna mapa.
UWAGI-DLA-ORKIESTRATORA:
1. Założenia dispatchu były nieaktualne: FALA 875 (x1/x2/x4) została anulowana przez FALĘ 883 (WERSJE.md); „kurs 0,2” to kurs Żywność→Podatek, a nie składnik zużycia jednostek.
2. Bramka NNS blokuje koniec tury 1 przez ZŁOTO (skarbiec 0, po turze −6), nie przez żywność, przy domyślnym tempie Normalny. Dotyczy pytania ABC #99 (bramka NNS w turze 1). Bieg pomiarowy obszedł to +2000 złota przed turą, bez wpływu na zapas żywności.
3. Test rozejmu (`diplo-truce-live-test.cjs`) dosypuje żywność po blokadzie (`grantPlayerFood(300)`), co maskuje konsumpcję; warto to rozstrzygnąć przed uznaniem bufora za błędny.
4. Narzędzie wymaga `npm ci --ignore-scripts` w gra/ i `/usr/bin/google-chrome`; bundle budowany przez esbuild do katalogu poza repo.
NASTĘPNY KROK: Właściciel decyduje, czy klasyfikacja testu rozejmu (STARY-PIN) ma być zweryfikowana osobnym pomiarem bilansu całego zapasu tury (obywatele+produkcja) w scenariuszu testu. Bez tego pytanie 3 zostaje NIE ZMIERZONO.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
