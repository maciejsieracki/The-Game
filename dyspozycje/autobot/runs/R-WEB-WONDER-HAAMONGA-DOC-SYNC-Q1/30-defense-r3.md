# Obrona runda 3 — R-WEB-WONDER-HAAMONGA-DOC-SYNC-Q1

STATUS: **PASS**
DOMAIN: **GAME**
TEMAT: `R-WEB-WONDER-HAAMONGA-DOC-SYNC-Q1`
GOAL: Usunąć nieobsługiwane twierdzenie o wpływie Ha'amonga z dokumentacji gracza i wygenerowanego bundle.
ZMIANY/COMMIT: Tylko ten raport obrony; bez zmian źródła ani commita.
TESTY: Read-only inspekcja rozszerzonego diffu, dokumentów gracza, bundle, JSON i runtime TypeScript; `git diff --check` dla plików tematu.
BLOKADY: Brak dla sprzeciwu Evaluatora. Wartość `dyplomacja_wpływ: 3` pozostaje w JSON, ale nie jest używana przez runtime.
RUNDY: 3/5
NASTĘPNY KROK: Niezależny Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Ponowny przegląd sprzeciwu

Runda 3 rozszerzyła allowlistę o wyłącznie akapit Ha'amonga w
`docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md` oraz wygenerowany rekord tego
rozdziału w `wikiBundle`. Zmieniono ten akapit przez usunięcie `+3 Wpływu
(cywilizacja)`; tabela katalogu nadal prawidłowo podaje +3 kultury i +3 żywności
na każde miasto.

Porównałem sekcję `### Kamień Ha'amonga` ze źródła poradnika z sekcją tego samego
rozdziału w `gra/src/data/wikiBundle.json`: są identyczne. Ani ta sekcja, ani
hasło `cuda/hamonga` w źródle encyklopedii i bundle nie zawierają `Wpływu` lub
`dyplomacja_wpływ`. Przeszukanie odniesień do Ha'amonga w plikach Markdown pod
`docs/` nie znalazło dodatkowego aktywnego twierdzenia o Wpływie; pozostałe
trafienia są nazwami, linkami, wzmianką o epoce/Żegludze, historią albo
prawidłowym opisem miejskich plonów.

`gra/data/wonders.json` nadal przechowuje wartość `dyplomacja_wpływ: 3`, zgodnie
z zakresem rundy 3. Wyszukiwanie w `gra/src` znajduje ten identyfikator tylko w
komentarzu `wonders-data.ts`; nie ma konsumenta runtime. Inertny profil `_meta`
pozostaje `kultura, morze`.

## Potwierdzenie efektów

- `bonusy.miasto` w JSON to `{ kultura: 3, zywnosc: 3 }`; agregator dodaje te
  wartości bez mnożenia do każdego miasta właściciela. Źródłowa encyklopedia i
  jej rekord bundle mówią o +3 kulturze i +3 żywności na turę dla każdego miasta
  właściciela; tabela katalogu podaje równoważny efekt.
- Bonus handlu to `handel_procent`, `cel: handel_morski`, `wartosc: 0.15`.
  Runtime ogranicza go do tras morskich i stosuje do dochodu z tras; źródła i
  bundle opisują +15% dochodu z morskich tras handlowych.
- Wartości mechaniczne JSON nie zostały zmienione w tej korekcie. `+3 Wpływu`
  nie jest już przedstawiane jako aktywny efekt w player-facing docs ani w
  odpowiednich rekordach wikiBundle.

## Kontrole

- Poradnik: sekcja Ha'amonga źródło↔bundle identyczna; nie zawiera aktywnego
  twierdzenia o Wpływie; +15% morskiego handlu zachowane.
- Encyklopedia: źródło↔bundle pokazuje +3 kultury, +3 żywności i +15% morskiego
  handlu; brak twierdzenia o Wpływie.
- Przegląd trafień Ha'amonga w `docs/**/*.md`: poza wymienionymi aktywnymi,
  prawidłowymi efektami brak innych opisów bonusów Ha'amonga.
- `rg -n 'dyplomacja_wpływ' gra/src --glob '*.ts'`: jedno trafienie, komentarz
  w `wonders-data.ts`; brak konsumenta runtime.
- `git diff --check` dla źródeł dokumentacji, JSON i bundle: **PASS**.
- Bez testów produktu, edycji źródeł w ramach obrony, commita, przeglądarki i
  deployu.

Wynik dotyczy bieżącego rozszerzonego diffu rundy 3. Poprzedni werdykt
`30-defense.md` pozostaje historyczny i nie został nadpisany.
