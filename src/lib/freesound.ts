export type FreesoundResult = {
  id: number;
  name: string;
  url: string;
  previews: { "preview-hq-mp3": string };
  duration: number;
  license: string;
};

type FreesoundSearchResponse = {
  results: FreesoundResult[];
  count: number;
};

const BASE_URL = "https://freesound.org/apiv2";

export async function searchSounds(
  query: string,
  options: { pageSize?: number; filter?: string } = {}
): Promise<FreesoundResult[]> {
  const { pageSize = 5, filter = "duration:[1 TO 120]" } = options;

  const params = new URLSearchParams({
    query,
    filter,
    page_size: String(pageSize),
    fields: "id,name,url,previews,duration,license",
    token: process.env.FREESOUND_API_KEY ?? "",
  });

  const res = await fetch(`${BASE_URL}/search/text/?${params}`);
  if (!res.ok) throw new Error(`Freesound API error: ${res.status}`);

  const data: FreesoundSearchResponse = await res.json();
  return data.results;
}
