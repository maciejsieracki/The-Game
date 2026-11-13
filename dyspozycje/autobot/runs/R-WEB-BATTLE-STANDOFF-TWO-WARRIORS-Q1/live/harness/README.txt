Harness do dowodu na realnej sciezce (Chromium, bundle ROBOCZA z origin/main 4d1916f2c, BEZ budowania w repo).
1) Bundle: plik gra-robocza/Gra-ROBOCZA.html z origin/main wypisany do scratch (komenda show na origin/main:gra-robocza/Gra-ROBOCZA.html).
2) Kopia robocza w scratch, instrumentacja TYLKO obserwacyjna (zadna logika gry nie zmieniona):
   - ',BzA="Hastati"' -> ',BzA="Wojownik"' oraz ',RFM="Lucznik"' -> ',RFM="Wojownik"' (preset ?playtest=walka: Wojownik vs Wojownik)
   - po konstruktorze BattleScene: window.__bs=this ('_startLoop(),U$M(this)}play(' + window.__bs=this)
   - liczniki wywolan _kickoffBattleTurn / _beginTurn do window.__calls
3) node run.cjs <html> <outdir> '{"post":"R","secs":45}'
   (prawdziwe klikniecia myszy: jednostka gracza -> wrog -> preBattle "BITWA"; potem klawisz R albo bez)
Po naprawie: vite bezposrednio (node_modules/vite/bin/vite.js build --outDir <scratch>, poza repo), te same patche instrumentacji.
Chromium: /opt/pw-browsers/chromium, headless, --no-sandbox, swiftshader.
