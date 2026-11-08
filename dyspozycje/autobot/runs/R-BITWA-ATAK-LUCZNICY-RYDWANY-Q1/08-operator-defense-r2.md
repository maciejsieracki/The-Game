# Obrona Operatora — R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1, runda 2

**Data:** 2026-10-29
**Podstawa:** `07-evaluator-closeout.md`
**Werdykt Operatora:** Przyjmuję werdykt **FAIL / NAPRAW**. Nie uznaję tematu za gotowy ani za etap 11. Nie zmieniałem produktu, testów ani nie wykonywałem commita w tym etapie.

## Odpowiedź punkt po punkcie

1. **Trzy przypadki strzelców bez strzału mimo zasięgu — PRZYJMUJĘ.** Są widoczne w wyniku 36-scenariuszowej macierzy i zostały powtórzone przez niezależnego Evaluatora. Przykładowy identyfikator `atk-slinger-30` (wariant `lines=2`) oraz analogiczne przypadki łucznika/procarza są zapisane w logu i `06-operator-closeout.md`. To odchylenie fixture’u/planera wymaga wyjaśnienia; obecne dane nie dowodzą jeszcze zachowania pełnej walki.

2. **Procarz poza zasięgiem po 10 krokach — PRZYJMUJĘ Z ZASTRZEŻENIEM.** Trace macierzy pokazuje `atk-slinger-30`, pozycję końcową `(11,27)`, dystans 5 i zasięg 4. To potwierdza wynik w danym fixture, ale przyznaję, że 5 aktywacji i warunki planszy nie rozstrzygają, czy identyczny problem występuje w pełnym runtime. W raporcie Operatora nazwałem to reprodukowalnym przypadkiem testu, nie zweryfikowanym produkcyjnym root cause.

3. **Stub wykonania ataku w macierzy — PRZYJMUJĘ.** `battle-large-mixed-doctrine-matrix-test.cjs` korzysta z produkcyjnego planera, ale `_doAttack` rejestruje zdarzenie zamiast wykonać właściwą logikę obrażeń/animacji; `_doMove` jest adapterem fixture’u. Wyniki dowodzą decyzji planera i legalności według tego modelu, nie kompletnego cyklu akcji runtime. W `06-operator-closeout.md` ten limit zaznaczyłem; nie należy opisywać macierzy jako pełnego testu bitwy.

4. **Stuby w teście doktryn — PRZYJMUJĘ.** `battle-ranged-mounted-doctrine-test.cjs` potwierdza wybór/trasowanie wywołań, ponieważ podstawia `_doAttack` i `_cavalryAction`. Wynik 9/9 nie dowodzi rzeczywistego ostrzału, obrażeń ani manewru konnicy i rydwanów. Nie traktuję go jako dowodu zamknięcia zgłoszenia.

5. **Brak aktywnej bitwy doktryn w Chromium — PRZYJMUJĘ.** `battle-large-return-live-test.cjs` sprawdził otwarcie 28v28, zakończenie przez ścieżkę skip/wyniku i powrót na mapę. Nie uruchomił aktywnego Ataku/Obrony/Szturmu ani nie zmierzył strzałów i manewru konnicy/rydwanów. Zrzuty `chromium-battle-result.png` i `chromium-map-after-return.png` potwierdzają wyłącznie ten ograniczony smoke. Odczyt stanu otwartej walki przekroczył timeout; pełnego renderu aktywnej walki nie uzyskano.

6. **Niepotwierdzona hipoteza helpera i limitu rangi — PRZYJMUJĘ.** `_rangedFiringStepStaysBehindMelee` ma definicję bez callsite’ów (`rg -n` wskazał wyłącznie definicję). `formationRules.ts` układa role dystansowe w rangi, a `_compactAttackAllowsStep` kontroluje ruch zgodnie z rangą. To sensowny trop do instrumentacji, ale nie dowód przyczyny. Moja krótka próba podpięcia helpera nie zmieniła czterech czerwonych scenariuszy i została całkowicie cofnięta; dlatego nie pozostawiłem niepotwierdzonej poprawki.

## Minimalny zakres następnej rundy Operatora

1. Rozszerzyć wyłącznie harness macierzy o deterministyczny trace czterech czerwonych przypadków: wybrany cel/priorytet, dystans i zasięg, ranga, cel/ruch, wynik limitu zwartej linii oraz powód odrzucenia akcji. Zweryfikować, czy fixture resetuje `moveLeft`, `acted`, pozycję i skład zgodnie z właściwym cyklem.
2. W testowym środowisku wykonać odpowiednie produkcyjne metody akcji — rzeczywisty atak/zużycie amunicji/obrażenia oraz akcję konnicy/rydwanów — bez zastępowania ich stubem. Jeśli potrzebne są animacje i renderer, użyć przeglądarki; nie osłabiać kryteriów, by jedynie uzyskać zielony wynik.
3. Dopiero po odtworzeniu źródła RED zmienić produkcyjny planner w allowliście i wymagać przejścia tych samych 36 scenariuszy bez regresji.
4. Przygotować dedykowany test Chromium aktywnej mieszanej bitwy, wykonać Atak/Obronę/Szturm i udokumentować co najmniej legalne strzały dystansowych oraz ruch/atak konnicy i rydwanów, wraz z konsolą i dowodem ekranowym. Smoke skip/result nie zastępuje tego testu.
5. Po zmianach powtórzyć macierz, ukierunkowane testy, typecheck oraz `git diff --check`. Do tego czasu status pozostaje **FAIL / NAPRAW**.

## Stan repozytorium

Obrona jest wyłącznie raportem. Branch pozostaje `autobot/R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1-r2`, HEAD `2525710c17d59939e5178f729c83f3b77829084c`. Nie edytowałem źródeł, nie commitowałem, nie integrowałem, nie pushowałem ani nie wdrażałem.
