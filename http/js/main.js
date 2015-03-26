function changeUrl(title, url) {
	if (typeof (history.pushState) != "undefined") {
		var obj = { Title: title, Url: url };
		history.pushState(obj, obj.Title, obj.Url);
	}
}

function goToPage(page)
{
	var page = /[^/]*$/.exec(page)[0];
	if(page === "" || page === "#")
		return;

	var pageLink = $("#nav-table>a[href='" + page + "']");
	if(pageLink.length === 0)
		return;

	$("#nav-table>a").removeClass("selected-page");
	pageLink.addClass("selected-page");
	$("#content>div").removeClass("displayed-content");
	$(page).addClass("displayed-content");

	var title = $(page).find("h2").text() + " - LBS Game Jam";
	document.title = title;
	changeUrl(title, page);
}

$(function(){
	$("#countdown")
		.countdown("2015/04/10 07:00 UTC", function(event) {
			var totalHours = event.offset.totalDays * 24 + event.offset.hours;
			$(this).html(
					totalHours + event.strftime(' timmar <span>|</span> %-M %!M:minut,minuter; <span>|</span> %-S %!S:sekund,sekunder;')
					);
		});

	$("#nav-table>a").click(function()
			{
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

	goToPage(document.location);
});
