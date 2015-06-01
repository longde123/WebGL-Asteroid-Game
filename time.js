//time variables
var startTime = 0, elapsedTime = 0, currentTime = 0;
//grab correct elapsed time
function getElapsedTime(){
	currentTime = new Date();
	elapsedTime = currentTime-startTime;
	elapsedTime = elapsedTime / 1000;
	return elapsedTime;
}

function resetTimeandScale(){
    startTime = 0;
    elapsedTime = 0;
    currentTime = 0; 
	startTime = new Date();
    planets[0].scale = 5;
}