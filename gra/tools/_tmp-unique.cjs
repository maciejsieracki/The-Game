'use strict';
/**
 * _tmp-unique.cjs — wspolny identyfikator przebiegu dla nazw plikow tymczasowych w testach.
 *
 * PO CO: stala nazwa pod os.tmpdir() (np. `ai-economy-dist`) koliduje przy rownoleglych
 * przebiegach (bramka: bramki-tmpdir-unikalnosc-test.cjs). Zamiast tego nazwa dostaje sufiks
 * TMPDIR_RUN_ID: unikalny per proces (pid + losowy ciag). Dzieci uruchomione przez
 * child_process dziedzicza zmienna srodowiskowa, wiec para producent-konsument
 * uruchomiona w jednym przebiegu uzgadnia ta sama nazwe bez dodatkowych argumentow.
 *
 * Konsument uruchomiony RECZNIE, osobno od producenta, musi dostac ta sama wartosc:
 *   TMPDIR_RUN_ID=<wartosc z producenta> node tools/konsument.cjs
 * albo przekazac sciezke argumentem (np. --dist=...), jak wczesniej.
 */
const crypto = require('crypto');

if (!process.env.TMPDIR_RUN_ID) {
  process.env.TMPDIR_RUN_ID = `${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
}
const TMPDIR_RUN_ID = process.env.TMPDIR_RUN_ID;

module.exports = { TMPDIR_RUN_ID };
