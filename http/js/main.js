function goToPage(page)
{
	return false;
	var page = /[^/]*$/.exec(page)[0];
	if(page === "" || page === "#")
	   page = "#countdown";	

	//var pageLink = 

	$("#nav-table>a").removeClass("selected-page");
	alert(page);
}

$(function(){
	$("#countdown")
		.countdown("2015/04/10 07:00 UTC", function(event) {
			var totalHours = event.offset.totalDays * 24 + event.offset.hours;
			$(this).html(
					totalHours + event.strftime(' timmar<br>%-M %!M:minut,minuter;<br>%-S %!S:sekund,sekunder;')
					);
		});

	$("#nav-table>a").click(function()
			{
				$("#nav-table>a").removeClass("selected-page");
				$(this).addClass("selected-page");
				goToPage(this.href);
				return false;
			});

	$("#banner>a").click(function(){
		$(this).find("h1").addClass("banner-rotated");
		var that = this;
		setTimeout(function()
				{
					$(that).find("h1").removeClass("banner-rotated");
				}, 1000);
	});
});
