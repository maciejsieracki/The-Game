STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-DIPLO-CITY-OFFER-REJECT-OWN-COOLDOWN-Q1
GOAL: Odrzucenie oferty miasta za pokój zapisuje klucz `miasto_za_pokoj`, nie `pokoj`; zwykły pokój i oferta miasta nie blokują się cooldownem.
ZMIANY/COMMIT: kod kandydat 38b32dd25 (b8bd14e45 + obrona); raport operatora fc67ff594 (cherry-pick 864c6eccf, bo gałąź obrony go nie zawierała); ten plik.
Diff 2339b3dab..38b32dd25 (kod): main.ts, diplomacy-proposals.ts, diplomacy-rejection-cooldown.ts (poza allowlistą, uzasadnione: typ klucza), nowy test, 02-obrona-r1.md. ai.ts nietknięty. Bez WERSJE.md, bez build/dev.

ZARZUTY:
1. Okablowanie main.ts bez testu -> NAPRAWIONE przez Obronę (test źródłowy 6 miejsc, 2 mutacje main.ts złapane). ODDAL (rozstrzygnięte).
2. Odchylenie allowlisty diplomacy-rejection-cooldown.ts -> ODDAL; orkiestrator odnotowuje przy integracji.
3. Dedup hasPendingNegotiationForPair na 'pokoj' -> ODDAL (poza zakresem, udokumentowane); osobny temat/ABC dla właściciela.
4. Incydent gra/tools/.dip-* -> ODDAL (diff bez usunięć).
5. Ryzyko save/load pola rejectCooldownKey -> ODDAL (zapis negotiationTable.slice(), odczyt push(entry); pole przeżywa).
Zero NAPRAW -> PASS.

TESTY (własne, na 38b32dd25): diplo-city-offer-reject-own-cooldown 28/0; diplomacy-rejection-cooldown 14/0; diplomacy-proposal 190/190; tsc --noEmit exit 0.
NIE_ZMIERZONO przeze mnie: ai-losing-war, ai-war-weariness, ai-test, logic-test (w worktree brak esbuild); ai.ts nietknięty, opieram się na raporcie Operatora (12/0, 90/0, 289/0, 213/213). End-to-end w przeglądarce NIE_ZMIERZONO.
BLOKADY: brak
RUNDY: 2/5 (FC po r1 Operatora + Obrona r1)
NASTĘPNY KROK: integracja orkiestratora (merge fc67ff594+ ten commit), sprawdzić git merge-base --is-ancestor kodu operatora; ABC o dedupie 'pokoj'.
DEPLOY/PUSH: NIE WYKONANO
