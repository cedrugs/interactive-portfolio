export function dialoguePages(text: string, limit = 180): string[] {
	const pages: string[] = [];
	let page = '';
	for (const word of text.trim().split(/\s+/)) {
		if (page && page.length + word.length + 1 > limit) {
			pages.push(page);
			page = '';
		}
		page += (page ? ' ' : '') + word;
	}
	if (page) pages.push(page);
	return pages.length ? pages : [''];
}
