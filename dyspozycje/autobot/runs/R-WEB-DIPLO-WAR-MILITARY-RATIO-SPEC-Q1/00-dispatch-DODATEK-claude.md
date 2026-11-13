# R-WEB-DIPLO-WAR-MILITARY-RATIO-SPEC-Q1 — DODATEK orkiestratora (runda 1)

## Cel
Napisać specyfikację parametru wojennego w formie zweryfikowanej w kodzie. Wynik: `10-operator-claude.md`. Żadnych zmian w grze.

## Zatwierdzone założenia właściciela (2026-11-13) — traktować jako dane wejściowe, nie do dyskusji
1. Parametr „Stosunek militarny” (`militaryRatioWar`) jest aktywny TYLKO gdy para nacji jest w wojnie. Po pokoju przestaje wpływać na dyplomację.
2. Wartość jest symetryczna: dla A względem B odwrotność dla B względem A. Neutralna przy parytecie.
3. Składniki: (a) stosunek siły wojskowej obu stron = punkty Mocy wojskowej (Armia + Rekruci, flaga `wojskowy` w power-params.json); (b) wygrane i przegrane bitwy między tą parą od początku wojny; (c) dostępna pula rekrutów obu stron w chwili decyzji.
4. Start od zera przy wybuchu wojny. Liczą się tylko bitwy z tej wojny.
5. Zastosowanie: wypowiedzenie wojny, przyjęcie rozejmu, przyjęcie pokoju, propozycje pokoju AI. Ta sama miara dla gracza i AI.
6. NIE wchodzi do: Power, Respektu, Zaufania, etykiet relacji. Power i wzór Respektu `round(100·P_self/(P_self+P_partner))` zostają bez zmian. Brak bonusów +15/−10 i brak zaniku po 10 turach.
7. Progi: przewaga od 1,5× (≈50%); słabszy symetrycznie od 1/1,5; między progami neutralna.
8. Wynik w UI: panel wojny, nie wpływa na Respekt.
9. Nazwa: rekomendacja „Stosunek militarny” (UI), `militaryRatioWar` (kod). Alternatywy do oceny: „Przewaga wojenna” (`warAdvantage`). Odrzucone: „Potęga wojenna” (myli z Power).

## Założenie do sprawdzenia (właściciel chce je zapisać, nie pytać)
Respekt liczony jak dotąd, BEZ wojennego clampa do 29 (`clampRelationForWar`, `gra/src/game/diplomacy.ts:1141`). Operator ma potwierdzić, gdzie clamp wpływa na wartość Respektu (nie tylko na etykietę), i opisać usunięcie.

## Zadania operatora (kolejność)
1. Znajdź WSZYSTKIE miejsca decyzji: wypowiedzenie wojny, przyjęcie/odrzucenie rozejmu i pokoju, propozycje pokoju AI. Dla każdego: plik:linia. Start: `gra/src/game/ai.ts`, `gra/src/game/diplomacy-proposals.ts`, `gra/src/game/diplomacy-war-peace-profile.ts` (funkcja `militaryPowerRatio` ok. linii 314–329 i progi przewagi/niedoboru), `gra/src/main.ts` (grep: `wojna`, `rozejm`, `pokoj`, `declareWar`, `proposePeace`).
2. Sprawdź dostępność danych dla każdego składnika (TAK/NIE + dowód plik:linia):
   - (a) punkty wojskowe per nacja: `gra/src/game/power-objective.ts` (`computeObjectivePower`, flaga `military`, ok. linii 223–272) — czy da się wyciągnąć wyłącznie Armię + Rekrutów;
   - (b) bitwy per para od startu wojny: czy stan wojny w `diplomacy.ts` (lub `main.ts`) zapisuje moment startu i wyniki bitew między daną parą. Jeśli NIE — opisz, co trzeba dodać i gdzie (bez implementacji);
   - (c) pula rekrutów: pole `rekrutEkw` / pula w silniku — skąd i kiedy liczona.
3. Oceń każde założenie 1–9 wobec kodu: ZGODNE / SPRZECZNE (z dowodem) / BRAK (co dodać). Jeśli założenie jest sprzeczne z kodem, napisz to wprost i zaproponuj wariant — nie zmieniaj założenia po cichu.
4. Zaproponuj strukturę danych (pola stanu pary: start wojny, licznik bitew, składniki), wzór wartości i zakres, kolejność wdrożenia w małych krokach i listę testów.
5. Ryzyka: zapisy gry (migracja), testy istniejące, progi AI, UI. Każde z dowodem.
6. Nazwa: potwierdź rekomendację albo zaproponuj lepszą, z uzasadnieniem zgodnym z Polską terminologią gry (sprawdź `gra/src/data/` i wiki pod kątem kolizji nazw).
7. Lista „ZAŁOŻENIA DO POTWIERDZENIA” — punkty, których kod nie rozstrzyga. Pisz je jako założenia z proponowaną wartością domyślną, NIE jako pytania do właściciela (właściciel nie chce pytań w tym temacie).

## Kryteria końca (binarne)
- `10-operator-claude.md` zawiera punkty 1–7; każdy fakt o kodzie ma plik:linia.
- Zero zmian poza allowlistą: `git diff --name-only origin/main...HEAD` pokazuje tylko katalog runu.
- Brak słowa „pytanie” w sekcji ZAŁOŻENIA DO POTWIERDZENIA.

## Bramki
Zmian kodu NIE ma, więc tsc i 5 bramek referencyjnych są NIE_DOTYCZY. W raporcie napisz to wprost. Evaluator/FC: zweryfikuj diff (allowlista), dowody file:line (sprawdź przynajmniej 5 losowych odwołań w kodzie) i kompletność punktów 1–7.

## Zakazy
Bez `npm run build/dev`. Bez zmian w gra/, gra-robocza/, rust-port/, WERSJE.md, REJESTR. Bez `git add -A`. Nie integrujesz, nie deployujesz, nie pushujesz na main.
