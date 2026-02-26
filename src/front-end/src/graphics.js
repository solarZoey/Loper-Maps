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

function bindVertices(vertices, gl) {
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
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














function draw(programInfo) {
	let program = programInfo.program;
	let vertexBuffer = programInfo.buffers.vertexB;
	let gl = programInfo.gl;

	// tell WebGL how big its canvas is (clip -> pixels)
	resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// clear previous frame
	gl.clear(gl.COLOR_BUFFER_BIT);


	gl.useProgram(program);
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.enableVertexAttribArray(programInfo.vertexLoc);


	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(programInfo.vertexLoc, size, type, normalize, stride, offset);

    // update camera
	gl.uniform2f(programInfo.uniformLocations.viewLoc, programInfo.viewData.x, programInfo.viewData.y);
	gl.uniform1f(programInfo.uniformLocations.zoomLoc, programInfo.viewData.scale);

	// Draw the geometry.
	let currentGeometry = programInfo.geometry.tri;
	bindVertices(currentGeometry, gl);
		//
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = programInfo.geometry.tri.length / size;
    gl.drawArrays(primitiveType, offset, count);
}


