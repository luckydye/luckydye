let Console;

function download(url) {
    if(url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = url;
        a.click();
    }
}

function parseSearchParams(str) {
    const res = {};
    str.substring(1).split("&").map(item => item.split("=")).forEach(item => {
        res[item[0]] = unescape(item[1]);
    });
    return res;
}

async function parseLink(link) {
    const url = new URL(link);
    let service = url.host;
    console.log(service);
    switch (service) {
        case "clips.twitch.tv":
            const slug = url.pathname.split("/")[1];
            const reqBody = {
                query: `{
                    clip(slug: "${slug}") {
                        broadcaster {
                            displayName
                        }
                        createdAt
                        curator {
                            displayName
                            id
                        }
                        durationSeconds
                        id
                        tiny: thumbnailURL(width: 86, height: 45)
                        small: thumbnailURL(width: 260, height: 147)
                        medium: thumbnailURL(width: 480, height: 272)
                        title
                        videoQualities {
                            frameRate
                            quality
                            sourceURL
                        }
                        viewCount
                    }
                }`
            };
            return fetch('https://gql.twitch.tv/gql', {
                method: 'POST',
                headers: {
                    'Client-ID': "kimne78kx3ncx6brgo4mv6wki5h1ko"
                },
                body: JSON.stringify(reqBody)
            }).then(res => res.json()).then(json => {
                const clip = json.data.clip;

                return {
                    service,
                    source: clip.videoQualities[0].sourceURL
                }
            });
            break;
        // case "www.youtube.com":
        //     const video_id = parseSearchParams(url.search).v;
        //     return fetch(link).then(res => res.text()).then(txt => {
        //         console.log(txt);
        //     })
        //     break;
    }
    return null;
}

export default class DownloadModule extends ConsoleModule {

    static get moduleName() {
        return "dl-module";
    }

    static get commandName() {
        return "dl";
    }

    static install(cnsl) {
        Console = cnsl;
    }

    static async run(args) {
        const link = args[0];
        if (!link) {
            return Console.print("Provide a video link.");
        }

        const parsed = await parseLink(link);
        if (parsed) {
            download(parsed.source);
            Console.print(parsed);
        } else {
            Console.print("Not a valid video url.");
        }
    }

}