# Niezależna ewaluacja — R-BITWA-ATAK-LUCZNICY-RYDWANY-Q1

**Werdykt: FAIL / NAPRAW.** Nie oznaczać poprawki jako gotowej ani jako etapu 11. Ewaluacja jest read-only; nie zmieniono kodu ani nie wykonano commitów.

## Zakres i wynik niezależnej kontroli

Niezależnie uruchomiono `battle-large-mixed-doctrine-matrix-test.cjs`. Wynik: **36 scenariuszy, 4 RED** — zgodny z raportem operatora.

1. W trzech RED strzelcy kończą z celem w zasięgu, ale nie wykonują strzału, w tym `atk-slinger-30` przy `lines=2`.
2. Czwarty RED to `atk-slinger-30` przy `lines=3`: po 10 krokach kończy w odległości 5 od celu, przy zasięgu 4. Macierz potwierdza problem w tym fixture i ścieżce planowania/ruchu, ale sama nie dowodzi trwałego błędu w pełnym runtime: limit aktywacji lub warunki fixture mogą mieć wpływ.
3. Macierz uruchamia produkcyjny planner, a jej trasy/movement obejmują produkcyjne decyzje ruchu. Zastępuje jednak `_doAttack` recorderem zdarzeń (weryfikuje m.in. kwalifikację do strzału i amunicję), zaś `_doMove` jest adapterem fixture’u. Nie sprawdza pełnej ścieżki obrażeń, animacji ani rzeczywistego runtime action loop. Wyniki są wartościowym sygnałem regresji, lecz nie stanowią samodzielnego dowodu zachowania kompletnej bitwy.
4. `battle-ranged-mounted-doctrine-test.cjs` stubuje `_doAttack` oraz `_cavalryAction` (m.in. linie 61, 83, 111 i 161). To test routingu wywołań, nie dowód, że strzelcy strzelają, a konnica/rydwany wykonują prawidłowe działania w walce.
5. Chromium smoke opisany w closeout sprawdza ogólną ścieżkę 28v28 skip/result i powrót na mapę. Nie sprawdza aktywnego ataku, strzałów dystansowych ani ruchu konnicy/rydwanów. Zrzut aktywnej walki nie powstał z powodu timeoutu diagnostyki. Brakuje więc wymaganej weryfikacji wizualnej/runtime dla tej poprawki.
6. W kodzie `_rangedFiringStepStaysBehindMelee` jest zdefiniowane, ale nie ma callsite’ów. Równocześnie `_compactAttackAllowsStep` ogranicza ruch niekonnych jednostek według kolejnych rang; `formationRules.ts` rozdziela oszczepników, łuczników i procarzy na kolejne rangi. To wiarygodny kierunek diagnostyki, lecz nie potwierdzona przyczyna czterech RED. Nie należy przedstawiać go jako rozstrzygniętego root cause.

## Wymagany minimalny następny krok operatora

1. Dodać dla wszystkich czterech RED deterministyczny trace: wybrany target i jego priorytet, odległość/zasięg, rangę jednostki, planowane pole, wynik compact-line gate oraz powód niewykonania ataku lub odrzuconego kroku.
2. Naprawić lub wyjaśnić każdy RED, a następnie uruchomić te same fixture’y przez rzeczywistą ścieżkę `_doAttack` i rzeczywiste akcje konnicy/rydwanów — bez zastępowania ich recorderem.
3. Wykonać Chromium smoke z aktywną bitwą dla ataku, obrony i szarży; zebrać dowód strzałów łuczników/procarzy oraz ruchu i ataku konnicy/rydwanów.
4. Ponownie uruchomić macierz i kontrole po zmianie. Wymagany rezultat: wszystkie 36 scenariuszy PASS i brak nowych regresji.

Do spełnienia tych warunków wynik pozostaje **FAIL / NAPRAW**.
