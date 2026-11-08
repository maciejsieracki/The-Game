# Integracja i deploy — R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1

**STATUS: PASS-WITH-NOTES**
**DOMAIN: GAME**
**TEMAT:** `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1`
**GOAL:** zużyte lub pominięte ID nie zostają w kolejce i nie blokują następnych rozkazów.
**INTEGRACJA:** kod produktu commit `96d088b4` na lokalnym `main`, baza przed zmianą `c0724801`.
**TESTY:** Chromium 15/15; pełna kolejka 28/28, stan końcowy queue=0, 8 zmienionych pozycji; pointerowy rozkaz `atk27` wykonany raz; probe pomijania martwego ID PASS; TypeScript, node syntax, diff-check, bundle smoke i manifest verifier PASS.
**FINAL CONTROL:** PASS-WITH-NOTES, etap 8; raport `43-integrated-main-final-control.md`.
**DEPLOY:** lokalne bund­le `gra-robocza/Gra-ROBOCZA.html` i `Gra-ROBOCZA-POLE-BITWY.html` zbudowane z `gra/src`, opatrzone/zweryfikowane; main bundle MD5 `2f15bd3b3ef6b3732cee4007f8c49cda`, SHA-256 `2c6e0e446af65e6d76d6e09f378801fe69f3614391489f4d418bac90bad336b7`, 70,045,250 B; battle bundle MD5 `daf66e2423e0f550db70ee41d8cdf12f`, SHA-256 `ecf1e42a8ec6eeaddca66a86596c34614199f101b253c73c98e266ca16fde4ec`, 57,380,299 B. `SMOKE OK`; `VERIFY OK`.
**BLOKADY:** brak dla integracji; 60-sekundowy ślad nie potwierdził drugiego ruchu. To nie dowodzi, że overlap nie może zajść w żadnej innej sytuacji.
**RUNDY:** 2/5
**NASTĘPNY KROK:** commit artefaktów Roboczej i dokumentacji, push `main`, zdalny odczyt hashów i aktualizacja etapu do 11.
**DEPLOY/PUSH:** deploy bundle wykonany lokalnie; push i zdalny readback jeszcze niewykonane.

## Push/readback — etap 11

`git push origin main` zakończył się powodzeniem. `git ls-remote` zwrócił release commit `87aa8678427109b9a109aea7797ca3c171cfd84f`. Pinned GitHub Raw SHA-256 dla main bundle (`2c6e0e44…`) oraz standalone battle bundle (`ecf1e42a…`) zgadza się z lokalnymi artefaktami; manifest zdalny zwraca MD5 `2f15bd3b…` i rozmiar `70,045,250 B`. Raport i rejestr aktualizują etap do 11/11.
