# AutoBot runs — kanoniczny ślad obiegu

Każdy nowy temat ma własny katalog `runs/<pełne-ID>/` i dokładnie pięć etapów:

`00-dispatch.md` → `01-operator.md` → `02-evaluator.md` →
`03-final-control.md` → `04-integration.md`.

Wszystkie pliki runu używają tego samego pełnego ID. Przy `FAIL`, technicznym `BLOCK`,
`TIMEOUT`, `INFRA`, `ZWIS` lub braku gotowości dopisz rundę/korektę w tym samym
katalogu; nie twórz nowego ID. Raporty z `logs/` są historią legacy, nie zastępują runu.

`04-integration.md` może oznaczyć `READY_FOR_DEPLOY` dopiero po faktycznej integracji.
Deploy/push zapisuje się osobno i wymaga autoryzacji właściciela.

Wzorzec zakończonej paczki dokumentacyjnej:
[`R-PROC-AUTOBOT-PAKIETY-1-3-Q1/`](R-PROC-AUTOBOT-PAKIETY-1-3-Q1/).
