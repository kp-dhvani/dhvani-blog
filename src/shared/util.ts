export const highlightCurrentPageInNav = function () {
	const currentPath = window.location.pathname;
	const basePath = currentPath.split("/")[1];

	// Select all navigation links
	const allNavigationLinks =
		document.querySelectorAll<HTMLAnchorElement>(".article-link");

	allNavigationLinks.forEach((link) => {
		const linkHref = link.getAttribute("href") || "";
		const linkBasePath = linkHref.split("/")[1];

		if (currentPath === linkHref || basePath === linkBasePath) {
			link.classList.add("bg-gray-900");
		} else {
			link.classList.remove("bg-gray-900");
		}
	});
};
