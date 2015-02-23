//Data handling
d3.csv("meteo.csv", function (error, data) {
	//Idea: create 2 arrays, one will record the sum of temperatures in each month, one will count the days in the month. At the end, the averages will be computed by dividing the sum of temperatures by the days in the month
	//Each array will be 2-dimensional, the first index being the year, the second one being the month

	var averages = new Array(5); //the temperature sums/averages array, the 5 stands for 5 years
	var daysInMonth = new Array(5); //the days-in-month array, same logic


	//Initialize both arrays with zeroes
	for (var i = 0; i<5; i++) {
		averages[i] = new Array(12); //each of the five years has 12 months
		daysInMonth[i] = new Array(12); // dtto

		//Fill each newly created array with zeroes
		for (var j = 0; j<12; j++) {
			averages[i][j] = 0;
			daysInMonth[i][j] = 0;
		}
	}
	
	//Cycle through data and fill the arrays with values
	data.forEach(function(d) {
		//Determine the year index: indices of an array start with 0, years start with 2010, so need to subtract
		//"+d.year" ensures parsing the year as a number
		var yearIndex = +d.year - 2010;

		//Month index: same logic, only the months start with 1, so we need to subtract 1
		var monthIndex = +d.month - 1;

		//Now that I have the indices, I can directly add the proper values without using if or switch
		averages[yearIndex][monthIndex] += +d.temperature/10; //Divide by 10, since the CSV file contains tenths of degrees, then add to the proper year and month
		daysInMonth[yearIndex][monthIndex] += 1; //Add 1 to the days in month count
	});
	
	//After the previous step, the "averages" array contains sums of temperatures in each month, the "daysInMonth" array the number of days in each month
	//Now, we need to cycle through arrays and divide each month sum by the number of days to get the average temperature for each month
	for (var i = 0; i<5; i++) {
		for (var j = 0; j<12; j++) {
			averages[i][j] /= daysInMonth[i][j];
		}
	}

	//Initialize the visualization and its parameters
	var dispYear = 2014; //I'm starting at 2014
	var svgWidth = 600; //Width of the SVG canvas
	var svgHeight = 400; //Height of the SVG canvas
	var svg = d3.select("body")
		.append("svg")
		.attr("width",svgWidth)
		.attr("height",svgHeight); //Create the canvas
	var padding = 50; //Padding between the visualization and the border of the SVG canvas
	var barPadding = 10; //Padding between bars
	var barSpace = (svgWidth - 2*padding)/12; //Space dedicated to each bar

	//A custom function which creates the visualization for each year (see below)
	visualize(averages, dispYear, svgHeight, svgWidth, padding, barPadding, barSpace);


	//The interactivity code, adaptable from the Population Pyramid example on D3 examples gallery
	window.focus(); //Make sure the window is focused
	d3.select(window).on("keydown", function() { //Watch for key being pressed
		switch (d3.event.keyCode) {
			case 37: { //37 = code for left arrow, i.e. "show previous year"

				//Make sure you don't go beyond 2010
				if (dispYear-1 >= 2010) { 
					//Update the "displayed year" variable and call the custom function to update the visualization
					dispYear -= 1;
					visualize(averages, dispYear, svgHeight, svgWidth, padding, barPadding, barSpace);
				}
				break;
			}
			case 39: { //39 = code for right arrow, i.e. "show next year"

				//Make sure you don't go beyond 2013
				if (dispYear+1 <= 2014) {
					//Update the "displayed year" variable and call the custom function to update the visualization
					dispYear += 1;
					visualize(averages, dispYear, svgHeight, svgWidth, padding, barPadding, barSpace);
				}
				break;
			}
		}
	});
});

function visualize(averages, dispYear, svgHeight, svgWidth, padding, barPadding, barSpace) {

	//Variable initialization
	var unscaledData = averages[dispYear-2010]; //the unscaled data to be shown
	var scaledData = []; //the scaled data (at this point empty, we need to scale them first)
	var minDataPoint = d3.min(unscaledData); //minimal average temperature value
	var maxDataPoint = d3.max(unscaledData); //maximal average temperature value

	var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; //month labels

	//Scale the data to screen space: x-dimension (bar width) is fixed, so we need no scaling, y-dimension (bar height) is dynamic based on data values, so scaling needed there
	//Using a linear scale, the lowest point of the domain is lowered by 5 to ensure that the minimal value gets displayed, range is reversed so the bars grow from bottom to top rather than from top to bottom
	var yScale = d3.scale.linear()
			.domain ([minDataPoint-5, maxDataPoint])
			.range ([svgHeight-2*padding,0]);

	//Scale the data
	for (var i = 0; i<unscaledData.length; i++) {
		scaledData[i] = yScale(unscaledData[i]);
	}
	
	//Construct a y axist to be showed
	var yAxis = d3.svg.axis()
			.scale(yScale)
			.orient("left")
			.ticks(5);

	
	//A short-hand, so that I don't have to write "d3.select('svg')" all the time below
	var svg = d3.select("svg");


	//Draw the bars
	svg.selectAll("rect").data([]).exit().remove(); //First, remove the old data (if any) like so
	svg.selectAll("rect").data(scaledData).enter().append("rect")
		//The bars are animated: following 5 attr calls define the initial state (all black, 0 height)
		.attr("x", function(d,i) {return padding + i*barSpace + barPadding;})
		.attr("y", svgHeight - padding)
		.attr("width", barSpace - barPadding)
		.attr("height","0")
		.attr("fill","black")
		.transition() //Stating that there is an animation here
		.duration(1500) //The animation takes 1.5 seconds
		//The remaining attr calls change the size to match the data and colours it orange
		.attr("height", function(d) {return svgHeight - 2*padding - d;})
		.attr("fill","orange")
		.attr("y", function(d) {return d+padding;})

	//Value labels at the top of each bar, in a similar manner to the bars
	svg.selectAll("text").data([]).exit().remove();
	svg.selectAll("text")
		.data(unscaledData)
		.enter()
		.append("text")
		//Again a transition - from nothing to displaying the labels
		.transition()
		.delay(1500) //Delay is again 1.5 seconds, otherwise the labels would appear before the bars
		.text(function(d) {return d.toFixed(1);})
		.attr("x", function(d,i) {return padding + barSpace*i+barPadding/2+barSpace/2})
		.attr("y", function(d) {return yScale(d) + padding + 15})
		.attr("text-anchor","middle")
		.attr("font-family","sans-serif")
		.attr("font-size","10px");
	
	//Add month labels - you can also use automatic x axis, I use just text labels similar to the value labels
	svg.selectAll(".month")
		.data(months)
		.enter()
		.append("text")
		.text(function(d) {return d;})
		.attr("x", function(d,i) {return padding + barSpace*i+barPadding/2+barSpace/2})
		.attr("y", function(d) {return svgHeight - padding + 10})
		.attr("text-anchor","middle")
		.attr("font-family","sans-serif")
		.attr("font-size","10px");

	//Add the year label
	svg.selectAll(".year").remove();
	svg.selectAll(".year")
		.data([dispYear])
		.enter()
		.append("text")
		.text(dispYear)
		.attr("x",padding+60)
		.attr("y",padding+30)
		.attr("text-anchor","middle")
		.attr("font-family","sans-serif")
		.attr("font-weight","bold")
		.attr("font-size","24px");
	
	//Draw the y axis
	svg.selectAll("g").remove();	
	svg.append("g")
		.attr("class","yaxis")
		.attr("transform", "translate(" + padding + "," + padding + ")")
		.call(yAxis);

}

