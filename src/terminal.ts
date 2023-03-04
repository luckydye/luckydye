import { initTerminal } from "terminal";

async function init() {
	const term = await initTerminal();
	const ele = term.getTerminal();
	document.body.append(ele);
}

init();
