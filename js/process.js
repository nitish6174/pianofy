var currentIndex;

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



/* Document loaded */

$(document).ready(function () {

	initialiseFrequencyBinDisplay();

	visualizer = new AudioVisualizer();
	visualizer.handleSongs();

	MIDI.loadPlugin({
		soundfontUrl: "./soundfont/",
		instrument: "acoustic_grand_piano",
		onsuccess: function() {			
			playHardCoded();
		}
	});
	
});


/* Audio visualizer object */

function AudioVisualizer() {
	this.bins = new Array();
	this.javascriptNode;
	this.audioContext;
	this.sourceBuffer;
	this.sourceBufferOriginal;
	this.gainNode;
	this.gainNodeOriginal;
	this.analyser;
}



/* Handle file upload and song selection */

AudioVisualizer.prototype.handleSongs = function () {

	// drag enter
	dragDropArea.addEventListener("dragenter", function () {
		$('#fileInput').css("box-shadow","0px 0px 5px 0px #999");
	}, false);

	// drag over
	document.addEventListener("dragover", function (e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}, false);

	// drag leave
	dragDropArea.addEventListener("dragleave", function () {
		$('#fileInput').css("box-shadow","none");
	}, false);

	// drop
	document.addEventListener("drop", function (e) {
		$('#fileInput').css("box-shadow","none");
		e.stopPropagation();
		e.preventDefault();

		var l = playlistFiles.length;
		if(l==0)
			playlistElem.innerHTML = "";
		uploadedFiles = e.dataTransfer.files;
		for(var i=0;i<uploadedFiles.length;i++)
			playlistFiles.push(uploadedFiles[i]);
		for(var i=0;i<uploadedFiles.length;i++)
		{
			if(uploadedFiles[i]["type"]=="audio/mp3")
			{
				var filename = uploadedFiles[i]["name"];
				var index = l+i;
				var elem = addPlaylistItem(filename,index);
				elem.onclick = function(){
					currentIndex = parseInt(this.getAttribute('data-index'));
					playSong();
				}
			}
		}
	}, false);


	function addPlaylistItem(filename,index)
	{
		var elem = document.createElement("div");
		elem.className = "playlist-item";
		elem.id = "playlistItem"+index.toString();
		elem.setAttribute("data-index",index.toString());
		elem.innerHTML = filename;
		playlistElem.appendChild(elem);
		return elem;
	}

	function playSong()
	{
		songName = playlistFiles[currentIndex]["name"];
		$(".playlist-item.playing").removeClass("playing");
		$("#playlistItem"+currentIndex.toString()).addClass("playing");
		$("#currentSongName").html(songName);
		setTimeout(function(){tabSelect(3);},500);
		
		var fileReader = new FileReader();
		fileReader.onload = function (e) {
			var fileResult = e.target.result;
			visualizer.startAudioProcessing(fileResult);
		};
		fileReader.readAsArrayBuffer(playlistFiles[currentIndex]);
	}

	function stopSong()
	{
		if(visualizer.audioContext!=undefined && visualizer.audioContext.state!="closed")
			visualizer.audioContext.close();
	}

	// control buttons
	$("#repeatSongButton").click(function(){ playSong() });
	$("#stopSongButton").click(function(){ stopSong() });

}



/* Start analyzing on selecting song */

AudioVisualizer.prototype.startAudioProcessing = function (buffer) {

	var audioVisualizerObj = this;

	// stop current song
	if(visualizer.audioContext!=undefined && visualizer.audioContext.state!="closed")
		visualizer.audioContext.close();
	// Make audio context
	this.audioContext = new AudioContext();
	this.audioContext.sampleRate = sampleRate;
	// create the javascript node
	this.javascriptNode = this.audioContext.createScriptProcessor(bufferSize,numberOfInputChannels,numberOfOutputChannels);
	this.javascriptNode.connect(this.audioContext.destination);
	// create the analyser node
	this.analyser = this.audioContext.createAnalyser();
	this.analyser.frequencyBinCount = frequencyBinCount;
	this.analyser.smoothingTimeConstant = smoothingTimeConstant;
	this.analyser.fftSize = fftSize;
	this.analyser.minDecibels = minDecibels;
	this.analyser.maxDecibels = maxDecibels;
	// analyser to speakers
	this.analyser.connect(this.javascriptNode);

	// create the source buffer and gain node
	this.sourceBuffer = this.audioContext.createBufferSource();
	this.sourceBuffer.playbackRate.value = playbackRate;
	this.gainNode = this.audioContext.createGain();
	this.sourceBufferOriginal = this.audioContext.createBufferSource();
	this.sourceBufferOriginal.playbackRate.value = playbackRate;
	this.gainNodeOriginal = this.audioContext.createGain();
	// connect source -> gainNode -> song/analyser
	this.sourceBuffer.connect(this.gainNode);
	this.gainNode.connect(this.analyser);
	this.sourceBufferOriginal.connect(this.gainNodeOriginal);
	this.gainNodeOriginal.connect(this.audioContext.destination);

	// get decoded audio data into audio context
	this.audioContext.decodeAudioData(buffer, decodeAudioDataSuccess, decodeAudioDataFailed);
	function decodeAudioDataSuccess(decodedBuffer) {
		visualizer.sourceBuffer.buffer = decodedBuffer
		visualizer.sourceBuffer.start(0);
		visualizer.sourceBufferOriginal.buffer = decodedBuffer
		visualizer.sourceBufferOriginal.start(0);
	}
	function decodeAudioDataFailed() {
		debugger
	}

	// Fade between original and piano play mode
	function setGain()
	{
		var elem = document.querySelector("#playModeSlider");
		var x = parseInt(elem.value) / parseInt(elem.max);
		// Use an equal-power crossfading curve:
		var gain1 = Math.cos(x * 0.5*Math.PI);
		var gain2 = Math.cos((1.0 - x) * 0.5*Math.PI);
		visualizer.gainNode.gain.value = gain1;
		visualizer.gainNodeOriginal.gain.value = gain2;		
	}
	setGain();
	$("#playModeSlider").change(function() { setGain() });


	/* Note extraction calculation as song progresses */

	this.javascriptNode.onaudioprocess = function () {

		// get the average for the first channel
		var array = new Uint8Array(visualizer.analyser.frequencyBinCount);
		visualizer.analyser.getByteFrequencyData(array);

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
				if(checkPlayNote(slice_avg,history,i)==1)
					playNote(note,history[history_pos][i]);
			}
		}
		history_pos=(history_pos+1)%history_size;
	}

};



/* Mapping and calculation functions */

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



/* Notes playing and display */

// Frequency-amplitude display initialisation
function initialiseFrequencyBinDisplay()
{
	for(var i=0;i<frequencyBinCount;i++)
	{
		var label = getBinFrequency(i);
		out_elem.innerHTML += "<div class='col-sm-1'><span id='freq"+i.toString()+"'>"+label.toString()+"</span> : <span id='bin"+i.toString()+"'></span></div>";
		addMapping(label);
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

function playNote(note,amplitude)
{
	if(typeof note === 'string')
		note = keyToNote(note);
	// MIDI.noteOn(0, note, 100, 0);
	MIDI.noteOn(0, note, (amplitude*amplitude)/256, 0);
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
	if( amp>1.3*slice_avg+30 )
	{
		if( (i==l||history[history_pos][i]>history[history_pos][i+1]) && amp-history[(history_pos+history_size-1)%history_size][i]>=-30 )
			return 1;
	}
	return 0;
}

function checkPlayNote(slice_avg,history,i)
{
	var amp = history[history_pos][i];
	var l = history[history_pos].length;
	if( amp>1.3*slice_avg+30 )
	{
		if( (amp-history[(history_pos+1)%history_size][i]>8) && (i==l||history[history_pos][i]>history[history_pos][i+1]))
			return 1;
	}
	return 0;
}