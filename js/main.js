/* Load keys JSON data */
var keys = JSON.parse(keys);

/* Constants */
var bufferSize = 512;
var numberOfInputChannels = 1;
var numberOfOutputChannels = 1;

var playbackRate = 1;

var frequencyBinCount = 256;
var smoothingTimeConstant = 0.9;
var fftSize = 4096;
var minDecibels = -100;
var maxDecibels = -10;

/* Keys */
var tracks = 1;
var threshold = 127;
var min_note_no = 13;
var max_note_no = 76;

var keys_len = keys.length;
var max_key_freq = keys[keys_len-max_note_no]["frequency"];
var min_key_freq = keys[keys_len-min_note_no]["frequency"];
var freq_map = {};


/* MP3 processing */
var visualizer;
var out_elem = document.querySelector('#output div.row');


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
	// Uncomment the below line to play mp3 file
	// this.sourceBuffer.connect(this.audioContext.destination);

	for(var i=0;i<frequencyBinCount;i++)
	{
		var label = getBinFrequency(this.sampleRate,i);
		out_elem.innerHTML += "<div class='col-sm-1'><span id='freq"+i.toString()+"'>"+label.toString()+"</span> : <span id='bin"+i.toString()+"'></span></div>";
		addMapping(label);
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
			f = parseInt(document.getElementById('freq'+i.toString()).innerHTML);
			if(freq_map[f]!=undefined)
			{
				note = freq_map[f];
				if(array[i]>=threshold)
					$("[data-ipn='"+note+"']").addClass('active');
				else
					$("[data-ipn='"+note+"']").removeClass('active');
			}

			elem.innerHTML = array[i];
		}
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

function addMapping(frequency)
{
	if(frequency>=min_key_freq && frequency<=max_key_freq)
	{
		var pos = keys_len-max_note_no;
		var mindiff = Math.abs(frequency-keys[pos]['frequency']);
		for(var i=pos;i<=keys_len-min_note_no;i++)
		{
			var diff = Math.abs(frequency-keys[i]['frequency']);
			if(diff<mindiff)
			{
				pos=i;
				mindiff=diff;
			}
		}
		freq_map[frequency] = keys[pos]["note"];
	}
}