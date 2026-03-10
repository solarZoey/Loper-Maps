/*
Author: Nova Solarz (it/they/she)
Date of creation: 2026-02-18
Directive:
	generates and displays graphics to the #gl_canvas canvas element
*/
// a few functions herein are taken from MDN (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context)

// global declaration
const programInfo = {
		program: null,
		attribLocations: {
			vertexLoc: null,
		},
		uniformLocations: {
			viewLoc: null,
		},
		buffers: {
			vertexB: null,
		},
		geometry: {
			tri: null,
			sqr: null,		
		},
		viewData: {
			x: 0.0,
			y: 0.0,
			scale: 1.0,
		},
		gl: null,
	};

// event listeners
document.addEventListener("keydown", handleEvent);

// wait half a second for html elements to load before starting graphics
console.log("waiting...")
setTimeout(function() {
	console.log("woaw!!!")
	main();
}, 500);

function main() {
	console.log("graphics running...")
	
	// Initialize the GL context
	const canvas = document.querySelector("#gl_canvas");
	const gl = canvas.getContext("webgl");

	// Only continue if WebGL is available and working
	if (gl === null) {
		alert(
			"Unable to initialize WebGL. Your browser or machine may not support it.",
		);

		return;
	}

	// vertex shader
	const vsSource = `
		attribute vec2 aVertexPosition;
		uniform vec2 uViewOffset; // position of camera
		uniform float uZoom; // zoom level of camera

		void main() {
				vec2 finalPos = (aVertexPosition - uViewOffset) * uZoom;
				gl_Position = vec4(finalPos, 0.0, 1.0);
		}
	`;

	// fragment shader
	const fsSource = `
		precision mediump float;

		void main() {
			gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
		}
	`;

	// GL program setup
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	gl.useProgram(shaderProgram);

	// test geometry
	const verticesSquare = new Float32Array([
		0.5, 0.5,
		-0.5, 0.5,
		-0.5, -0.5,
		0.5, 0.5,
		0.5, -0.5,
		-0.5, -0.5,
	]);
	const testVertices = new Float32Array([
		0.1, 0.1,
		0.2, 0.2,
		0.1, 0.2,

		0.0, 0.0,
		0.1, 0.1,
		0.0, 0.1,

		-1.0, -1.0,
		-0.9, -0.9,
		-0.9, -1.0,

		-1.5, -1.5,
		-1.9, -1.9,
		-1.9, -1.5,
	]);


	// buffer setup
	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	// filling out programInfo
	programInfo.program = shaderProgram;
	programInfo.attribLocations.vertexLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	programInfo.uniformLocations.viewLoc = gl.getUniformLocation(shaderProgram, "uViewOffset");
	programInfo.uniformLocations.zoomLoc = gl.getUniformLocation(shaderProgram, "uZoom");
	programInfo.buffers.vertexB = vertexBuffer;
	programInfo.geometry.tri = testVertices;
	programInfo.geometry.sqr = verticesSquare;
	programInfo.viewData.x = 0.0;
	programInfo.viewData.y = 0.0;
	programInfo.viewData.scale = 1.0;
	programInfo.gl = gl;

	// initial draw
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	draw(programInfo);

}

// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	// Create the shader program
	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert(
			`Unable to initialize the shader program: ${gl.getProgramInfoLog(
			shaderProgram,)}`,
		);
		return null;
	}

	return shaderProgram;
}

// creates a shader of the given type, uploads the source and
// compiles it.
function loadShader(gl, type, source) {
	const shader = gl.createShader(type);

	// Send the source to the shader object
	gl.shaderSource(shader, source);

	// Compile the shader program
	gl.compileShader(shader);

	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(
			`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
		);
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function resizeCanvasToDisplaySize(canvas) {
		// Lookup the size the browser is displaying the canvas in CSS pixels.
		const displayWidth  = canvas.clientWidth;
		const displayHeight = canvas.clientHeight;

		// Check if the canvas is not the same size.
		const needResize = canvas.width !== displayWidth ||
							canvas.height !== displayHeight;

		if (needResize) {
			// Make the canvas the same size
			canvas.width  = displayWidth;
			canvas.height = displayHeight;
		}
}	

function handleEvent(event) {
	let needDraw = false;
	const step = 0.05;

	if (event.key === "ArrowRight") {
		programInfo.viewData.x += step;
		needDraw = true;
	}
	if (event.key === "ArrowLeft") {
		programInfo.viewData.x -= step;
		needDraw = true;
	}
	if (event.key === "ArrowUp") {
		programInfo.viewData.y += step;
		needDraw = true;
	}
	if (event.key === "ArrowDown") {
		programInfo.viewData.y -= step;
		needDraw = true;
	}
	if (event.key === "=") {
		programInfo.viewData.scale += step;
		needDraw = true;
	}
	if (event.key === "-") {
		programInfo.viewData.scale -= step;
		needDraw = true;
	}

	if (needDraw) {
		draw(programInfo);
	}
}

function bindAttribute(data, attributeLocation, size) {
	// binds an attribute to a new buffer
	// access with attribute location
	let gl = programInfo.gl;
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(attributeLocation);
	gl.vertexAttribPointer(attributeLocation, size, gl.FLOAT, false, 0, 0);
}

function drawTrianglesObject(verticesArray) {
	// draws a single object from an array of vertices
	let gl = programInfo.gl;
	bindAttribute(verticesArray, programInfo.attribLocations.vertexLoc, 2);
	gl.drawArrays(gl.TRIANGLES, 0, verticesArray.length/2); // len/2 because 2D
}

function drawTriangleFanObject(verticesArray) {
	// draws a single object from an array of vertices
	let gl = programInfo.gl;
	bindAttribute(verticesArray, programInfo.attribLocations.vertexLoc, 2);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesArray.length/2); // len/2 because 2D
}

function constructCircle(radius, center, resolution) {
	// radius => float
	// center => [xFloat, yFloat]
	// resolution => integer; number of circumference points
	let gl = programInfo.gl;

	let vertices = [];

	center = {
		x: center[0],
		y: center[1],
	};
	// push center
	vertices.push(center.x);
	vertices.push(center.y);

	// add cicumference vertices
	let angle;
	let newX;
	let newY;
	let first; // storing the first calculated vertex, needs to be copied at the end to complete the circle
	for (let i = 0; i < resolution; i++) {

		angle = ((2 * Math.PI) * (i / resolution)); // circle angles from 0 to 2PI
		newX = center.x + radius * Math.cos(angle);
		newY = center.y + radius * Math.sin(angle);

		// add new
		vertices.push(newX);
		vertices.push(newY);

		if (!first) {
			// record first generated vertex for duplication later
			first = [newX, newY];
		}
	}
	// duplicate first vertex
	vertices.push(first[0]);
	vertices.push(first[1]);

	// convert vertex array to Float32Array
	let output = new Float32Array(vertices.length);
	let outI = 0;
	vertices.forEach( (v) => {
		output[outI] = v;
		outI++;
	});

	return output;
}

function constructLatLongPath(pathJSON) {
	// TODO convert JSON path retrieved from directory processor to lat,long tuples for use in tracePath()
	// currently, it only constructs a static test array
	
	const path = new Float32Array([
		0.9,0.9,
		0.3,0.3,
		0.6,0.2,
		0.1,-0.4,
		-0.2,-0.5,
		-0.2,-0.8,
		0.0,-0.9,
	]);

	// make a triangle for every point
	const verticesFromPath = new Float32Array((path.length * 5 + 6)); // a triangle per coordinate pair
	let pathVerticeIndex = 0;
	let delta = {
		x:0,
		y:0,
	};
	let previousPoint = null;
	let currentPoint;
	let sideA;
	let sideB;

	for (var i = 0; i < path.length; i+=2) {
		// create vertices for a rectangle for each line (set of two points)
		console.log("i",i)

		currentPoint = {
			x:path[i],
			y:path[i+1],
		};

		if (previousPoint == null) {
			// handle first line
			previousPoint = currentPoint;
			i += 2;
			currentPoint = {
				x:path[i],
				y:path[i+1],
			};
		}

		console.log("current point: ",currentPoint);
		// now we have two points for a line, (currentPoint, previousPoint)
		
		/* TODO
		// determine direction of path
		// ensure width of path does not change

		var angleFromNorth;
		var lineMagnitude = Math.sqrt(delta.x**2 + delta.y**2);
		delta = {
			x: Math.abs(currentPoint.x - previousPoint.x),
			y: Math.abs(currentPoint.y - previousPoint.y),
		};

		if (currentPoint) {
			// heading

			// angleFromNorth = Math.atan()

				//north (deltaY = 1)

				//south (deltaY = -1)
			
				//east (deltaX = 1)
			
				//west (deltaY = -1)
		} else {

		}
		*/

		// two triangles per point pair
		sideA = []; // three 2d vertices
		sideB = []; // three 2d vertices

		sideA.push(previousPoint.x+0.05);
		sideA.push(previousPoint.y);
		sideA.push(previousPoint.x-0.05);
		sideA.push(previousPoint.y);
		sideA.push(currentPoint.x-0.05);
		sideA.push(currentPoint.y);

		sideB.push(currentPoint.x-0.05);
		sideB.push(currentPoint.y);
		sideB.push(currentPoint.x+0.05);
		sideB.push(currentPoint.y);
		sideB.push(previousPoint.x+0.05);
		sideB.push(previousPoint.y);

		sideA.forEach( (element) => {
			verticesFromPath[pathVerticeIndex] = element;
			pathVerticeIndex++;
		});
		sideB.forEach( (element) => {
			verticesFromPath[pathVerticeIndex] = element;
			pathVerticeIndex++;
		});


		previousPoint = currentPoint;
	}

	return verticesFromPath;
}

function draw(programInfo) {
	let program = programInfo.program;
	let vertexBuffer = programInfo.buffers.vertexB;
	let gl = programInfo.gl;

	// tell WebGL how big its canvas is (clip -> pixels)
	resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// clear previous frame
	gl.clear(gl.COLOR_BUFFER_BIT);

		// update camera
	gl.uniform2f(programInfo.uniformLocations.viewLoc, programInfo.viewData.x, programInfo.viewData.y);
	gl.uniform1f(programInfo.uniformLocations.zoomLoc, programInfo.viewData.scale);

	// Draw the geometry.
	// circle
	drawTriangleFanObject(constructCircle(0.2,[-0.5,0.5],30));
	// path
		// TODO refactor target: make 'pathGeo' a programInfo attribute, set to null when not displaying
	let pathGeo = constructLatLongPath(null);
	console.log(pathGeo);
	drawTrianglesObject(pathGeo);

}


