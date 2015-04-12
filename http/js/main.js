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

var uploading = false;
function uploadEntry(complete)
{
	if(uploading)
		return;

	var files = $("#entry-archive")[0].files;
	var data = new FormData();

	var file = false;
	
	if(files.length !== 0)
	{
		file = true;
		data.append("Archive", files[0], files[0].name);
	}

	var entryCode = $("#entry-code").val().trim();
	var entryName = $("#entry-name").val().trim();
	var entryDesc = $("#entry-desc").val().trim();

	var missing = false;
	
	if(entryCode === "")
	{
		$("#entry-code").addClass("missing");
		missing = true;
	}
	
	if(entryName === "")
	{
		$("#entry-name").addClass("missing");
		missing = true;
	}
	
	if(entryDesc === "")
	{
		$("#entry-desc").addClass("missing");
		missing = true;
	}	

	if(missing)
		return;
	
	data.append("Code", entryCode);
	data.append("Name", entryName);
	data.append("Description", entryDesc);
	data.append("Link", $("#entry-link").val().trim());
	
	//console.log(data.getAll())

	console.log("sending");
	if(file)
		$("#submit-button").val("Laddar upp...");

	uploading = true;
	$.ajax({
		url: "/backend.fcgi/UploadEntry",
		data: data,
		processData: false,
		type: "POST",
		contentType: false,
		success: function(result)
			{
				console.log("result: ", result);
				if(result.Status === 4 || result.Status === 1)
					alert("Ojdå, något gick fel. :(\n\nProva gärna igen eller kontakta cberry på IRC. Visa honom det här:\n\n" + JSON.stringify(result));
				else if(result.Status === 3)
					$("#wrong-key-message").fadeIn();
				else if(result.Status === 2)
					alert("Filen är för stor. Den får vara som högst 50 MB.");
				else if(result.Status === 0)
				{
					if(file)
						$("#submit-button").val("Uppladdat!");

					$("#upload-form *").prop("disabled", true);

					$("#upload-done").fadeIn(1000);
					$(document).scrollTo($("#upload-done"), 1000);
				}
				uploading = false;
			},
		dataType: "json"});
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

function revealTheme()
{
	$("#time-display").fadeOut(1400)
	$.ajax({
		url: "/theme",
		dataType: "text",
		success: function(theme)
		{
			setTimeout(function()
					{
						$("#theme-display>span").text(theme);
						$("#theme-display").fadeIn(3000);
					}, 1300);
		},
		error: function()
		{
			$("#theme-display").text("Din klocka verkar vara lite för snabb, och inget tema har valts ut än. Prova att ladda om sidan!");
			$("#theme-display").addClass("error");
			$("#theme-display").fadeIn(1000);
		}
	});
}

$(function(){
	goToPage(document.location);

	var revealDate = new Date("2015/04/10 06:00 UTC");
	var now = new Date();

	if(revealDate < now)
		$.ajax({
			url: "/theme",
			dataType: "text",
			success: function(theme)
			{
				$("#theme-display>span").text(theme);
				$("#theme-display").show();
			},
			error: function()
			{
				$("#theme-display").text("Din klocka verkar vara lite för snabb, och inget tema har valts ut än. Prova att ladda om sidan!");
				$("#theme-display").addClass("error");
				$("#theme-display").show();
			}});
	else
		$("#countdown")
			.countdown(revealDate, function(event) {
				var totalHours = event.offset.totalDays * 24 + event.offset.hours;
				$(this).find("#time-display").html(
						totalHours + event.strftime(' timmar <span>|</span> %-M %!M:minut,minuter; <span>|</span> %-S %!S:sekund,sekunder;')
						);
			}).on("finish.countdown", function()
				{
					revealTheme();
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

	$("#upload-form").submit(function()
			{
				uploadEntry();
				return false;
			});
	$("#upload-form input, textarea").click(function() { $(this).removeClass("missing"); });
	$("#entry-code").click(function()
			{
				$("#wrong-key-message").fadeOut();
			});
});

