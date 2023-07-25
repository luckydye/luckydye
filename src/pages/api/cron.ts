export async function post({}) {
  console.log("woks?");

  return {
    body: JSON.stringify({
      name: "Astro",
      url: "https://astro.build/",
    }),
  };
}
