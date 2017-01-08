$('.tab-page#page1').show();

$('.tab-head').click(function(){
	var id = "page"+$(this).attr('data-tabno');
	$('.tab-head.active').removeClass('active');
	$(this).addClass('active');
	$('.tab-page').hide();
	$('.tab-page#'+id).show();
});