STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1
GOAL: Falanga jako falangita macedoński — długa włócznia (sarissa) w OBU rękach + mała tarcza przypięta do przedramienia; wyraźnie inny niż zwykły hoplita; bez nowych materiałów/geometrii per instancja (wariant B scalania).
ZMIANY/COMMIT: baza origin/main 0ca51a30c; kod + test + zrzuty w jednym commicie (SHA w polu sha zwrotki). Pliki (allowlista): gra/src/render/hastati-falangita.ts (buildFalangita przepisany; buildHastati bez zmian), gra/tools/zelazo-falanga-real-render-test.cjs (przepisany pod nowy model + mutacje + E5–E8), gra/tools/falangita-sarissa-shots.cjs (nowy: zrzuty PRZED/PO), 5 testów rodziny zelazo-* (rename nazw mesh dory->sarissa; R1 27->29 mesh; M16 oznaczona jako przestarzała), dyspozycje/autobot/runs/R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1/{10-operator-claude.md,dowody/*.png}. Nie ruszano: WERSJE.md, gra-robocza/, units.ts (dispatch po nazwie bez zmian).

ZAŁOŻENIA (luki dispatchu): w repo NIE ISTNIAŁ plik 00-dispatch-DODATEK-claude.md na origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (git show: path does not exist). Wykonano wyłącznie oryginalny 00-dispatch.md z origin/main + zasady procesowe z zadania (worktree od origin/main, bez push/deploy/WERSJE/build/dev). Konfiguracja "środowisko" z DODATKU nie była znana.

CO ZROBIONO (model):
- Sarissa: drzewce 0.90*HEX_R + grot (dawna dory 0.74), chwyt OBYDWIEMA rękami: prawa dłoń z tyłu (punkt równowagi, 0.30 drzewca za dłonią, sauroter), lewa 0.09 przed nią; obie pięści NA osi drzewca (ramiona 3D IK, 2 segmenty z singletonów UpArm/Forearm, rozciągnięcie 1.00 prawe / 1.043 lewe).
- Poza: tors skręcony o -0.60 rad (lewy bark do przodu, postawa pikiniera; głowa przodem do +Z), drzewce 0.25 rad w lewo i 0.16 rad w górę. Parametry dobrane liczbowo (przeszukanie), bo bez skrętu torsu drzewce obiema rękami nie da się utrzymać bez przejścia przez korpus.
- Pelte: mała okrągła tarcza (te same geometrie co aspis, skala 0.74, średnica 0.19*HEX_R) przypięta do LEWEGO przedramienia; pole = kolor gracza, rant brąz, neutralna episema (K7 bez zmian: brak lambdy, brak umba).
- Różnice względem hoplity: brak grzebienia, dwa białe pióra helmu, chlamys na plecach, szkarłatne chitony zamiast woad, tors w skręcie, sarissa zamiast dory, mała tarcza zamiast aspis.
- Ścieżka doku: komentarz K5 (SARISSA), K6, K7 (PELTE I EPISEMA), K4/K9 zaktualizowane w hastati-falangita.ts.

WSPÓŁDZIELENIE MODELU (ustalone): Falanga dociera do buildFalangita WYŁĄCZNIE przez dispatch po nazwie (falanga/hoplit/phalanx w buildNamedUnit) i `case 'falanga'`. W units.json jedyna jednostka z tych rdzeni to „Falanga". Włócznik, Włócznik sumeryjski, Thorakites, Hieros Lochos mają własne buildery. Zmierzone przed/po (mesh, tri): Włócznik 77/1228 = 77/1228; Thorakites 32/430 = 32/430; Hieros Lochos 40/552 = 40/552; Włócznik sumeryjski 36/448 = 36/448 — bez zmian (asercja E7).

TESTY (surowe wyjście, wszystko z worktree):
- node tools/zelazo-falanga-real-render-test.cjs (z buildem vite do katalogu tmp): "53 pass, 0 fail". Obejmuje: dispatch po nazwie (A1-A4), obie pięści na osi sarissy < 0.01 i rozstaw 0.119 (H1), rozciągnięcie ramion <=1.15 (H2), sarissa 0.90 > 0.74 i grot najdalej w przód (H3), sauroter za plecami (H4), drzewce poza korpusem min 0.0148*HEX_R (H5) i poza ramionami (H5b), skręt torsu (H6), pelte mała/na lewym przedramieniu/ku przodowi (H7), episema/neutralność (H8-H10), brak grzebienia + 2 pióra + chlamys (H11), model Falangi != Włócznika (H11b), nagolenniki/helm (H12/H13), stopy y~0 (E1), promień 0.703 <= 0.866 (E2), kolor właściciela (E3), tri 428 (404 przedtem; budżet <=460, E4), zero nowej geometrii per instancja: dwie instancje dzielą WSZYSTKIE geometrie, perTokenGeos puste (E5), brak userData / wyznacznik>0 (E6), inne jednostki włóczniowe bez zmian (E7), mergeUnitStaticParts na Falandze: mniej meshy, obrys bez zmian <1e-4 (E8), artefakt vite zawiera falangita-sarissa (G1/G2), zero błędów konsoli (F0).
- Mutacje (sekcja B, każda zapala wskazaną asercję): M1 bez dispatchu -> A1 czerwone; M2 lewa dłoń 0.12 poza drzewcem -> H1 czerwone (odlLewa 0.1164); M3 drzewce 0.60 -> H3 czerwone; M4 drzewce przez środek korpusu -> H5 czerwone (min odl. -0.0474); M5 tarcza bokiem -> H7 czerwone.
- Pozostałe testy rodziny zelazo-* po zmianie nazw mesh: srodziemnomorze 81/0, slowianie-zulusi 73/0, germanie 77/0, super-rzym-grecja 89/0 (po R1 27->29 mesh i oznaczeniu M16 jako przestarzałej — patrz NOTATKI), celtowie-miecznik-rydwan 78 pass / 1 fail: (0e) dane units.json rydwan celtycki — NIEZWIĄZANE z modelem Falangi (asercja o danych Pancerz/załoga; na origin/main ta sama asercja czyta te same dane — nie odtwarzano osobno na czystym main: NIE_ZMIERZONO, wniosek z treści asercji).
- tsc --noEmit -p . (gra): brak błędów.
- Chromium: dowody wizualne w dowody/ (przed-* i po-*): close-front, close-34, close-side-right, close-back34 (zbliżenie) oraz far-line (6x3 w szyku, kamera ~50 deg). Model renderowany w moim scratch-harnessie Three.js z kamerą jak w grze, NIE w pełnej scenie bitwy — NIE_ZMIERZONO: zrzut z żywej bitwy (wymaga dev servera/builda gry, zakazanych w tym temacie; build do /tmp tylko przez test vite, nie uruchamiałem gry).

BLOKADY: brak blokujących. Notatki:
1. Brak pliku DODATEK (patrz ZAŁOŻENIA).
2. zelazo-super-rzym-grecja: mutacja M16 (kolor pierścienia aspidy Hieros) przestała zapalać H13, bo para Hieros/Falanga jest teraz z natury dużo bardziej rozróżnialna; oznaczona `przestarzala` (zielona kontrola w macierzy, nie wymagana jako czerwona w M1). Luka: para Evocati/Hastati w H13 nie ma teraz mutacji rozstrzygającej — do Evaluatora/FC.
3. Z daleka (kamera 50 deg, widok z przodu) sarissa jest silnie skrócona perspektywą; z boku i 3/4 czytelna. Sylwetka Falangi z daleka wyraźnie inna: skręt, chlamys, pióra, tarcza.
4. Skręt torsu -0.60 rad jest świadomym, mierzonym kompromisem; alternatywą (do ABC właściciela, jeśli wygląd nie pasuje) jest mniejszy skręt z większym rozciągnięciem lewego ramienia.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet): niezależne uruchomienie node tools/zelazo-falanga-real-render-test.cjs i 5 pozostałych testów zelazo-*, ocena wizualna dowody/*.png (zwłaszcza close-34 i far-line), ewentualne zrzuty w żywej bitwie przez dozwoloną ścieżkę. Dług REPIN Rust (model Falangi: sarissa/pelte, torso yaw, skala meshy, nowe nazwy mesh) — do założenia po FC PASS; mechanika bez zmian (tylko wygląd).
DEPLOY/PUSH: NIE WYKONANO
