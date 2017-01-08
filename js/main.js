/* Variables */
var playlistFiles = [];



/* On load */

$(document).ready(function(){
	tabSelect(1);
	uploadFilePageBocHeight = window.innerHeight-120;
	$('#fileInput').height(uploadFilePageBocHeight);
	$('#playlistBox').height(uploadFilePageBocHeight);	
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



// /* Drag events */

// // drag enter
// document.body.addEventListener("dragenter", function () {

// }, false);

// // drag over
// document.body.addEventListener("dragover", function (e) {
// 	e.stopPropagation();
// 	e.preventDefault();
// 	e.dataTransfer.dropEffect = 'copy';
// }, false);

// // drag leave
// document.body.addEventListener("dragleave", function () {

// }, false);

// // drop
// document.body.addEventListener("drop", function (e) {
// 	e.stopPropagation();
// 	e.preventDefault();

// 	var l = playlistFiles.len;
// 	if(l==0)
// 		playlistElem.innerHTML = "";
// 	uploadedFiles = e.dataTransfer.files;
// 	playlistFiles =  playlistFiles.concat(uploadedFiles);
// 	for(var i=0;i<uploadedFiles.length;i++)
// 	{
// 		if(uploadedFiles[i]["type"]=="audio/mp3")
// 			addPlaylistItem(uploadedFiles[i]["name"],l+i);
// 	}
// }, false);