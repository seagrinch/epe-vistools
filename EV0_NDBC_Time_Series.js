// Basic Timeseries Visualization Tool
//
// Ocean Observatories Initiative 
// Education & Public Engagement Implementing Organization
//
// Written by Mike Mills and Sage Lichtenwalner, Rutgers University
// Revised 6/5/12

var EV0_NDBC_Time_Series = function(dom_id,config_override){
	
  // Default Configuration
	this.configuration = {
		title:"Buoy 44025: Sea Water Temperature",
		subtitle:"January 2012",
		station_id:"44025",
		start_date:"2012-01-01",
		end_date:"2012-02-01",
		color:"#6699CC",
  };

  // Configuration Controls
	this.controls = {	
		"station_id":{
			"type":"dropdown",
			"label":"NDBC Buoy",
			"tooltip":"Select an NDBC buoy from the options provided.",
			"default_value":"44025",
			"options":[
				{"name":"Station 44025","value":"44025"},
				{"name":"Station 44022","value":"44022"}
			]
		},
		"start_date":{
			"type":"datepicker",
			"label":"Start Date",
			"tooltip":"Enter or select the starting date for your graph in the format: yyyy-mm-dd.",
			"default_value":"2012-01-01",
			"validation":{
				"type":"datetime",
				"format":"yyyy-mm-dd"
			}
		},
		"end_date":{
			"type":"datepicker",
			"label":"End Date",
			"tooltip":"Enter or select the ending date for your graph in the format: yyyy-mm-dd",
			"default_value":"2012-01-31",
			"validation":{
				"type":"datetime",
				"format":"yyyy-mm-dd"
			}
		},
		"color":{
			"type":"colorpicker",
			"label":"Line Color",
			"tooltip":"Select a hexidecimal line color for your graph.",
			"default_value":"#6699CC",
			"validation":{
				"type":"hexcolor"
			}
		}
	};

  // Datasource Configuration
  this.datasource = {
		agency:"IOOS",
		parameter:"sea_water_temperature",
		metadata:{ 
			name:"Sea Water Temperature", 
			qParam:"sea_water_temperature",
			column:"sea_water_temperature (C)",
			units:"&deg; C",
			units2:"Degrees Celcius",
	  }
  };
	
	// Identify the DOM element where the Visualization will be placed.
	if(typeof(dom_id)!="undefined") this.dom_element = dom_id; else this.dom_element = "ev";

	// the actual dom element container. this.id() performs additional 
	this.dom_container = this.id(); 
	
	// an empty object where datasets should be placed
	this.dataset={};
	
	// boolean to check is the object is ready to be drawn
	this.isDrawReady = false; 
	
	// graph specific properties
	this.graph = {
		domain:{
			y:{
				min:null,
				max:null
			},
			x:{ 
				min:null,
				max:null
			}
		},
		range:{
			y:{	
				min:null,
				max:null
			}
		}
	}
	
	// Create placeholder loading image
	this.loadingDiv();
	
	// do configuration overrides exist? if so, parse overrides
	this.parse_configuration(config_override);
	
	// parse dataset and draw graph
	this.parse_dataset();
	
}

EV0_NDBC_Time_Series.prototype.loadingDiv = function(){
	// Create a load
	$('#'+this.dom_container).html('<img id="loading_'+ this.dom_element + '" src="http://epe.marine.rutgers.edu/visualization/img/loading_a.gif" alt="Loading..."/>');
}

EV0_NDBC_Time_Series.prototype.parse_configuration = function(config_override){
	
	if(typeof(config_override)=="undefined"){
		console.log("no settings passed, default configuration loaded");		
	}
	else{
		//override settings exist, so merge overrides into configuration
		$.extend(true,this.configuration,config_override);
	}	
};

EV0_NDBC_Time_Series.prototype.parse_dataset = function(){
	var self = this;
	
	// get web service URL	
	
	// build data querystring
	var querystring = this.IOOS_querystring();
	console.log("Requesting CSV: " + querystring)
	
	d3.csv(querystring, function(ts_data){
	
		console.log("CSV Loaded..");
		
		var parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse,
			month_format = d3.time.format("%B - %Y"),
			end_month, end_year;
			
		colX = "date_time";
		colY = self.datasource.metadata.column;
					
		// check to see if there is any data, besides headers.. -> empty dataset
		if(ts_data.length == 0)
		{
			alert("Your request returned an empty dataset. ");	
		}
		else{
			console.log("Parsing Data..");		
			// parse date and convert csv source to numerical values

			ts_data.forEach(function(d) { 
				d[colX] = parse(d[colX]);
				d[colY] = +d[colY];
			});

			// find min and max for x and y colums
			var minX = d3.min(ts_data,function(d){return d[colX];}),
				maxX = d3.max(ts_data,function(d){return d[colX];}),
				minY = d3.min(ts_data,function(d){return d[colY];}),
				maxY = d3.max(ts_data,function(d){return d[colY];});

			// test for min and max Ys across datasets and maintain such
			if(!self.graph.domain.y.min){
				self.graph.domain.y.min = minY;
				self.graph.domain.y.max = maxY;
			}
			else{
				if(self.graph.domain.y.min > minY){self.graph.domain.y.min = minY;}
				if(self.graph.domain.y.max < maxY){ self.graph.domain.y.max = maxY;}
			}
			
			// test for min and max Ys across datasets and maintain such
			if(!self.graph.domain.x.min){
				self.graph.domain.x.min = minX;
				self.graph.domain.x.max = maxX;
			}
			else{
				if(self.graph.domain.x.min > minX){ self.graph.domain.x.min = minX;}
				if(self.graph.domain.x.max < maxX){ self.graph.domain.x.max = maxX;}
			}
			
			// save reference of data in datasets object
			self.dataset = { 	
				//id:ds.id, 
				isLoaded:true,
				columns:{x:colX,y:colY},
				data: ts_data,
				dates:{
						month: month_format(minX),
						range_begin: new Date(minX.getFullYear(), minX.getMonth(), 1),
						range_end: new Date(end_year, end_month, 1),
						month_days: new Date(minX.getFullYear(),minX.getMonth()+1,0).getDate()
					},
				extents : {
						y: d3.extent(ts_data,function(d){return d[colY];})
					},
				mean: (d3.sum(ts_data, function(d){return d[colY];}) / ts_data.length),
				stddev: ( d3.values(ts_data).stdev(colY) )			
			};

			// log to console for debugging
			console.log("CVS Parsed...");			
			
			self.draw();
		}
	});		
	
	
}

EV0_NDBC_Time_Series.prototype.draw = function(){
	
	var self = this;
	var domain = self.graph.domain;
	
	// set up basic graph elements
	var margin = {top: 10, right: 10, bottom: 30, left: 40},

		width = 580 - margin.left - margin.right,
		height = 260 - margin.top - margin.bottom;

	var date_time_parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

	var x = d3.time.scale().range([0, width]).domain([domain.x.min,domain.x.max]),
		y = d3.scale.linear().range([height, 0]).domain([domain.y.min,domain.y.max])

	var xAxis = d3.svg.axis().scale(x).ticks(8).tickSubdivide(true).orient("bottom"),
		yAxis = d3.svg.axis().scale(y).orient("left");

	var svg = d3.select("#"+this.dom_container).append("svg")
		.attr("id","container_" + this.dom_element)
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom);

	svg.append("defs").append("clipPath")
		.attr("id", "clip_" + this.dom_element)
		.append("rect")
		.attr("width", width)
		.attr("height", height);
		
	var focus = svg.append("g")
		.attr("id","focusgraph_"+this.dom_element)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");	

	focus.append("g")
		.attr("class", "x axis")
	//	.style("fill","none")
//		.style("stroke","#000")
//		.style("shape-rendering","crispedges")		
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	focus.append("g")
		.attr("class", "y axis")
//		.style("fill","#000")
//		.style("stroke","#000")
//		.style("shape-rendering","crispedges")
		.call(yAxis);

	console.log('now get csv for each dataset')

	colX = self.dataset.columns.x;
	colY = self.dataset.columns.y;
	
	d = self.dataset.data;

	var line = d3.svg.line()
		.interpolate("linear")
		.x(function(d) { return x(d[colX]); })
		.y(function(d) { return y(d[colY]); })
	
	focus.append("path")
		.data([d])
		.attr("clip-path", "url(#clip_"+ this.dom_element + ")")
		.attr("d", line)
		.style("fill","none")
		.style("stroke", self.configuration.color)
		.style("stroke-width","2");

	$("#loading_" + self.dom_element).hide();
}

EV0_NDBC_Time_Series.prototype.IOOS_querystring = function(){
	
	var queryString = 'http://epe.marine.rutgers.edu/visualization/proxy_ndbc.php?http://sdf.ndbc.noaa.gov/sos/server.php?request=GetObservation&service=SOS&offering=urn:ioos:station:wmo:'+ this.configuration.station_id + 
	'&observedproperty=' + this.datasource.metadata.qParam + 
	'&responseformat=text/csv' + 
	'&eventtime=' + this.configuration.start_date + 'T00:00Z/'+ this.configuration.end_date + 'T00:00Z';

	return queryString;	
}

EV0_NDBC_Time_Series.prototype.id = function(){
	// this is simple for now, its here in case we wanted to add any additional naming functionality
//	return this.dom_element + "_" + new Date().getMinutes() + "_" + new Date().getMilliseconds()+ "_container";
//	return this.dom_element + "_container";
		return this.dom_element;
}

Array.prototype.stdev = function(key){
	
	var sum = 0, diff_ary = [], mean, diff_sum = 0, stddev, len = this.length;
	for(var x=0; x < len-1; x++){
		sum += this[x][key];
	}

	mean = ( sum / this.length );
	
	for(var x=0; x < len-1; x++){	
		diff_ary.push( (this[x][key] - mean) * (this[x][key] - mean) );
	}
	
	for(var x=0; x < diff_ary.length;x++){	
		diff_sum += diff_ary[x];
	}
	
	stddev = ( diff_sum / ( diff_ary.length - 1)  );
	
	return stddev;
}