const scriptPath = document.currentScript.src;
const basePath = scriptPath.substring(0, scriptPath.lastIndexOf("/") + 1);
const shaderPath = `${basePath}../../shaders/crt-apperture.glsl`;

document.addEventListener("DOMContentLoaded", function () {
	// Ensure ambience sound plays if it was playing before
	if (localStorage.getItem("ambiencePlaying") === "true") {
		document.body.addEventListener("click", initializeAudio, { once: true });
	} else {
		// If ambience wasn't playing, just add a one-time event listener for future initialization
		document.body.addEventListener("click", initializeAudio, { once: true });
	}

	// Simulate bootup process
	setTimeout(function () {
		const loadingLog = document.querySelector(".loading-log");
		if (loadingLog) {
			loadingLog.textContent = "Bootup complete. Welcome!";
		}
		bindStartButtonClick();
	}, 5000); // Adjust the delay as needed
	fetch(shaderPath)
		.then((response) => {
			if (!response.ok) {
				throw new Error("Failed to load crt-apperture.glsl");
			}
			return response.text();
		})
		.then((glslCode) => {
			console.log("Shader code loaded successfully:", glslCode);
			initWebGLShader(glslCode);
		})
		.catch((error) => {
			console.error("Failed to load crt-apperture.glsl:", error);
		});
});

function initializeAudio() {
	playAmbienceSound();
}

function playAmbienceSound() {
	var ambienceAudio = new Audio("../../Sounds/Ambience.mp3");
	ambienceAudio.volume = 0.5; // Adjust the volume as needed
	ambienceAudio.loop = true;

	// Resume from the last saved time if available
	var currentTime = parseFloat(localStorage.getItem("ambienceCurrentTime")) || 0;
	ambienceAudio.currentTime = currentTime;

	// Play the audio
	ambienceAudio.play().catch((error) => {
		console.error("Failed to play ambience audio:", error);
	});

	// Store the audio element and state in localStorage
	localStorage.setItem("ambiencePlaying", "true");

	// Update the current time of the audio in localStorage
	ambienceAudio.addEventListener("timeupdate", function () {
		localStorage.setItem("ambienceCurrentTime", ambienceAudio.currentTime);
	});
}

function bindStartButtonClick() {
	var startButton = document.querySelector("#startButton");
	if (startButton) {
		startButton.addEventListener("click", function () {
			playPCRunningSound();
		});
	}
}

function playPCRunningSound() {
	var pcRunningAudio = new Audio("../../Sounds/pc_running.mp3");
	pcRunningAudio.loop = true;

	// Resume from the last saved time if available
	var currentTime = parseFloat(localStorage.getItem("pcRunningCurrentTime")) || 0;
	pcRunningAudio.currentTime = currentTime;

	// Play the audio
	pcRunningAudio.play().catch((error) => {
		console.error("Failed to play PC running audio:", error);
	});

	// Store the audio element and state in localStorage
	localStorage.setItem("pcRunningPlaying", "true");

	// Update the current time of the audio in localStorage
	pcRunningAudio.addEventListener("timeupdate", function () {
		localStorage.setItem("pcRunningCurrentTime", pcRunningAudio.currentTime);
	});
}

// WebGL shader initialization
function initWebGLShader(fsSource) {
	const vsSource = `
        attribute vec4 aVertexPosition;
        void main(void) {
            gl_Position = aVertexPosition;
        }
    `;

	const canvas = document.createElement("canvas");
	canvas.id = "glCanvas";
	document.body.appendChild(canvas);

	const gl = canvas.getContext("webgl");

	if (!gl) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}

	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
		},
	};

	const buffers = initBuffers(gl);

	function render() {
		drawScene(gl, programInfo, buffers);
		requestAnimationFrame(render);
	}
	render();
}

function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
		return null;
	}
	return shaderProgram;
}

function loadShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

function initBuffers(gl) {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
	};
}

function drawScene(gl, programInfo, buffers) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
	gl.clearDepth(1.0); // Clear everything
	gl.enable(gl.DEPTH_TEST); // Enable depth testing
	gl.depthFunc(gl.LEQUAL); // Near things obscure far things

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
	}

	gl.useProgram(programInfo.program);

	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
	}
}

// Handle page unload to keep playing the ambience sound and pc running sound
window.onbeforeunload = function () {
	// Update the playing state in localStorage
	localStorage.setItem("ambiencePlaying", "true");
	localStorage.setItem("pcRunningPlaying", "true");
};

function drawTimer() {
	const canvas = document.getElementById("glCanvas");
	const width = canvas.width;
	const height = canvas.height;

	gl.viewport(0, 0, width, height);
	gl.useProgram(programInfo.program);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [width - 100, height - 100, width - 100, height - 200, width - 200, height - 100, width - 200, height - 200];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const numComponents = 2;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	// Draw text
	const text = "YOU HAVE TRIGGERED A DEADSWITCH";
	const textX = width - 400;
	const textY = height - 300;
	gl.font = "30px Arial";
	gl.fillStyle = "white";
	gl.fillText(text, textX, textY);

	const subText = "YOU HAVE 1 HOUR BEFORE NEUROLINK PROTOCOL INITIATES";
	const subTextX = width - 500;
	const subTextY = height - 250;
	gl.font = "20px Arial";
	gl.fillStyle = "white";
	gl.fillText(subText, subTextX, subTextY);

	const buttonX = width - 200;
	const buttonY = height - 150;
	const buttonWidth = 100;
	const buttonHeight = 50;

	// Draw button
	gl.fillStyle = "blue";
	gl.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

	// Draw button text
	const buttonText = "Proceed";
	const buttonTextX = buttonX + buttonWidth / 2 - 30;
	const buttonTextY = buttonY + buttonHeight / 2 + 5;
	gl.font = "20px Arial";
	gl.fillStyle = "white";
	gl.fillText(buttonText, buttonTextX, buttonTextY);

	// Add event listener to button
	canvas.addEventListener("click", function (event) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
			// Proceed button clicked, start the timer
			startTimer();
		}
	});
}

function startTimer() {
	// 1 hour = 3600000 milliseconds
	const oneHourInMillis = 3600000;

	console.log("Timer started!");

	// Set up a timer to redirect after one hour
	setTimeout(function () {
		// Redirect to Error_Neurolink.html
		window.location.href = "Error_Neurolink.html";
	}, oneHourInMillis);
}

// Call drawTimer function inside the render function
function render() {
	drawTimer(gl, programInfo);
	drawScene(gl, programInfo, buffers);
	requestAnimationFrame(render);
}
render();
