export const highlightCurrentPageInNav = function () {
	const splitPath = window.location.pathname.split("/");
	const currentPathName = splitPath[1];
	if (currentPathName) {
		const allNavigationLinks: NodeListOf<HTMLAnchorElement> =
			document.querySelectorAll(".article-link");
		allNavigationLinks.forEach((link) => {
			if (link.text.toLocaleLowerCase() === currentPathName) {
				link.className += " bg-gray-900";
			}
		});
	} else {
		const homeAnchorTag: NodeListOf<HTMLAnchorElement> =
			document.querySelectorAll('a[href="/"]');
		homeAnchorTag.forEach((link) => {
			link.className += " bg-gray-900";
		});
	}
};
