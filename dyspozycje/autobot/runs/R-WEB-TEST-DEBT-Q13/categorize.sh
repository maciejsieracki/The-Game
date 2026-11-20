#!/bin/bash
# R-WEB-TEST-DEBT-Q13 r3: kategoryzacja pierwszej linii FAIL po scaleniu z main (wejscie: res-final.txt = exit|plik|ostatnia linia|pierwszy FAIL)
# Kategorie: E = timeout (exit 124) po ponowieniu; A = fixture/harness (ReferenceError, Build failed, brak ROBOCZA_HTML/--dist/--gra, SKIP, brak katalogu/PRE-tree);
#            X = wymaga analizy (B stary pin / D kandydat bledu gry) - NIE ROZSTRZYGNIETE w tej rundzie; P = PASS (exit 0)
# usage: categorize.sh <res-final.txt>
while IFS='|' read -r ec name last first; do
  if [ "$ec" = "0" ]; then cat="P"
  elif [ "$ec" = "124" ]; then cat="E"
  elif echo "$first $last" | grep -qE 'ReferenceError|Build failed|ROBOCZA_HTML|--dist|Brak katalogu|podaj --gra|SKIP:|BUILD/RUNTIME|AMBUSH_BASE_GRA|PRE-tree|is not defined|Ustaw ROBOCZA|installCivTestHooks'; then cat="A"
  else cat="X"; fi
  printf '%s|%s|%s|%s\n' "$cat" "$ec" "$name" "$(printf '%s' "$first" | cut -c1-140)"
done < "$1"
