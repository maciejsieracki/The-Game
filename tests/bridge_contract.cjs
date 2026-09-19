#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repository = path.resolve(__dirname, '..');
const manifest = path.join(repository, 'rust-port', 'engine', 'Cargo.toml');
const target = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-engine-bridge-'));
const dependencyDirectory = path.join(target, 'debug', 'deps');
const testBinary = path.join(target, 'bridge-contract-tests');
const cleanupPaths = new Set([target]);
const engineLock = path.join(repository, 'rust-port', 'engine', 'Cargo.lock');
const hadEngineLock = fs.existsSync(engineLock);

function cleanup() {
  for (const directory of cleanupPaths) {
    fs.rmSync(directory, { force: true, recursive: true });
  }
  if (!hadEngineLock) {
    fs.rmSync(engineLock, { force: true });
  }
}

process.on('exit', cleanup);

function run(program, args, options = {}) {
  const result = spawnSync(program, args, {
    cwd: repository,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: options.stdio ?? 'inherit',
    timeout: options.timeout ?? 1_200_000,
  });
  assert.equal(result.error, undefined, `${program} ${args.join(' ')} could not start`);
  assert.equal(result.status, 0, `${program} ${args.join(' ')} failed`);
}

function runExpectedFailure(program, args, options = {}) {
  const result = spawnSync(program, args, {
    cwd: repository,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: 'pipe',
    timeout: options.timeout ?? 1_200_000,
  });
  assert.equal(result.error, undefined, `${program} ${args.join(' ')} could not start`);
  assert.notEqual(result.status, null, `${program} ${args.join(' ')} timed out`);
  assert.notEqual(result.status, 0, `${program} ${args.join(' ')} unexpectedly passed`);
  assert.ok(
    `${result.stdout}\n${result.stderr}`.trim().length > 0,
    `${program} ${args.join(' ')} failed without diagnostics`,
  );
  return result;
}

function artifact(prefix, suffix) {
  const matches = fs
    .readdirSync(dependencyDirectory)
    .filter((name) => name.startsWith(prefix) && name.endsWith(suffix));
  assert.equal(matches.length, 1, `expected one ${prefix}*${suffix}, found ${matches.length}`);
  return path.join(dependencyDirectory, matches[0]);
}

const shell = fs.readFileSync(path.join(repository, 'src-tauri', 'src', 'lib.rs'), 'utf8');
const bridge = fs.readFileSync(
  path.join(repository, 'rust-port', 'engine', 'src', 'bridge.rs'),
  'utf8',
);
const frontend = fs.readFileSync(
  path.join(repository, 'src-tauri', 'frontend', 'index.html'),
  'utf8',
);
const frontendScript = fs.readFileSync(
  path.join(repository, 'src-tauri', 'frontend', 'main.js'),
  'utf8',
);
assert.match(bridge, /pub const TAURI_COMMAND: &str = "engine_command"/);
assert.match(bridge, /pub const EVENT_STATE_CHANGED: &str = "engine_state_changed"/);
assert.match(shell, /#\[tauri::command\]/);
assert.match(shell, /fn engine_command/);
assert.doesNotMatch(shell, /pub fn engine_command/);
assert.match(shell, /generate_handler!\[engine_command\]/);
assert.match(shell, /app\.emit\(event\.channel\(\), event\)/);
for (const id of ['start-new-game', 'more-button', 'continue-game', 'load-game', 'about-game', 'settings-button', 'exit-game']) {
  assert.match(frontend, new RegExp(`id=["']${id}["']`), `menu control ${id} is missing`);
}
assert.match(frontend, /id=["']continue-game["'][^>]*disabled/);
assert.match(frontend, /id=["']load-game["'][^>]*disabled/);
assert.match(frontend, /Więcej/);
assert.match(frontend, /Wczytaj grę/);
assert.match(frontend, /O grze/);
assert.match(frontend, /Wyjdź/);
assert.match(frontendScript, /buildStartGameParams/);
assert.match(frontendScript, /typSwiata/);
assert.match(frontendScript, /worldDensity/);
assert.match(frontendScript, /selectedAiCivIds/);
assert.match(frontendScript, /unsupportedFeatures/);
assert.match(frontendScript, /getWizardParams/);

const TAURI_INTEGRATION_TEST = String.raw`

#[cfg(test)]
mod bridge_shell_integration {
    use std::sync::{Arc, Mutex};

    use serde_json::json;
    use tauri::Listener;

    use super::{bridge::*, configure};

    #[test]
    fn registered_command_returns_and_emits_through_mock_shell() {
        let app = configure(tauri::test::mock_builder())
            .build(tauri::test::mock_context(tauri::test::noop_assets()))
            .expect("mock Tauri app builds");
        let event_payload = Arc::new(Mutex::new(None));
        let event_payload_for_listener = Arc::clone(&event_payload);
        app.listen(EVENT_STATE_CHANGED, move |event| {
            *event_payload_for_listener.lock().expect("event mutex") =
                Some(event.payload().to_owned());
        });

        let webview = tauri::WebviewWindowBuilder::new(&app, "main", Default::default())
            .build()
            .expect("mock webview builds");
        let request = tauri::webview::InvokeRequest {
            cmd: TAURI_COMMAND.to_owned(),
            callback: tauri::ipc::CallbackFn(0),
            error: tauri::ipc::CallbackFn(1),
            url: "tauri://localhost".parse().expect("valid test URL"),
            body: tauri::ipc::InvokeBody::Json(json!({
                "request": serde_json::to_value(BridgeRequest::new(
                    "req-1",
                    EngineCommand::AddPlayer {
                        id: 7,
                        name: "Ada".to_owned(),
                    },
                )).expect("request serializes"),
            })),
            headers: Default::default(),
            invoke_key: tauri::test::INVOKE_KEY.to_owned(),
        };

        let response = tauri::test::get_ipc_response(&webview, request)
            .expect("registered command returns a response")
            .deserialize::<serde_json::Value>()
            .expect("response JSON");
        assert_eq!(response["requestId"], "req-1");
        let players = response["result"]["state"]["players"]
            .as_array()
            .expect("players array");
        assert!(players.iter().any(|player| player["name"] == "Ada"));

        let event = event_payload
            .lock()
            .expect("event mutex")
            .clone()
            .expect("registered command emits state event");
        let event: serde_json::Value = serde_json::from_str(&event).expect("event JSON");
        assert_eq!(event["contractVersion"], CONTRACT_VERSION);
        assert_eq!(event["requestId"], "req-1");
        assert_eq!(event["kind"], "state_changed");
    }
}
`;

function createTauriProbe(source) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'the-game-bridge-contract-tauri-'));
  cleanupPaths.add(root);
  const srcTauri = path.join(root, 'src-tauri');
  const src = path.join(srcTauri, 'src');
  fs.mkdirSync(src, { recursive: true });
  fs.symlinkSync(path.join(repository, 'rust-port'), path.join(root, 'rust-port'), 'dir');
  fs.writeFileSync(path.join(src, 'lib.rs'), `${source}${TAURI_INTEGRATION_TEST}`);
  fs.writeFileSync(
    path.join(srcTauri, 'Cargo.toml'),
    `[package]
name = "rustreal22-tauri-probe"
version = "0.1.0"
edition = "2021"

[lib]
path = "src/lib.rs"

[dependencies]
civ-engine = { package = "civ-engine", path = "../rust-port/engine" }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tauri = { version = "=2.11.5", features = ["test"] }

[build-dependencies]
tauri-build = "=2.6.3"
`,
  );
  fs.writeFileSync(path.join(srcTauri, 'build.rs'), 'fn main() { tauri_build::build(); }\n');
  fs.writeFileSync(
    path.join(srcTauri, 'tauri.conf.json'),
    JSON.stringify(
      {
        $schema: 'https://schema.tauri.app/config/2',
        productName: 'RustReal22Probe',
        version: '0.1.0',
        identifier: 'com.example.rustreal22probe',
        build: { frontendDist: '.' },
        app: { windows: [] },
        bundle: { icon: [] },
      },
      null,
      2,
    ),
  );
  const iconDirectory = path.join(srcTauri, 'icons');
  fs.mkdirSync(iconDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(iconDirectory, 'icon.png'),
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==',
      'base64',
    ),
  );
  return {
    manifest: path.join(srcTauri, 'Cargo.toml'),
    source: path.join(src, 'lib.rs'),
    target: path.join(root, 'cargo-target'),
  };
}

function runTauriProbe(probe) {
  const cargoArgs = [
    'test',
    '--manifest-path',
    probe.manifest,
    '--offline',
    '--target-dir',
    probe.target,
    '-j',
    '1',
  ];
  run('cargo', cargoArgs, { env: { CARGO_INCREMENTAL: '0' } });

  const original = fs.readFileSync(probe.source, 'utf8');

  const publicMutation = original.replace(
    'fn engine_command<R: Runtime>(',
    'pub fn engine_command<R: Runtime>(',
  );
  assert.notEqual(publicMutation, original, 'public-command mutation did not change the probe');
  fs.writeFileSync(probe.source, publicMutation);
  const publicFailure = runExpectedFailure('cargo', cargoArgs, {
    env: { CARGO_INCREMENTAL: '0' },
  });
  assert.match(
    `${publicFailure.stdout}\n${publicFailure.stderr}`,
    /E0255|duplicate definitions|__cmd__engine_command/,
    'public command mutation failed without the expected Tauri duplicate-symbol diagnostic',
  );
  fs.writeFileSync(probe.source, original);

  const eventMutation = original.replace(
    'app.emit(event.channel(), event)',
    'let _ = event.channel()',
  );
  assert.notEqual(eventMutation, original, 'event mutation did not change the probe');
  fs.writeFileSync(probe.source, eventMutation);
  runExpectedFailure('cargo', cargoArgs, { env: { CARGO_INCREMENTAL: '0' } });
  fs.writeFileSync(probe.source, original);

  const registrationMutation = original.replace(
    '        .invoke_handler(tauri::generate_handler![engine_command])\n',
    '',
  );
  assert.notEqual(
    registrationMutation,
    original,
    'registration mutation did not change the probe',
  );
  fs.writeFileSync(probe.source, registrationMutation);
  runExpectedFailure('cargo', cargoArgs, { env: { CARGO_INCREMENTAL: '0' } });
  fs.writeFileSync(probe.source, original);
}

// Build the allowlisted playable integration target in an isolated directory,
// then compile and run the bridge contract directly because the repository has
// no root Cargo workspace and the test is intentionally outside the manifest.
run('cargo', [
  'test',
  '--manifest-path',
  manifest,
  '--test',
  'playable_slice',
  '--offline',
  '--no-run',
  '--target-dir',
  target,
]);

run('rustc', [
  '--edition',
  '2021',
  '-D',
  'warnings',
  '--test',
  path.join(repository, 'tests', 'bridge_contract.rs'),
  '--extern',
  `civ_engine=${artifact('libciv_engine-', '.rlib')}`,
  '--extern',
  `serde=${artifact('libserde-', '.rlib')}`,
  '--extern',
  `serde_json=${artifact('libserde_json-', '.rlib')}`,
  '-L',
  `dependency=${dependencyDirectory}`,
  '-o',
  testBinary,
]);
run(testBinary, []);
run(process.execPath, [path.join(repository, 'tests', 'frontend_contract.cjs')]);
const tauriProbe = createTauriProbe(shell);
try {
  runTauriProbe(tauriProbe);
  console.log('tauri shell behavioral probe: PASS (registration/event mutation controls)');
} finally {
  cleanup();
}
console.log('bridge contract tests: PASS');
