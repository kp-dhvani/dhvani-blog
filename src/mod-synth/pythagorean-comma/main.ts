document.addEventListener("DOMContentLoaded", function () {
	const width = 800;
	const height = 500;
	const canvas = <HTMLCanvasElement>document.getElementById("wave-canvas");
	const context = canvas?.getContext("2d");
	if (context) {
		for (let x = 0; x < width; x++) {
			const amplitude = height * 0.25;
			const y = height / 2 + Math.sin(x) * amplitude;
			context.lineTo(x, y);
		}
		context.stroke();
	}
});
