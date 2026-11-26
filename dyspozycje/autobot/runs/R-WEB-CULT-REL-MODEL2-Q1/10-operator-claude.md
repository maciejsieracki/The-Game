STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza z silnika; zero zmian w gra/src, gra/data, gra/tools)
TEMAT: R-WEB-CULT-REL-MODEL2-Q1 (CULTRELMODEL2, #176)
GOAL: policzyć na prawdziwych funkcjach silnika, jak potwierdzony projekt właściciela (kultura i religia na Szczęście i Prawo; łatwy −10/+10, normalny −15/+5, trudny −20/0 na linię; skala epok ×1,6/×2,3) zmienia Szczęście, Prawo i Porządek miast oraz ile jednostek garnizonu trzeba w mieście obcej kultury i religii; porównać z celem 2/3/4 i opisać efekt na własne miasta i AI.
ZMIANY/COMMIT: nowe pliki (allowlista): dyspozycje/analizy/model-kultura-religia-model2-entry.ts, dyspozycje/analizy/KULTURA-RELIGIA-MODEL2-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/10-operator-claude.md, dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/10-wyniki-silnika.md. Commit: patrz SHA w polu sha wyniku (commit tylko tych plików, bez git add -A).
TESTY (bramka: model uruchamia się; wyniki z surowego wyjścia):
- npx -y esbuild@0.24.0 dyspozycje/analizy/model-kultura-religia-model2-entry.ts --bundle --platform=node --format=cjs: exit 0, bez ostrzeżeń.
- node model2.cjs: exit 0, 515 linii wyniku (zapisane w 10-wyniki-silnika.md, plus sekcja 8 Zamożności: 36 wierszy).
- Kontrola skali: linie kultury i religii w normalnym pop 5 epoka 1 scenariusz a = +5 + +5 = +10 (suma linii); netto Szczęścia po podatkach −5,6 wynosi +4,4 (szMax 33,6); Prawo +10 (prawMax 44,8). Zgodne z wzorem D+(G−D)·udział.
- Kontrola zgodności z dzisiejszym silnikiem (wariant OBECNE, bez zmian): scenariusze b/c/d łatwy/normalny dają 2/1 i 2/1 (neutral/wyjście) — zgodnie z poprzednią analizą KULTURA-RELIGIA-WPLYW-2026-11-26.md.
- tsc: nie dotyczy (zero zmian w src).
BLOKADY: brak blokad technicznych. Nieopracowane elementy: pozostałe linie Szczęścia (luksus, cuda, zaopatrzenie), budynki Prawa (Pałac, Dwór, Trybunał, Sąd), AI i tempo przejęcia kultury — poza modelem (opisane w dokumencie §10).
RUNDY: 1/5
WYNIKI KLUCZOWE (SILNIK, pop 5, epoka 1, obca kultura + obca religia, bez budynków; neutralny / wyjście z buntu skrajnego):
- łatwy: 2 / 2 (dziś 2 / 1) — zgodne z celem 2
- normalny: 3 / 3 (dziś 2 / 1) — zgodne z celem 3
- trudny: brak / 4 (dziś 2 / 1) — cel 4 zgodny tylko dla wyjścia z buntu; neutralny nieosiągalny nawet przy 4 jednostkach
- trudny z budynkiem Garnizon: 3 / 2
- własne miasto bez garnizonu na trudnym: Szczęście 0%, Prawo 0%, Porządek 0% → bunt skrajny, rebelia w turze 4 (dziś Porządek 17%, bez buntu)
- AI: `ai-city-garrison.ts` utrzymuje 1 garnizon na miasto; przy obcej kulturze i religii 1 jednostka daje bunt (rebelia po 4–6 turach zależnie od trudności) — ocena statyczna, NIE ZMIERZONO w grze
- wartości D dające dokładnie 4 jednostki do neutralnego na trudnym: D od −16 do −9 (zamiast −20)
DEPLOY/PUSH: NIE WYKONANO
NASTĘPNY KROK: orkiestrator przekazuje rozpiskę (dokument §1 i §8) właściciela do potwierdzenia; pytania 2–5 z §8 wymagają wyboru wariantu (DECISION_REQUIRED), pytanie 1 (obcięcie Szczęścia od 0%) też. Po potwierdzeniu: #173 (ustawienie) i #174 (implementacja) — zgodnie z modelem.

UWAGI-DLA-ORKIESTRATORA:
- Rozbieżności z dispatchem: szacunki 3/3/4 do neutralnego i 2/3/3 do wyjścia są NIEPOPRAWNE względem silnika (silnik: neutralny 2/3/brak, wyjście 2/3/4). Szczegóły: dokument §9. Dispatch „+40 Szczęścia i +40 Prawa na łatwym” dotyczył unieważnionych granic; po korekcie łatwy = +20/+20.
- DECISION_REQUIRED (jedno zdanie skutku na wariant, wszystkie w dokumencie §8):
  1. Obcięcie Szczęścia od 0%: zostaje — obce miasta w neutralnym wymagają 2/3/brak; usunięte — wymogi rosną (łatwy i normalny nie osiągają neutralnego przy 4 jednostkach).
  2. Trudny, własne miasto bez garnizonu: zostaje — rebelia w turze 4 w epoce 1 i od epoki 2 (Porządek 0%); dodana jednostka Prawa za miasto własne — mniej buntów, zmiana poza tym tematem.
  3. Trudny, D = −20: zostaje — 4 jednostki tylko do wyjścia z buntu; D od −16 do −9 — 4 jednostki do neutralnego (zgodne z celem właściciela).
  4. Łatwy, +20 Prawa dla własnego miasta: zostaje — stabilniejsze miasta na łatwym; mniejsze G na łatwym — mniej stabilne miasta, nadal lepsze niż dziś.
  5. Epoka 3 na trudnym: neutralny nieosiągalny dla obcej kultury i religii — zostaje (ciężkie wejście w epokę 3) lub skala epok na trudnym mniejsza (inne mnożniki niż proporcjonalne).
- Zasada testowania (maksimum): trudny = najwyższy wpływ, główny scenariusz; wszystkie trzy poziomy raportowane. Maksymalny suwak Zamożności (100%) zbadany dla miast własnych i obcych (dokument §5 i sekcja 8 wyników): na trudnym nie zapobiega rebelii w turze 4 bez garnizonu (Porządek 11,5%).
- Zgłoszenie poza zakresem: model nie uwzględnia budynków Prawa stolicy (Pałac +35/45/55) — przy testach stolic należy dodać je osobno.
- Nie wykonano: zmian w grze, wpisów w rejestrach, push, deploy. Commit wyłącznie plików allowlisty.
