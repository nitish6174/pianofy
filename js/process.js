var currentSamplePlaylistIndex;
var currentUserPlaylistIndex;

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

/* Calculation related variables */
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

    // MIDI for sound
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/",
        instrument: "acoustic_grand_piano",
        onsuccess: function() {

            $("#loadingMsg").hide();
            $("#keyboardContainer").show();
            initialiseFrequencyBinDisplay();

            // Setup visualiser
            visualizer = new AudioVisualizer();
            visualizer.handleSampleSongs();
            visualizer.handleSongs();

            // Control buttons
            $("#repeatSongButton").click(function(){ visualizer.playSong() });
            $("#stopSongButton").click(function(){ visualizer.stopSong() });

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



/* Play song */

AudioVisualizer.prototype.playSong = function() {
    if(currentUserPlaylistIndex>=0)
    {
        currentSamplePlaylistIndex = -1;
        songName = userPlaylistFiles[currentUserPlaylistIndex]["name"];
        $(".playlist-item.playing").removeClass("playing");
        $("#userPlaylistItem"+currentUserPlaylistIndex.toString()).addClass("playing");
        $("#currentSongName").html(songName);
        setTimeout(function(){tabSelect(3);},500);
        
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            var fileResult = e.target.result;
            visualizer.startAudioProcessing(fileResult);
        };
        fileReader.readAsArrayBuffer(userPlaylistFiles[currentUserPlaylistIndex]);
    }
    else
    {
        currentUserPlaylistIndex = -1;
        songName = sampleFiles[currentSamplePlaylistIndex];
        $(".playlist-item.playing").removeClass("playing");
        $("#samplePlaylistItem"+currentSamplePlaylistIndex.toString()).addClass("playing");
        $("#currentSongName").html(songName);
        setTimeout(function(){tabSelect(3);},500);

        visualizer.startAudioProcessing(currentSamplePlaylistIndex,true);
    }
}



/* Stop song */

AudioVisualizer.prototype.stopSong = function() {
    if(visualizer.audioContext!=undefined && visualizer.audioContext.state!="closed")
        visualizer.audioContext.close();
}



/* Handle sample songs */

AudioVisualizer.prototype.handleSampleSongs = function () {
    samplePlaylistElem.innerHTML = "";
    for(var i=0;i<sampleFiles.length;i++)
    {
        var elem = addPlaylistItem(sampleFiles[i],i,true);
        elem.onclick = function(){
            currentSamplePlaylistIndex = parseInt(this.getAttribute('data-index'));
            currentUserPlaylistIndex = -1;
            visualizer.playSong();
        }
    }
}



/* Handle file upload and playlist song selection */

AudioVisualizer.prototype.handleSongs = function () {

    // drag enter
    dragDropArea.addEventListener("dragenter", function () {
        $('#fileInput').css("box-shadow","0px 0px 10px 0px #999");
    }, false);

    // drag over
    document.addEventListener("dragover", function (e) {
        if(currentTab!=2)
            tabSelect(2);
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

        var l = userPlaylistFiles.length;
        if(l==0)
            userPlaylistElem.innerHTML = "";
        uploadedFiles = e.dataTransfer.files;
        for(var i=0;i<uploadedFiles.length;i++)
            userPlaylistFiles.push(uploadedFiles[i]);
        for(var i=0;i<uploadedFiles.length;i++)
        {
            if(uploadedFiles[i]["type"]=="audio/mp3")
            {
                var filename = uploadedFiles[i]["name"];
                var index = l+i;
                var elem = addPlaylistItem(filename,index);
                elem.onclick = function(){
                    currentUserPlaylistIndex = parseInt(this.getAttribute('data-index'));
                    currentSamplePlaylistIndex = -1;
                    visualizer.playSong();
                }
            }
        }
    }, false);

}



/* Start analyzing on selecting song */

AudioVisualizer.prototype.startAudioProcessing = function (buffer,sample=false) {

    var audioVisualizerObj = this;

    // Stop current song
    if(visualizer.audioContext!=undefined && visualizer.audioContext.state!="closed")
        visualizer.audioContext.close();

    // Audio context
    this.audioContext = new AudioContext();
    this.audioContext.sampleRate = sampleRate;
    // Script processor node
    this.javascriptNode = this.audioContext.createScriptProcessor(bufferSize,numberOfInputChannels,numberOfOutputChannels);
    // Analyser node
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.frequencyBinCount = frequencyBinCount;
    this.analyser.smoothingTimeConstant = smoothingTimeConstant;
    this.analyser.fftSize = fftSize;
    this.analyser.minDecibels = minDecibels;
    this.analyser.maxDecibels = maxDecibels;
    // Source buffer and gain node
    if(sample==false)
    {
        this.sourceBuffer = this.audioContext.createBufferSource();
        this.sourceBuffer.playbackRate.value = playbackRate;
        this.sourceBufferOriginal = this.audioContext.createBufferSource();
        this.sourceBufferOriginal.playbackRate.value = playbackRate;
    }
    else
    {
        b1 = sampleAudios[(2*buffer)];
        b2 = sampleAudios[(2*buffer)+1];
        this.sourceBuffer = this.audioContext.createMediaElementSource(b1);
        this.sourceBufferOriginal = this.audioContext.createMediaElementSource(b2);
    }
    this.gainNode = this.audioContext.createGain();
    this.gainNodeOriginal = this.audioContext.createGain();

    // Connections:
    //  To play piano : source -> gain node -> analyser -> script processor -> destination
    //  To play song  : source -> gain node -> destination
    this.sourceBuffer.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.javascriptNode);
    this.javascriptNode.connect(this.audioContext.destination);
    this.sourceBufferOriginal.connect(this.gainNodeOriginal);
    this.gainNodeOriginal.connect(this.audioContext.destination);

    // Decoded audio data if taking file input and start buffering
    if(sample==false)
    {
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
    }
    else
    {
        b1.play();
        b2.play();
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

        // Get amplitude vs frequency data at current time
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
