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

export type WebsitePage = {
	title: string;
	description?: string;
	content?: string;
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

/** An entry's properties keyed by lowercased name, so lookups ignore case. */
function entryProperties(
	entry: VektorEntry,
): Record<string, PropertyValue | undefined> {
	return Object.fromEntries(
		Object.entries(entry.data.properties).map(([key, value]) => [
			key.toLowerCase(),
			value,
		]),
	);
}

export function sourceCollection(entry: VektorEntry): string | undefined {
	return propertyScalar(entryProperties(entry).sourcecollection);
}

export function toWebsitePost(entry: VektorEntry): WebsitePost {
	const properties = entryProperties(entry);
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
	const properties = entryProperties(entry);
	return {
		id:
			propertyScalar(properties.id) ??
			propertyScalar(properties.slug) ??
			entry.id,
		title: propertyScalar(properties.title) ?? entry.data.title ?? entry.id,
	};
}

export function toWebsitePage(entry: VektorEntry): WebsitePage {
	const properties = entryProperties(entry);
	return {
		title: propertyScalar(properties.title) ?? entry.data.title ?? entry.id,
		description: propertyScalar(properties.description),
		content: entry.data.content ?? undefined,
	};
}

export function formatDate(value: string | undefined): string | undefined {
	return value ? new Date(value).toLocaleDateString() : undefined;
}
