const status = document.querySelector('#status');
const stateOutput = document.querySelector('#state');
const createSession = document.querySelector('#create-session');
const advanceTurn = document.querySelector('#advance-turn');
const tauri = window.__TAURI__;

let requestNumber = 0;

function requestId() {
  requestNumber += 1;
  return `desktop-${requestNumber}`;
}

function renderState(state) {
  stateOutput.textContent = JSON.stringify(state, null, 2);
  advanceTurn.disabled = false;
}

async function sendCommand(command) {
  const response = await tauri.core.invoke('engine_command', {
    request: {
      contractVersion: 1,
      requestId: requestId(),
      command,
    },
  });
  renderState(response.result.state);
}

if (!tauri?.core?.invoke || !tauri?.event?.listen) {
  status.textContent = 'Tauri runtime unavailable; open this page from the desktop bundle.';
  createSession.disabled = true;
} else {
  tauri.event.listen('engine_state_changed', (event) => {
    renderState(event.payload.state);
  }).catch((error) => {
    status.textContent = `Event subscription failed: ${error}`;
  });

  createSession.addEventListener('click', async () => {
    try {
      await sendCommand({ kind: 'create_session' });
      status.textContent = 'Rust engine session created.';
    } catch (error) {
      status.textContent = `Create session failed: ${error}`;
    }
  });

  advanceTurn.addEventListener('click', async () => {
    try {
      await sendCommand({ kind: 'advance_turn' });
      status.textContent = 'Rust engine turn advanced.';
    } catch (error) {
      status.textContent = `Advance turn failed: ${error}`;
    }
  });

  status.textContent = 'Rust engine bridge ready.';
}
