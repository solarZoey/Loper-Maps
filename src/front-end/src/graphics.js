/*
Author: Nova Solarz (it/they/she)
Date of creation: 2026-02-18
Date of last edit: 2026-02-18
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

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);



    // vertex shader
    const vsSource = `
        attribute vec2 a_path_geometry;
        uniform vec2 u_offset;
        uniform float u_scale;

        void main() {

            // scale first, then translate
            new_scale = a_path_geometry * u_scale;
            gl_Position = vec4(new_scale + u_offset, 0.0, 1.0);
        }
    `;

    // fragment shader
    const fsSource = `
        precision mediump float;

        void main() {
            gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
        }
    `;
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