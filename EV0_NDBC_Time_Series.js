// Basic Timeseries Visualization Tool
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University
// Revised 8/22/12

var EV0_NDBC_Time_Series = function( domId, customToolConfiguration ){

    this.evtool = new EVTool();
    this.sos = new ioosSOS();

    var self = this;

    // Default Configuration
    this.configuration = {
        title:"Buoy 44025: Sea Water Temperature",
        subtitle:"January 2012",
        station_id:"44025",
        start_date:"2012-01-01",
        end_date:"2012-02-01",
        color:"#6699CC"
    };

    // Configuration Controls
    this.controls = {
        "station_id":{
            "type":"textbox",
            "label":"NDBC Buoy",
            "tooltip":"Enter an NDBC buoy id.",
            "default_value":"44025"
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
            units2:"Degrees Celcius"
        }
    };

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

    this.tool = {
        domID: self.evtool.domToolID(domId),
        configuration:{
            default:self.configuration,
            custom:self.configuration
        }
    };

    // Create placeholder loading image
    this.loadingDiv();

    // do configuration overrides exist? if so, parse overrides
    this.evtool.configurationParse( self.tool.configuration.custom, customToolConfiguration );

    // parse dataset and draw graph
    this.parse_dataset();

}

EV0_NDBC_Time_Series.prototype.loadingDiv = function(){
    // Create a load
    var self = this;
    $('#'+self.tool.domID).html('<img id="loading_'+ self.tool.domID + '" src="http://epe.marine.rutgers.edu/visualization/img/loading_a.gif" alt="Loading..."/>');
}


EV0_NDBC_Time_Series.prototype.parse_dataset = function(){
    var self = this;

    // build data querystring
    var csvUrl = self.sos.requestUrlTimeseriesDate(
        self.tool.configuration.custom.station_id,
        self.datasource.metadata.qParam,
        {
            dateStart:self.tool.configuration.custom.start_date,
            dateEnd:self.tool.configuration.custom.end_date
        }
    );

    console.log("Requesting CSV: " + csvUrl)

    d3.csv(csvUrl, function(ts_data){

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

//todo: rename draw with createToolChart?
EV0_NDBC_Time_Series.prototype.draw = function(){

    var self = this;
    var domain = self.graph.domain;

    // set up basic graph elements
    var margin = {top: 10, right: 10, bottom: 30, left: 40},

        width = 580 - margin.left - margin.right,
        height = 260 - margin.top - margin.bottom,

        date_time_parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse,

        x = d3.time.scale()
            .range([0, width])
            .domain([domain.x.min,domain.x.max]),
        y = d3.scale.linear()
            .range([height, 0])
            .domain([domain.y.min,domain.y.max]),

        xAxis = d3.svg.axis()
            .scale(x)
            .ticks(8)
            .tickSubdivide(true)
            .orient("bottom"),
        yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

    var svg = d3.select("#"+self.tool.domID).append("svg")
        .attr("id","container_" + self.tool.domID)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip_" + self.tool.domID)
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("id","focusgraph_"+self.tool.domID)
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
        .attr("clip-path", "url(#clip_"+ self.tool.domID + ")")
        .attr("d", line)
        .style("fill","none")
        .style("stroke", self.configuration.color)
        .style("stroke-width","2");

    $("#loading_" + self.tool.domID).hide();
}