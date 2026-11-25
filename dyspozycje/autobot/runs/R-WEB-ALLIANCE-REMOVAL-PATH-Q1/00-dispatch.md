# R-WEB-ALLIANCE-REMOVAL-PATH-Q1 — którą ścieżką znikają sojusze AI↔AI (umowy 1–13 i 1–19 w turze 66, seed 4242)

DOMAIN: GAME (pomiar/instrumentacja) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main b610e71a62f68c5c3052d456facc0deebd86af72. Bez deployu, zero zmian w gra/src i gra/data (instrumentacja tylko w kopii poza repo / w runnerze).

## Kontekst
ALLY66 (rejestr, wpis ALLY66): status relacji „sojusz” zostaje po zniknięciu umowy z activeDeals (syncRelationFromDeals); limit 2 sojuszy działa (maks. 2, 0 naruszeń na seedzie 4242 do t67). NIE ZMIERZONO: dlaczego/kiedy umowy 1–13 i 1–19 zniknęły z activeDeals w t62–66 (4 zinstrumentowane ścieżki usuwania nie zalogowały zdarzenia). Dane: runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane/ (log t67), runs/R-WEB-MEASURE-WARS-4242-VERIFY-Q1/dane/.
## Zadanie
1. W gra/src znajdź WSZYSTKIE miejsca, które usuwają lub zamykają umowę sojuszu w activeDeals (grep: activeDeals + filter/splice/delete/expire/dissolve/breakTreaty/cancel, removeTreaty, zerwanie, wygaśnięcie, wojna, zdrada, ultimatum, rozwiązanie przy przejęciu miasta, cleanup/sync) — lista z plik:linia.
2. Zbuduj bundle z instrumentacją w KOPII drzewa POZA repo (worktree w /tmp, patch logujący każde usunięcie: tura, strony, funkcja, powód; vite --outDir poza repo, wyjątek C-001); bieg ciągły seed 4242 do t67 (runner diplomacy-harder-measure-run.cjs, ~10 min); wyniki: dla każdej utraty sojuszu AI 1 w t62–66 — ścieżka i powód. Jeden Chromium.
3. Klasyfikacja ścieżki: ZGODNA Z REGUŁĄ (np. zerwanie przy wojnie, wygaśnięcie terminu — zacytuj regułę z rejestru/przewodnika) albo ŁAMIE REGUŁĘ/BŁĄD (kandydat R-WEB-* z minimalnym odtworzeniem, bez naprawy w tym temacie) albo NIE ZMIERZONO z powodem. Powiązane pytanie do właściciela (status relacji po zniknięciu umowy, task #103) tylko opisz w raporcie, nie zadawaj.
4. Dokument dyspozycje/analizy/ZNIKANIE-SOJUSZY-AI-2026-11-25.md + dane (log, SHA256) w runs/…/dane/.
## Allowlista
nowe pliki w dyspozycje/analizy/ i runs/R-WEB-ALLIANCE-REMOVAL-PATH-Q1/**, ewentualnie nowy gra/tools/alliance-removal-log.cjs (analizator logu), patch instrumentacji jako plik .patch w runs/…/ (bez zmiany gra/src w repo).
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana gra/src i gra/data w repo, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Jeden Chromium; po pracy zabij WŁASNE procesy po PID i usuń worktree/bundle/logi z /tmp. Dysk >= 4 GB.
## Bramki
tsc 0; logic 213; ai-test 297/0 (kod gry bez zmian w repo). Zacommituj i zwróć SHA.
## Binarne kryterium
Lista wszystkich ścieżek usuwania sojuszu z plik:linia; log utrat sojuszu AI 1 w t62–66 z funkcją i powodem; klasyfikacja ścieżki z regułą; dokument i dane z SHA256; repo bez zmian w gra/src.
