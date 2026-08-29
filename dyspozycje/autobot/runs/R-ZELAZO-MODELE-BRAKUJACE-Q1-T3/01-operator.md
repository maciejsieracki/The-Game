```
STATUS: PASS
DOMAIN: GAME
TEMAT: R-ZELAZO-MODELE-BRAKUJACE-Q1-T3
GOAL: Dać jednostce Falanga (Żelazo, kultura Grecka) dedykowany dispatch PO NAZWIE
      (nie tylko po kategorii) i uzupełnić dokumentację historyczną istniejącego
      modelu do standardu serii Opus 5.
MODEL WYKONAWCY: Opus 5, `claude-opus-5[1m]`, effort High (env CLAUDE_EFFORT=high).
      Zgodne z wymogiem dispatchu i R-PROC-AUTOBOT.md §5a (temat wizualny).
ZMIANY/COMMIT: 5aaddf389c5268c8cc312864743b3b050d15b549 na autobot/ZELAZO-T3-Q1
      (potwierdzone `git ls-remote`). Allowlista, 3 pliki, `git add` per plik:
      - gra/src/render/units.ts (+17: dispatch po nazwie w buildNamedUnit)
      - gra/src/render/hastati-falangita.ts (sekcja K1-K9, naprawa geometrii,
        episema zamiast lambdy, nazwy mesh + userData.anchors)
      - gra/tools/zelazo-falanga-real-render-test.cjs (nowy, real render)
TESTY: nowy real-render 40/40 · T1 31/31 · T2 42/42 · zelazo-gate 24/24 ·
      tsc --noEmit 0 błędów · vite build OK (C-001, binarka z node_modules,
      --outDir /tmp poza repo) · bramki referencyjne 213/213, 19/19, 33/33,
      13/13, 6/6 — wszystkie zgodne z §6 · regresja pełna: 141/143 nazw
      identycznych z origin/main.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5 High).
DEPLOY/PUSH: NIE WYKONANO. Push wyłącznie gałęzi roboczej autobot/ZELAZO-T3-Q1
      do integracji (praktyka T1/T2). Brak merge do main, brak deployu —
      `git merge-base --is-ancestor` potwierdza, że commit NIE jest w main.
```

## Uzasadnienie i dowody

**Zastosowałem lekcję T1/T2: zmierzyłem, nie przeczytałem.** Zainstrumentowałem `buildFalangita()` nazwami mesh i `userData.anchors`, zbudowałem model w żywym Chromium i wypisałem pudełka, osie i rzuty wszystkich 28 części.

**(a) Dispatch po nazwie.** Dodany w `buildNamedUnit()` (sekcja GRECJA), `case 'falanga'` zostawiony jako fallback. Reguła `falanga|hoplit|phalanx` przeciera dokładnie 2 z 143 nazw units.json (PL „Falanga" + EN „Phalanx" — ta sama jednostka); nie łapie „Hieros Lochos" ani „Thorakites". Zero regresji wyglądu, bo `applyCultureOverrides()` i tak zwraca od razu dla kategorii 'falanga'.

**(b) Audyt geometrii — jeden twardy błąd, znaleziony pomiarem.** Kąt przedramienia (1.32) był praktycznie osią włóczni (1.371 — różnica 2.9°). Przy historycznym chwycie w punkcie równowagi dory 0.240×HEX_R drzewca wystaje za dłoń, więc szło wzdłuż przedramienia **prosto w łokieć i w ramię**. Zmierzone PRZED: odległość osi ramienia od osi włóczni spada z 0.0747 przy barku do **0.0044 przy łokciu**, przy progu styczności 0.0375 — drzewce zanurzone w górnych ~45% ramienia, bez ucieczki bokiem (obie części w tej samej płaszczyźnie X). Poprawka: przedramię 1.32 → 1.85. PO: klirens **0.0587** na całej długości. Kąt ramienia i punkt chwytu bez zmian — chwyt jest historyczny.

**(c) Kwestia blazonu — rozstrzygnięta danymi, nie opinią.** Sparta **istnieje** w grze, ale nie tak, jak sugerował recon: nie jest kulturą, nacją ani jednostką, tylko **jedną z dziesięciu równorzędnych nazw miast greckich** (`city-names-pools.json`: Ateny, Sparta, Korynt, Teby, Argos…), przy **jednej** cywilizacji „Grecy" (`civs.json`). „Falanga" jest jednostką liniową całej tej cywilizacji — wystawia ją tak samo gracz ze stolicą w Atenach. Dodatkowo jedyna grecka jednostka przypisana konkretnej polis to **tebański** „Hieros Lochos". Λ = Lakedaimon przeczyła więc wprost własnemu rosterowi. Wobec ECHO właściciela („jak najlepiej odzwierciedlały kwestie historyczne") **usunąłem lambdę**, w jej miejsce neutralna, współśrodkowa **episema**. Budżet bez zmian: 404 tri. Sekcja (K) testu pilnuje tych czterech przesłanek w danych, żeby decyzja nie zdezaktualizowała się po cichu.

**(d) Sekcja ZGODNOŚĆ HISTORYCZNA K1-K9** dodana. Przy okazji: **nagolenniki nie były luką** — są w modelu od początku (materiałem golenia jest brąz), wbrew notatce reconu.

**Test i dowód nietautologiczności.** Sekcja (H) mierzy relacje, nie nazwy: klirens broni od ramienia, chwyt wewnątrz pięści, porpax na normalnej tarczy, współśrodkowość i symetria godła, brak umba, grzebień wzdłużny. Mutacja PRZED cofa w locie trzy rzeczy naraz i czerwieni asercje na **zmierzonych** wartościach: H1 = 0.0044, H9a = 0.0279, H9b = 1.7414. Podmiotem sekcji (H) jest ścieżka kategorii, nie nazwy — inaczej mutacja dispatchu maskowałaby mutacje geometrii.

**Dwa błędy złapane przez sam test, nie przeze mnie.** H6 początkowo porównywał pudełka osiowe i dawał wynik na granicy szumu (0.1394 vs 0.1394): aspis jest dyskiem odchylonym o 0.20 rad, więc jego najdalszy w tył narożnik leży po przeciwnej stronie tarczy niż przedramię. Przepisane na rzut na normalną tarczy — realny zapas 0.031. Drugi: sekcja (B) wywracała się na `null` dla modelu bez kotwic.

**Weryfikacja wizualna** (§9 poz. 6a): zrzuty PRZED/PO z żywego Chromium, kamera jak w grze (azymut 0), trzy ujęcia — dispatch po nazwie, front, profil od strony broni. PRZED widać miecznika zamiast hoplity, lambdę na tarczy i drzewce wchodzące w ramię; PO hoplitę z episemą i włócznię przechodzącą nad barkiem. Obejrzałem oba.

**Poza zakresem — nie ruszone:** `buildHastati()` bajtowo identyczny z origin/main (md5 funkcji), wspólne helpery `niBuildCore/niBuildLeg/niBuildArm` nietknięte (nazwy nadaję po zakresie indeksów, nie w helperze).

**Uwaga kosmetyczna do rejestru (nie blokuje):** nagłówek pliku deklaruje sylwetkę „~0.55×HEX_R", a zmierzona wysokość Falangity to 0.727×HEX_R (z grzebieniem). To nieaktualny komentarz odziedziczony po v2, wspólny z `buildHastati`, więc jego poprawka wychodzi poza zakres T3 — zgłaszam jako osobny temat zamiast poprawiać „przy okazji" (§14).