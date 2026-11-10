STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1
GOAL: Ekran wyboru epoki w żywym Chromium, pin main=edb8fb56.
RUNDY: 1/5 (2 zarzuty niskiej wagi — niedokładny mechanizm blokady w opisie, brak dowodu dla kliknięcia
— Obrona dodała poprawny mechanizm (`epochHasCivs`) i dump DOM+3 dodatkowe zrzuty, Final Control ODDAL)

ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-4-EPOCH-SELECTION.md`, zrzut główny + 3 zrzuty probe w
`runs/.../`.

3 epoki (Kamienia 8 cyw., Brązu 14, Żelaza 15 — kumulacyjnie wg `epokaWejscia` w `civs.json`), wszystkie
odblokowane. Blokada w kodzie zależy od `epochHasCivs(e.id)`, nie od nieużywanego pola `avail`.
Potwierdzone interaktywnie: klik Brązu → zaznaczenie zmienia się → "Dalej" → "Wybór Cywilizacji".

**ZNALEZISKO OPERACYJNE (do uwagi na przyszłość):** Obrona przy sprzątaniu procesów omyłkowo ubiła
proces dev-servera należący do RÓWNOLEGLE działającego tematu P1.7 (PID z innej powłoki sesji,
`p1-7-iso`) — zbyt szerokie dopasowanie przy `pkill`/szukaniu procesu vite. Do sprawdzenia przy
zamknięciu P1.7, czy to spowodowało realny problem w tamtym temacie.

BLOKADY: brak dla tego tematu. 404 w konsoli odłożony do P1.16 (tak jak w P1.3).
NASTĘPNY KROK: integracja orkiestratora. **Dopisać do przyszłych dispatchy przeglądarkowych: ubijać
TYLKO proces o PID zapisanym przez SIEBIE (nie przez wzorzec nazwy/portu ogólny), żeby uniknąć
kolizji między równoległymi tematami.**
DEPLOY/PUSH: NIE WYKONANO
