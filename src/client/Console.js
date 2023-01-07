import commands from "./Commands.js";
import Terminal from "./Terminal.js";

const terminal = new Terminal();

let modules = new Map();

const MODULE_REGISTRY_ID = "modules";

function getModuleRegistry() {
  let moduleRegistry = localStorage.getItem(MODULE_REGISTRY_ID);
  if (!moduleRegistry) {
    moduleRegistry = '{ "modules": [] }';
  }
  return JSON.parse(moduleRegistry);
}

function saveModuleRegistry(reg) {
  localStorage.setItem(MODULE_REGISTRY_ID, JSON.stringify(reg));
}

let idle = true;

export default class Console {
  static get INPUT_PREFIX() {
    return "luckydye@web:~$ ";
  }

  static async loadModules() {
    const moduleRegistry = getModuleRegistry();
    for (let modulePath of moduleRegistry.modules) {
      const module = await Console.fetchModule(modulePath).catch((err) => {
        Console.print("[Module Error] Module: '" + modulePath + "': " + err.message);
      });
      Console.installModule(module);
    }
  }

  static async evaluateInput(args) {
    function evaluate() {
      const result = eval(args.join(" "));
      if (result) {
        Console.print(result.toString());
      }
    }

    if (args[0] != "") {
      if (commands[args[0]]) {
        idle = false;
        document.title = args[0];
        let exit;
        try {
          exit = await commands[args[0]](args.slice(1));
        } catch (err) {
          document.title = "Terminal";
          throw new Error(err);
        }
        document.title = "Terminal";
        if (exit !== 0 && exit != undefined) {
          Console.print("\nProcess exited.\n");
        }
        terminal.read(this.INPUT_PREFIX);
        idle = true;
      } else {
        try {
          evaluate.call(Console);
        } catch (err) {
          console.error(err);
          Console.print("\n[Error] " + err.message);
        }
      }
    }
  }

  static getModules() {
    return modules;
  }

  static async fetchModule(path) {
    const raw = await fetch(path).then((res) => res.text());
    const base64 = "data:application/javascript;base64," + btoa(raw);
    const module = await fetchModule(base64);
    module.origin = path;

    // register module in localstorage
    let registry = getModuleRegistry();
    if (registry.modules.indexOf(module.origin) === -1) {
      registry.modules.push(module.origin);
    }
    saveModuleRegistry(registry);

    return module;
  }

  static async installModule(module) {
    const name = module.moduleName || module.origin;
    if (modules.get(name)) {
      Console.log(`[Module] Module '${name}' already installed.`);
      return;
    }
    try {
      if (module.install) {
        modules.set(name, module);
        await module.install(Console);

        Console.log(`[Module] Installed module '${name}'`);

        if (module.commandName) {
          commands[module.commandName] = module.run;
        }
      } else {
        throw new Error(`Missing install method in module: ${name}`);
      }
    } catch (err) {
      Console.log("[Error] " + err.message);
    }
  }

  static uninstallModule(moduleName) {
    const module = modules.get(moduleName);
    if (module) {
      modules.delete(moduleName);
      module.uninstall();
      if (module.commandName) {
        commands[module.commandName] = null;
      }

      // nuregister
      let moduleRegistry = getModuleRegistry();
      moduleRegistry.modules.splice(moduleRegistry.modules.indexOf(module.origin), 1);
      saveModuleRegistry(moduleRegistry);

      Console.print(`[Module] Uninstalled module '${moduleName}'`);
    } else {
      Console.print("Module not found.");
    }
  }

  static getTerminal() {
    return terminal;
  }

  static async simulateWrite(str, ms = 24) {
    return new Promise((resolve) => {
      terminal.disableInput();

      const time = ms;

      let index = 0;
      const int = setInterval(() => {
        const curr = str[index];

        terminal.write(curr);

        index++;

        if (index == str.length) {
          clearInterval(int);
          resolve();
        }
      }, time);
    });
  }

  static print(str) {
    if (typeof str == "object") {
      str = JSON.stringify(str, null, "\t");
    }
    const lines = str.split("\n");
    for (let line of lines) {
      terminal.write(line);
      terminal.write("\n");
    }
  }

  static async readLine(prefix = "") {
    const value = await terminal.read(prefix);
    return value;
  }

  static log(...str) {
    const ts = `${new Date().toGMTString()}: `;
    return this.print(str.join(" "));
  }

  static printHTML(width, height, content) {
    this.print(`\\\\\\HTML ${width} ${height} ${content}`);
  }

  static sleep(time) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), time);
    });
  }

  static clear() {
    terminal.clear();
  }
}
