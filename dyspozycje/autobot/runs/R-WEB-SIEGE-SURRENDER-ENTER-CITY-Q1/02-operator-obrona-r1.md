STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-SIEGE-SURRENDER-ENTER-CITY-Q1
ROLA: Operator (obrona), baza b4a97ae4b

Zarzut 1 (brak Chromium/integracji): PRZYJMUJE CZESCIOWO. Dodano test zapisu/odczytu (JSON roundtrip, brak nowych pol, idempotencja) -> 32 OK/0 FAIL. Chromium `?civTest=1` i integracja resolveSiegeSurrender nadal NIE_ZMIERZONO (wymaga vite build; wywolanie sprawdzone strukturalnie). Luke akceptuje/wykonuje orkiestrator przed READY_FOR_DEPLOY.
Zarzut 2 (obca/sojusznicza jednostka blokuje): ODRZUCAM jako wade, przyjmuje jako udokumentowane zachowanie. Konserwatywne (brak dep. dyplomacji w module czystym), po kapitulacji nieosiagalne. Dodano test utrwalajacy zachowanie.
Zarzut 3 (tylko oblegaCityId z commitBesiege): ODRZUCAM; doslowna tresc dispatchu, bez zmiany.
Zarzut 4 (2 czerwone regresje): ODRZUCAM jako nie z tego tematu; Evaluator potwierdzil te same wyniki na bazie. Dlug poprzedzajacy.

TESTY: gate-new-test-r2.txt 32 OK/0 FAIL EXIT=0; gate-tsc-r2.txt EXIT=0. node_modules usuniety.
DEPLOY/PUSH: NIE WYKONANO
