const BORDER_PADDING = [0, 0];
const CURSOR_OFFSET = [1, 0];
const FONT_SIZE = 14;
const FONT_FAMILY = "monospace";
const FONT_WEIGHT = 200;
const FONT_COLOR = "#333";
const SLECTION_COLOR = "#333";
const SHADOW_BLUR = 0;
const CURSOR_HEIGHT = 16;
const CURSOR_WIDTH = 6;
const VALID_CHARS = ` ~{}@=<>^abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()[]-.,_:;#+'*/&%$§!?€1234567890"`;
const LINE_PADDING = 3;

let LINE_WRAPPING = true;
let CHAR_WIDTH = 7.69;
let CHAR_HEIGHT = 12;

let canvas, context;
let buffer = ["Terminal Version 1.0", "(c) 2020 luckydye. All rights reserved.", ""];
let hiddenBuffer = [];
let cursor = [buffer[buffer.length - 1].length, buffer.length - 1];
let view = [0, 0];
let selection = [
	[0, 0],
	[0, 0],
];
let prefix = "";
let inputEnabled = true;
let hideOutput = false;
let history = localStorage.history ? JSON.parse(localStorage.history) : [];
let historyCursor = -1;

const htmlElements = {};

class SubmitEvent extends Event {
	constructor(value) {
		super("submit");
		this.value = value;
	}
}

class ShortcutEvent extends Event {
	get defaultPrevented() {
		return this._defaultPrevented;
	}

	set defaultPrevented(v) {
		this._defaultPrevented = v;
	}

	constructor(key) {
		super("shortcut");
		this.key = key;
		this._defaultPrevented = false;
	}
}

export default class Terminal extends HTMLElement {
	get hideOutput() {
		return hideOutput;
	}

	set hideOutput(v) {
		hideOutput = v;
	}

	get inputEnabled() {
		return inputEnabled;
	}

	set inputEnabled(v) {
		inputEnabled = v;
	}

	get prefix() {
		return prefix;
	}

	set prefix(v) {
		prefix = v;
	}

	get cursor() {
		return cursor;
	}

	get width() {
		return canvas.width / globalThis.devicePixelRatio;
	}

	get height() {
		return canvas.height / globalThis.devicePixelRatio;
	}

	focus() {
		canvas.focus();
	}

	constructor() {
		super();

		this.bounds = { x: 0, y: 0 };

		canvas = document.createElement("canvas");
		canvas.tabIndex = 0;
		context = canvas.getContext("2d");

		window.addEventListener("resize", (e) => {
			this.reformat();
		});

		window.addEventListener("wheel", (e) => {
			const dir = Math.sign(e.deltaY) * 2;

			const cursorY = this.getCursorPosition()[1];
			const maxY = Math.max(0, cursorY - (this.height - this.lineHeight * 3));

			view[1] = Math.max(0, Math.min(maxY, view[1] + dir * this.lineHeight));
		});

		this.addEventListener("keydown", (e) => {
			this.handleInput(e);
		});

		// mouse selections
		let mouseStart = [0, 0];

		const setSelection = (index, px, py) => {
			const pos = this.pixelToBufferPos(px + view[0], py + view[1]);
			selection[index][0] = pos[0];
			selection[index][1] = pos[1];
		};

		const mouseDown = (e) => {
			if (!this.bounds) return;

			let x = e.clientX - this.bounds.x;
			let y = e.clientY - this.bounds.y;

			if (e.button === 0) {
				mouseStart[0] = x;
				mouseStart[1] = y;

				setSelection(0, x, y);
				setSelection(1, x, y);
				window.addEventListener("mousemove", mouseMove);
			}
		};

		const mouseUp = (e) => {
			if (!this.bounds) return;

			let x = e.clientX - this.bounds.x;
			let y = e.clientY - this.bounds.y;

			if (e.button === 0) {
				let index = 1;
				if (mouseStart[1] > y) {
					index = 0;
				}
				setSelection(index, x, y);
				window.removeEventListener("mousemove", mouseMove);
			}
		};

		const mouseMove = (e) => {
			if (!this.bounds) return;

			let x = e.clientX - this.bounds.x;
			let y = e.clientY - this.bounds.y;

			let index = 1;
			if (mouseStart[1] > y) {
				index = 0;
			}
			setSelection(index, x, y);
		};

		window.addEventListener("mousedown", mouseDown);
		window.addEventListener("mouseup", mouseUp);

		this.addEventListener("contextmenu", (e) => {
			const txt = this.getSelectionFromBuffer(selection);
			navigator.clipboard.writeText(txt);
			this.resetSelection();
			e.preventDefault();
		});

		this.attachShadow({ mode: "open" });
	}

	resetSelection() {
		selection = [
			[0, 0],
			[0, 0],
		];
	}

	getSelectionFromBuffer(selection) {
		let copiedLines = [];

		const startLine = selection[0][1];
		const lines = selection[1][1] - selection[0][1];
		const start = selection[0];
		const end = selection[1];

		for (let line = 0; line <= lines; line++) {
			let a = line > 0 && lines > 0 ? 0 : start[0];
			let b = line === lines ? end[0] : undefined;

			const txt = buffer[startLine + line].slice(a, b);
			copiedLines.push(txt);
		}

		return copiedLines.join("\n");
	}

	pixelToBufferPos(x, y) {
		return [
			Math.floor((x - BORDER_PADDING[0]) / CHAR_WIDTH),
			Math.floor((y - BORDER_PADDING[1]) / this.lineHeight),
		];
	}

	getContext() {
		return context;
	}

	init() {
		const style = document.createElement("style");
		style.innerHTML = `
					:host {
							display: block;
							width: 100%;
							height: 100%;
							overflow: hidden;
					}
					:host(:focus) {
							z-index: 1000000;
							opacity: 1;
							pointer-events: all;
					}
					canvas {
							filter: contrast(1.1) blur(.33px);
							outline: none;
					}
					.inline-element {
							position: absolute;
							top: calc(var(--elementY) * 1px - var(--scrollY) * 1px);
							left: calc(var(--elementX) * 1px);
							height: calc(var(--elementHeight) * 1px);
							width: calc(var(--elementWidth) * 1px);
							display: block;
							overflow: hidden;
							color: #eee;
							font-family: monospace;
							user-select: none;
					}
					.inline-element + * {
							display: inline;
					}
					a[href] {
						color: inherit;
					}
        `;
		this.shadowRoot.appendChild(style);
		this.shadowRoot.appendChild(canvas);

		this.loop();
	}

	connectedCallback() {
		if (!canvas.parentNode) {
			this.init();
		}
		this.reformat();
	}

	append(index, line) {
		const temp = buffer.slice(0, index);
		temp.push(line);
		temp.push(...buffer.slice(index));

		if (cursor[1] >= index) {
			cursor[1]++;
		}

		this.setBuffer(temp);
	}

	setBuffer(newBuffer) {
		buffer = newBuffer;
	}

	clear() {
		buffer = [""];
		for (let ele in htmlElements) {
			htmlElements[ele].remove();
		}
		this.setCursor(0, 0);
	}

	setCursor(x, y) {
		cursor[0] = x != null ? x : cursor[0];
		cursor[1] = y != null ? y : cursor[1];
	}

	setPrefix(str = "") {
		this.prefix = str;
	}

	disableInput() {
		this.inputEnabled = false;
	}

	enableInput() {
		this.inputEnabled = true;
	}

	disableLineWrapping() {
		LINE_WRAPPING = false;
	}

	enableLineWrapping() {
		LINE_WRAPPING = true;
	}

	handleSubmit(line) {
		if (hideOutput) {
			line = hiddenBuffer.join("");
			hideOutput = false;
		} else {
			line = line.slice(this.prefix.length);
		}
		this.pushToHistory(line);
		this.dispatchEvent(new SubmitEvent(line));
	}

	pushToHistory(input) {
		if (input == history[0]) {
			return;
		}
		if (input != "") {
			history.unshift(input);
		}
		historyCursor = -1;
		localStorage.history = JSON.stringify(history);
	}

	cancelInput() {
		buffer[cursor[1]] = this.prefix;
		this.setCursor(buffer[cursor[1]].length);
	}

	replaceInput(str) {
		this.cancelInput();
		this.write(str);
	}

	read(newPrefix) {
		return new Promise((resolve) => {
			const currLine = buffer[buffer.length - 1];
			this.inputEnabled = true;
			this.prefix = newPrefix || currLine;
			if (newPrefix && currLine !== newPrefix) {
				this.write(newPrefix);
			}

			const submitCallback = (e) => {
				resolve(e.value);
				this.removeEventListener("submit", submitCallback);
			};
			this.addEventListener("submit", submitCallback);
		});
	}

	newline() {
		const newLine = "";
		const currLine = buffer[buffer.length - 1];
		buffer.push(newLine);
		cursor[0] = newLine.length;
		cursor[1]++;
		return currLine;
	}

	write(str) {
		switch (str) {
			case "\0":
				// nothing (sleep)
				break;
			case "\r":
				const currLine = this.newline();
				this.handleSubmit(currLine);
				break;
			case "\n":
				this.newline();
				break;
			default:
				const temp = buffer[cursor[1]].split("").slice(0, cursor[0]);

				if (hideOutput) {
					hiddenBuffer.push(str);
					temp.push(...new Array(str.length).fill("*"));
				} else {
					temp.push(str);
				}

				const tail = buffer[cursor[1]].split("").slice(cursor[0]);
				temp.push(...tail);
				buffer[cursor[1]] = temp.join("");
				cursor[0] += str.length;
		}

		this.autoScroll();
	}

	handleInput(e) {
		let key = e.key;
		const shift = e.shiftKey;
		const ctrl = e.ctrlKey;

		if (inputEnabled) {
			if (key == "Enter") {
				this.write("\r");
			}
			if (key == "ArrowUp") {
				historyCursor = Math.min(historyCursor + 1, history.length - 1);
				if (history[historyCursor]) {
					this.replaceInput(history[historyCursor]);
				}
			}
			if (key == "ArrowDown") {
				historyCursor = Math.max(historyCursor - 1, 0);
				if (history[historyCursor]) {
					this.replaceInput(history[historyCursor]);
				}
			}
			if (key == "ArrowLeft") {
				cursor[0] = Math.max(cursor[0] - 1, Math.max(prefix.length, 0));
			}
			if (key == "ArrowRight") {
				cursor[0] = Math.min(cursor[0] + 1, buffer[buffer.length - 1].length);
			}
			if (key == "Escape") {
				this.cancelInput();
			}
			if (key == "End") {
				cursor[0] = buffer[buffer.length - 1].length;
			}
			if (key == "Home") {
				cursor[0] = Math.max(prefix.length, 0);
			}
			if (key == "Backspace") {
				if (cursor[0] > 0 && cursor[0] > prefix.length) {
					const temp = buffer[buffer.length - 1].split("").slice(0, cursor[0] - 1);
					const tail = buffer[buffer.length - 1].split("").slice(cursor[0]);
					temp.push(...tail);
					buffer[buffer.length - 1] = temp.join("");
					cursor[0]--;
				}
			}
			if (key == "Delete") {
				const temp = buffer[buffer.length - 1].split("").slice(0, cursor[0]);
				const tail = buffer[buffer.length - 1].split("").slice(cursor[0] + 1);
				temp.push(...tail);
				buffer[buffer.length - 1] = temp.join("");
			}

			if (VALID_CHARS.indexOf(key) != -1 && !ctrl) {
				this.write(key);
			}
		}

		if (ctrl) {
			const ev = new ShortcutEvent(key);
			const canceled = this.dispatchEvent(ev);

			e.preventDefault();
			e.stopPropagation();

			if (!ev.defaultPrevented) {
				if (VALID_CHARS.indexOf(key) != -1) {
					this.dispatchEvent(new SubmitEvent("^" + key));
				}
			}
		}

		e.preventDefault();
		e.stopPropagation();
	}

	reformat() {
		canvas.width = this.clientWidth * globalThis.devicePixelRatio;
		canvas.height = this.clientHeight * globalThis.devicePixelRatio;
		canvas.style.width = `${this.clientWidth}px`;

		this.autoScroll();

		this.bounds = this.getClientRects()[0];
	}

	autoScroll() {
		const cursorY = this.getCursorPosition()[1];
		view[1] = Math.max(0, cursorY - (this.height - this.lineHeight * 3));
	}

	draw(context) {
		context.resetTransform();
		context.scale(globalThis.devicePixelRatio, globalThis.devicePixelRatio);

		context.globalCompositeOperation = "normal";
		context.fillStyle = "#fff";
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);

		if (canvas.width <= 0) return;

		context.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`;
		context.textAlign = "left";
		context.textBaseline = "top";

		const text = context.measureText("M");
		CHAR_WIDTH = text.width;

		context.shadowColor = FONT_COLOR;
		context.shadowBlur = SHADOW_BLUR;

		context.fillStyle = FONT_COLOR;

		this.drawBuffer();

		if (this.inputEnabled) {
			this.drawCursor();
		}
		this.drawSelection();

		context.shadowColor = "none";
		context.shadowBlur = 0;

		this.style.setProperty("--scrollY", view[1]);
	}

	drawCursor() {
		const ts = Date.now() / 500;

		if (ts % 2 > 1) {
			const pos = this.getCursorPosition();

			context.fillStyle = FONT_COLOR;
			context.fillRect(pos[0], pos[1] - view[1], CURSOR_WIDTH, CURSOR_HEIGHT);
		}
	}

	bufferToPixelPos(x, y) {
		return [
			x * CHAR_WIDTH + BORDER_PADDING[0] - view[0],
			y * this.lineHeight + BORDER_PADDING[1] - view[1],
		];
	}

	drawSelection() {
		const start = this.bufferToPixelPos(...selection[0]);
		const end = this.bufferToPixelPos(...selection[1]);

		context.globalCompositeOperation = "difference";
		context.shadowColor = "";
		context.shadowBlur = 0;

		const lines = selection[1][1] - selection[0][1];

		for (let i = 0; i <= lines; i++) {
			let x = 0;
			const y = start[1] + this.lineHeight * i;

			let width = CHAR_WIDTH;

			const xDiff = end[0] - start[0];

			if (lines === i) {
				width = xDiff + start[0];
			} else {
				width = canvas.width;
			}

			if (i === 0) {
				x = start[0];

				if (lines === i) {
					width = xDiff;
				}
			}

			context.fillStyle = SLECTION_COLOR;
			context.fillRect(x, y, width, this.lineHeight);
		}

		context.globalCompositeOperation = "";
	}

	getMaxBufferWidth() {
		return canvas.width - BORDER_PADDING[0] * 2;
	}

	get lineHeight() {
		return CHAR_HEIGHT + LINE_PADDING;
	}

	getCursorPosition() {
		const max_line_px_length = this.getMaxBufferWidth();

		let posY = 0;
		for (let i = 0; i < cursor[1]; i++) {
			const line = buffer[i];

			const html = this.parseHTMLLine(line);
			if (html) {
				posY += html.height / this.lineHeight;
			} else {
				const text = context.measureText(line);
				if (max_line_px_length - text.width < 0 && LINE_WRAPPING) {
					const parts = sliceLine(line, max_line_px_length / CHAR_WIDTH);
					for (let part of parts) {
						posY++;
					}
				} else {
					posY++;
				}
			}
		}

		const x = BORDER_PADDING[0] + cursor[0] * CHAR_WIDTH;
		const y =
			BORDER_PADDING[1] +
			posY * CHAR_HEIGHT +
			posY * LINE_PADDING +
			CHAR_HEIGHT / 2 -
			CURSOR_HEIGHT / 2;

		return [x + CURSOR_OFFSET[0], y + CURSOR_OFFSET[1]];
	}

	parseHTMLLine(line) {
		if (line.slice(0, 7) == "\\\\\\HTML") {
			const htmlMeta = line.slice(7).split(" ").slice(0, 3).join(" ");
			const [nul, width, height] = htmlMeta.split(" ").map((v) => +v);

			return {
				content: line.slice(7 + htmlMeta.length),
				width,
				height: Math.round(height / this.lineHeight) * this.lineHeight,
			};
		}
	}

	drawBuffer() {
		const max_line_px_length = this.getMaxBufferWidth();

		let x = BORDER_PADDING[0];
		let y = BORDER_PADDING[1] - view[1];

		const drawLine = (line, index) => {
			context.fillText(line, x, y);
			y += CHAR_HEIGHT + LINE_PADDING;
		};

		let index = -1;
		for (let line of buffer) {
			index++;

			const html = this.parseHTMLLine(line);
			if (html) {
				if (!htmlElements[index]) {
					htmlElements[index] = document.createElement("div");
					const ele = htmlElements[index];
					ele.className = "inline-element";
					ele.style.setProperty("--elementY", y + view[1]);
					ele.style.setProperty("--elementX", x);
					ele.style.setProperty("--elementWidth", html.width);
					ele.style.setProperty("--elementHeight", html.height);
					ele.innerHTML = html.content || "";
					this.shadowRoot.appendChild(ele);
				}
				y += html.height;
			} else {
				const text = context.measureText(line);
				if (max_line_px_length - text.width < 0 && LINE_WRAPPING) {
					const parts = sliceLine(line, max_line_px_length / CHAR_WIDTH);
					for (let part of parts) {
						drawLine(part);
					}
				} else {
					drawLine(line);
				}
			}
		}
	}

	loop() {
		this.draw(context);
		setTimeout(this.loop.bind(this), 1000 / 60);
	}
}

function sliceLine(line, maxLength) {
	if (maxLength < 0) {
		return [];
	}

	const parts = [];

	line = line.split("");

	while (line.length > maxLength) {
		const temp = line.splice(0, maxLength);
		parts.push(temp.join(""));
	}
	parts.push(line.join(""));

	return parts;
}

customElements.define("gyro-terminal", Terminal);
