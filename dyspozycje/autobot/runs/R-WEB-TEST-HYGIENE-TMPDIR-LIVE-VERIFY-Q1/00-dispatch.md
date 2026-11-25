# R-WEB-TEST-HYGIENE-TMPDIR-LIVE-VERIFY-Q1 — próbna weryfikacja testów live po zmianie nazw plików tymczasowych (FALA main 29f7ba81a)

DOMAIN: INFRA (testy live) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main ca19244c196277a139dfc87aedd90d914dd7d41b. Bez deployu, zero zmian w gra/src i gra/data.

## Kontekst
Temat R-WEB-TEST-HYGIENE-TMPDIR-UNIQUE-Q1 (rejestr, wpis TMPDIR) zmienił 97 plików gra/tools/*.cjs na unikalne nazwy plików tymczasowych (helper gra/tools/_tmp-unique.cjs, TMPDIR_RUN_ID wspólny rodzic/dziecko). NIE ZMIERZONO: 78–79 testów live (Chromium) po zmianie, pełny bieg pary producent–konsument (ai-economy-measure-run + ai-economy-measure-hook-test), skala wycieku nowych katalogów w tmpdir. Trzy sim/measure kończą się timeoutem (ai-army-replacement-sim, ai-economy-measure-upkeep-onoff, weary40-sim-measure). Ręczne osobne uruchomienia pary wymagają wspólnego TMPDIR_RUN_ID albo --dist/--profile. Harness Chromium ma teraz ponawianie startu ze slotu (FALA main 1688d38e1).
## Zadanie
1. Zbuduj bundle POZA repo (vite --outDir w /tmp/<unikalny>, wyjątek C-001) i uruchom po JEDNYM reprezentancie na typ testu live (zapis/wczytanie, bitwa, mapa/generator, diplomacja, ekonomia, UI/panel), po jednym Chromium naraz, solo, z limitem 10 min; wypisz które i dlaczego wybrane. Wynik surowy + exit; porównaj z baseline sprzed zmiany (git stash nie — użyj worktree origin/main~ przed merge TMPDIR: commit 180d518b1) tylko dla testów, które padną.
2. Pełny bieg pary ai-economy-measure-run.cjs → ai-economy-measure-hook-test.cjs (wspólne TMPDIR_RUN_ID / --dist --profile): dowód, że konsument widzi plik producenta (wyjście obu).
3. Zmierz skalę wycieku: liczba i rozmiar katalogów tworzonych w os.tmpdir() przez jeden bieg reprezentanta; zaproponuj (w raporcie) i — jeśli mieści się w allowliście — dodaj sprzątanie po sobie tylko tam, gdzie nie psuje pary producent–konsument.
4. Naprawiaj wyłącznie nazwy/ścieżki tmp w testach, które padły z powodu zmiany; asercji nie osłabiaj; inne przyczyny → klasyfikacja STARY-PIN/HARNESS/BŁĄD-GRY/NIE-ZMIERZONO z dowodem (git log -S zawężony do gra/src gra/data gra/tools). Trzy sim/measure z timeoutem: zmierz czas na 25 min w tle (setsid nohup timeout 1500 … i czekaj Monitor/until-pętlą) albo NIE-ZMIERZONO z konkretnym powodem.
Paczki, commit po każdej. ZAKAZ statusu BLOCK bez blokady technicznej.
## Allowlista
gra/tools/*.cjs, w których test live padł z powodu nazw tmp (tylko nazwy/ścieżki), gra/tools/_tmp-unique.cjs, dyspozycje/autobot/runs/R-WEB-TEST-HYGIENE-TMPDIR-LIVE-VERIFY-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash (długie testy tylko setsid nohup w pierwszym planie wg pkt 4). Jeden Chromium naraz; po pracy zabij WŁASNE procesy chrome/node (po PID własnych poleceń, nie pkill po nazwie), usuń bundle, logi, node_modules z /tmp. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0; bramki-tmpdir-unikalnosc-test PASS (0 trafień). Zacommituj i zwróć SHA.
## Binarne kryterium
Tabela reprezentantów live: wynik + werdykt; para producent–konsument dowiedziona pełnym biegiem lub NIE-ZMIERZONO z powodem; skala wycieku podana liczbami; poprawki tylko nazw/ścieżek; bramki zielone.
