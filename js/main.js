/* Variables */
var playlistFiles = [];
var dragDropArea = document.querySelector('#fileInput');
var playlistElem = document.querySelector('#playlist');



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