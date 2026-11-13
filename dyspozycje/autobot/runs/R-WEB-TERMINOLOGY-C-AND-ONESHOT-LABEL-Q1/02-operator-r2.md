STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERMINOLOGY-C-AND-ONESHOT-LABEL-Q1
GOAL: Usunięcie zarzutów Evaluatora rundy 1 (FAIL) w allowliście: wspólna etykieta grupy, brak handelNetto w tekstach dla gracza, wzmocnione testy [C]/[D].
ZMIANY/COMMIT: baza 0df2cf574 (r1); commit r2 = SHA w gałęzi terminology-r2-wip (patrz sekcja RUNDA). Pliki: gra/src/ui/cityPanel.ts, gra/tools/terminology-trade-vs-tax-test.cjs, dyspozycje/autobot/runs/R-WEB-TERMINOLOGY-C-AND-ONESHOT-LABEL-Q1/02-operator-r2.md.
ZARZUTY (odpowiedzi):
1. (grupa w cityPanel:9577) PRZYJĘTE. Dodano jedną funkcję buildingGroupDisplayLabel (mapa etykiet z kluczem 'Handel i pieniądz' → 'Podatek i pieniądz'), użytą w karcie szczegółów (appendDetailSection) i w nagłówku listy budynków (summary.textContent). Klucz danych grupa bez zmian. Test [C] sprawdza oba miejsca i brak surowego ${grupa} w nagłówku.
2. (handelNetto w :5018 i :5028) PRZYJĘTE. Wyświetlany tekst: „floor(podatek netto × %Zamożność)” i „%Zamożność × podatek netto → wpływ do puli zamożności”. Identyfikatory bez zmian. Test [C] ma nowy wzorzec: żaden literał (poza komentarzami) nie zawiera handelNetto/handelBrutto. Sprawdzono: wzorzec łapie oba miejsca z r1 (2 trafienia), na bieżącym kodzie 0 trafień.
3. (styl: Tarasy/„2 glina”/„twojej religii”) ODRZUCONE w tym temacie — poza allowlistą (gra/data/tech-cards-top5.json, building-cards-top5.json i generatory nie są na allowliście). DECYZJA ORKIESTRATORA: rozszerzyć allowlistę albo osobny temat. Nie zmieniano.
4. (wiki „Mnożnik handlu/waluty”) ODRZUCONE w tym temacie — zgodnie z dispatchem („dotyczy handlu: nie zmieniaj, zgłoś”); r1 wykazał, że wartość jest czytana jako mnożnik handlowy religii (culture-religion.ts, klasa B). DECYZJA ORKIESTRATORA/ABC: zostawić lub „Mnożnik waluty”.
5. (empireDetailPanel.ts:2277 „Handel i pieniądz”) ODRZUCONE w tym temacie — plik poza allowlistą. DECYZJA ORKIESTRATORA: rozszerzyć allowlistę o empireDetailPanel.ts (i building-upgrades.ts) albo osobny temat, razem z pkt 1 dla spójności UI.
6. (test podpisu trybu wymiany [D] tylko źródłowy) PRZYJĘTE CZĘŚCIOWO. Dodano asercje: podpis w resourceTradeModeHtml z gałęzią po mode (once/per_turn) oraz renderBasket przekazujący resourceTradeMode do tej funkcji (chip → refresh → renderBasket). To nadal asercja źródłowa, nie render. Efekt w UI: NIE_ZMIERZONY (brak Chromium/node_modules w worktree). Raport NIE sugeruje tego jako pokrycia renderu.
RUNDA: 2/5 (ID bez zmian: ten sam temat, to samo Operator/Obrona).
TESTY:
- terminology-trade-vs-tax-test: 794 pass, 1 fail. Jedyny fail: [G] gen-tech-cards-top5 --check („Sztuka wojenna: Top3 = NIE_USTALONO”) — istnieje na bazie e4f57ace2, poza tematem, NIE NAPRAWIANE.
- tsc: global TypeScript 6.0.2 (brak gra/node_modules, projekt nie ma zainstalowanego TS) → błędy w niezwiązanych plikach (filePlayer.ts itd.), zero błędów w cityPanel.ts i diplomacyTradeBasket.ts. Wynik bramki projektu: NIE_ZMIERZONE.
- logic-test: NIE_ZMIERZONE (wymaga esbuild z npm install w gra/; nie uruchamiano npm install).
- korupcja-tekst / dyplo real-render (Chromium): NIE_ZMIERZONE (brak node_modules).
- git diff --check: czysto.
- npm run build/dev: NIE URUCHAMIANO (zakaz).
BLOKADY: brak technicznych. Pkt 3, 4, 5 wymagają decyzji orkiestratora (allowlista/ABC). Dysk worktree: 2,5 GB wolnego przy starcie (poniżej progu 4 GB dla web) — brak instalacji zależności, więc bez wpływu na wynik, ale orkiestrator powinien to uwzględnić przy Evaluatorze.
NASTĘPNY KROK: Evaluator (ten sam ID, runda 2) → Obrona → Final Control. Orkiestrator: decyzje pkt 3–5 (allowlista lub osobny temat).
DEPLOY/PUSH: NIE WYKONANO
