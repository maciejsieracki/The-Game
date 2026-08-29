STATUS: PASS
DOMAIN: GAME
TEMAT: R-BADANIA-KOSZT-PODWOJENIE-Q1 / RUNDA 1/5
MODEL+EFFORT: Sonnet 5, effort=medium (Workflow, Ścieżka A)
GOAL: Podwoić „Koszt nauki" w gra/data/tech.json dla 28 technologii, 4 wymienione bez zmian, brak innych zmian.

ZMIANY/COMMIT: branch `autobot/R-BADANIA-KOSZT-PODWOJENIE-Q1`, SHA `ebfec876` (po rebase orkiestratora na aktualny `origin/main`: patrz 02-evaluator.md).

TESTY (skrypt weryfikacyjny pozycja-po-pozycji, wszystkie 32 technologie — wklejony surowy output):
```
Obróbka drewna: stary=5 nowy=5
Garncarstwo: stary=20 nowy=40
Murarstwo: stary=28 nowy=56
Rolnictwo: stary=5 nowy=5
Łowiectwo: stary=5 nowy=5
Łucznictwo: stary=28 nowy=56
Oswojenie zwierząt: stary=5 nowy=5
Mistycyzm: stary=20 nowy=40
Wymiana: stary=32 nowy=64
Gospodarka wodna: stary=36 nowy=72
Koło: stary=44 nowy=88
Brązownictwo: stary=90 nowy=180
Żegluga: stary=80 nowy=160
Pismo: stary=90 nowy=180
Religia: stary=96 nowy=192
Jeździectwo: stary=112 nowy=224
Wojskowość: stary=104 nowy=208
Matematyka: stary=136 nowy=272
Handel: stary=148 nowy=296
Kodeks: stary=124 nowy=248
Budownictwo: stary=170 nowy=340
Waluta: stary=200 nowy=400
Astronomia: stary=220 nowy=440
Hutnictwo żelaza: stary=240 nowy=480
Inżynieria: stary=260 nowy=520
Oblężnictwo: stary=280 nowy=560
Filozofia: stary=300 nowy=600
Prawo: stary=310 nowy=620
Drogi brukowane: stary=340 nowy=680
Medycyna: stary=324 nowy=648
Obróbka żelaza: stary=370 nowy=740
Sztuka wojenna: stary=400 nowy=800
```

Bramki (z katalogu gra/): tsc --noEmit EXIT 0 · logic-test 213/213 · tech-tree-test 19/0 ·
research-test 33/33 (fixture syntetyczna, niezależna od tech.json — wynik niezmieniony) ·
unit-replace-test 13/13 · combat-test 6/6.

BLOKADY: brak.
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
