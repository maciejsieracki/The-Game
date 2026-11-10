# R-WEB-WONDER-HAAMONGA-DOC-SYNC-Q1 — dispatch

Data: 2026-11-10 · Operator: LunaHigh

## Cel

Doprowadzić encyklopedyjny opis Kamienia Ha'amonga do prawdy danych i runtime po FALA 597. Zmiany wyłącznie dokumentacyjne: poprawić mylące „×3 plony w mieście wzniesienia” w `docs/encyklopedia/cuda/hamonga.md`, a informacyjny profil `rybołówstwo` w `_meta.cuda_wyscigowe_epoka` usunąć, jeśli potwierdzisz, że runtime go nie czyta. Nie zmieniać balansu ani zachowania cudów.

## Stan bazowy

Obowiązkowo sprawdź `origin/main`, `HEAD` i istniejący wpis FALA597 / FALA 607. FALA597 (`d0f08d184`, już obecna na bazie) usunęła martwe bonusy `bonusy.teren` Ha'amonga (`lowie_rybackie`, `laka`). Nie powtarzaj tej poprawki. Użyj tego ID; jeśli istnieje już osobny ID dokumentacji, zachowaj istniejący.

## Zakres

- `docs/encyklopedia/cuda/hamonga.md`
- `gra/data/wonders.json` wyłącznie informacyjny profil w `_meta.cuda_wyscigowe_epoka.2.profil`, po potwierdzeniu braku konsumenta runtime
- `gra/src/data/wikiBundle.json` tylko przez kanoniczny generator, jeśli zmieni się dokumentacja
- ten katalog runu: dispatch i operator receipt

Bez zmian w katalogach ściągawki/rejestru globalnego, balansie, implementacji runtime, testach, deployu i commicie.

## Kryterium prawdy

`gra/data/wonders.json` definiuje Ha'amonga jako `bonusy.miasto: { kultura: 3, zywnosc: 3 }` oraz `bonusy.specjalne`: +15% handlu morskiego i +3 wpływu. `wonders-data.ts` agreguje miejskie plony flat dla każdego miasta właściciela; `bonus_miasto_mnoznik=3` dokumentuje historyczne skalowanie, nie kolejny mnożnik. Po FALA597 nie ma bonusu terenowego Ha'amonga. Profil `_meta` wolno poprawić wyłącznie jako inertną etykietę, jeśli wyszukiwanie runtime potwierdzi brak odczytu.

## Raport

Zapisz podstawę/model, bazowe SHA, dowody inspekcji JSON/runtime, wynik przeglądu konsumentów profilu, wykonane zmiany i rzeczywiste kontrole w `01-operator-receipt.md`. Jeśli profil okaże się używany albo dokument nie będzie jednoznacznie przestarzały, zostaw dane i wskaż decyzję zamiast zgadywać. Regeneruj wyłącznie wikiBundle kanonicznym skryptem po zmianach docs.

## Runda 2 — odpowiedź na Evaluator FAIL (2026-11-10)

Evaluator wskazał jeden zasadny błąd: mimo że `wonders.json` nadal zawiera informacyjny wpis `dyplomacja_wpływ: 3`, w aktualnym `gra/src` brak runtime konsumenta tego typu (poza komentarzem). Nie przedstawiaj tej wartości jako działającego efektu.

Korekta ograniczona do dokumentacji: usuń `+3 Wpływu` z opisu aktywnych efektów w `docs/encyklopedia/cuda/hamonga.md`; pozostaw wpis danych i wcześniejszą zmianę inertnego `_meta...profil` bez zmian. Zachowaj efekty potwierdzone runtime: +3 kultury i +3 żywności do każdego miasta właściciela oraz +15% dochodu z morskich tras handlowych. Następnie regeneruj wikiBundle kanonicznym skryptem i zapisz dowody / kontrole w `21-operator-response.md`. Bez zmian mechaniki, wartości bonusów, tagu metadanych, commitów i deployu.

## Runda 3 — korekta residualnego opisu w katalogu (2026-11-10)

Obrona wykryła pozostałe, niezaimplementowane twierdzenie `+3 Wpływu` w `docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md` przy Ha'amonga oraz jego kopię w wygenerowanym bundle. Rozszerz zakres jawnie wyłącznie na akapit/wiersz Ha'amonga w tym pliku i odpowiadający rozdział `91-katalog-cudow-antyk` w `gra/src/data/wikiBundle.json`. Usuń z akapitu wyłącznie `+3 Wpływu (cywilizacja)`; zostaw dane bonusu nietknięte. Przeszukaj player-facing docs pod kątem dalszych twierdzeń o aktywnym Wpływie Ha'amonga, nie koryguj ani nie przepisuj cudów innych niż Ha'amonga. Wygeneruj bundle kanonicznym skryptem, porównaj sekcję Ha'amonga źródło↔bundle i zapisz wynik w addendum do raportu operatora. Inertna zmiana `_meta...profil` z poprzednich rund pozostaje bez zmian.
