// Update function so time is accurate
function updateMoment(){
	var now = moment();
	$("#time").html(now.format('h:mm:ss a'));
	$("#date").html(now.format('dddd' + ", " + 'MMM Do'));
}

function updateWeather(){
	var apiKey = 'bd0e23dbeb0c1b833c00b4b45d4fa188';
	$.getJSON('http://api.openweathermap.org/data/2.5/forecast/daily?q=Tucson&mode=JSON&units=imperial&cnt=4&APPID=' + apiKey, function(weatherForecast){
	// For the description, the access path differs from the given path on their site. You must add
	// an index to the 'weather' element, because it's stored as a list for some reason.
		$("#weather").html("Today ");
		$("#weather").append(Math.round(weatherForecast.list[0].temp.min), " ", Math.round(weatherForecast.list[0].temp.max), " ", weatherForecast.list[0].weather[0].description, '<br>');
		$("#weather").append(moment().add(1, 'd').format('dddd'), " ");
		$("#weather").append(Math.round(weatherForecast.list[1].temp.min), " ", Math.round(weatherForecast.list[1].temp.max), " ", weatherForecast.list[1].weather[0].description,  '<br>');
		$("#weather").append(moment().add(2, 'd').format('dddd'), " ");
		$("#weather").append(Math.round(weatherForecast.list[2].temp.min), " ", Math.round(weatherForecast.list[2].temp.max), " ",weatherForecast.list[2].weather[0].description,  '<br>');
		$("#weather").append(moment().add(3, 'd').format('dddd'), " ");
		$("#weather").append(Math.round(weatherForecast.list[3].temp.min), " ", Math.round(weatherForecast.list[3].temp.max), " ",weatherForecast.list[3].weather[0].description, '<br>');
	});
}

var clientId = '840122434097-gb87cdf08fupi69b262066jl68f9q1a4.apps.googleusercontent.com';
var apiKey = 'AIzaSyDgUKhpF1UNxiTbGU-bS1FRPwyksg5M3I0';
var scopes = 'https://www.googleapis.com/auth/calendar';


function handleClientLoad() {
  gapi.client.setApiKey(apiKey);
  window.setTimeout(checkAuth,1);
}

function checkAuth() {
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult) {
  var authorizeButton = document.getElementById('authorize-button');
  if (authResult && !authResult.error) {
    authorizeButton.style.visibility = 'hidden';
    makeApiCall();
  } else {
    authorizeButton.style.visibility = '';
    authorizeButton.onclick = handleAuthClick;
  }
}

function handleAuthClick(event) {
  gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
  return false;
}

function makeApiCall(){
	var allEvents = new Array(); 
	var counter = 0;
	gapi.client.load('calendar', 'v3').then(function(){
		var minTime = moment().format();
		var calListRequest = gapi.client.calendar.calendarList.list();

		parseCalendars(calListRequest, function(masterEvents, totalCalendarCount){
			allEvents = allEvents.concat(masterEvents);
			counter += 1;
			if (counter == totalCalendarCount){
				sortEvents(allEvents, calendarFrontEnd);
			};
		});
	});
}

function parseCalendars(calListRequest, callback){
	var minTime = moment().format();
	calListRequest.execute(function(resp){
		for(x = 0; x < resp.items.length; x++){
			var item = resp.items[x];
			var calEventRequest = gapi.client.calendar.events.list({
				'calendarId': item.id,
				'singleEvents': true,
				'orderBy': 'startTime',
				'timeMin': minTime,
				'maxResults': 10,
			});
			
			parseEvents(calEventRequest, function(eventList){
				callback(eventList, resp.items.length);
			});
		};
	});
}

function parseEvents(calEventRequest, callback){
	var localEventList = new Array();

	calEventRequest.execute(function(events){
		for(i = 0; i < events.items.length; i++){
			var item = events.items[i];
			localEventList.push(item);
		};
		callback(localEventList);
	});	
}

function sortEvents(eventList, callback){
	// This function deals with events in their object form


	// console.log("This is sortEvents");
	// for(i = 0; i < eventList.length; i++){
	// 	console.log(eventList[i].summary);
	// }
	// console.log("------------------------------------------");

	var timedEvents = new Array(); // AKA non-all day events. IDK what to call them.
	var sortedList = new Array(); // This array will hold (only) the timed events, sorted
	var rawAllDayEvents = new Array();
	var sortedAllDayEvents = new Array();
	
	// Seperating all day and non-all day events
	for(j = 0; j < eventList.length; j++){
		if(typeof eventList[j].start.dateTime != "string"){
			rawAllDayEvents.push(eventList[j]);
		}
		else{
			timedEvents.push(eventList[j]);
		}
	}

	// Sorting the all day events 
	// This isn't necesary if I only display one day, but it will be if I want a future view
	for(i = 0; i < rawAllDayEvents.length; i++){
		var item = rawAllDayEvents[i];
		var start = item.start.date;

		if(sortedAllDayEvents.length == 0){
			sortedAllDayEvents.push(item)
		}
		else if(sortedAllDayEvents.length == 1){
			if(start >= sortedAllDayEvents[0].start.date){
				sortedAllDayEvents.push(item);
			}
			else{
				sortedAllDayEvents.unshift(item);
			}
		}
		else{
			var counter = 0;
			while(counter <= sortedAllDayEvents.length){
				if(start >= sortedAllDayEvents[counter].start.date && counter != sortedAllDayEvents.length - 1){
					counter++;
				}
				else if(counter == sortedAllDayEvents.length - 1){
					if(start >= sortedAllDayEvents[counter].start.date){
						sortedAllDayEvents.push(item);
					}
					else{
						sortedAllDayEvents.splice(counter, 0, item);
					}
					counter = counter + 1000; //ensures while loop breaks
				}
				else{
					sortedAllDayEvents.splice(counter, 0, item);
					counter = counter + 1000;
				}
			}
		}
	}

	// Add timed events to sortedList, and sorting as you go
	for(i = 0; i < timedEvents.length; i++){
		var item = timedEvents[i];
		var startTime = item.start.dateTime;

		// sortedList is currently empty.
		if(sortedList.length == 0){
			sortedList.push(item);
		} 
		else if(sortedList.length == 1){
			if(startTime >= sortedList[0].start.dateTime){
				sortedList.push(item);
			}
			else{
				sortedList.unshift(item);
			}
		} 
		else{
			var counter = 0;
			while(counter <= sortedList.length){
				if(startTime >= sortedList[counter].start.dateTime && counter != sortedList.length - 1){
					counter++;
				}
				else if(counter == sortedList.length - 1){
					if(startTime >= sortedList[counter].start.dateTime){
						sortedList.push(item);
					}
					else{
						sortedList.splice(counter, 0, item);
					}
					counter = counter + 1000;// ensures while loop breaks
				}
				else{
					sortedList.splice(counter, 0, item);
					counter = counter + 1000; 
				}
			}
		};  
	}


	// // console logging the all day events
	// for(i = 0; i < sortedAllDayEvents.length; i++){
	// 	console.log("ALL DAY " + sortedAllDayEvents[i].summary);
	// }

	// console.log("----------------------------------")

	// // console logging the timed events
	// for(i = 0; i < sortedList.length; i++){
	// 	console.log(sortedList[i].summary);
	// }

	callback(sortedAllDayEvents, sortedList);
}

function calendarFrontEnd(allDayEvents, timedEvents){
	// These will hold the events corresponding to each day
	var todayEvents = new Array();
	var plusOneEvents = new Array();
	var plusTwoEvents = new Array();
	var plusThreeEvents = new Array();
	var plusFourEvents = new Array();

	var today = moment().format("YYYY-MM-DD");
	var plusOne = moment().add(1, 'd').format("YYYY-MM-DD");
	var plusTwo = moment().add(2, 'd').format("YYYY-MM-DD");
	var plusThree = moment().add(3, 'd').format("YYYY-MM-DD");
	var plusFour = moment().add(4, 'd').format("YYYY-MM-DD");

	// Pushing all-day events first, into the corresponding day array
	for(i = 0; i < allDayEvents.length; i++){
		
		var item = allDayEvents[i];
		var start = item.start.date;
		
		if(start == today){
			todayEvents.push(item);
		}
		else if(start == plusOne){
			plusOneEvents.push(item);
		}
		else if(start == plusTwo){
			plusTwoEvents.push(item);
		}
		else if(start == plusThree){
			plusThreeEvents.push(item);
		}
		else if(start == plusFour){
			plusFourEvents.push(item);
		}
	}

	// Pushing timed events to the corresponding day array
	for(i = 0; i < timedEvents.length; i++){
		
		var item = timedEvents[i];
		var start = item.start.dateTime;
		start = start.slice(0,10);
		
		if(start == today){
			todayEvents.push(item);
		}
		else if(start == plusOne){
			plusOneEvents.push(item);
		}
		else if(start == plusTwo){
			plusTwoEvents.push(item);
		}
		else if(start == plusThree){
			plusThreeEvents.push(item);
		}
		else if(start == plusFour){
			plusFourEvents.push(item);
		}
	}

	for(i = 0; i< plusFourEvents.length; i++){
		console.log(plusFourEvents[i].summary + " ")
	}

}

$(document).ready(function(){
	updateMoment();
	setInterval(updateMoment, 1000);

	updateWeather();
	setInterval(updateWeather, 600000);

	handleClientLoad();

})


