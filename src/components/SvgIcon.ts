export class SvgIcon extends (globalThis.HTMLElement || {}) {
  static get observedAttributes() {
    return ["name"];
  }

  public get name(): SvgIconName | null {
    return this.getAttribute("name") as SvgIconName;
  }

  public set name(icon: SvgIconName | null) {
    if (icon !== null) this.setAttribute("name", icon);
  }

  async attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = /*html*/ `
      <svg width="1rem" height="1rem" fill="none" xmlns="http://www.w3.org/2000/svg">
        <use href="${`#${this.name?.replace(/\//g, "\\/")}`}"></use>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "svg-icon": SvgIcon;
  }
}

if ("customElements" in globalThis && !customElements.get("svg-icon")) {
  customElements.define("svg-icon", SvgIcon);
}
