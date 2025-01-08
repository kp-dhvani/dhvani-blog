drawMembraneMode("w02-vibration-mode", 0, 2);
drawMembraneMode("w11-vibration-mode", 1, 1);
drawMembraneMode("w12-vibration-mode", 1, 2);
drawMembraneMode("w13-vibration-mode", 1, 3);
drawMembraneMode("w03-vibration-mode", 0, 3);
drawMembraneMode("w30-vibration-mode", 3, 0);
drawMembraneMode("w31-vibration-mode", 3, 1);
drawMembraneMode("w41-vibration-mode", 4, 1);

function drawMembraneMode(
	canvasId: string,
	m: number, // number of radial modes (diameter line nodes)
	n: number // number of circular modes (circular nodes including edge)
): void {
	let canvas = document.getElementById(canvasId) as HTMLCanvasElement;
	if (!canvas) {
		canvas = document.createElement("canvas");
		canvas.id = canvasId;
		document.body.appendChild(canvas);
	}

	const updateSize = () => {
		const parent = canvas.parentElement;
		if (!parent) return;

		const containerWidth = parent.clientWidth;
		// set size to minimum of container width or 200px, with some padding
		const size = Math.min(containerWidth - 32, 200);

		const dpr = window.devicePixelRatio || 1;

		canvas.style.width = size + "px";
		canvas.style.height = size + "px";

		// set actual size (scaled for DPR)
		canvas.width = size * dpr;
		canvas.height = size * dpr;

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			console.error("Could not get canvas context");
			return;
		}

		// scale all drawing operations by DPR
		ctx.scale(dpr, dpr);

		const center = size / 2;
		const radius = size * 0.45;

		// for mode (0,1) - fundamental mode
		if (m === 0 && n === 1) {
			ctx.beginPath();
			ctx.arc(center, center, radius, 0, 2 * Math.PI);
			ctx.fillStyle = "white";
			ctx.fill();
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.stroke();
			return;
		}

		// for modes with only circular nodes (m=0, n>1)
		if (m === 0) {
			// start from center and work outwards
			for (let i = 0; i < n; i++) {
				const innerRadius = (radius * i) / n;
				const outerRadius = (radius * (i + 1)) / n;

				ctx.beginPath();
				ctx.arc(center, center, outerRadius, 0, 2 * Math.PI);
				ctx.arc(center, center, innerRadius, 0, 2 * Math.PI, true);
				ctx.closePath();

				ctx.fillStyle = i % 2 === 0 ? "white" : "#FF6577";
				ctx.fill();

				if (i > 0) {
					ctx.beginPath();
					ctx.arc(center, center, innerRadius, 0, 2 * Math.PI);
					ctx.strokeStyle = "black";
					ctx.lineWidth = 1;
					ctx.stroke();
				}
			}

			ctx.beginPath();
			ctx.arc(center, center, radius, 0, 2 * Math.PI);
			ctx.strokeStyle = "black";
			ctx.lineWidth = 2;
			ctx.stroke();
			return;
		}

		// for modes with radial nodes (m > 0)
		const angleStep = Math.PI / m;

		// draw from outer to inner rings
		for (let ringIndex = n; ringIndex > 0; ringIndex--) {
			const outerRadius = (radius * ringIndex) / n;
			const innerRadius = (radius * (ringIndex - 1)) / n;

			for (let i = 0; i < m * 2; i++) {
				const startAngle = i * angleStep;
				const endAngle = (i + 1) * angleStep;

				ctx.beginPath();
				ctx.arc(center, center, outerRadius, startAngle, endAngle);
				ctx.arc(center, center, innerRadius, startAngle, endAngle, true);
				ctx.closePath();

				const shouldFill = (i % 2 === 0) !== (ringIndex % 2 === 0);
				ctx.fillStyle = shouldFill ? "#FF6577" : "white";
				ctx.fill();
				ctx.strokeStyle = "black";
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		}

		// draw radial node lines
		for (let i = 0; i < m * 2; i++) {
			const angle = i * angleStep;
			ctx.beginPath();
			ctx.moveTo(center, center);
			ctx.lineTo(
				center + radius * Math.cos(angle),
				center + radius * Math.sin(angle)
			);
			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.stroke();
		}

		// draw circular node lines
		for (let i = 1; i < n; i++) {
			const circleRadius = (radius * i) / n;
			ctx.beginPath();
			ctx.arc(center, center, circleRadius, 0, 2 * Math.PI);
			ctx.strokeStyle = "black";
			ctx.lineWidth = 1;
			ctx.stroke();
		}

		// draw boundary
		ctx.beginPath();
		ctx.arc(center, center, radius, 0, 2 * Math.PI);
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		ctx.stroke();
	};

	// initial draw
	updateSize();

	const resizeObserver = new ResizeObserver(updateSize);
	resizeObserver.observe(canvas.parentElement || document.body);
}
