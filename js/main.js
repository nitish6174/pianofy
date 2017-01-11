/* Variables */
var playlistFiles = [];
var dragDropArea = document.querySelector('#fileInput');
var playlistElem = document.querySelector('#playlist');
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

]
sampleFilePaths = [];
for(var i=0;i<sampleFiles.length;i++)
	sampleFilePaths[i] = "./songs/"+sampleFiles[i];

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
		elem.id = "playlistItem"+index.toString();
		playlistElem.appendChild(elem);		
	}
	return elem;
}