/* Variables */
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
	tabno = tabno.toString();
	$('.tab-head.active').removeClass('active');
	$('.tab-head#tabHead'+tabno).addClass('active');
	$('.tab-page').hide();
	$('.tab-page#page'+tabno).show();
}



/* Playlist */

// Sample files
sampleFiles = [
	"All Of Me.mp3",
	"See You Again - Fast and Furious 7.mp3",
	"Light of the Seven - Game of Thrones.mp3",
	"Hymn For The Weekend.mp3",
	"Following the Footsteps.mp3"
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