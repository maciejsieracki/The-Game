# Evaluator — R-WEB-WONDER-HAAMONGA-DOC-SYNC-Q1

Wynik: **FAIL** · Evaluator: LunaHigh · 2026-11-10

## Podstawa

- Dispatch i operator receipt: `00-dispatch.md`, `01-operator-receipt.md`.
- Zweryfikowany stan repo: `HEAD == origin/main == b477ecb70196f18d28857e112e25860e710600a6`; WERSJE zawiera FALA 607.
- FALA 597 `d0f08d184` jest w historii. `git show d0f08d184` potwierdza wcześniejsze usunięcie `bonusy.teren` (`lowie_rybackie`, `laka`). Bieżący diff Ha'amonga nie odtwarza ani nie powtarza tej poprawki.

## Kontrole

- **PASS — plony miejskie:** `wonders.json` ma `bonusy.miasto` `{ kultura: 3, zywnosc: 3 }`. `sumWonderCityYieldsForOwner` dodaje te wartości bez mnożenia, a komentarz wskazuje, że caller dodaje sumę do każdego miasta właściciela. `bonus_miasto_mnoznik=3` jest historycznym opisem, nie kolejnym mnożnikiem.
- **PASS — handel morski:** dane zachowują `handel_procent`, `cel: handel_morski`, `wartosc: 0.15`; `sumWonderTradeRouteBonusForOwner` wybiera ten efekt dla tras `morze`. Komentarz `trade-routes.ts` określa jego zakres jako dochód z tras, nie Daninę.
- **FAIL — +3 Wpływu jako efekt runtime:** JSON zachowuje wpis `dyplomacja_wpływ: 3`, ale wyszukiwanie całego `gra/src` nie znajduje konsumenta tego typu poza komentarzem w `wonders-data.ts`. Aktualna implementacja agreguje plony miejskie i procent handlu, lecz nie stosuje dyplomatycznego Wpływu. Zdanie w poprawionym haśle „Imperium dostaje też … +3 Wpływu” przedstawia wartość danych jako działający efekt i nie spełnia kryterium zgodności runtime. To jest jedyny merytoryczny sprzeciw.
- **PASS — inertna etykieta:** brak odwołań TypeScript do `cuda_wyscigowe_epoka`; `profil` jest tylko etykietą w `_meta`. Usunięcie słowa „rybołówstwo” z profilu nie zmienia zachowania gry.
- **PASS — zakres i FALA 597:** wybrane diffy zawierają tylko korektę zdania dokumentacji, zmianę `_meta...profil` oraz wygenerowany bundle. Nie ma nowej zmiany w bonusach mechanicznych ani duplikatu poprawki `d0f08d184`.
- **PASS — bundle kanoniczny:** uruchomienie `node gra/tools/bundle-wiki-for-game.cjs` pozostawiło SHA-256 bundle bez zmian (`1aeea5d42e13e6bda40f622c4585faa8555c4ab5d27f1a68ebf0a2c200161a37` przed i po). Wygenerowane `cuda/hamonga.wikiM` odpowiada plikowi źródłowemu i nie zawiera starego zdania „×3 plony w mieście wzniesienia”.
- **PASS — kontrola diffu:** `git diff --check` dla trzech plików docelowych przechodzi.

## Sprzeciw

Przed zamknięciem zadania trzeba usunąć z hasła twierdzenie o działającym `+3 Wpływu` albo dostarczyć dowód istniejącego konsumenta runtime. W bieżącym zakresie dokumentacyjnym nie wprowadzałem zmian źródłowych ani mechaniki. Zmiany innych procesów w checkoutcie, w tym battle-loot i recruit-all, pozostają poza oceną; nie uruchamiałem przeglądarki ani builda produktu.
