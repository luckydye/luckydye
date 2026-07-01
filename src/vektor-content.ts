import type { CollectionEntry } from "astro:content";

export type VektorEntry = CollectionEntry<"pages">;

export type WebsiteTag = {
  id: string;
  title: string;
};

export type WebsiteImage = {
  src: string;
  width: number;
  height: number;
};

export type WebsitePost = {
  id: string;
  data: {
    title: string;
    description?: string;
    author?: string;
    tags?: WebsiteTag[];
    topics?: string[];
    date?: string;
    url?: string;
    links?: string[];
    images?: WebsiteImage[];
    headerImage?: string;
    layout?: string;
    content?: string;
  };
};

export type WebsiteLink = {
  id: string;
  title: string;
  link: string;
  target?: string;
};

export type SiteAssets = {
  favicon?: string;
  logoRive?: string;
  logoSvg?: string;
  portfolioVideo?: string;
  portfolioVideoMp4?: string;
};

function parseJsonArray(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : undefined;
  } catch {
    return undefined;
  }
}

function parseJsonRecord(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed).map(([key, val]) => [key, String(val)]))
      : {};
  } catch {
    return {};
  }
}

export function sourceCollection(entry: VektorEntry): string | undefined {
  return entry.data.properties.sourceCollection;
}

export function toWebsitePost(entry: VektorEntry): WebsitePost {
  const properties = entry.data.properties;
  const tags = parseJsonArray(properties.tags)?.map((id) => ({ id, title: id }));
  const images = parseJsonArray(properties.images)?.map((src) => ({
    src,
    width: 16,
    height: 9,
  }));

  return {
    id: properties.slug ?? entry.id,
    data: {
      title: properties.title ?? entry.data.title ?? entry.id,
      description: properties.description,
      author: properties.author,
      tags,
      topics: parseJsonArray(properties.topics),
      date: properties.date,
      url: properties.url,
      links: parseJsonArray(properties.links),
      images,
      headerImage: entry.data.headerImage ?? undefined,
      layout: properties.layout,
      content: entry.data.content ?? undefined,
    },
  };
}

export function toWebsiteTag(entry: VektorEntry): WebsiteTag {
  const properties = entry.data.properties;
  return {
    id: properties.id ?? properties.slug ?? entry.id,
    title: properties.title ?? entry.data.title ?? entry.id,
  };
}

export function toWebsiteLink(entry: VektorEntry): WebsiteLink {
  const properties = entry.data.properties;
  return {
    id: properties.id ?? properties.slug ?? entry.id,
    title: properties.title ?? entry.data.title ?? entry.id,
    link: properties.link ?? "#",
    target: properties.target,
  };
}

export function getSiteAssets(entries: VektorEntry[]): SiteAssets {
  const manifest = entries.find((entry) => sourceCollection(entry) === "asset-manifest");
  return parseJsonRecord(manifest?.data.properties.assets);
}

export function formatDate(value: string | undefined): string | undefined {
  return value ? new Date(value).toLocaleDateString() : undefined;
}
