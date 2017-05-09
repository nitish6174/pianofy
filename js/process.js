/* Web audio API constants */

var bufferSize = 256;
var numberOfInputChannels = 1;
var numberOfOutputChannels = 1;

var playbackRate = 1;

var frequencyBinCount = 256;
var fftSize = 4096;
var sampleRate = 44100;
// var binWidth = 10;
// var sampleRate = binWidth*fftSize;
var minDecibels = -100;
var maxDecibels = -10;
var smoothingTimeConstant = 0.9;


/* Playlist variables */

var currentSamplePlaylistIndex;
var currentUserPlaylistIndex;


/* Keys and mapping variables */

var keys = JSON.parse(keys);
var min_note_no = 13;
var max_note_no = 76;

var keys_len = keys.length;
var max_key_freq = keys[keys_len-max_note_no]["frequency"];
var min_key_freq = keys[keys_len-min_note_no]["frequency"];

var bin_frequency_map = [];
var frequency_note_map = {};


/* Calculation related variables */

// No of frequency-amplitude snapshots to be maintained
var history_size = 5;
// Frequency-Amplitude snapshot array
// The array will be seeded after loading MIDI soundfont
freq_amp_arr = new Array(history_size);
// History snapshots are stored in a circular queue fashion, history_pos stores latest index in array
history_pos = 0;



/* Web audio visualizer object initialization */

var visualizer;



/* On page loading */

$(document).ready(function () {

    // Load MIDI soundfont
    MIDI.loadPlugin({
        soundfontUrl: "./soundfont/", 
        instrument: "acoustic_grand_piano", 
        onsuccess: function() {
            // Display keyboard when MIDI soundfont has loaded
            $("#loadingMsg").hide();
            $("#keyboardContainer").show();
            // Seed frequency-amplitude array values
            initializeFrequencyArray();
            // Initialize bin->frequency and frequency->note mapping
            initializeMappings();
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
    if(currentUserPlaylistIndex >= 0)
    {
        // When user's uploaded song is being played
        currentSamplePlaylistIndex = -1;
        songName = userPlaylistFiles[currentUserPlaylistIndex]["name"];
        $(".playlist-item.playing").removeClass("playing");
        $("#userPlaylistItem"+currentUserPlaylistIndex.toString()).addClass("playing");
        $("#currentSongName").html(songName);
        // Navigate to 'Now Playing' tab
        setTimeout(function(){tabSelect(3);}, 500);
        // Uploaded file must read using FileReader and then passed for processing as buffer
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            var fileResult = e.target.result;
            visualizer.startAudioProcessing(fileResult);
        };
        fileReader.readAsArrayBuffer(userPlaylistFiles[currentUserPlaylistIndex]);
    }
    else
    {
        // When sample song is being played
        currentUserPlaylistIndex = -1;
        songName = sampleFiles[currentSamplePlaylistIndex];
        $(".playlist-item.playing").removeClass("playing");
        $("#samplePlaylistItem"+currentSamplePlaylistIndex.toString()).addClass("playing");
        $("#currentSongName").html(songName);
        // Navigate to 'Now Playing' tab
        setTimeout(function(){tabSelect(3);}, 500);
        // Sample songs are audio elements so directly able to start audio processing
        visualizer.startAudioProcessing(currentSamplePlaylistIndex, true);
    }
}



/* Stop song */

AudioVisualizer.prototype.stopSong = function() {
    if(visualizer.audioContext!=undefined && visualizer.audioContext.state!="closed")
        visualizer.audioContext.close();
}



/* Load sample songs and ready the sample playlist for playing */

AudioVisualizer.prototype.handleSampleSongs = function () {
    // Clear markup in sample playlist box
    samplePlaylistElem.innerHTML = "";
    // Iterate through sample songs list (defined in main.js)
    for(var i=0; i<sampleFiles.length; i++)
    {
        // Render markup for sample playlist item
        var elem = addPlaylistItem(sampleFiles[i], i, true);
        // Add click event listener to above added list item
        elem.onclick = function(){
            currentSamplePlaylistIndex = parseInt(this.getAttribute('data-index'));
            currentUserPlaylistIndex = -1;
            visualizer.playSong();
        }
    }
}



/* Handle file upload and user playlist song selection */

AudioVisualizer.prototype.handleSongs = function () {

    // drag enter
    dragDropArea.addEventListener("dragenter", function () {
        $('#fileInput').css("box-shadow", "0px 0px 10px 0px #999");
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
        $('#fileInput').css("box-shadow", "none");
    }, false);

    // drop
    document.addEventListener("drop", function (e) {
        $('#fileInput').css("box-shadow", "none");
        e.stopPropagation();
        e.preventDefault();

        var l = userPlaylistFiles.length;
        if(l==0)
        {
            // Clear markup in sample playlist box
            userPlaylistElem.innerHTML = "";
        }
        uploadedFiles = e.dataTransfer.files;
        // Append new files to global list of uploaded files
        for(var i=0; i<uploadedFiles.length; i++)
            userPlaylistFiles.push(uploadedFiles[i]);
        for(var i=0; i<uploadedFiles.length; i++)
        {
            if(uploadedFiles[i]["type"]=="audio/mp3")
            {
                var filename = uploadedFiles[i]["name"];
                var index = l+i;
                // Render markup for song in user playlist box
                var elem = addPlaylistItem(filename, index);
                // Add click event handler on above playlist item
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

AudioVisualizer.prototype.startAudioProcessing = function (buffer, sample=false) {

    // Store reference to 'this'
    var audioVisualizerObj = this;

    // Stop current song
    if(visualizer.audioContext!=undefined && visualizer.audioContext.state!="closed")
        visualizer.audioContext.close();

    // Audio context
    this.audioContext = new AudioContext();
    this.audioContext.sampleRate = sampleRate;
    // Script processor node
    this.javascriptNode = this.audioContext.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
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
        // Make buffer for playing pianofied audio
        this.sourceBuffer = this.audioContext.createBufferSource();
        this.sourceBuffer.playbackRate.value = playbackRate;
        // Make buffer for playing original audio
        this.sourceBufferOriginal = this.audioContext.createBufferSource();
        this.sourceBufferOriginal.playbackRate.value = playbackRate;
    }
    else
    {
        // 'buffer' is an integer in case of sample playlist song
        // Each sample song is loaded twice in sampleAudios (see main.js)
        b1 = sampleAudios[(2*buffer)];
        b2 = sampleAudios[(2*buffer)+1];
        // Use b1 for pianofied audio and b2 for original audio
        this.sourceBuffer = this.audioContext.createMediaElementSource(b1);
        this.sourceBufferOriginal = this.audioContext.createMediaElementSource(b2);
    }
    // Create audio gain objects
    this.gainNode = this.audioContext.createGain();
    this.gainNodeOriginal = this.audioContext.createGain();

    /* Create connections */
    //  To play pianofied audio : source -> gain node -> analyser -> script processor -> destination
    this.sourceBuffer.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.javascriptNode);
    this.javascriptNode.connect(this.audioContext.destination);
    //  To play original audio  : source -> gain node -> destination
    this.sourceBufferOriginal.connect(this.gainNodeOriginal);
    this.gainNodeOriginal.connect(this.audioContext.destination);

    // Decoded audio data if taking file input and start buffering
    if(sample==false)
    {
        // In case of user uploaded audio, decode the passed buffer and start both original and pianofied buffer
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
        // In case of sample songs, b1 & b2 are audio elements
        // Start playing both audio elements
        b1.play();
        b2.play();
    }

    // Fade between original and piano play mode
    function setGain()
    {
        // Get ratio value from slider
        var elem = document.querySelector("#playModeSlider");
        var x = parseInt(elem.value) / parseInt(elem.max);
        // Use an equal-power crossfading curve:
        var gain1 = Math.cos(x * 0.5 * Math.PI);
        var gain2 = Math.cos((1.0 - x) * 0.5 * Math.PI);
        // Assign these gains to pianofied buffer and original buffer resp.
        visualizer.gainNode.gain.value = gain1;
        visualizer.gainNodeOriginal.gain.value = gain2;     
    }
    setGain();
    // Event handler for slider
    $("#playModeSlider").change(function() { setGain() });


    /* Note extraction calculation as song progresses */

    this.javascriptNode.onaudioprocess = function () {

        // Get amplitude vs frequency data at current time
        var array = new Uint8Array(visualizer.analyser.frequencyBinCount);
        visualizer.analyser.getByteFrequencyData(array);

        // Variables to calculate average amplitude of each bin at current snapshot
        var snapshot_amp_sum = 0;
        var snapshot_bin_count = 0;
        // Loop through each bin to record snapshot
        for(var i=0; i<frequencyBinCount; i++)
        {
            // Get frequency value corresponding to i'th bin
            var f = bin_frequency_map[i];
            if(frequency_note_map[f]!="")
            {
                var amplitude = array[i];
                snapshot_amp_sum += amplitude;
                snapshot_bin_count++;
                // Add current bin's amplitude value to freq-amp snapshot
                freq_amp_arr[history_pos][i] = amplitude;
            }
        }
        // Calculate average amplitude at current snapshot
        var snapshot_amp_avg = snapshot_amp_sum/snapshot_bin_count;
        // Loop through each bin and check if corresponding note should be played
        for(var i=0; i<frequencyBinCount; i++)
        {
            var f = bin_frequency_map[i];
            if(frequency_note_map[f]!="")
            {
                note = frequency_note_map[f];
                // Check if note is to be displayed
                if(checkNote(snapshot_amp_avg, i, 4)==1)
                    $("[data-ipn='"+note+"']").addClass('active');
                else
                    $("[data-ipn='"+note+"']").removeClass('active');
                // Check if note sound is to be played
                if(checkNote(snapshot_amp_avg, i, 4)==1)
                    playNote(note, freq_amp_arr[history_pos][i]);
            }
        }
        // Update history index
        history_pos = (history_pos+1)%history_size;
    }

};



/* Process history to determine if a note is to be played */

function checkNote(snapshot_amp_avg, i, method)
{
    var l = freq_amp_arr[history_pos].length;
    // Find various amplitude values
    var this_amp = freq_amp_arr[history_pos][i];
    var prev_snapshot_amp = freq_amp_arr[(history_pos+history_size-1)%history_size][i];
    var next_snapshot_amp = freq_amp_arr[(history_pos+1)%history_size][i];
    var right_bin_amp = 0;
    var right_bin_amp = 0;
    if(i>0) { left_bin_amp = freq_amp_arr[history_pos][i-1]; }
    if(i<l-1) { right_bin_amp = freq_amp_arr[history_pos][i+1]; }
    // Boolean results for various checks
    var above_avg_amp = (this_amp > (1.3*snapshot_amp_avg+30)) ? true : false;
    var above_left_bin_amp = (this_amp > left_bin_amp) ? true : false;
    var above_right_bin_amp = (this_amp > right_bin_amp) ? true : false;
    var above_prev_snapshot_amp = (this_amp-prev_snapshot_amp >= -30) ? true : false;
    var above_next_snapshot_amp = (this_amp-next_snapshot_amp > 8) ? true : false;
    // Combine various combinations of above boolean checks in different methods
    switch(method)
    {
        case 1: return (above_avg_amp && above_right_bin_amp);
        case 2: return (above_avg_amp && above_right_bin_amp && above_next_snapshot_amp);
        case 3: return (above_avg_amp && above_right_bin_amp && above_prev_snapshot_amp);
        case 4: return (above_prev_snapshot_amp && above_next_snapshot_amp && above_left_bin_amp && above_right_bin_amp);
        default: return 0;
    }
    return 0;
}



/* Seed Frequency-amplitude array with 0 amplitude value */

function initializeFrequencyArray()
{
    for(var i=0; i<history_size; i++)
    {
        freq_amp_arr[i] = new Array(frequencyBinCount);
        for(var j=0; j<frequencyBinCount; j++)
            freq_amp_arr[i][j] = 0;
    }
}



/* Initialize bin->frequency and frequency->note mapping */

function initializeMappings()
{
    for(var i=0; i<frequencyBinCount; i++)
    {
        var freq = binIndexToFrequency(i);
        bin_frequency_map.push(freq);
        frequency_note_map[freq] = frequencyToNote(freq);
    }
}



/* Calculate frequency corresponding to a bin index */

function binIndexToFrequency(binIndex)
{
    binWidth = sampleRate/fftSize;
    f = binWidth*binIndex;
    return Math.round(f);
}



/* Frequency to music note mapping */

function frequencyToNote(frequency)
{
    if(frequency>=min_key_freq && frequency<=max_key_freq)
    {
        var pos = keys_len-max_note_no;
        var mindiff = Math.abs(frequency-keys[pos]['frequency']);
        for(var i=pos; i<=keys_len-min_note_no; i++)
        {
            var diff = Math.abs(frequency-keys[i]['frequency']);
            if(diff<mindiff)
            {
                pos = i;
                mindiff = diff;
            }
        }
        return keys[pos]["note"];
    }
    return "";
}



/* Utility function to play MIDI sound */

function playNote(note, amplitude)
{
    if(typeof note === 'string')
        note = keyToNote(note);
    MIDI.noteOn(0, note, (amplitude*amplitude)/256, 0);
    MIDI.noteOff(0, note, 0.3);
}



/* Convert music letter form to keyboard position (with octave) */

function keyToNote(key)
{
    var l = key.length-1;
    var rawKey = key.substr(0, l);
    var octave = parseInt(key[l]);
    return (octave*12)+keyNoteMap[rawKey];
}



/* Dictionary to convert music letter to number position */

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



/* MIDI sound test function */

function testMIDI()
{
    playNote('C4');
    playNote('E4');
    playNote('G4');
    playNote('A4');
    playNote('C5');
    playNote('E5');
}
