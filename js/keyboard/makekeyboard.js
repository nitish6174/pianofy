var nOctaves = 5;
var container = document.querySelector('#keyboard');

piano(container, {octaves: nOctaves});
container.classList.add('piano-show-names');


resizeKeyboard(nOctaves);

/* Re-size keyboard to fit width */

function resizeKeyboard(nOctaves)
{
	var nKeys = 7*nOctaves + 3;
	var keyboardWidth = window.innerWidth-30;
	keyboardWidth = parseInt(keyboardWidth);
	// ratios
	var whiteKeyWidth = keyboardWidth/nKeys;
	var whiteKeyHeight = keyboardWidth/6;
	var blackKeyWidth = whiteKeyWidth/1.7;
	var blackKeyHeight = whiteKeyHeight/1.65;
	// white key
	$('#beautiful-piano li').css('width',whiteKeyWidth);
	$('#beautiful-piano li a,#beautiful-piano li div.anchor').css('height',whiteKeyHeight);
	// black key
	$('#beautiful-piano li span').css('width',blackKeyWidth);
	$('#beautiful-piano li span').css('left',-blackKeyWidth/2);
	$('#beautiful-piano li span').css('height',blackKeyHeight);
	// key label
	// $('.piano-show-names #beautiful-piano div[data-keyname]:not(:active):not(.active):after').css('font-size',whiteKeyWidth/2.2);
	// $('.piano-show-names #beautiful-piano div[data-keyname]:not(:active):not(.active):after').css('bottom',whiteKeyHeight/10);
	// $('.piano-show-names #beautiful-piano span[data-keyname]:not(:active):not(.active):after').css('font-size',blackKeyWidth/2);

}

window.onresize = function(){
	resizeKeyboard(nOctaves);
}