import "./ConsoleModule.js";
import Console from "./Console.js";
import FileSystem from "./FileSystem.js";
import EchoModule from "./modules/echo.js";

async function startSequence() {
	return new Promise(async (resolve) => {
		Console.clear();

		// [![Twitch](/TwitchGlitchPurple.png)](https://www.twitch.tv/luckydye)
		// [![Twitter](/2021-Twitter-logo-blue.png)](https://twitter.com/timh4v)
		// [![Github](/github-mark-white.png)](https://github.com/luckydye)
		// [![Instagram](/instagram.png)](https://www.instagram.com/luckydye/)

		// await Console.printHTML(
		// 	400,
		// 	24,
		// 	`<a href="https://www.twitch.tv/luckydye" target="_blank">Twitch</a>`
		// );
		// await Console.printHTML(
		// 	400,
		// 	24,
		// 	`<a href="https://twitter.com/timh4v" target="_blank">Twitter</a>`
		// );
		// await Console.printHTML(
		// 	400,
		// 	24,
		// 	`<a href="https://github.com/luckydye" target="_blank">Github</a>`
		// );
		// await Console.printHTML(
		// 	400,
		// 	24,
		// 	`<a href="https://www.instagram.com/luckydye/" target="_blank">Instagram</a>`
		// );

		// await Console.print("");
		// await Console.print("");

		setTimeout(() => {
			resolve();
		}, 100);
	});
}

async function sleep(seconds = 1) {
	return new Promise((resolve) => {
		setTimeout(() => resolve(), 1000 * seconds);
	});
}

export async function initTerminal(prefix) {
	const nativeModules = [EchoModule, ...FileSystem.modules];

	const terminal = Console.getTerminal();
	terminal.clear();
	terminal.disableInput();

	setTimeout(async () => {
		const terminal = Console.getTerminal();

		await startSequence();

		for (let modulePath of nativeModules) {
			let module = modulePath;
			if (typeof module === "string") {
				module = await Console.fetchModule(modulePath).catch((err) => {
					Console.log("[Error] " + err.message);
				});
			}
			await Console.installModule(module);
		}

		await Console.loadModules();

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

		Console.INPUT_PREFIX = prefix;

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
