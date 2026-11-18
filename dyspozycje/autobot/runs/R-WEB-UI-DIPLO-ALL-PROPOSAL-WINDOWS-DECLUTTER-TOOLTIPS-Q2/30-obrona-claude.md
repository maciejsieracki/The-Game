# R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2 — Operator (obrona, runda 3)

STATUS: OBRONA-R3 (zarzuty 1–3 Evaluatora PRZYJĘTE z poprawką i dowodem)
DOMAIN: GAME (UI dyplomacji, wyłącznie prezentacja; zero zmian reguł, cen, progów, logiki AI)
TEMAT: R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2
GOAL: domknąć zarzuty Evaluatora do kandydata ca9408d68 (regresja testu barb, penaltyBlockHtml, pełny inwentarz).
BAZA: ca9408d68 (kandydat, detached). Gałąź robocza: brak — commit na HEAD worktree.

## Odpowiedź na zarzuty

Zarzut 1 (regresja barb-karencja-czas-trwania-real-render-test, exit 1): PRZYJĘTE.
Przyczyna: kotwica `HTML_PO_ANCHOR` odwzorowywała stary wiersz `<p class="cdb-sub">Opłata cywilne: …</p>`, który w r2 zamieniono na `detailTipAttr(...)` + „Opłata: C · M”. Kotwica przestała pasować, więc mutacja nie zaszła.
Poprawka: `gra/tools/barb-karencja-czas-trwania-real-render-test.cjs` — `HTML_PO_ANCHOR` ustawiona na aktualny kod kandydata (`detailTipAttr([...]) + '>Opłata: ' ...`). `HTML_PRZED_ANCHOR` (stan sprzed rundy) bez zmian.
Dowód: `node gra/tools/barb-karencja-czas-trwania-real-render-test.cjs` → `WYNIK: 13 PASS, 0 FAIL`, exit 0.

Zarzut 2 (penaltyBlockHtml chowa linie „info”, pusty nagłówek „Skutki:”): PRZYJĘTE.
Poprawka: `gra/src/ui/diplomacyAudience.ts` (penaltyBlockHtml):
- linie `kind='info'` są widoczne jako werdykt decyzyjny: pierwsza klauzula przed średnikiem (np. „brak kary Wiarygodności za samo zerwanie”, „kara jeszcze N tur”, „Sojusz zostanie zerwany”); pełne uzasadnienie w `title` tej pozycji;
- każda pozycja liczbowa (`<li>`) ma `title` z uzasadnieniem (tooltip elementu, nie tylko kontenera);
- kontener zachowuje dotychczasowy `title` bloku (pełne wyliczenie). Nagłówek „Skutki:” nie zostaje pusty, bo lista zawsze ma co najmniej jedną pozycję (`preview.lines` niepusta).
Dowód: nowe asercje w `gra/tools/diplo-all-windows-declutter-real-render-test.cjs` (scenariusz zerwania traktatu dostał linię info): „werdykt decyzyjny … widoczny” PASS; „uzasadnienie linii info (po średniku) tylko w title” PASS. Mutacja M1 zaktualizowana do nowej kotwicy linii `<li title=…>`; wynik `baza fail=0, mutacje wykryte 10/10 => PASS`.
Uwaga techniczna: pierwsza wersja poprawki dała błąd tsc (`split(';')[0]` przy `noUncheckedIndexedAccess`); zamieniono na `replace(/;.*$/, '')`.

Zarzut 3 (inwentarz bez plik:linia, bez osobnych wierszy): PRZYJĘTE. Pełny inwentarz niżej (KROK 0, zastępuje skrót z 10-operator-claude.md). Linie z kodu kandydata ca9408d68 (grep); zakres funkcji podany tam, gdzie pojedyncza linia tekstu nie jest unikalna.

## KROK 0 — INWENTARZ (pełny)

Legenda decyzji: ZOSTAJE = widoczne; TOOLTIP = treść w `title`/`detailTipAttr` elementu, którego dotyczy; WIDOCZNE-SKRÓT = krótki werdykt widoczny, reszta w tooltipie; POZA = poza zakresem.

| plansza | plik:linia | tekst widoczny dziś (kandydat) | decyzja |
|---|---|---|---|
| Wojna: zgoda — lead, opcje | diplomacyAudience.ts:1130–1186 (showWarConsentModal) | „Nie jesteście w stanie wojny…”, „Bez ataku w tej turze (karencja N1)”, „Wojna od razu i atak…” | lead i opisy opcji → TOOLTIP na przyciskach; przyciski ZOSTAJĄ |
| Wojna: zgoda — skutki | diplomacyAudience.ts:1095–1128 (penaltyBlockHtml), wywołania :1139, :1148 | „Skutki:” + liczby (Wiarygodność/Zaufanie −N) | liczby ZOSTAJĄ; powody i linie info: werdykt WIDOCZNE-SKRÓT, reszta TOOLTIP |
| Wojna: potwierdzenie | diplomacyAudience.ts:1249–1280 (showWarConfirmModal), penalty :1262 | „Na pewno wypowiadasz wojnę…” | pytanie ZOSTAJE; skutki jak wyżej |
| Zerwanie traktatu | diplomacyAudience.ts:1281–1308 (showBreakTreatyConfirmModal), penalty :1294 | „Zerwać traktat?” + skutki | pytanie ZOSTAJE; skutki jak wyżej (werdykt „brak kary…” widoczny, uzasadnienie w tooltipie) |
| Sojusz: obowiązek / odmowa | diplomacyAudience.ts:1187–1225 (showAllianceObligationModal), penalty :1199 | „Odmowa = kara Wiarygodności i zerwanie sojuszu” | skutek → TOOLTIP (test: nie widoczny); przyciski Wypełnij/Odmów ZOSTAJĄ |
| Pokój wymuszony | diplomacyAudience.ts:1226–1248 (showForcedPeaceModal) | — | POZA ZAKRESEM (FORCEDPEACE), nietknięte |
| Baner stanu audiencji | diplomacyAudience.ts:1309–1334 (formalBannerHtml), breakTip :1330 | „Stan: POKÓJ/WOJNA…”; „zerwanie: …” usunięte z tekstu | etykieta stanu ZOSTAJE; kara zerwania → TOOLTIP |
| Nagłówek: relacja (Zaufanie + Respekt) | diplomacyAudience.ts:1661–1677 (relacjaTotalHtml) | „Relacja …” | liczba ZOSTAJE; wzór „(Zaufanie + Respekt)” → TOOLTIP |
| Nagłówek: wiarygodność | diplomacyAudience.ts:1704–1776 (credibilityBarHtml, credibilityBreakdownHtml) | pasek + wartość | wartość ZOSTAJE; rozbicie → TOOLTIP paska |
| Nagłówek: zmęczenie / desperacja | diplomacyAudience.ts:1616–1660 (warWearinessRowHtml, warWearinessMarkHtml) | „Desperacja N%”, „Pokój wymuszony za ≈N tur” | liczby ZOSTAJĄ; opis mechanizmu → TOOLTIP (istniejący) |
| Nagłówek: życiorys/bieżące | diplomacyAudience.ts:1478–1583 (playerCardHtml/otherCardHtml) | sekcje opisowe | usunięte z widoku (test: brak bloku), treść w TOOLTIP karty |
| Relacje partnerów (NAP) | diplomacyAudience.ts:1584–1615 (otherRelationsSectionHtml) | „Pakt o nieagresji z …” | nazwa ZOSTAJE; opis → TOOLTIP |
| Relacja — rozbicie | diplomacyAudience.ts:2357–2385 (relBreakdownHtml) | wyliczenie składników | TOOLTIP (liczba ZOSTAJE) |
| Szybka wymiana | diplomacyAudience.ts:1883–1889 | „SZYBKA WYMIANA” | przeniesiona na górę (R5); podpis „auto-uczciwa oferta” → TOOLTIP przycisku |
| Pasek akcji (Wojna/Pokój/Sojusz/Pakt/Handel/Dar/Wasal/Wchłonięcie) | diplomacyAudience.ts:1833–1840 (etykiety), 1857–1928 (actionBarHtml) | nazwy akcji | ZOSTAJĄ (nazwy i przyciski) |
| Stół: „Na stole …” / hint pakietu | diplomacyAudience.ts:2039 | „Na stole jest już…”, „Jeden bilans PW…” | licznik ZOSTAJE; hint → TOOLTIP |
| Aktywne traktaty | diplomacyAudience.ts:2052–2100 (treatiesColumnHtml), nagłówek :2090 | lista traktatów, „kara zerwania” | nazwy i liczba ZOSTAJĄ; kara i meta → TOOLTIP wiersza |
| Stół negocjacji: karty, bilans | diplomacyAudience.ts:2106–2306 (negotiationCard*, negotiationBalanceBarHtml :2174) | karty, bilans | bilans ZOSTAJE; wyjaśnienia → TOOLTIP |
| Stół negocjacji: pasek akcji | diplomacyAudience.ts:2306–2339 (negotiationActionBarHtml), :2323 | „Decyzja dla całego pakietu” | przyciski ZOSTAJĄ; opis → TOOLTIP (detailTipAttr) |
| Pakt (koszyk) | diplomacyTradeBasket.ts:667–669 (case 2 — czas paktu, etykieta z tooltipem) | „Czas paktu”, „Ręcznie: 10–20 tur…” | etykieta ZOSTAJE; wyjaśnienia i „Złamanie: −30 Relacja, −20 Zaufanie” → TOOLTIP |
| Sojusz (typ) | diplomacyTradeBasket.ts:679 (case 3) | „Typ sojuszu” + opcje | etykieta ZOSTAJE; „Zerwanie sojuszu… kary” → TOOLTIP |
| Przemarsz | diplomacyTradeBasket.ts:720 (case 4); diplomacyNegotiationModal.ts:324 | „Opłata: C · M” | widoczne liczby; „(jednorazowo)” i pełna treść → TOOLTIP |
| Wspólna walka z barbarzyńcami | diplomacyTradeBasket.ts:717 | przycisk | ZOSTAJE |
| Wasal | diplomacyTradeBasket.ts:735 (case 12); diplomacyNegotiationModal.ts:381 | „Trybut wasala ¤/turę” | etykieta ZOSTAJE; „zachowuje terytorium…” → TOOLTIP |
| Wchłonięcie | diplomacyTradeBasket.ts:740–742 (case 15); walidacja :1036 | „Minimum X ¤” | widoczne minimum; „wasal musi wyrazić zgodę (Relacja ≥ 60)” → TOOLTIP |
| Handel / traktat handlowy | diplomacyTradeBasket.ts:757–762 (case 5) | „Czas traktatu handlowego (tur)” | etykieta ZOSTAJE; „Ręcznie … fundament szlaków” → TOOLTIP |
| Reparacje / ultimatum | diplomacyTradeBasket.ts:840 (case 9); diplomacyNegotiationModal.ts:373 | „Reparacje (¤)” | etykieta ZOSTAJE; „Odmowa = casus belli” → TOOLTIP |
| Pokój / Rozejm (okno propozycji) | diplomacyTradeBasket.ts:855–870 (case 10), etykiety :862 | przyciski „Pokój/Rozejm”, „Rodzaj” | etykieta ZOSTAJE; opisy trybów → TOOLTIP etykiety. Osobne okno propozycji poza koszykiem: NIE ZMIERZONO (patrz niżej) |
| Słodzik (PW w negocjacjach) | diplomacyNegotiationModal.ts:228–251 (sweetenerSectionHtml), label :240 | „Dołóż do umowy (opcjonalnie — słodzik)” | etykieta ZOSTAJE; „Zwiększa szansę akceptacji…” → TOOLTIP |
| Dar | diplomacyNegotiationModal.ts:333 | „Wybierz …” | instrukcja „zamknij to okno…” → TOOLTIP (test: nie widoczna) |
| Handel — instrukcja | diplomacyTradeBasket.ts (instrukcja koszyka) | „zamknij to okno…” | → TOOLTIP (test: nie widoczna) |
| Koszyk: czas umowy | diplomacyTradeBasket.ts:1416, :1449, :1474 | „Czas umowy”, opis trybu | etykieta ZOSTAJE; opisy → TOOLTIP |
| Koszyk: puste miasta | diplomacyTradeBasket.ts:1678 | „— brak miast do oddania —” | komunikat ZOSTAJE (blokujący); „Stolica i ostatnie miasto są wyłączone” → TOOLTIP |
| Empty states | diplomacyNegotiationModal.ts:338, :352; diplomacyTradeBasket.ts:783–784, :826 | „Brak technologii…”, „Brak znanych wrogów…” | komunikaty blokujące ZOSTAJĄ (R2) |

## Testy (wszystkie na kandydacie + poprawce, Node 22.22.0, esbuild z gra/node_modules po `npm ci`)

- `npx tsc --noEmit` — exit 0 (po poprawce split→replace).
- `barb-karencja-czas-trwania-real-render-test.cjs` — `WYNIK: 13 PASS, 0 FAIL`, exit 0.
- `diplo-all-windows-declutter-tooltips-test.cjs` — `48 pass, 0 fail`, exit 0.
- `diplo-deal-boards-declutter-tooltips-test.cjs` (Q1) — `13 pass, 0 fail`, exit 0.
- `diplo-all-windows-declutter-real-render-test.cjs` — baza `fail=0` (26 asercji PASS, w tym 2 nowe dla linii info); mutacje `10/10 wykryte => PASS`, exit 0.
- NIE ZMIERZONO w tej rundzie: pięć bramek referencyjnych (logic/tech-tree/research/unit-replace/combat) i pełny zestaw diplo*/dyplo* oraz testy *-live (zmierzone w rundzie 2 na ca9408d68; zmian poza `diplomacyAudience.ts`/testami nie ma). Live-test i fokus klawiatury/dotyk: NIE ZMIERZONO.

## Dowody (zrzuty)

Bez zmian względem r2: `dowody/PRZED-*.png`, `dowody/PO-*.png`, `dowody/PO-hover-war.png`, `dowody/PO-hover-alliance.png`. Zmiana penaltyBlockHtml nie została ponownie sfotografowana — NIE ZMIERZONO wizualnie.

## Zakończenie

- Zmienione pliki (allowlista): `gra/src/ui/diplomacyAudience.ts`, `gra/tools/barb-karencja-czas-trwania-real-render-test.cjs`, `gra/tools/diplo-all-windows-declutter-real-render-test.cjs`, ten raport.
- `gra/node_modules` utworzony w worktree przez `npm ci` (do usunięcia po zakończeniu tematu).
- Nic nie wpchnięto (`push`/`deploy` NIE WYKONANO); `git add` tylko ścieżkowy.

RUNDY: 3/5 (runda obrony po FAIL Evaluatora r2).
NASTĘPNY KROK: Evaluator ponowna weryfikacja zarzutów 1–3 (barb 13/0; real-render baza 0 fail, mutacje 10/10; penalty verdict).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: `df -h /` przed startem 5.5G wolne (86%); node_modules w worktree (~1 pakiet mały, 71 pakietów). Testy wołane w pierwszym planie.
