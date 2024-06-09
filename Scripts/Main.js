// This code is for bootup
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() {
        document.querySelector(".loading-log").textContent = "Bootup complete. Welcome!";
    }, 5000); // Adjust the delay as needed
});
