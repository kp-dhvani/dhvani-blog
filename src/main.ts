const startYear = 2023;
const elapsedTimeInYear = new Date().getFullYear() - startYear;
const span = document.querySelector("#time-elapsed");
if (span) {
	span.textContent = `${elapsedTimeInYear.toString()} year${
		elapsedTimeInYear > 1 ? "s" : ""
	}`;
}
