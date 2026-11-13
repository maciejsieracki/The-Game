# AutoBot Evaluator — AI General-led war campaign

**WERDYKT: PASS-WITH-NOTES**
**Zakres:** niezależna inspekcja implementacji i raportu 48; wskazane testy uruchomione; bez zmian produktu.

## Tożsamość badanych źródeł

- `gra/src/game/ai.ts`: `f66803293fa327b3955abc19edd5451f437f560de33b9d987bd92137369d71f6`
- `gra/src/main.ts`: `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`
- `gra/src/game/ai-general-war-campaign.ts`: `438fc9030a6cdd9bbfb62b2188508fd2357e029e91928731f394d1f856341734`
- `gra/tools/ai-general-war-campaign-test.cjs`: `f51dead68ab6d658188ea6eed1e9d4881f59dafdb678973b5dd108705fe9f3d1`

Hashy zgadzają się z raportem 48. `git diff --check` nie zgłosił błędów dla badanych plików.

## Ocena wymagań

- **Wybór celu:** `prepareAiGeneralWarCampaign()` tworzy kandydatów wyłącznie z niebarbarzyńskich, nieeliminowanych właścicieli będących aktualnie w stanie wojny, znajduje ich aktywne stolice i liczy dystans stolica AI → stolica wroga. `chooseAiGeneralWarTarget()` wybiera najbliższą z remisem po ownerId, zachowuje cel podczas tej samej aktywnej wojny, a brak celu usuwa kampanię. Potwierdzone kodem i testem.
- **Rekrutacja wodza:** oferta pochodzi z `bestGeneralUnitForOwner()` opartego na `purchasableUnits(capital, ..., productionAvailabilityCtxForCity(capital))`; kampania sprawdza limit `canRecruitGeneral()` i woła wspólny `purchaseRecruitmentUnit(capital.id, ..., { isGeneral: true })`. Oczekiwanie na fizyczny spawn oraz istniejąca kolejka są obsłużone. To zachowuje bramki epoki/koszarów oraz transakcyjne kontrole kosztu/zasobów z istniejącego purchase path. Test potwierdza bramkę i połączenie statycznie; nie wykonuje rzeczywistej transakcji przeglądarkowej.
- **Zbiórka i granica ataku:** ruch zbiórki kieruje kwalifikujące się lądowe jednostki do aktualnej pozycji przypisanego Generała. Zbiórka emituje `endTurn`, więc zwykłe ataki są pominięte. Licznik jest ograniczony do jednego wpisu na `currentTurn`; po pięciu wykonanych owner-turns stage przechodzi na `attacking`, ale rozkazy ataku pojawiają się w następnym wejściu planner-a, czyli w owner-turn 6. Niedrożna/daleka jednostka nie przedłuża licznika; pozostaje na marszu w turze granicznej. Potwierdzone testami.
- **Cel ataku i skład:** attack stage woła istniejący `applyWarAllInCapitalToCommands()` z listą `targets: [campaign.target]`; każda wygenerowana komenda marszu ma ten sam targetCityId. Wspólna funkcja dopuszcza ruchome jednostki bojowe lądowe bez wykluczania `isGeneral`, więc fizyczny General może iść z armią. Kwalifikacja używa istniejącej reguły all-in (wyklucza cywilów, zwiadowców, brak ruchu, embark/naval raiders); nie oznacza literalnie każdej jednostki w imperium. Test rzeczywistego planner-a potwierdza komendę Generała i jednolity cel mimo drugiego miasta wroga.
- **Śmierć wodza i pokój:** zniknięcie przypisanego Generała przełącza kampanię do `recruiting`, resetuje licznik i blokuje ponowne użycie żyjących Generałów z kampanii. Dopiero nowy fizyczny General rozpoczyna świeżą zbiórkę. Brak aktywnego celu wojny usuwa kampanię, przez co planner wraca do zwykłych rozkazów. Test sprawdza te przejścia.
- **Save/load:** stan kampanii (stage, target, assigned/blocked ID, gather count i last turn) serializuje się do metadanych save i jest walidowany/odtwarzany przy load. Test pokrywa roundtrip helperów i statyczną obecność hooków w `main.ts`; nie przeprowadza pełnego save/load gry po integracji z walką.

## Wyniki walidacji i ograniczenia

`node tools/ai-general-war-campaign-test.cjs`: **24 passed, 0 failed**.
`npm run typecheck`: **PASS** (`tsc --noEmit`, exit 0).
`git diff --check` dla badanych ścieżek: **PASS**.

**PASS-WITH-NOTES:** wymagane lifecycle, wybór jednego celu, pięć pełnych tur zbiórki, atak w turze 6, ruch Generała/armii, restart po śmierci, anulowanie pokoju i trwałość helperów są zgodne z kodem oraz fokusem testowym. Główne ograniczenie dowodu: rzeczywisty zakup/queue/spawn oraz zapis i odczyt kompletnej gry nie zostały dynamicznie odtworzone; te integracje potwierdza inspekcja hooków i asercje źródłowe. Aktywny wcześniej General może poprowadzić pierwszą kampanię bez nowego zakupu. Po jego śmierci rekrutacja wymaga dostępnego limitu epoki i wolnych bramek/zasobów; ścieżka celowo czeka, zamiast omijać je.
