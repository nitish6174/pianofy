/* Play mode */
// var playMode = "song"
var playMode = "piano"

/* Load keys JSON data */
var keys = JSON.parse(keys);

/* Constants */
var bufferSize = 256;
var numberOfInputChannels = 1;
var numberOfOutputChannels = 1;

var playbackRate = 1;

var frequencyBinCount = 256;
var fftSize = 4096;
// var binWidth = 10;
var sampleRate = 44100;
// var sampleRate = binWidth*fftSize;
var minDecibels = -100;
var maxDecibels = -10;
var smoothingTimeConstant = 0.9;

/* Keys */
var tracks = 1;
var history_size = 5;
var min_note_no = 13;
var max_note_no = 76;
var duration = 4;

var keys_len = keys.length;
var max_key_freq = keys[keys_len-max_note_no]["frequency"];
var min_key_freq = keys[keys_len-min_note_no]["frequency"];
var freq_map = {};

var history = new Array(history_size);
for (var i=0;i<history_size;i++)
{
	history[i] = new Array(frequencyBinCount);
	for (var j=0;j<frequencyBinCount;j++)
		history[i][j] = 0;
}
history_pos = 0;

/* MP3 processing */
var visualizer;
var out_elem = document.querySelector('#output div.row');


$(document).ready(function () {
	visualizer = new AudioVisualizer();
	visualizer.setupAudioProcessing();
	visualizer.handleDrop();
	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		onsuccess: function() {			
			playHardCoded();
		}
	});
});


function AudioVisualizer() {
	this.bins = new Array();
	this.javascriptNode;
	this.audioContext;
	this.sourceBuffer;
	this.analyser;
}

AudioVisualizer.prototype.setupAudioProcessing = function () {
	//get the audio context
	this.audioContext = new AudioContext();
	this.audioContext.sampleRate = sampleRate;
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
	if(playMode=="song")
		this.sourceBuffer.connect(this.audioContext.destination);

	for(var i=0;i<frequencyBinCount;i++)
	{
		var label = getBinFrequency(i);
		out_elem.innerHTML += "<div class='col-sm-1'><span id='freq"+i.toString()+"'>"+label.toString()+"</span> : <span id='bin"+i.toString()+"'></span></div>";
		addMapping(label);
	}

	var that = this;

	//this is where we animates the bars
	this.javascriptNode.onaudioprocess = function () {

		// get the average for the first channel
		var array = new Uint8Array(that.analyser.frequencyBinCount);
		that.analyser.getByteFrequencyData(array);

		var slice_sum = 0;
		var slice_count = 0;
		for(var i=0;i<frequencyBinCount;i++)
		{
			var f = parseInt(document.getElementById('freq'+i.toString()).innerHTML);
			var elem = document.getElementById('bin'+i.toString());
			if(freq_map[f]!=undefined)
			{
				slice_sum += array[i];
				slice_count++;
				elem.innerHTML = array[i];
				history[history_pos][i] = array[i];
			}
		}
		var slice_avg = slice_sum/slice_count;
		for(var i=0;i<frequencyBinCount;i++)
		{
			var f = parseInt(document.getElementById('freq'+i.toString()).innerHTML);
			if(freq_map[f]!=undefined)
			{
				note = freq_map[f];
				if(checkDisplayNote(slice_avg,history,i)==1)
					$("[data-ipn='"+note+"']").addClass('active');
				else
					$("[data-ipn='"+note+"']").removeClass('active');
				if(playMode=="piano")
				{
					if(checkPlayNote(slice_avg,history,i)==1)
						playNote(note);
				}
			}
		}
		history_pos=(history_pos+1)%history_size;
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


function getBinFrequency(binIndex)
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


function playHardCoded()
{
	// playNote('C4');
	// playNote('E4');
	// playNote('G4');
	// playNote('A4');
	// playNote('C5');
	// playNote('E5');
}

function playNote(note)
{
	if(typeof note === 'string')
		note = keyToNote(note);
	MIDI.noteOn(0, note, 127, 0);
	MIDI.noteOff(0, note, 0.3);
}

function keyToNote(key)
{
	var l = key.length-1;
	var rawKey = key.substr(0,l);
	var octave = parseInt(key[l]);
	return (octave*12)+keyNoteMap[rawKey];
}

var keyNoteMap = {
	'A':1,
	'A#':2,
	'B':3,
	'C':4,
	'C#':5,
	'D':6,
	'D#':7,
	'E':8,
	'F':9,
	'F#':10,
	'G':11,
	'G#':12
};

function checkDisplayNote(slice_avg,history,i)
{
	var amp = history[history_pos][i];
	var l = history[history_pos].length;
	if( amp>1.3*slice_avg+50 )
	{
		if( i==l||history[history_pos][i]>history[history_pos][i+1] )
			return 1;
	}
	return 0;
}

function checkPlayNote(slice_avg,history,i)
{
	var amp = history[history_pos][i];
	var l = history[history_pos].length;
	var score1 = amp-1.25*slice_avg-30;
	var score2 = amp-history[(history_pos+1)%history_size][i];
	var score = score1 + score2;
	if( amp>1.3*slice_avg+50 )
	{
		if(amp-history[(history_pos+1)%history_size][i]>=10)
			return 1;
	}
	return 0;
}