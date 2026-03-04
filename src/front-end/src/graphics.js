/*
Author: Nova Solarz (it/they/she)
Date of creation: 2026-02-18
Directive:
	generates and displays graphics to the #gl_canvas canvas element
*/
// as it stands, most of this is taken from MDN (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context)

// wait half a second for html elements to load before starting graphics
console.log("waiting...")
setTimeout(function() {
	console.log("woaw!!!")
	main();
}, 500);

// event listeners
document.addEventListener("keydown", handleEvent);

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
		const needResize = canvas.width  !== displayWidth ||
											 canvas.height !== displayHeight;

		if (needResize) {
			// Make the canvas the same size
			canvas.width  = displayWidth;
			canvas.height = displayHeight;
		}
}	

function handleEvent(event) {
	const step = 0.05;

		if (event.key === "ArrowRight") {
			programInfo.viewData.x += step
		}
		if (event.key === "ArrowLeft") {
			programInfo.viewData.x -= step
		}
		if (event.key === "ArrowUp") {
			programInfo.viewData.y += step
		}
		if (event.key === "ArrowDown") {
			programInfo.viewData.y -= step
		}
		if (event.key === "=") {
			programInfo.viewData.scale += step
		}
		if (event.key === "-") {
			programInfo.viewData.scale -= step
		}
		
		draw(programInfo);

}



function drawTrianglesObject(verticesArray) {
	// draws a single object from an array of vertices
	let gl = programInfo.gl;
	bindAttribute(verticesArray, programInfo.attribLocations.vertexLoc, 2);
	gl.drawArrays(gl.TRIANGLES, 0, verticesArray.length/2); // len/2 because 2D
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









function constructLatLongPath(pathJSON) {
	// convert JSON path retrieved from directory processor to lat,long tuples for use in tracePath()

	// currently, it only constructs a static test array
	const path = new Float32Array([
		0.5,0.5,
		0.9,0.9,
	]);

	// make a triangle for every point
	const verticesFromPath = new Float32Array((path.length * 3)); // three vertices per point
	let pathVerticeIndex = 0;

	let delta = {
		x:0,
		y:0,
	};
	let previousPoint = null;
	let currentPoint;
	let newTriangleA;
	let newTriangleB;

	for (var i = 0; i < path.length; i+=2) {
		currentPoint = {
			x:path[i],
			y:path[i+1],
		};

		if (previousPoint == null) {
			previousPoint = currentPoint;
			i += 2;
			currentPoint = {
				x:path[i],
				y:path[i+1],
			};
		}

		console.log(currentPoint);
		
		// length
		var lineLength = Math.sqrt((currentPoint.x - previousPoint.x)**2 + (currentPoint.y - previousPoint.y)**2);


		var directionFromUp

		// determine direction of path
		if (currentPoint) {
			// heading
			// get x y delta
			// 
				//north (deltaY = 1)

				//south (deltaY = -1)
			
				//east (deltaX = 1)
			
				//west (deltaY = -1)
		} else {

		}

		// two triangles per point pair
		newTriangleA = []; // three 2d vertices
		newTriangleB = []; // three 2d vertices

		// above point
		newTriangleA.push(currentPoint.x);
		newTriangleA.push(currentPoint.y+0.05);
		// left bottom
		newTriangleA.push(currentPoint.x-0.05);
		newTriangleA.push(currentPoint.y-0.05);
		// right bottom
		newTriangleA.push(currentPoint.x+0.05);
		newTriangleA.push(currentPoint.y-0.05);
		

		// above point
		newTriangleB.push(previousPoint.x);
		newTriangleB.push(previousPoint.y+0.05);
		// left bottom
		newTriangleB.push(previousPoint.x-0.05);
		newTriangleB.push(previousPoint.y-0.05);
		// right bottom
		newTriangleB.push(previousPoint.x+0.05);
		newTriangleB.push(previousPoint.y-0.05);
		

		newTriangleA.forEach( (element) => {
			verticesFromPath[pathVerticeIndex] = element;
			pathVerticeIndex++;
		});
		newTriangleB.forEach( (element) => {
			verticesFromPath[pathVerticeIndex] = element;
			pathVerticeIndex++;
		});

		console.log(newTriangleA);
		console.log(newTriangleB);


		previousPoint = currentPoint;
	}

	return verticesFromPath;
}



// function tracePath(pathJSON) {
// 	// take path=[[lat,long],...,[lat,long]] -> draw lines between locations
// 	let gl = programInfo.gl;
// 	const pathVertices = constructLatLongPath(null);
// 	bindAttribute(pathVertices, programInfo.attribLocations.vertexLoc, 2);
// 	gl.lineWidth(4.0);
// 	gl.drawArrays(gl.LINE_ARRAY, pathVertices, pathVertices.length/2);
// 	console.log("path drawn!")
// }


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
	drawTrianglesObject(programInfo.geometry.tri);

	let p = constructLatLongPath(null);
	console.log(p);
	drawTrianglesObject(p);

	// tracePath(null);
}


