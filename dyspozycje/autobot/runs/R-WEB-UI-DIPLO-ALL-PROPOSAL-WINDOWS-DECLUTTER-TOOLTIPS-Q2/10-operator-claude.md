STATUS: PASS-WITH-NOTES (Operator, runda 2/5 — do Evaluatora; nie integrowane)
DOMAIN: GAME (UI dyplomacji, wyłącznie prezentacja)
TEMAT: R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2
GOAL: reguły R1–R6 dla pozostałych okien dyplomacji (zakres r2 = zarzut 1 FC: wojna/zgoda, sojusz, pakt, pokój/rozejm, wasal, wchłonięcie, handel, dar, zerwanie, panel PW w negocjacjach).
ZMIANY/COMMIT: baza 89a5e25cc; kod rundy 1 = 92fede741 (kandydat FC r1); czubek tej rundy = commit tego raportu (SHA w polu sha).
  Kod: gra/src/ui/diplomacyTradeBasket.ts (formularze umów koszyka: Pakt, Sojusz, Przemarsz, Wasal, Wchłonięcie, Pokój/Rozejm, Reparacje, Handel-dolny opis; wyjaśnienia → title etykiety/pola, widoczna tylko liczba); gra/src/ui/diplomacyNegotiationModal.ts (słodzik, opłata przemarszu, „Odmowa = casus belli”); gra/src/ui/diplomacyAudience.ts (penaltyBlockHtml: modal wojny/zgody/sojuszu/zerwania — lista skutków = same liczby, uzasadnienia i linie „info” w title bloku, nagłówek „Skutki:”); gra/src/ui/hudTitleTooltip.ts (+ scope `.civ-diplo-neg-overlay`). Testy: gra/tools/diplo-all-windows-declutter-tooltips-test.cjs (+ blok koszyka, mutacje), gra/tools/diplo-all-windows-declutter-real-render-test.cjs (M1 zaktualizowana do nowej kotwicy). Zrzuty: dowody/PRZED-*.png i PO-*.png (7 okien) + PO-hover-war.png, PO-hover-alliance.png (dymek hudTitleTooltip z treścią title).
  Ta runda NIE rusza showForcedPeaceModal (poza zakresem, FORCEDPEACE).

KROK 0 — INWENTARZ (skrót; pełne wiersze wg kodu)
| plansza | plik | tekst dziś | decyzja |
|---|---|---|---|
| Wojna: zgoda/kara | diplomacyAudience.ts penaltyBlockHtml | „Czy na pewno? Skutki…”, uzasadnienia, info-linie | Skutki: liczby zostają; uzasadnienia + info → title bloku |
| Wojna: opcje | showWarConsentModal | „Bez ataku…”, „Wojna od razu…”, lead „Nie jesteście…” | title opcji / lead (r1) |
| Wojna: potwierdzenie | showWarConfirmModal | „Na pewno wypowiadasz wojnę X?” | pytanie decyzyjne ZOSTAJE |
| Zerwanie traktatu | showBreakTreatyConfirmModal | „Na pewno zrywasz: X?” + kara | pytanie zostaje; kara → title bloku |
| Sojusz (obowiązek) | showAllianceObligationModal | „Kara Wiarygodności…” | title (r1) |
| Baner stanu | formalBannerHtml | „Stan: X”, „zerwanie: …” | etykieta zostaje; kara → title (r1) |
| Relacje / wiarygodność | relacjaTotalHtml, credibilityBarHtml | „(Zaufanie + Respekt)”, rozbicie | title (r1) |
| Zmęczenie/desperacja | warWearinessRowHtml | etykieta „Desperacja N%”, „Pokój wymuszony za ≈N tur” | liczby zostają; opis w title (istniejący) |
| Aktywne traktaty | treatiesColumnHtml | „kara zerwania”, meta | title nazwy (r1) |
| Stół negocjacji | dealsColumnHtml, negotiation cards | „Na stole: N”, „Użyj Edytuj…” | title (r1) |
| Pakt | treatySectionHtml case 2 | „Ręcznie: 10–20…”, „Koszty/kary: Złamanie…” | etykieta „Czas paktu” + title |
| Sojusz (typ) | case 3 | „Zerwanie sojuszu… kary” | title etykiety „Typ sojuszu” |
| Przemarsz | case 4 | „Opłata cywilne/wojskowe (jednorazowo)” | widoczne „Opłata: C · M”, pełna treść w title |
| Wasal | case 12 | „Wasal zachowuje terytorium…” | title etykiety |
| Wchłonięcie | case 15 | „Wymagane minimum X · wasal musi… (Relacja ≥ 60)” | widoczne „Minimum X ¤”, reszta title |
| Handel/traktat handlowy | case 5 | „Ręcznie: 1–20… fundament szlaków…” | title etykiety |
| Reparacje/ultimatum | case 9, negotiation „cdn-ult-gold” | „Odmowa partnera = casus belli” | title pola |
| Pokój/Rozejm | case 10 | „Rozejm: po wygaśnięciu…”, „Zakończenie wojny…” | title etykiety „Rodzaj”/„Czas rozejmu” |
| Dar | negotiation case 13/14 | „zamknij to okno…” | title (r1) |
| Słodzik (PW) | sweetenerSectionHtml | „Zwiększa szansę akceptacji…” | title etykiety |
| Empty states | „Brak technologii…”, „Brak znanych wrogów…” | komunikaty blokujące | ZOSTAJĄ (R2) |
| Okno pokoju wymuszonego | showForcedPeaceModal | — | POZA ZAKRESEM (FORCEDPEACE), nietknięte |

TESTY (wszystkie na candidate, Node 22/esbuild/Chromium):
- tsc --noEmit: exit 0.
- Bramki referencyjne: logic-test 213/213; tech-tree 20/20; research 33/33; unit-replace 21/21; combat-test OK; unit-power 6/0. (5 wierszy z dispatchu + combat.)
- diplo-all-windows-declutter-tooltips-test: 48 pass, 0 fail (po poprawce asercji wielkości liter w bloku koszyka; 7 mutacji koszyka wykrytych).
- diplo-all-windows-declutter-real-render-test: baza fail=0 (250 asercji PASS), mutacje 10/10 wykryte, zrzuty PO + hover.
- diplo-deal-boards-declutter-tooltips-test (Q1): 13/0.
- Pełny zestaw diplo*/dyplo* (178 plików): 101+72 uruchomione z limitem 30–40 s na plik. Exit 1 — IDENTYCZNE na bazie 89a5e25c (pre-existing): civ-matrix-ai-diplomacy-wiring (1 fail), dyplo-bilans-gate-n-e1 (×3), dyplo-karta-duplikat, dyplo-pakt-ekspansja, dyplo-warunek-niespelniony, granice-relacja-dyplomatyczna, diplomacy-border-era-penalty-live (dług #369).
- Exit 124 (limit mojej pętli 30–40 s, NIE_ZMIERZONO do końca): 16 testów *-live-test i hotseat; diplo-aggressor-marker-live na bazie też 124 po 200 s (pre-existing).

ZAKOŃCZENIE / BLOKADY:
- NIE_ZMIERZONO: 16 testów live (przekroczony limit czasu pętli) — wymagają osobnego przebiegu z dłuższym timeoutem.
- Hover: zrzut dymka tylko dla war i alliance (dispatch wymagał min. 2 okien — spełnione). Fokus klawiatury/dotyk: NIE_ZMIERZONO.
- Dowody PRZED/PO: PRZED z bazy 89a5e25cc, PO z kandydata. Uwaga: testy diplo* nadpisały w innych runs/ zrzuty; PRZED-*/PO-* tej rundy nie są tam; cofnięte (git checkout) — nie ma zmian poza tematem.
- Dwa nieśledzone pliki wygenerowane przez test w innym runs/ (render.png, live-table.json) pozostawione nietknięte, NIE dodane do commita.

RUNDY: 2/5 (ten przebieg = runda 2 Operatora; FC r1 FAIL).
NASTĘPNY KROK: Evaluator (Sonnet/Haiku wg zasady) → Obrona → FC; sprawdzić zwłaszcza zarzut 1 (koszyk + penaltyBlock) i powtórzyć tooltips-test.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: dwa testy live (diplo-truce-live itp.) wymagają dłuższego limitu; test hover robi zrzut tylko dla war/alliance.
