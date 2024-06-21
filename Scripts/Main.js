// This code is for bootup
document.addEventListener("DOMContentLoaded", function () {
	setTimeout(function () {
		document.querySelector(".loading-log").textContent = "Bootup complete. Welcome!";
		playBackgroundSound();
	}, 5000); // Adjust the delay as needed
});

function playBackgroundSound() {
	var audio = new Audio("../../Sounds/pc_running.mp3");
	var ambienceAudio = new Audio("../../Sounds/Ambience.mp3");
	ambienceAudio.volume = 0.5; // Adjust the volume as needed

	var pcRunningAudio = new Audio("../../Sounds/pc_running.mp3");

	document.querySelector("#startButton").addEventListener("click", function () {
		pcRunningAudio.loop = true;
		pcRunningAudio.play();
	});
	audio.loop = true;
	audio.play();
}
