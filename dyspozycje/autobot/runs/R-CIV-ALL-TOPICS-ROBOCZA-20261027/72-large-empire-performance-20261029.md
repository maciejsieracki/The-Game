# Test dużego imperium po publikacji — 2026-10-29

**Wynik: FAIL bramki 60 s/turę; test przerwał się po 39/100 tur. Wydajność dużego imperium pozostaje otwarta.**

Scenariusz uruchomiono po publikacji na źródłach z `main` `16cc4d5137c57e88254e237f9dfc6a7f9fb23236`, w Chromium i czystym buildzie harnessu: 137 miast (40 gracza, sześć głównych AI po 15 miast oraz siedmiu małych właścicieli), 180 ulepszeń terenów, 5 budynków na miasto. Mapa rosła organicznie podczas normalnych tur AI. Komenda:

```sh
timeout --signal=TERM --kill-after=30 5400s env STRESS_COMPACT=1 STRESS_EOT_TIMEOUT_MS=120000 STRESS_EVALUATE_TIMEOUT_MS=120000 node tools/perf-large-empire-stress-live-test.cjs 100
```

Tura świata 39→40 zakończyła się w 60,611 ms, przekraczając bramkę o 611 ms. Harness zakończył test zgodnie z polityką przy pierwszej turze powyżej 60 s; żadna z 39 tur nie przekroczyła limitu timeoutu 120 s. Brak błędów JavaScript i błędów yield. Zapis ma 426 ostrzeżeń. Najwyższa próbka pamięci JS wyniosła ok. 642 MiB przy turze 20; próbka przy zatrzymaniu wynosiła ok. 452 MiB — nie ma trendu monotonicznego, ale to nie mierzy całkowitego RSS/GPU.

Średnie czasy faz w 39 turach: `runWorldEndTurn_total` 26.46 s; `runAiPhase` 13.51 s; `autosave_async` 9.97 s; `city_economy_phase` 5.03 s; `scanAutoSiegesAfterAiTurn` 3.99 s; `recomputeTradeRoutesNow` 2.33 s. Maksima: AI 28.77 s, autosave 19.42 s, ekonomia 10.36 s, skan oblężeń 17.41 s. Fazy są pomiarami instrumentacji i nie należy ich sumować jako rozłącznych składników. To wskazuje na wiele kosztownych ścieżek; ten test nie izoluje pojedynczego winowajcy.

Raw JSON: `evidence/perf-final-20261029/summary.json`, SHA-256 `12531adf51de1cf18995209dc0a296ca9d9ebd444ae9a707e25ce7b3726575c6`.

Porównanie: wcześniejszy 100-turowy run na starszym źródle osiągnął maksimum 58.139 s. Obecny przebieg nie potwierdza poprawy: jego pierwsze 30 tur miały średnio 25.792 / 35.609 / 33.918 s na kolejne bloki dziesięciu; potem nastąpił skok do 60.611 s. Potrzebny jest osobny profil tury 39 oraz optymalizacja skanów oblężeń/AI/autosave/ekonomii, po czym pełny rerun 100 tur. Nie zmieniano produktu w trakcie testu; wdrożone poprawki pozostają na `main` i w ROBOCZEJ.
