import Console from "../Console";

export default {
    moduleName: "echo",
    commandName: "echo",
    install() {},
    run(arguemnts) {
        Console.print(arguemnts.join(" "));
    }
}