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
	// ratios
	var whiteKeyWidth = keyboardWidth/nKeys;
	var whiteKeyHeight = keyboardWidth/6;
	var blackKeyWidth = whiteKeyWidth/1.7;
	var blackKeyHeight = whiteKeyHeight/1.65;
	// white key
	$('#beautiful-piano li').css('width',whiteKeyWidth);
	$('#beautiful-piano li a,#beautiful-piano li div.anchor').css('height',whiteKeyHeight);
	$('#beautiful-piano li div.anchor:active:before, #beautiful-piano li div.anchor.active:before').css('border-width',whiteKeyHeight+"px 5px 0px");
	$('#beautiful-piano li div.anchor:active:after, #beautiful-piano li div.anchor.active:after').css('border-width',whiteKeyHeight+"px 5px 0px");
	// black key
	$('#beautiful-piano li span').css('width',blackKeyWidth);
	$('#beautiful-piano li span').css('left',-blackKeyWidth/2);
	$('#beautiful-piano li span').css('height',blackKeyHeight);
}

window.onresize = function(){
	resizeKeyboard(nOctaves);
}