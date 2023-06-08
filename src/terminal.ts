import { initTerminal } from "terminal";

async function init() {
  const term = await initTerminal();
  const ele = term.getTerminal();
  const root = document.getElementById("terminal");
  if (root) root.append(ele);
}

init();
