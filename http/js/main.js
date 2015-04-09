function changeUrl(title, url) {
	if (typeof (history.pushState) != "undefined") {
		var obj = { Title: title, Url: url };
		history.pushState(obj, obj.Title, obj.Url);
	}
}

function goToPage(page, fade)
{
	page = /[^/]*$/.exec(page)[0];
	if(page === "" || page === "#")
		page="#information";

	var pageLink = $("#nav-table>a[href='" + page + "']");
	if(pageLink.length === 0)
		return;

	var pageUrl = page;
	page = $(page + "-page");

	$("#nav-table>a").removeClass("selected-page");
	pageLink.addClass("selected-page");
	$("#content>div").removeClass("displayed-content");
	
	if(fade)
	{
		$("#content>div").not(page).animate({opacity: 0.0}, 200, function()
				{
					$("#content>div").not(page).hide();
					page.show();
					page.animate({opacity: 1.0}, 200);
				});
	}
	else
	{
		$("#content>div").not(page).hide().css("opacity", 0.0);
		page.show();
	}

	var title = page.find("h2").text() + " - LBS Game Jam";
	document.title = title;
	changeUrl(title, pageUrl);
}

function backendCall(func, data, complete)
{
	$.post("backend.fcgi/" + func,
			JSON.stringify(data),
			complete,
			"json");
}

function displayKeyCode(code)
{
	$("#registration-form *").prop("disabled", true);

	$("#keycode").text(code);
	$("#keycode-display").fadeIn(1000);
	$(document).scrollTo($("#keycode-display"), 1000);
}

var waitingForReply = false;
function register()
{
	if(waitingForReply)
		return;

	var name = $("#name").val().trim();
	var teamName = $("#team-name").val().trim();
	var teamMembers = Number($("#team-members").val());

	if(name === "")
	{
		$("#name").addClass("missing");
		return;
	}

	var data = {
		Name: name,
		TeamMembers: teamMembers
	};

	if(teamName !== "")
		data.TeamName = teamName;

	waitingForReply = true;
	backendCall("Register",
			data,
			function(res)
			{
				waitingForReply = false;

				if(res.Status === 0)
				{
					waitingForReply = false;
					displayKeyCode(res.Key);
				}
				else
				{
					alert("Ojdå, något gick fel. :(\n\nProva gärna igen eller kontakta cberry på IRC. Visa honom det här:\n\n" + JSON.stringify(res));
				}
			});
}

$(function(){
	goToPage(document.location);

	$("#countdown")
		.countdown("2015/04/10 06:00 UTC", function(event) {
			var totalHours = event.offset.totalDays * 24 + event.offset.hours;
			$(this).html(
					totalHours + event.strftime(' timmar <span>|</span> %-M %!M:minut,minuter; <span>|</span> %-S %!S:sekund,sekunder;')
					);
		});

	$("#nav-table>a").click(function()
			{
				goToPage(this.href, true);
				return false;
			});

	$("#banner>a").click(function(){
		$(this).find("h1").addClass("banner-rotated");
		var that = this;
		setTimeout(function()
				{
					$(that).find("h1").removeClass("banner-rotated");
				}, 1000);
		return false;
	});

	$("#suggest-theme").submit(function()
			{
				var themeInput = $("#suggest-theme>input[type='text']");
				var theme = themeInput.val().trim();

				if(theme === "")
					return false;

				backendCall("SuggestTheme", theme);
				$(this).find("input").prop("disabled", true);
				$(this).find("input[type='text']").val("Tack!");
				return false;
			});

	$("#registration-form input, select").click(function() { $(this).removeClass("missing"); });
	$("#registration-form").submit(function()
			{
				register();
				return false;
			});
});

