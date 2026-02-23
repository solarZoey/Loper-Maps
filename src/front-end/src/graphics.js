/*
Author: Nova Solarz (it/they/she)
Date of creation: 2026-02-18
Directive:
	generates and displays graphics to the #gl_canvas canvas element
*/
// as it stands, most of this is taken from MDN (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context)

main();

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
		attribute vec4 aVertexPosition;
		uniform vec4 uViewOffset; // position of camera
		uniform float uZoom; // zoom level of camera

		void main() {
				gl_Position = aVertexPosition;
		}
	`;

	// fragment shader
	const fsSource = `
		precision mediump float;

		void main() {
			gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
		}
	`;

	// test square geometry
	const verticesSquare = new Float32Array([
		0.5, 0.5,
		-0.5, 0.5,
		-0.5, -0.5,
		0.5, 0.5,
		0.5, -0.5,
		-0.5, -0.5,
	]);
	
	// view defaults
	/*
	let viewOffset = {
		'x':0.0,
		'y':0.0,
	};
	let scale = 1.0;
	*/

	// GL program setup
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
	gl.useProgram(shaderProgram);

	// buffer setup
	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesSquare, gl.STATIC_DRAW);

	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexLocation: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
		},
	};

	// initial draw
	draw(gl, shaderProgram, programInfo, vertexBuffer);

}

function draw(gl, program, programInfo, vertexBuffer) {
	// tell WebGL how big its canvas is (clip -> pixels)
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// clear previous frame
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(program);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	gl.enableVertexAttribArray(programInfo.vertexLocation);

	// Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(programInfo.vertexLocation, size, type, normalize, stride, offset);

	// Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
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

