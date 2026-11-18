# R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI dyplomacji — wyłącznie prezentacja, zero zmian reguł/progów/AI)
TEMAT: R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1 (część 1 z 2)
GOAL: na planszach umów (Punkty Wymiany, Umowa wymiany surowców, Decyzja dla pakietu, Szybka wymiana) zostają tylko liczby decyzyjne, werdykt i przyciski; wyjaśnienia trafiają do atrybutu title (tooltip) bez usuwania treści; „SZYBKA WYMIANA” na górze audiencji.

ZMIANY-COMMIT: commit na gałęzi autobot/R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1 (SHA w polu sha wyniku; baza 98c988d7c). Pliki:
- gra/src/ui/diplomacyTipText.ts (NOWY) — helper: escTipAttr, plainTextFromHtml, detailTipAttr (wspólny wzorzec title).
- gra/src/ui/diplomacyAcceptanceBalance.ts — renderPnBalancePanelHtml / FromBasket / ForTreaty: na planszy trzy pola PW + hint; relacja (WPŁYW), cena pokoju, traktat („Ty: baza → PW”), baza, „PW @ Rel … fair min … bilans”, werdykt → title na liczbie Bilansu. Werdykt jednolinijkowy („Brakuje N PW” / „Równo — spełnia”).
- gra/src/ui/diplomacyTradeBasket.ts — summaryHtml przepisane: SUMA, Fair min, Nadmiar, Dobra wola, Jednorazowo/Co turę, Szczegóły zostają w title panelu (lub podpowiedzi, gdy brak panelu); „Tryb wymiany” — opis w title etykiety; „Czas umowy” — podpowiedź w title nagłówka; podtytuł okna: „Wymiana dwustronna · partner: X” (Relacja w title); gift: „SUMA daru” z title.
- gra/src/ui/diplomacyAudience.ts — „SZYBKA WYMIANA” (sam tytuł, podpis „auto-uczciwa oferta” w title) jako pierwszy rząd audiencji nad paskiem akcji; „Decyzja dla całego pakietu (N)” i „Jeden bilans PW…” → title kontenera; zostają Przyjmij/Odrzuć.
- gra/tools/diplomacy-trade-era-dom-test.cjs — asercje bez osłabiania; czytają textContent + wartości title (wyliczenia SUMA/Fair min są teraz w tooltipie).
- gra/tools/diplo-deal-boards-declutter-tooltips-test.cjs (NOWY) — 7 asercji: widoczny tekst bez wyjaśnień i ≤160 znaków; tooltip niesie dawne treści; MUTACJA (wyjaśnienie wraca na planszę) czerwieni test.

Nic nie usunięto z DOM-u tekstowego planszy — przeniesiono do title.

TESTY:
- `npx tsc --noEmit` = 0 (brak błędów).
- Diplomacy UI (40 skryptów referencyjnych dotykających modułów diplomacy*/Audience/TradeBasket/AcceptanceBalance): przed zmianą 33 zielone / 7 czerwonych; po zmianie 33 zielone / 7 czerwonych — te same 7 (dyplo-bilans-gate-n-e1-reprodukcja{,-runda2,-runda3}, dyplo-pakt-ekspansja-granica, dyplo-warunek-niespelniony-czerwony-tooltip, terminology-trade-vs-tax, ui-language-count-renderer): czerwone PRZED zmianą, błędy dotyczą silnika paktu/bilansu, nie prezentacji. Brak nowych regresji.
- Naprawione przy okazji dwa testy, które by poczerwieniały: diplo-quick-actions-labels (aria-label CTA zostaje „auto-uczciwa wymiana”) 38/0; diplomacy-infografiki-tooltipy 12/0.
- diplomacy-trade-era-dom-test 58/0 (po przeniesieniu asercji na title).
- Nowy diplo-deal-boards-declutter-tooltips-test: 7 pass / 0 fail, mutacja czerwieni.
- Chromium / zrzuty PRZED–PO / zrzut tooltipa: NIE ZMIERZONO (brak uruchomionej przeglądarki w tej rundzie; wymagane przez Evaluator).

BLOKADY: brak blokad technicznych. Zakres świadomie ograniczony do części 1:
- Okna Wojna / Sojusz / Pakt / Handel / Dar / Wasal / Wchłonięcie i nagłówek relacji — część 2 (R-…-ALL-PROPOSAL-WINDOWS-…-Q2).
- diplomacyDealDisplay.ts i diplomacyPanel.ts nie zmieniane (teksty poza panelem PW).
- Układ CSS „Szybkiej wymiany” nad paskiem: inline flex, bez zrzutu nie potwierdzono wyglądu.
- Opisy w dealDurationHtml (sub pod czasem umowy) zostawione widoczne.

UWAGI-DLA-ORKIESTRATORA:
- W worktree przed startem były zmodyfikowane pliki PNG w dyspozycje/autobot/runs/* (nie moje) — NIE dodawane do commita (git add tylko ścieżek gra/* i raportu).
- Zainstalowano `npm ci --ignore-scripts` w gra/ tego worktree (node_modules) — do sprzątania po FC.
- Część kodu (wyliczenia Relacja/fair min w tooltipach) wymaga weryfikacji w grze: czy tooltip na liczbie Bilans jest czytelny dla gracza (dotyk — brak wzorca długiego tapnięcia; title działa wg zasad gry na hover).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — Chromium: zrzuty PRZED/PO dla planszy Umowy wymiany surowców, PW (pokój/zawieszenie), Decyzji pakietu, Szybkiej wymiany + zrzut z tooltipem; ocena R2/R3; potem Final Control i część 2 (Q2).
DEPLOY/PUSH: NIE WYKONANO
