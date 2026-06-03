import { Bezier } from "bezier-js";

class Point {
	x: number;
	y: number;
	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

function getLinearInterPolationValue(
	startValue: number,
	endValue: number,
	ratio: number,
) {
	return startValue + (endValue - startValue) * ratio;
}

function getLinearInterpolationPoint(
	startPoint: Point,
	endPoint: Point,
	ratio: number,
) {
	return new Point(
		getLinearInterPolationValue(startPoint.x, endPoint.x, ratio),
		getLinearInterPolationValue(startPoint.y, endPoint.y, ratio),
	);
}

function getPointOnQuadraticBezierCurve(
	startPoint: Point,
	controlPoint: Point,
	endPoint: Point,
	ratio: number,
) {
	return getLinearInterpolationPoint(
		getLinearInterpolationPoint(startPoint, controlPoint, ratio),
		getLinearInterpolationPoint(controlPoint, endPoint, ratio),
		ratio,
	);
}

document.addEventListener("DOMContentLoaded", function () {
	const width = 800;
	const height = 500;

	const canvas = <HTMLCanvasElement>document.getElementById("wave-canvas");
	const context = canvas?.getContext("2d");
	const lissajousCanvas = <HTMLCanvasElement>(
		document.getElementById("lissajous-canvas")
	);
	const lissajousCanvasContext = lissajousCanvas?.getContext("2d");

	const polygonCanvas = <HTMLCanvasElement>(
		document.getElementById("polygon-canvas")
	);
	const polygonCanvasContext = polygonCanvas?.getContext("2d");

	const frequency = 3;
	const amplitude = height * 0.45;

	const y = height / 2;
	const margin = 0;
	const x0 = margin;
	const y0 = height / 2;
	const x1 = width - margin;
	const cx = x0 + y0 / 2;

	if (context) {
		for (let x = 0; x < width; x++) {
			const y =
				height / 2 +
				Math.sin((x / width) * Math.PI * 2 * frequency) * amplitude;
			context.lineTo(x, height - y);
		}
		context.stroke();
	}

	function drawSineWave(
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		frequency: number,
		amplitude: number,
	) {
		const dx = x1 - x0;
		const dy = y1 - y0;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const angle = Math.atan2(dy, dx);
		context?.save();
		context?.translate(x0, y0);
		context?.rotate(angle);
		context?.beginPath();
		context?.moveTo(0, 0);
		for (let x = 0; x < distance; x++) {
			const y = Math.sin((x / distance) * frequency * Math.PI * 2) * amplitude;
			context?.lineTo(x, -y);
		}
		context?.stroke();
		context?.restore();
	}

	drawSineWave(100, 100, 700, 400, 10, 40);

	function drawTanCurve() {
		const amplitude = 10;
		const frequency = 2;
		context?.save();
		for (let x = 0; x < width; x++) {
			const y =
				height / 2 + Math.tan((x / width) * Math.PI * frequency) * amplitude;
			context?.lineTo(x, height - y);
		}
		context?.stroke();
		context?.restore();
	}

	drawTanCurve();

	function drawPolygon(
		x: number,
		y: number,
		radius: number,
		sides: number,
		rotation: number,
	) {
		const resolution = (Math.PI * 2) / sides;
		polygonCanvasContext?.save();
		// polygonCanvasContext?.beginPath();
		polygonCanvasContext?.moveTo(0, 0);

		for (let i = 0; i < Math.PI * 2; i += resolution) {
			polygonCanvasContext?.lineTo(
				x + Math.cos(i + rotation) * radius,
				y + Math.sin(i + rotation) * radius,
			);
		}
		polygonCanvasContext?.closePath();
	}

	let polygonAngle = 0;
	for (let r = 5; r <= 255; r += 10) {
		drawPolygon(300, 300, r, 5, polygonAngle);
		polygonAngle += 0.05;
	}
	polygonCanvasContext?.stroke();

	function drawLissajousCurve(
		cx: number,
		cy: number,
		A: number,
		B: number,
		a: number,
		b: number,
		d: number,
	) {
		const resolution = 0.01;
		lissajousCanvasContext?.beginPath();
		for (let t = 0; t < Math.PI * 2; t += resolution) {
			const x = cx + Math.sin(a * t + d) * A;
			const y = cy + Math.sin(b * t) * B;
			lissajousCanvasContext?.lineTo(x, y);
		}
		lissajousCanvasContext?.closePath();
		lissajousCanvasContext?.stroke();
	}

	drawLissajousCurve(300, 300, 250, 250, 2, 1, 0);
	drawLissajousCurve(300, 300, 250, 250, 2, 3, 0);
	drawLissajousCurve(300, 300, 100, 250, 10, 11, 0.5);
});
