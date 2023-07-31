
const url = process.env.API_URL;

function fetchCMS(collection: string) {
  return fetch(`${url}/${collection}`).then(res => res.json());
}

export async function getExamples() {
  return fetchCMS('examples').then(res => res.docs);
}
