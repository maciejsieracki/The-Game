TEMAT: P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1
RUNDA: 1/5
DATA: 2026-09-04
DOMAIN: GAME (logika, nie UI wizualne)
ŚCIEŻKA: gra/src/main.ts (WYŁĄCZNIE blok „Snap any in-flight animation to its
destination" wewnątrz triggerPlayerEndTurn(), linie ~27449-27486)
MODEL+EFFORT: claude-sonnet-5, effort medium (Operator) / claude-sonnet-5, effort
high (Evaluator) — temat GAME logic, reguła bazowa R-PROC-AUTOBOT.md §5a. Final
Control Sonnet 5, effort high.

WYZWALACZ
Znalezione przez Final Control 2026-09-03 przy weryfikacji
`P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1` (trzecie miejsce tego samego wzorca buga, poza
allowlistą tamtego dispatchu). Właściciel zgłosił TEN SAM objaw ponownie
2026-09-04: "Nadal często na drodze przejścia jednostki, pomimo przejścia przez
dany teren, pole nie zostaje odkryte, zwłaszcza kiedy komputer trochę zamuli i
procesor nie nadąża. To jest problem, który trzeba ogarnąć; miał być sprawdzony
już wcześniej."

RECON (wykonane przez orkiestratora — zweryfikowane bezpośrednim odczytem kodu
2026-09-04, nie powtarzaj, buduj na tym)
Hipoteza „to FPS/zamulenie klatek" jest OBALONA jako mechanizm ogólny — dwa
wcześniejsze miejsca tego samego wzorca buga (`main.ts:32200-32205` normalne
zakończenie animacji, `main.ts:22295` ruch instant) zostały już naprawione w
`P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1` (ZINTEGROWANE, commit `6a9db6e0`, FALA 342) —
przyczyna była w 100% deterministyczna: `refreshFog()` liczył widoczność
WYŁĄCZNIE z pozycji KOŃCOWEJ ruchu, ignorując heksy pośrednie. Naprawa: funkcja
`computeVisibleAlongPath(pathHexes, map, sight)` w `gra/src/game/visibility.ts:
105-114` (unia `computeVisibleAt()` dla każdego heksu ścieżki), wołana przez
`addExplored(explored, computeVisibleAlongPath(pathHexes, map, unitSight(su)))`
dla każdej jednostki w `stack` — wzorzec potwierdzony żywo w `main.ts:32200-32205`.

TRZECIE miejsce (ten dispatch): `triggerPlayerEndTurn()` (`main.ts`, funkcja
zaczyna się ok. linii 27416), blok „Snap any in-flight animation to its
destination" (linie 27449-27486). Gdy gracz kończy turę PODCZAS trwającej
animacji wieloheksowego marszu: linie 27458-27459 teleportują jednostkę na
`anim.destQ`/`anim.destR`, linia 27465 woła `checkVillageRewardsAlongPath(anim.
pathHexes)`, linia 27473 woła `checkBarbCampDestructionAlongPath(anim.pathHexes)`
— DOKŁADNIE ten sam wzorzec co dwa naprawione miejsca — ale w CAŁYM tym bloku
NIE MA ani jednego wywołania `computeVisibleAlongPath`/`addExplored`. Mgła pomija
środek ścieżki dokładnie jak w oryginalnym zgłoszeniu. Korelacja z „zamuleniem"
(hipoteza właściciela): ta ścieżka aktywuje się TYLKO gdy gracz zdąży kliknąć
„koniec tury" zanim animacja marszu się dokończy — statystycznie częstsze przy
wolniejszym sprzęcie/dłuższych animacjach (gracz nie czeka na dokończenie), nie
jest to jednak bug klatek per se, tylko inny punkt wejścia tego samego
deterministycznego braku wywołania.

GOAL
1. W bloku `triggerPlayerEndTurn()` (linie ~27449-27486), wewnątrz pętli
   `for (const su of stack)` (linia 27457) LUB bezpośrednio po niej (przed
   `deductStackRuchLeft`/po nadaniu nowych współrzędnych, ale PRZED
   `checkVillageRewardsAlongPath`/`checkBarbCampDestructionAlongPath` — kolejność
   ma znaczenie: mgła musi się odkryć zanim liczone są nagrody/zniszczenia wzdłuż
   tej samej ścieżki, analogicznie do kolejności w już zintegrowanym
   `main.ts:32200-32205`), dodaj wywołanie `addExplored(explored,
   computeVisibleAlongPath(anim.pathHexes, map, unitSight(su)))` dla KAŻDEJ
   jednostki w `stack`, warunkowane `anim.pathHexes.length > 0` (ten sam warunek
   co istniejące wywołania `checkBarbCampDestructionAlongPath` na linii 27467).
2. Zero zmian w `computeVisibleAlongPath`/`addExplored`/`visibility.ts` — funkcje
   już istnieją i są przetestowane, użyj ich WPROST, tak jak w
   `main.ts:32200-32205`.
3. Sprawdź czy `explored`/`map`/`addExplored`/`computeVisibleAlongPath`/
   `unitSight` są już w zasięgu (in scope) w miejscu `triggerPlayerEndTurn()` —
   jeśli tak, to czysty jednolinijkowy fix w pętli; jeśli import/zasięg
   wymagałby zmiany poza allowlistą, zgłoś DECISION_REQUIRED zamiast obchodzić
   barierę.

KRYTERIA KOŃCA (binarne)
1. Żywy test (Playwright/Chromium LUB deterministyczny test jednostkowy
   symulujący stan gry): jednostka gracza w trakcie wieloheksowej animacji
   marszu (np. 3+ heksy), gracz klika „koniec tury" PRZED zakończeniem animacji
   — WSZYSTKIE heksy pośrednie na trasie (nie tylko heks docelowy) są oznaczone
   jako odkryte (`explored`) po zakończeniu tej sekwencji. Dowód: zmierz stan
   `explored` dla heksu ŚRODKOWEGO trasy PRZED i PO fixie na tym samym scenariuszu
   — przed fixem heks środkowy NIE jest odkryty (reprodukcja buga), po fixie JEST.
2. Zero regresji w istniejącej logice `checkVillageRewardsAlongPath`/
   `checkBarbCampDestructionAlongPath`/`applyCityVisitBonusesAlongPath` w tym
   samym bloku — te wywołania nadal działają identycznie (kolejność wykonania
   względem nowego wywołania nie zmienia ich wyniku).
3. `tsc --noEmit` czysty, istniejące testy dotykające mgły/widoczności/końca tury
   (grep `gra/tools/*mgla*-test.cjs`, `gra/tools/*fog*-test.cjs`,
   `gra/tools/*visibility*-test.cjs`, `gra/tools/*end-turn*-test.cjs`,
   `gra/tools/*koniec-tury*-test.cjs`) nadal zielone, 5 bramek referencyjnych
   zielone.

ALLOWLISTA (nic poza tym)
- gra/src/main.ts (WYŁĄCZNIE wnętrze bloku „Snap any in-flight animation to its
  destination" w `triggerPlayerEndTurn()`, linie ~27449-27486 — dodanie
  wywołania `addExplored(computeVisibleAlongPath(...))`; zero zmian poza tym
  blokiem, zero zmian w innych funkcjach).
- Nowe/rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: zmiana `gra/src/game/visibility.ts` (funkcje już gotowe,
przetestowane w poprzednim temacie — użyj wprost), zmiana pozostałych dwóch już
naprawionych miejsc (`main.ts:32200-32205`, `main.ts:22295`), zmiana logiki
`checkVillageRewardsAlongPath`/`checkBarbCampDestructionAlongPath`/
`applyCityVisitBonusesAlongPath` (tylko WYWOŁAJ istniejącą funkcję mgły obok
nich, nie zmieniaj ich samych), dyspozycje/WERSJE.md,
gra-robocza/ROBOCZA-MANIFEST.json, playbook.json.

IZOLACJA
worktree /home/user/wt-mgla-teleport-koniec-tury, gałąź
autobot/P-MGLA-ODKRYCIE-TELEPORT-KONIEC-TURY-Q1, baza jawnie: origin/main
(najnowszy commit na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON). Jedyna dozwolona
kompilacja to node ./node_modules/typescript/bin/tsc --noEmit.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 za spełnione przez samo dodanie wywołania bez żywego
dowodu reprodukcji buga PRZED fixem (heks środkowy trasy NIE odkryty w
scenariuszu „koniec tury podczas animacji") i jego zniknięcia PO fixie — to
DOKŁADNIE ten sam wymóg nietautologiczności, który obowiązywał w
`P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1` (mutacja/revert pokazująca test
czerwieniejący). Nie zakładaj, że kopiowanie wzorca z `main.ts:32200-32205`
automatycznie działa w innym kontekście (`triggerPlayerEndTurn` ma inny zestaw
zmiennych w zasięgu, np. `stack` budowany inaczej niż w drugim miejscu) —
zweryfikuj że `su`/`map`/`explored` w tym konkretnym bloku odnoszą się do tych
samych, poprawnych obiektów.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM
SAMYM ID i TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach:
LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują i nie pushują.

OBIEG
Operator (Sonnet 5, effort medium) → Evaluator (Sonnet 5, effort high) → Operator
(obrona, jeśli zarzuty niepuste) → Final Control (Sonnet 5, effort high) →
integracja orkiestratora.
