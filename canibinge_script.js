// SAMPLE JSON RETURN:
// Success callback: {"page":1,"total_results":2,"total_pages":1,"results":[{"original_name":"Westworld","genre_ids":[878,37],"name":"Westworld","popularity":248.284,"origin_country":["US"],"vote_count":2183,"first_air_date":"2016-10-02","backdrop_path":"\/yGNnjoIGOdQy3douq60tULY8teK.jpg","original_language":"en","id":63247,"vote_average":8.1,"overview":"A dark odyssey about the dawn of artificial consciousness and the evolution of sin. Set at the intersection of the near future and the reimagined past, it explores a world in which every human appetite, no matter how noble or depraved, can be indulged.","poster_path":"\/y55oBgf6bVMI7sFNXwJDrSIxPQt.jpg"},{"original_name":"Beyond Westworld","genre_ids":[10765],"name":"Beyond Westworld","popularity":2.009,"origin_country":["US"],"vote_count":0,"first_air_date":"1980-03-05","backdrop_path":null,"original_language":"en","id":411,"vote_average":0,"overview":"Beyond Westworld was a short-lived 1980 television series that carried on the stories of the two feature films, Westworld and Futureworld. It featured Jim McMullan as Security Chief John Moore of the Delos Corporation. The story revolved around John Moore having to stop the evil scientist, Quaid, as he planned to use the robots in Delos to try to take over the world. Despite being nominated for two Emmys, only five episodes were produced, and only three of them were aired before cancellation.","poster_path":null}]}
// JSON RETURN IF NO RESULTS FOUND:
// Success callback: {"page":1,"total_results":0,"total_pages":0,"results":[]}

var template, errorTemplate, searchBox, suggestionContainer, showContainer;
var timeNumber = 1; // default: 1
var timeUnit = 1440; // default: 1440 minutes i.e. minutes in a day
var timeUnitMultiplier = 1; // 1 = 1 day; 7 = 1 week; 30 = 1 month; 365 = 1 year
// Multiply timeNumber * timeUnit * timeUnitMultiplier to get total time available

$(document).ready(function () {
	$('#search-form').submit(function (e) {
		e.preventDefault(); // stops page redirect
	});
	
	$('#search-box').focus(function () {
		$('#search-suggestion-container').addClass('enabled');
	});
	
	$(document).click(function (e) { // close suggestions container when clicking outside search box/button
		if (!$('#search-box').is(e.target) && !$('#search-button').is(e.target)) {
			closeSearch();
		}
	});
	
//	$('#search-button').click(function () {
//		var query = $('#search-box').val();
//		theMovieDb.search.getTv({"query":query}, successCB, errorCB);
//	});
	 
	$('#search-box').on('input', delay(function (e) { // start new search every time text in search box changes
        var query = $('#search-box').val();
        if (query.length != 0) { // send query only if there's something in text box
            theMovieDb.search.getTv({"query":query}, successCB, errorCB);
        } else {
            populateError(0);
        }
	}, 100)); // delay by 200ms to account for typing
		
	// search suggestions template
    template = document.querySelector('#search-suggestion-template'); // select template element
    errorTemplate = document.querySelector('#search-error-template'); // select error template element
	searchBox = document.querySelector('#search-box'); // select search box (starting point of arrow navigation)
    suggestionContainer = document.querySelector('#search-suggestion-container'); // select suggestions container
	showContainer = document.querySelector('.show-container'); // select show container
	
//	scrollResults(); // activate search suggestion navigation using arrow keys
//	theMovieDb.tv.getById({"id":63247}, show_successCB, show_errorCB);
});

function successCB(data) {
//	console.log("Success callback: " + data);
	var queryData = JSON.parse(data);
	
	$('#search-suggestion-container').empty(); // clear search suggestions
	if (queryData.total_results != 0) { // if something returned from query
		populateResults(queryData);
	} else {
		populateError(1);
	}
	
	scrollResults(); // activate search suggestion navigation using arrow keys
	selectResults(); // activate event listener for show selection
}
        
function errorCB(data) { // LIKELY WON'T BE CALLED but as backup, only called when nothing gets returned from a sent query; a query w/ no results goes to successCB()
    console.log("Error callback: " + data);
	populateError(0);
}

function populateResults(queryData) {
	if ('content' in document.createElement('template')) { // if template tag is supported
		for (var i = 0; i < Math.min(queryData.results.length, 5); i++) { // display up to 5 results
			console.log(queryData.results[i].name + ': ' + queryData.results[i].overview);
			// ID/TITLE/OVERVIEW
			var clone = template.content.cloneNode(true);
			clone.querySelector('.search-suggestion').setAttribute('data-tvid', queryData.results[i].id);
			clone.querySelector('.search-suggestion-title').textContent = queryData.results[i].name;
			clone.querySelector('.search-suggestion-overview').textContent = queryData.results[i].overview;
			// POSTER
			var posterURL;
			if (queryData.results[i].poster_path != null) {
				posterURL = 'https://image.tmdb.org/t/p/w500' + queryData.results[i].poster_path;
				clone.querySelector('.search-suggestion-poster').setAttribute('src', posterURL);
				clone.querySelector('.search-suggestion-poster').setAttribute('alt', 'Poster for “'+queryData.results[i].name+'”.');
			} else {
				posterURL = '';
				clone.querySelector('.search-suggestion-poster').setAttribute('src', posterURL);
				clone.querySelector('.search-suggestion-poster').setAttribute('alt', '');
			}
			// ADD CLONE TO CONTAINER
			suggestionContainer.appendChild(clone);
			
		}
	} else {
		console.log("Template tag not supported. View this page on a modern browser.")
	}
}

function populateError(type) {
	$('#search-suggestion-container').empty(); // clear search suggestions
	if ('content' in document.createElement('template')) { // if template tag is supported
		var clone = errorTemplate.content.cloneNode(true);
        if (type == 0) { // if search box is empty
			clone.querySelector('.search-error-description').textContent = 'Start typing in the search box.';
		} else if (type == 1) { // if no results found for query
			clone.querySelector('.search-error-description').textContent = 'No results found for “' + $('#search-box').val() + '”.';
		}
        // ADD CLONE TO CONTAINER
        suggestionContainer.appendChild(clone);
	} else {
		console.log("Template tag not supported. View this page on a modern browser.")
	}
}

function scrollResults() { // IMPORTANT: needs to be called EVERY TIME results are refreshed (b/c first element is changed)
	var first = suggestionContainer.firstElementChild; // select first result in list
	document.onkeydown = function (e) {
		switch(e.keyCode) {
			case 38: // if UP key is pressed
				console.log("UP PRESSED");
				if (document.activeElement == searchBox) { // if focus is on search box
					break;
				} else if (document.activeElement == first) { // if focus is on first result
					setTimeout(function () { // cursor move only works with setTimeout
						var strLength = searchBox.value.length * 2; // multiply by 2 to ensure the cursor always ends up at the end; Opera sometimes sees a carriage return as 2 characters.
						searchBox.focus(); // shift focus to search box
						searchBox.setSelectionRange(strLength, strLength); // move cursor to end of input
					}, 0);
				} else {
					document.activeElement.previousElementSibling.scrollIntoView(true);
					document.activeElement.previousElementSibling.focus(); // shift focus to previous result
				}
				break;
			case 40: // if DOWN key is pressed
				console.log("DOWN PRESSED");
				if (document.activeElement == searchBox) { // if focus is on search box
					first.focus(); // shift focus to first result
				} else if (document.activeElement == document.activeElement.parentNode.lastElementChild) { // if last result
					break;
				} else {
					document.activeElement.nextElementSibling.scrollIntoView(false);
					document.activeElement.nextElementSibling.focus(); // shift focus to next result
				}
				break;
			case 13: // if ENTER key is pressed
				console.log("ENTER PRESSED");
				if (document.activeElement == searchBox) { // if focus is on search box
					break;
				} else {
					loadShow(document.activeElement); // load show details
					closeSearch();
				}
				break;
			default:
				break;
		}
	}
}

//function selectResults() {
//	$('.search-suggestion').click(function () {
//		if (!$(this).hasClass('search-error')) { // exclude error results
//			console.log("clicked");
//			console.log($(this).data('tvid')); // get tvid
//			var showID = $(this).data('tvid');
//			theMovieDb.tv.getById({"id":showID}, show_successCB, show_errorCB);
//		}
//	});
//}

function selectResults() {
	$('.search-suggestion').click(function () {
		loadShow(this);
	});
}

function closeSearch() {
	$('#search-suggestion-container').removeClass('enabled');
}

function loadShow(entry) {
	if (!$(entry).hasClass('search-error')) { // exclude error results
//        console.log("clicked");
//        console.log($(entry).data('tvid')); // get tvid
        var showID = $(entry).data('tvid');
        theMovieDb.tv.getById({"id":showID}, show_successCB, show_errorCB);
    }
}

function show_successCB(data) {
//	console.log("Success callback: " + data);
	var queryData = JSON.parse(data);
	console.log(queryData);
	// EPISODE COUNT
	// get true episode count by omitting episodes in current season that haven't aired yet
	var trueEpisodeCount;
	if (queryData.seasons[queryData.seasons.length - 1].episode_count != null && queryData.last_episode_to_air != null && queryData.number_of_episodes != null) {
		var episodesRemainingInCurrentSeason = queryData.seasons[queryData.seasons.length - 1].episode_count - queryData.last_episode_to_air.episode_number; // get episode count of last season in array and minus episode no. of last aired episode
		trueEpisodeCount = queryData.number_of_episodes - episodesRemainingInCurrentSeason; // get true episode count
	} else if (queryData.number_of_episodes != null) {
		trueEpisodeCount = queryData.number_of_episodes;
	} else {
		trueEpisodeCount = 0;
		// TO ADD: SET 'UNKNOWN' CONDITION
	}
	showContainer.querySelector('#show-episode-count').textContent = trueEpisodeCount;
	// RUNTIME
	var averageRuntime, totalRuntimeMinutes;
	if (Array.isArray(queryData.episode_run_time) && queryData.episode_run_time.length != 0) { // check if array is empty
		averageRuntime = average(queryData.episode_run_time);
		totalRuntimeMinutes = trueEpisodeCount * averageRuntime; // some shows have varied runtimes - use average
		showContainer.querySelector('#show-total-runtime').textContent = timeConvert(totalRuntimeMinutes); // convert to hours and minute
	} else {
		showContainer.querySelector('#show-total-runtime').textContent = "Runtime not available.";
		// TO ADD: SET 'UNKNOWN' CONDITION
	}
	// TITLE
	showContainer.querySelector('.show-title').textContent = queryData.name;
	// POSTER
	var posterURL;
	if (queryData.poster_path != null) {
		posterURL = 'https://image.tmdb.org/t/p/w500' + queryData.poster_path;
		showContainer.querySelector('.show-poster').setAttribute('src', posterURL);
		showContainer.querySelector('.show-poster').setAttribute('alt', 'Poster for “'+queryData.name+'”.');
	} else {
		posterURL = '';
		showContainer.querySelector('.show-poster').setAttribute('src', posterURL);
		showContainer.querySelector('.show-poster').setAttribute('alt', '');
	}
	populateBingeability(totalRuntimeMinutes, averageRuntime);
}

function show_errorCB(data) {
	console.log("Error loading show details.");
}

function populateBingeability(total, average) {
	timeNumber = 7;
	var timeAvailable = timeNumber * timeUnit * timeUnitMultiplier; // in minutes
	var daysAvailable = timeNumber * timeUnitMultiplier; // in days
	if (total > timeAvailable) {
		showContainer.querySelector('#show-binge-answer').textContent = "Nope";
	} else {
		var dailyAverage = total / daysAvailable; // in minutes
		var dailyEpisodeAverage = Math.round(dailyAverage / average); // in episodes, rounded to nearest integer
		showContainer.querySelector('#show-binge-answer').textContent = "Yes, if you watch about " + dailyEpisodeAverage + " episodes per day.";
//		showContainer.querySelector('#show-binge-answer').textContent = "Yes, if you watch an average of " + timeConvert(dailyAverage) + " per day.";
	}
}

function average(array) {
    return array.reduce((acc, next) => acc + next) / array.length;
}

function delay(fn, ms) {
	let timer = 0
	return function(...args) {
	  clearTimeout(timer)
	  timer = setTimeout(fn.bind(this, ...args), ms || 0)
	}
}

function timeConvert(n) {
	var num = n;
	var hours = (num / 60);
	var rhours = Math.floor(hours);
	var minutes = (hours - rhours) * 60;
	var rminutes = Math.round(minutes);
	return rhours + " hour(s) and " + rminutes + " minute(s)";
//	return num + " minutes = " + rhours + " hour(s) and " + rminutes + " minute(s)";
}