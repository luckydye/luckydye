import type { CollectionEntry } from "astro:content";
import { type PropertyValue, propertyScalar } from "@vektorapp/api";

export type VektorEntry = CollectionEntry<"pages">;

export type WebsiteTag = {
	id: string;
	title: string;
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
		headerImage?: string;
		/** Number of grid columns the post tile occupies, 1 to 6. */
		size?: string;
		content?: string;
	};
};

export type WebsiteLink = {
	id: string;
	title: string;
	link: string;
	target?: string;
};

export type WebsitePage = {
	title: string;
	description?: string;
	content?: string;
};

export type SiteAssets = {
	favicon?: string;
	logoRive?: string;
	logoSvg?: string;
	portfolioVideo?: string;
	portfolioVideoMp4?: string;
};

/**
 * Reads a multi-value property as a list. Vektor hands multi-value properties
 * over as arrays already; a property holding a single value stays a plain string.
 */
function propertyList(value: PropertyValue | undefined): string[] | undefined {
	if (!value) return undefined;
	if (Array.isArray(value))
		return value.length > 0 ? value.map(String) : undefined;
	try {
		const parsed = JSON.parse(value);
		if (Array.isArray(parsed))
			return parsed.length > 0 ? parsed.map(String) : undefined;
	} catch {
		// Not JSON, so it is a single value.
	}
	return [value];
}

/** Reads a property holding a JSON object, such as the site-asset manifest. */
function propertyRecord(
	value: PropertyValue | undefined,
): Record<string, string> {
	if (!value || Array.isArray(value)) return {};
	try {
		const parsed = JSON.parse(value);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? Object.fromEntries(
					Object.entries(parsed).map(([key, val]) => [key, String(val)]),
				)
			: {};
	} catch {
		return {};
	}
}

export function sourceCollection(entry: VektorEntry): string | undefined {
	return propertyScalar(entry.data.properties.sourceCollection);
}

export function toWebsitePost(entry: VektorEntry): WebsitePost {
	const properties = entry.data.properties;
	const tags = propertyList(properties.tags)?.map((id) => ({ id, title: id }));

	return {
		id: propertyScalar(properties.slug) ?? entry.id,
		data: {
			title: propertyScalar(properties.title) ?? entry.data.title ?? entry.id,
			description: propertyScalar(properties.description),
			author: propertyScalar(properties.author),
			tags,
			topics: propertyList(properties.topics),
			date: propertyScalar(properties.date),
			url: propertyScalar(properties.url),
			links: propertyList(properties.links),
			headerImage: entry.data.headerImage ?? undefined,
			size: propertyScalar(properties.size),
			content: entry.data.content ?? undefined,
		},
	};
}

export function toWebsiteTag(entry: VektorEntry): WebsiteTag {
	const properties = entry.data.properties;
	return {
		id:
			propertyScalar(properties.id) ??
			propertyScalar(properties.slug) ??
			entry.id,
		title: propertyScalar(properties.title) ?? entry.data.title ?? entry.id,
	};
}

export function toWebsiteLink(entry: VektorEntry): WebsiteLink {
	const properties = entry.data.properties;
	return {
		id:
			propertyScalar(properties.id) ??
			propertyScalar(properties.slug) ??
			entry.id,
		title: propertyScalar(properties.title) ?? entry.data.title ?? entry.id,
		link: propertyScalar(properties.link) ?? "#",
		target: propertyScalar(properties.target),
	};
}

export function toWebsitePage(entry: VektorEntry): WebsitePage {
	const properties = entry.data.properties;
	return {
		title: propertyScalar(properties.title) ?? entry.data.title ?? entry.id,
		description: propertyScalar(properties.description),
		content: entry.data.content ?? undefined,
	};
}

export function getSiteAssets(entries: VektorEntry[]): SiteAssets {
	const manifest = entries.find(
		(entry) => sourceCollection(entry) === "asset-manifest",
	);
	return propertyRecord(manifest?.data.properties.assets);
}

export function formatDate(value: string | undefined): string | undefined {
	return value ? new Date(value).toLocaleDateString() : undefined;
}
