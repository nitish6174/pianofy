bufferSize = 512;
numberOfInputChannels = 1;
numberOfOutputChannels = 1;

playbackRate = 1;

frequencyBinCount = 256;
smoothingTimeConstant = 0.9;
fftSize = 4096;
minDecibels = -100;
maxDecibels = -10;

/*
	each bin freq range = sample rate / fftSize
*/

var visualizer;
var out_elem = document.querySelector('#output div.row');
var keys = JSON.parse(keys);


$(document).ready(function () {
	visualizer = new AudioVisualizer();
	visualizer.setupAudioProcessing();
	visualizer.handleDrop();
});


function AudioVisualizer() {
	this.bins = new Array();
	this.javascriptNode;
	this.audioContext;
	this.sourceBuffer;
	this.analyser;
	this.sampleRate;
}

AudioVisualizer.prototype.setupAudioProcessing = function () {
	//get the audio context
	this.audioContext = new AudioContext();
	this.sampleRate = this.audioContext.sampleRate;
	//create the javascript node
	this.javascriptNode = this.audioContext.createScriptProcessor(bufferSize,numberOfInputChannels,numberOfOutputChannels);
	this.javascriptNode.connect(this.audioContext.destination);
	//create the source buffer
	this.sourceBuffer = this.audioContext.createBufferSource();
	this.sourceBuffer.playbackRate.value = playbackRate;
	//create the analyser node
	this.analyser = this.audioContext.createAnalyser();
	this.analyser.frequencyBinCount = frequencyBinCount;
	this.analyser.smoothingTimeConstant = smoothingTimeConstant;
	this.analyser.fftSize = fftSize;
	this.analyser.minDecibels = minDecibels;
	this.analyser.maxDecibels = maxDecibels;
	//connect source to analyser
	this.sourceBuffer.connect(this.analyser);
	//analyser to speakers
	this.analyser.connect(this.javascriptNode);
	//connect source to analyser
	this.sourceBuffer.connect(this.audioContext.destination);

	for(var i=0;i<frequencyBinCount;i++)
	{
		// var label = i;
		var label = getBinFrequency(this.sampleRate,i);
		out_elem.innerHTML += "<div class='col-sm-1'><span>"+label.toString()+" : </span><span id='bin"+i.toString()+"'></span></div>";
	}

	var that = this;

	//this is where we animates the bars
	this.javascriptNode.onaudioprocess = function () {

		// get the average for the first channel
		var array = new Uint8Array(that.analyser.frequencyBinCount);
		that.analyser.getByteFrequencyData(array);

		for(var i=0;i<frequencyBinCount;i++)
		{
			var elem = document.getElementById('bin'+i.toString());
			elem.innerHTML = array[i];
		}
		// console.log(array);
	}

};


//start the audio processing
AudioVisualizer.prototype.start = function (buffer) {
	this.audioContext.decodeAudioData(buffer, decodeAudioDataSuccess, decodeAudioDataFailed);
	var that = this;

	function decodeAudioDataSuccess(decodedBuffer) {
		that.sourceBuffer.buffer = decodedBuffer
		that.sourceBuffer.start(0);
	}

	function decodeAudioDataFailed() {
		debugger
	}
};


AudioVisualizer.prototype.handleDrop = function () {
	//drag Enter
	document.body.addEventListener("dragenter", function () {
	   
	}, false);

	//drag over
	document.body.addEventListener("dragover", function (e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}, false);

	//drag leave
	document.body.addEventListener("dragleave", function () {
	   
	}, false);

	//drop
	document.body.addEventListener("drop", function (e) {
		e.stopPropagation();

		e.preventDefault();

		//get the file
		var file = e.dataTransfer.files[0];
		var fileName = file.name;

		var fileReader = new FileReader();

		fileReader.onload = function (e) {
			var fileResult = e.target.result;
			visualizer.start(fileResult);
		};

		fileReader.onerror = function (e) {
		  debugger
		};
	   
		fileReader.readAsArrayBuffer(file);
	}, false);
}


function getBinFrequency(sampleRate,binIndex)
{
	binWidth = sampleRate/fftSize;
	f = binWidth*binIndex;
	return Math.round(f);
}