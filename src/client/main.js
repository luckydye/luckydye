import "./ConsoleModule.js";
import Console from "./Console.js";
import EchoModule from "./modules/echo.js";
import HTMLModule from "./modules/html.js";

async function startSequence() {}

async function sleep(seconds = 1) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000 * seconds);
  });
}

async function initTerminal() {
  const nativeModules = [EchoModule, HTMLModule];

  const terminal = Console.getTerminal();
  terminal.clear();
  terminal.disableInput();

  setTimeout(async () => {
    const terminal = Console.getTerminal();

    await startSequence();

    await Console.simulateWrite("Initializing...\n\n");
    await sleep();

    await Console.log("Loading modules\n");
    await sleep(0.5);
    for (let modulePath of nativeModules) {
      let module = modulePath;
      if (typeof module === "string") {
        module = await Console.fetchModule(modulePath).catch((err) => {
          Console.log("[Error] " + err.message);
        });
      }
      await Console.installModule(module);
      await sleep(0.05);
    }

    await Console.loadModules();
    Console.print("");

    terminal.addEventListener("shortcut", (e) => {
      if (e.key == "r") {
        location.reload();
      } else if (e.key == "v") {
        navigator.clipboard.readText().then((txt) => {
          terminal.write(txt);
        });
        e.defaultPrevented = true;
      }
    });

    while (true) {
      const value = await terminal.read(Console.INPUT_PREFIX);
      const args = value.split(" ");
      await Console.evaluateInput(args).catch((err) => {
        console.error(err);
        Console.print(`\n[Internal Error]: ${err.message}\n`);
      });
    }
  }, 50);

  return Console;
}

window.createTerminal = async () => {
  return await initTerminal();
};
