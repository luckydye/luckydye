import Console from './Console.js';

export default {

    modules() {
        for(let [name, module] of Console.getModules()) {
            Console.print(name);
        }  
    },

    async install([ modulePath ]) {
        if(modulePath) {
            const module = await Console.fetchModule(modulePath).catch(err => {
                Console.print("[Error] " + err.message);
            })
            await Console.installModule(module);
        } else {
            Console.print("Provide a module path.");
        }
    },

    async uninstall([ modulePath ]) {
        if(modulePath && modulePath != "") {
            await Console.uninstallModule(modulePath);
        } else {
            Console.print("Provide a module name.");
        }
    },

    clear(args) {
        const terminal = Console.getTerminal();
        terminal.clear();
    },

    help() {
        Console.print(`\nCommands: \n${Object.keys(this).join(", ")}\n`);
    },

    exit(args) {
        return new Promise((resolve) => {
            const terminal = Console.getTerminal();
            terminal.setPrefix("");
            terminal.disableInput();
            terminal.clear();
            Console.print("Bye.");

            terminal.remove();

            setTimeout(() => window.close(), 1000);
        })
    }

}
