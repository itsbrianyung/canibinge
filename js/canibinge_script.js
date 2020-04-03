// SAMPLE JSON RETURN:
// Success callback: {"page":1,"total_results":2,"total_pages":1,"results":[{"original_name":"Westworld","genre_ids":[878,37],"name":"Westworld","popularity":248.284,"origin_country":["US"],"vote_count":2183,"first_air_date":"2016-10-02","backdrop_path":"\/yGNnjoIGOdQy3douq60tULY8teK.jpg","original_language":"en","id":63247,"vote_average":8.1,"overview":"A dark odyssey about the dawn of artificial consciousness and the evolution of sin. Set at the intersection of the near future and the reimagined past, it explores a world in which every human appetite, no matter how noble or depraved, can be indulged.","poster_path":"\/y55oBgf6bVMI7sFNXwJDrSIxPQt.jpg"},{"original_name":"Beyond Westworld","genre_ids":[10765],"name":"Beyond Westworld","popularity":2.009,"origin_country":["US"],"vote_count":0,"first_air_date":"1980-03-05","backdrop_path":null,"original_language":"en","id":411,"vote_average":0,"overview":"Beyond Westworld was a short-lived 1980 television series that carried on the stories of the two feature films, Westworld and Futureworld. It featured Jim McMullan as Security Chief John Moore of the Delos Corporation. The story revolved around John Moore having to stop the evil scientist, Quaid, as he planned to use the robots in Delos to try to take over the world. Despite being nominated for two Emmys, only five episodes were produced, and only three of them were aired before cancellation.","poster_path":null}]}
// JSON RETURN IF NO RESULTS FOUND:
// Success callback: {"page":1,"total_results":0,"total_pages":0,"results":[]}

var template, errorTemplate, searchBox, suggestionContainer;
// search suggestions template
template = document.querySelector('#search-suggestion-template'); // select template element
errorTemplate = document.querySelector('#search-error-template'); // select error template element
searchBox = document.querySelector('#search-box'); // select search box (starting point of arrow navigation)
suggestionContainer = document.querySelector('#search-suggestion-container'); // select suggestions container
var showLoaded = false;

var timeNumber = 1; // default: 1
var timeUnitMins = 1440; // default: 1440 minutes i.e. minutes in a day
var timeUnitMultipliers = [1, 7, 30, 365]; // 1 = 1 day; 7 = 1 week; 30 = 1 month; 365 = 1 year
// Multiply timeNumber * timeUnitMins * timeUnitMultipliers[timeUnitsIndex] to get total time available
var timeUnits = ['day', 'week', 'month', 'year'];
var timeUnitsIndex = 0; // start at 'day'
var timeUnitIsPlural = false;
var selected_totalRuntimeMinutes = 0;
var selected_averageRuntime = 0;
var selected_missingVars = false;

$(document).ready(function () {
	$('#search-form').submit(function (e) {
		e.preventDefault(); // stops page redirect
	});
	
	 // init AutosizeInput plugin
	if (window.innerWidth >= 1000) { // desktop
		$('#search-box').autosizeInput({'space': 0, 'desktopMinWidth': 350, 'placeholder': 'Modern Family'});
	} else {
		$('#search-box').autosizeInput({'space': 9, 'desktopMinWidth': window.innerWidth - 120, 'placeholder': 'Modern Family'});
	}
	
	$('#search-box').focus(function () {
		$('#search-box').addClass('enabled');
		$('#search-box').trigger('change'); // AutosizeInput plugin adjusts text box size upon detecting 'change' event
		$('#bingeability').addClass('pending');
	});
	
	$(document).click(function (e) { // close suggestions container when clicking outside search box/button
		if (!$('#search-box').is(e.target) && !$('#search-button').is(e.target)) {
			closeSearch();
		}
	});
	 
	$('#search-box').on('input', delay(function (e) { // start new search every time text in search box changes
        var query = $('#search-box').val();
        if (query.length != 0) { // send query only if there's something in text box
            theMovieDb.search.getTv({"query":query}, successCB, errorCB);
        } else {
			$('#search-suggestion-container').empty(); // clear search suggestions
//          populateError(0); // show 'start typing' prompt if input is empty
        }
	}, 100)); // delay by 100ms to account for typing
	
	$('#search-box').on('input', function (e) {
		if (showLoaded == true) {
			showLoaded = false; // reset showLoaded boolean once user begins new search
		}
		if (!$('#search-suggestion-container').hasClass('enabled')) {
			$('#search-suggestion-container').addClass('enabled'); // not on input focus; should not show up on first click
		}
	});
	
	$('#time-unit').click(function () { // update text and timeUnitMultiplier by updating timeUnitsIndex
		if (timeUnitsIndex == timeUnits.length - 1) {
			timeUnitsIndex = 0; // loop back to beginning of array
			updateTimeUnit();
		} else {
			timeUnitsIndex++;
			updateTimeUnit();
		}
		populateBingeability(selected_totalRuntimeMinutes, selected_averageRuntime, selected_missingVars);
	});
	
	$('#time-adjust-up, #mobile-time-adjust-up').click(function () {
		timeNumber++;
		document.querySelector('#time-number').textContent = timeNumber;
		if (timeUnitIsPlural == false && timeNumber > 1) { // make timeUnit plural if more than 1
			timeUnitIsPlural = true;
			updateTimeUnit();
		}
		populateBingeability(selected_totalRuntimeMinutes, selected_averageRuntime, selected_missingVars);
	});
	
	$('#time-adjust-down, #mobile-time-adjust-down').click(function () {
		if (timeNumber > 1) { // can't go lower than 1
			timeNumber--;
			document.querySelector('#time-number').textContent = timeNumber;
		}
		if (timeUnitIsPlural == true && timeNumber == 1) { // make timeUnit singular if 1
			timeUnitIsPlural = false;
			updateTimeUnit();
		}
		populateBingeability(selected_totalRuntimeMinutes, selected_averageRuntime, selected_missingVars);
	});
});

function updateTimeUnit() {
	if (timeUnitIsPlural == true) {
		document.querySelector('#time-unit').textContent = timeUnits[timeUnitsIndex] + 's';
    } else {
    	document.querySelector('#time-unit').textContent = timeUnits[timeUnitsIndex];
	}
}

function closeSearch() {
	$('#search-box, #search-suggestion-container').removeClass('enabled');
	$('#search-box').trigger('change'); // AutosizeInput plugin adjusts text box size upon detecting 'change' event
	$('#bingeability').removeClass('pending');
	if (showLoaded == true) {
		if ($('#bingeability').hasClass('disabled')) {
			$('#bingeability').removeClass('disabled');
		}
	} else if (showLoaded == false) {
		$('#bingeability').addClass('disabled');
	}
}

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
//			console.log(queryData.results[i].name + ': ' + queryData.results[i].overview);
			// ID/TITLE/OVERVIEW
			var clone = template.content.cloneNode(true);
			clone.querySelector('.search-suggestion').setAttribute('data-tvid', queryData.results[i].id);
			if (queryData.results[i].name != null) {
				clone.querySelector('.search-suggestion-title').textContent = queryData.results[i].name;
			}
			if (queryData.results[i].first_air_date != null) {
				clone.querySelector('.search-suggestion-date').textContent = queryData.results[i].first_air_date.substring(0, 4); // return first 4 characters of string i.e. only the year
			}
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
					closeSearch();
					loadShow(document.activeElement); // load show details
				}
				break;
			default:
				break;
		}
	}
}

function selectResults() {
	$('.search-suggestion').click(function () {
		loadShow(this);
	});
}

function loadShow(entry) {
	if (!$(entry).hasClass('search-error')) { // exclude error results
//        console.log($(entry).data('tvid')); // get tvid
        var showID = $(entry).data('tvid');
        theMovieDb.tv.getById({"id":showID}, show_successCB, show_errorCB);
    }
}

function show_successCB(data) {
//	console.log("Success callback: " + data);
	var queryData = JSON.parse(data);
	console.log(queryData);
	// MISSING VARS CONDITION
	selected_missingVars = false; // reset
	// EPISODE COUNT
	// get true episode count by omitting episodes in current season that haven't aired yet
	var trueEpisodeCount;
	if (Array.isArray(queryData.seasons) && queryData.seasons.length != 0 && queryData.last_episode_to_air != null && queryData.number_of_episodes.length != 0) {
		var episodesRemainingInCurrentSeason = queryData.seasons[queryData.seasons.length - 1].episode_count - queryData.last_episode_to_air.episode_number; // get episode count of last season in array and minus episode no. of last aired episode
		trueEpisodeCount = queryData.number_of_episodes - episodesRemainingInCurrentSeason; // get true episode count
	} else if (queryData.number_of_episodes.length != 0) {
		trueEpisodeCount = queryData.number_of_episodes;
		selected_missingVars = true; // SET 'MAYBE' CONDITION
	} else {
		trueEpisodeCount = 0;
		selected_missingVars = true; // SET 'MAYBE' CONDITION
	}
	// RUNTIME
	var averageRuntime, totalRuntimeMinutes;
	if (Array.isArray(queryData.episode_run_time) && queryData.episode_run_time.length != 0) { // check if array is empty
		averageRuntime = average(queryData.episode_run_time);
		totalRuntimeMinutes = trueEpisodeCount * averageRuntime; // some shows have varied runtimes - use average
	} else {
		averageRuntime = 0;
		totalRuntimeMinutes = 0;
		selected_missingVars = true; // SET 'MAYBE' CONDITION
	}
	// TITLE
	document.querySelector('#search-box').value = queryData.name;
	showLoaded = true; // MUST set to true to show #bingeability
	closeSearch();
	// WRAP UP
	populateBingeability(totalRuntimeMinutes, averageRuntime, selected_missingVars);
	// update global variables for bingeability calculation
	selected_totalRuntimeMinutes = totalRuntimeMinutes;
	selected_averageRuntime = averageRuntime;
}

function show_errorCB(data) {
	console.log("Error loading show details.");
}

function populateBingeability(total, average, missingVars) {
	var timeAvailable = timeNumber * timeUnitMins * timeUnitMultipliers[timeUnitsIndex]; // in minutes
	var daysAvailable = timeNumber * timeUnitMultipliers[timeUnitsIndex]; // in days
//	console.log("timeAvailable: "+timeAvailable+" daysAvailable: "+daysAvailable);
	if (missingVars == true) {
		document.querySelector('#bingeability').textContent = "Maybe?"; // variables missing, can't complete calculation
	} else if (total > timeAvailable) {
		document.querySelector('#bingeability').textContent = "Nope.";
	} else {
		var dailyAverage = total / daysAvailable; // in minutes
		var dailyEpisodeAverage = dailyAverage / average; // in episodes, rounded to nearest integer
		if (dailyEpisodeAverage >= 1) {
			var dailyEpisodeAverageRounded = Math.round(dailyEpisodeAverage);
			document.querySelector('#bingeability').textContent = "Yes, if you watch about " + dailyEpisodeAverageRounded + " episode(s) per day.";
		} else { // if daily average is less than 1 e.g. 0.35 episode
			 // MATH! dailyEpisodeAverage = number of episodes (or 'days' if 1 per day) / daysAvailable
			var numberOfDays = Math.round(dailyEpisodeAverage * daysAvailable);
			document.querySelector('#bingeability').textContent = "Yes, if you watch 1 episode a day for " + numberOfDays + " days.";
		}
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
}