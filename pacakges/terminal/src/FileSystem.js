import Console from "./Console";

const fs = {
    children: [
        {
            name: "File.png",
            type: "file",
        },
        {
            name: "Tests",
            type: "directory",
            children: [
                {
                    name: "TestFile.jpg",
                    type: "file",
                },
                {
                    name: "TestText.txt",
                    type: "file",
                },
                {
                    name: "Tests2",
                    type: "directory",
                    children: [
                        {
                            name: "TestFile2.jpg",
                            type: "file",
                        },
                        {
                            name: "TestText2.txt",
                            type: "file",
                        }
                    ]
                }
            ]
        }
    ]
};
let cd = "/";

export default class FileSystem {

    static getDirByName(cdir, name) {
        for(let child of cdir.children) {
            if(child.type == "directory" && child.name == name) {
                return child;
            }
        }
    }

    static getDirByPath(path) {
        const findChild = (root, name) => {
            for(let child of root.children) {
                if(child.type == "directory" && child.name == name) {
                    return child;
                }
            }
        }

        let curr = fs;
        let dirpath = path.split("/").filter(p => p != "").reverse();

        while(dirpath.length > 0) {
            curr = findChild(curr, dirpath[dirpath.length-1]);
            if(!curr) {
                break;
            } else {
                dirpath.pop();
            }
        }

        return curr;
    }

    static changeDir(relatievPath) {
        let newDir = cd + relatievPath + "/";
        if(relatievPath == "..") {
            newDir = cd.split("/").splice(0, cd.split("/").length - 2).join("/");
        }
        const dir = this.getDirByPath(newDir);
        if(dir) {
            cd = newDir;
        } else {
            Console.print('Directory not found.');
        }
    }

    static get modules() {
        return [
            {
                moduleName: "ls",
                commandName: "ls",
                install() {},
                run: (arguemnts) => {
                    Console.print("");
                    Console.print(cd);
                    Console.print("--------------------------------------");
                    for(let child of this.getDirByPath(cd).children) {
                        Console.print(`${child.type.padEnd(15, " ")} ${child.name}`);
                    }
                    Console.print("");
                }
            },
            {
                moduleName: "cd",
                commandName: "cd",
                install() {},
                run: (args) => {
                    if(args[0] != "") {
                        this.changeDir(args[0]);
                    }
                    Console.print(cd);
                }
            }
        ]
    }

}