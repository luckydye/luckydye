export default class Process {

    constructor() {
        this.worker = new Worker('./Process.js', { type: 'module' });
    }

    forceQuit() {

    }

    close() {

    }

}