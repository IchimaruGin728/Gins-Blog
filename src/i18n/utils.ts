import { defaultLang, languages, ui } from "./ui";

export { languages };

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split("/");
	if (lang === "zh") return "zh";
	if (lang in ui) return lang as keyof typeof ui;
	return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
	return function t(key: keyof (typeof ui)[typeof defaultLang]) {
		return ui[lang][key] || ui[defaultLang][key];
	};
}

export function getRouteFromUrl(url: URL, targetLang: string) {
	const currentLang = getLangFromUrl(url);
	let path = url.pathname;
	const search = url.search;

	if (currentLang === "zh") {
		path = path.replace(/^\/zh/, "") || "/";
	} else if (currentLang !== defaultLang) {
		path = path.replace(`/${currentLang}`, "") || "/";
	}

	// Ensure path starts with /
	if (!path.startsWith("/")) {
		path = `/${path}`;
	}

	// If target is default, return clean path
	if (targetLang === defaultLang) {
		return path + search;
	}

	return `/zh${path === "/" ? "" : path}${search}`;
}
