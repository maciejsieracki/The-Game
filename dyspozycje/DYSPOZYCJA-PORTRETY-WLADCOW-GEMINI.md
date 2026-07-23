# DYSPOZYCJA — portrety władców 15 cywilizacji (generacja: Gemini)

**Data:** 2026-07-23 · **Zleca:** Maciej (wkleja prompt do Gemini) · **Przygotował:** integrator chmurowy
**Cel:** jeden spójny zestaw 15 portretów władców. Użycia w grze: medaliony kart dowódców na polu bitwy (HUD TW-v5), karta rozmówcy w panelu dyplomacji (dwustronny FINAL), ekran wyboru cywilizacji, przyszłe preBattle (karty dowódców w rogach).

## Wymagania techniczne wpięcia
- Nazwy plików = `ikonaId` z `gra/data/civs.json` (`grecy.png`, `rzymianie.png`, …) — wpinamy bez mapowania.
- Kwadrat 1:1 ≥1024×1024 PNG; twarz w centrum (cięcie w okrągły medalion, czytelność przy 26–64 px).
- Głowa 3/4 w prawą stronę obrazu — dla wroga (prawa strona ekranu) odbijemy lustrzanie w CSS.
- Zero tekstu/ramek/znaków wodnych; tło granat→czerń + złoty rim light (tokeny 1E).

## Prompt do wklejenia w Gemini
(pełna treść — patrz blok w rozmowie z 2026-07-23; kopia poniżej)

STYL SERII: malarski portret olejny „painted imperial", popiersie 3/4 w prawo, tło granat→czerń z winietą, złote światło konturowe, światło ciepłe z lewej-góry, ubiór ściśle epokowy z akcentem koloru cywilizacji, bez tekstu/ramek/znaków wodnych, kwadrat ≥1024×1024 PNG. Najpierw 3 sztuki do zatwierdzenia stylu, potem reszta identycznie.

| Plik | Postać (propozycja integratora — do podmiany) | Wskazówki | Akcent |
|---|---|---|---|
| grecy.png | Leonidas, król Sparty | hełm koryncki na tył głowy, karmazynowy płaszcz, krótka broda | #1E5AA8 |
| rzymianie.png | Romulus | archaiczna zbroja italska, wilcze futro | #8B1A1A |
| chinczycy.png | Qin Shi Huang | zbroja lamelkowa, jedwab | #C41E3A |
| inkowie.png | Pachacuti | złote ozdoby, pióropusz, wzory geometryczne | #D4A017 |
| zulusi.png | Czaka Zulu | pióra, futro lamparta, tarcza nguni przy ramieniu | #2E7D32 |
| egipt.png | Ramzes II | nemes/chepresz, naszyjnik usech | #E8C547 |
| sumerowie.png | Gilgamesz | broda w sumeryjskie loki, kaunakes | #6B4226 |
| celtowie.png | Wercyngetoryks | długie włosy, wąsy, torques, kolczuga | #3D6B35 |
| germanie.png | Arminiusz | futro, skórzana zbroja | #4A5568 |
| harappa.png | Kapłan-Król z Mohendżo-Daro | trefiona broda, diadem z krążkiem, wzór trójlistny | #C67B4E |
| hetyci.png | Suppiluliuma I | stożkowa tiara, kręcona broda | #7B4B8A |
| slowianie.png | Samo | lniana szata, futrzany kołnierz | #B83232 |
| babilonia.png | Hammurabi | czapa jak na steli, kwadratowa broda | #2B5F8A |
| asyria.png | Aszurbanipal | tiara asyryjska, loki w rzędach | #5C4033 |
| fenicjanie.png | Hiram I z Tyru | purpura tyryjska, złote ozdoby morskie | #9B2335 |

## Po otrzymaniu grafik (zadanie integratora)
1. Weryfikacja: centrowanie twarzy (crop-test medalionu), spójność serii, brak tekstu.
2. Katalog docelowy: `gra/public/portrety/` (lub inline base64 przy bundlu — do decyzji przy wpinaniu).
3. Wpięcie: karta dowódcy bitwy (`mkCommanderCard` w `battleScene.ts`), panel dyplomacji (`diplomacyAudience.ts` — miejsce medalionu rozmówcy), ekran wyboru cywilizacji. Fallback: obecne inicjały/ikona, gdy pliku brak.
4. UWAGA: imiona władców wymagają zatwierdzenia Macieja zanim pojawią się w UI (dziś gra nie ma nazwanych liderów — to nowa treść).
