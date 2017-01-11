/* Variables */
var currentTab = 1;
var userPlaylistFiles = [];
var dragDropArea = document.querySelector('#fileInput');
var userPlaylistElem = document.querySelector('#userPlaylist');
var samplePlaylistElem = document.querySelector('#samplePlaylist');



/* On load */

$(document).ready(function(){
	tabSelect(1);
	uploadFilePageBocHeight = window.innerHeight-120;
	$('#fileInput').height(uploadFilePageBocHeight);
	$('.playlist-box').height(uploadFilePageBocHeight);
});



/* Tab switching */

$('.tab-head').click(function(){
	var tabno = $(this).attr('data-tabno');
	tabSelect(tabno);
});

function tabSelect(tabno)
{
	if(tabno==undefined)
	{
		tabno = currentTab;
	}
	else
	{
		currentTab = tabno;
		tabno = tabno.toString();
	}
	$('.tab-head.active').removeClass('active');
	$('.tab-head#tabHead'+tabno).addClass('active');
	$('.tab-page').hide();
	$('.tab-page#page'+tabno).show();
}



/* Playlist */

// Sample files
sampleFiles = [
	"See You Again - Fast and Furious 7.mp3",
	"Requiem for a Dream (theme music).mp3",
	"Primavera.mp3",
	"Hymn For The Weekend.mp3",
	"All Of Me.mp3",
	"Stairway to Heaven.mp3",
	"Tip My Hat and Farewell.mp3",
	"Light of the Seven - Game of Thrones.mp3",
	"Exhausted.mp3",
	"Let Her Go.mp3",
	"Following the Footsteps.mp3",
	"Leaves in the Wind.mp3",
	"I Giorni.mp3",
	"Facing the Mirror.mp3",
	"Felicity.mp3",
]
sampleFilePaths = [];
sampleAudios = [];
for(var i=0;i<sampleFiles.length;i++)
{
	sampleFilePaths[i] = "./songs/"+sampleFiles[i];
	sampleAudios[(2*i)] = new Audio(sampleFilePaths[i]);
	sampleAudios[(2*i)+1] = new Audio(sampleFilePaths[i]);
}

// Add playlist item
function addPlaylistItem(filename,index,sample=false)
{
	var elem = document.createElement("div");
	elem.className = "playlist-item";
	elem.setAttribute("data-index",index.toString());
	elem.innerHTML = filename;
	if(sample==true)
	{
		elem.id = "samplePlaylistItem"+index.toString();
		samplePlaylistElem.appendChild(elem);
	}
	else
	{
		elem.id = "userPlaylistItem"+index.toString();
		userPlaylistElem.appendChild(elem);
	}
	return elem;
}