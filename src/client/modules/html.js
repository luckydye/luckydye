import Console from "../Console";

export default {
    moduleName: "html",
    commandName: "html",
    install() {},
    run(arguemnts) {
        Console.printHTML(arguemnts[0], arguemnts[1], arguemnts.slice(2).join(" "));
    }
}
