// Bar Chart Tool for Testing
// Adapted from http://bost.ocks.org/mike/d3/workshop/bar-chart.html
// By Sage 3/9/12

var EV_Bar_Chart = function(dom_id,config_override) {
	
  // Default Configuration
	this.configuration = {
		data:"One, 1\nTwo, 2\nThree, 3\nFour, 4\nFive, 5",
		color:"steelblue",
//    "station_list": "44025|LONG ISLAND 33\n44027|Jonesport, Maine",
  };

  // Configuration Controls
	this.controls = {	
    "data": {
        "type": "textarea",
        "label": "Data Array",
        "tooltip": "Enter data in the following format:<br><br><em>label, value<br>label, value</em><br><br>Enter each pair of data on its own line.",
        "default_value": "One, 1\nTwo, 2\nThree, 3\nFour, 4\nFive, 5"
    },
		"color":{
			"type":"colorpicker",
			"label":"Bar Color",
			"tooltip":"Select a hexidecimal color for your graph.",
			"default_value":"#4682B4",
			"validation":{
				"type":"hexcolor"
		  }
		}
	}

	// Identify the DOM element where the Visualization will be placed.
	if(typeof(dom_id)!="undefined") this.dom_element = dom_id; else this.dom_element = "ev";

	// do configuration overrides exist? if so, parse overrides
	//this.tool.configuration.custom = $.extend(true, {}, this.configuration);
	this.tool = {
	  configuration:{
	    default:this.configuration,
	    custom:this.configuration
    }
  };
	this.parse_configuration(config_override);

	// Draw graph
	this.draw();
}

EV_Bar_Chart.prototype.parse_configuration = function(config_override){
	if(typeof(config_override)=="undefined"){
		console.log("no settings passed, default configuration loaded");		
	}
	else{
		//override settings exist, so merge overrides into configuration
		$.extend(true,this.tool.configuration.custom,config_override);
	}	
}

EV_Bar_Chart.prototype.draw = function () {
  var self = this;
  
  var bardata = [];
  var barlabels = [];
  $.each(this.tool.configuration.custom.data.split("\n"), function (key,value) {
    var parts = value.split(",");
    bardata[key] = +parts[1];
    barlabels[key] = parts[0];
  });

  var margin = {top: 40, right: 40, bottom: 40, left: 40},
      width = 640 - margin.left - margin.right,
      height = 480 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .domain(d3.range(bardata.length))
      .rangeRoundBands([0, width], .2);

  var y = d3.scale.linear()
    .domain([0, d3.max(bardata)])
    .range([height,0]);
  
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickSize(0)
      .tickPadding(8);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickPadding(8);

  var svg = d3.select("#"+this.dom_element).append("svg")
      .attr("width", width+margin.left+margin.right)
      .attr("height", height+margin.top+margin.bottom)
      .attr("class", "bar chart")
    .append("g")
      .attr("transform", "translate(" + margin.right + "," + margin.top + ")");
  
  svg.selectAll(".bar")
      .data(bardata)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, i) { return x(i); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d); })
      .attr("height", function(d) { return height - y(d); })
      .attr("style","fill:" + this.tool.configuration.custom.color);
        
  svg.append("g")
      .attr("class", "y axis")
      //.attr("transform", "translate(0,0)")
      .call(yAxis);
  
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .text(function(d) { return barlabels[d]; });

}