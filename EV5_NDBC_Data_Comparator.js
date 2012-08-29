// NDBC Data Comparator
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University
// Revised 8/27/12
// Version 0.1.7

var EV5_NDBC_Data_Comparator = function (div_id, customConfiguration) {

    console.log("creating object with div_id " + div_id + " and override: ", customConfiguration)

    this.evtool = new EVTool();
    this.sos = new ioosSOS();

    this.tool = {};

    var self = this;

    /***************************************/
    // SETTINGS - Parameters
    /***************************************/

    this.observations = this.sos.getObservationObj(
        [
            "sea_water_temperature",
            "sea_water_salinity",
            "air_temperature",
            "air_pressure_at_sea_level",
            "waves",
            "winds"
        ]
    );

    // stations object is populated from the configuration list and overridden with the user configuration


    // default tool configuration
    this.configuration = {

        "title":"EV TOOL 5",
        "subtitle":"NDBC Data Comparison Tool",

        "station_list":"41012|Station 41012",
        "observation_list":["sea_water_temperature", "sea_water_salinity"],

        "station":"41012",
        "variable1":"sea_water_temperature",
        "variable2":"sea_water_salinity",

        "date_start":"2010-01-01",
        "date_end":"2010-01-21",

        "chartView":"timeseries"

    };

    this.createElementDOM(div_id);


    // tool object to hold various properties and methods
    this.tool = {
        id_prefix:this.domID + "-",
        container:{
            layout:{
                margin:{top:20, right:100, bottom:0, left:30},
                width:780,
                height:500
            }
        },
        controls:{
            layout:{
                margin:{top:10, right:0, bottom:0, left:0},
                width:200
            }
        },
        chart:{
            axis:{},
            layout:{
                margin:{top:50, right:78, bottom:50, left:62}
            }
        },
        formats:{
            tooltip_num:d3.format("g"),
            linearModel:d3.format("0.4r"),
            tooltip_date:d3.time.format("%Y-%m-%d %H:%M %Z"),
            hours:d3.time.format("%H:M"),
            days:d3.time.format("%d"),
            months:d3.time.format("%m/%y"),
            datasource:d3.time.format("%Y-%m-%dT%H:%M:%SZ")

        },
        scales:{
            datetime:{
                hours:d3.time.scale().tickFormat("%H:M"),
                days:d3.time.scale().tickFormat("%d"),
                months:d3.time.scale().tickFormat("%m/%y")

            }
        },
        configuration:{
            default:self.configuration,
            custom:self.configuration
        },
        datasets:{}
    };


    // overide the configuration
    this.evtool.configurationParse( self.tool.configuration.custom, customConfiguration );

    //create station list from control
    this.stations = this.sos.stationListLB( self.tool.configuration.custom.station_list );

    this.controls = {

        "station_list": {
            "type": "textarea",
            "label": "Station List",
            "tooltip": "Enter a list of NDBC stations in the format: <br><em>BuoyID|Label Name</em><br>Use a new line for each station.",
            "default_value": self.tool.configuration.custom.station_list
        }
    };

    // calculate dimensions for the tool
    this.uiDimensions();

    // draw chart
    this.uiChart();

    // draw ALL UI CONTROLS
    this.uiControls();

    this.dataDownload("initialize");

}

EV5_NDBC_Data_Comparator.prototype.createElementDOM = function ( divId ) {

    var self = this;

    if ( typeof(divId) == "undefined" ){
        self.domID = "ev-" + ( Math.floor ( Math.random( ) * 9000 ) + 1000 ).toString() + "-";
    }
    else{
        self.domID = divId;
    }

    //document.write('<div id="'+ self.domID +'"></div>');
}

EV5_NDBC_Data_Comparator.prototype.uiDimensions = function() {

    // do some calculations here for the tool dimensions

    var self = this,
        container = self.tool.container.layout,
        chart = self.tool.chart.layout,
        controls = self.tool.controls.layout;

    // some calculations for width and height minus margins
    container.width_m = container.width - container.margin.left - container.margin.right;
    container.height_m = container.height - container.margin.top - container.margin.bottom;

    chart.height = container.height_m;
    chart.height_m = chart.height - chart.margin.top - chart.margin.bottom;

    chart.width = container.width_m;
    chart.width_m = chart.width - chart.margin.left - chart.margin.right;

}

EV5_NDBC_Data_Comparator.prototype.uiChart = function () {

    var self = this;

    var container = this.tool.container,
        chart = this.tool.chart,
        controls = this.tool.controls,
        config = this.tool.configuration.custom,
        id = this.tool.id_prefix,
        chart_title = this.observations[config.variable1].name + " vs. " + this.observations[config.variable2].name;

    self.tool_container = d3.select("#" + self.domID) //"#" + id + "tool")
        .append("div")
        .attr("id", id + "tool-container")
        .style("margin-left", container.layout.margin.left+ "px");

    self.tool.chart.tooltip = d3.select("#" + id + "tool-container")
        .append("div")
        .attr("id",id+"tooltip-div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");

    self.d_controls = self.tool_container.append("div")
        .attr("id", id + "controls-container")
        //.style("margin-top", container.layout.margin.top)
        .append("div")
        .attr("id", id + "controls-div")
        .style("float", "left")
        .style("height",container.layout.height + "px")
        .style("width", controls.layout.width + "px")
        .style("margin-top", "3px");//chart.layout.margin.top + "px")


    // DomElement: svg container
    self.svg = self.tool_container.append("div")
        .attr("id",id + "chart_container")
        .append("svg")
        .attr("id", id + "svg_main")
        .attr("width", chart.layout.width)
        .attr("height", chart.layout.height);

    self.svg.append("rect")
        .attr("width",chart.layout.width_m)
        .attr("height",chart.layout.height_m)
        .style("stroke","#000000")
        .style("stroke-width",1)
        .style("fill","none")
        //.attr("x",0)
        //.attr("y",chart.layout.margin.top);
        .attr("transform", "translate(" + chart.layout.margin.left + "," + chart.layout.margin.top + ")");

    // DomElement: svg g (grouping) for timeseries data
    self.g_timeseries = self.svg.append("g")
        .attr("id", id + "timeseries-g")
        .attr("width", chart.layout.width_m)
        .attr("height", chart.layout.height_m)
        .attr("transform", "translate(" + 0 + "," + chart.layout.margin.top + ")");

    self.path_timeseries1 = self.g_timeseries
        .append("svg:path")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + (chart.layout.margin.top-chart.layout.margin.bottom) + ")")
        .attr("id", id + "svg_timeseries1")
        .attr("class", "svg_timeseries")
        //.attr("d","")
        .style("stroke-width",2)
        .style("stroke", "#B94A48")
        .style("fill", "none")

    self.path_timeseries2 = self.g_timeseries
        .append("svg:path")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + (chart.layout.margin.top-chart.layout.margin.bottom) + ")")
        .attr("id", id + "svg-timeseries2")
        .attr("class", "svg-timeseries")
        //  .attr("d","")
        .style("stroke-width",2)
        .style("stroke", "#3A87AD")
        .style("fill", "none");

    self.g_timeseries_symbol1 = self.g_timeseries
        .append("svg:g")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + (chart.layout.margin.top-chart.layout.margin.bottom) + ")")
        .attr("id", id + "svg-timeseries-symbol1")

    self.g_timeseries_symbol2 = self.g_timeseries
        .append("svg:g")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + (chart.layout.margin.top-chart.layout.margin.bottom) + ")")
        .attr("id", id + "svg-timeseries-symbol2")

    self.g_scatterplot = self.svg.append("g")
        .attr("id", id + "scatterplot-g")
        .attr("width", chart.layout.width_m)
        .attr("height", chart.layout.height_m)
        .attr("transform", "translate(" + 0 + "," + chart.layout.margin.top + ")");

    self.clipPath = self.g_scatterplot
        .append("svg:clipPath")
        .attr("id", "clipper")
        .append("svg:rect")
        .attr("width", chart.layout.width_m )
        .attr("height", chart.layout.height_m)
    //.attr("transform", "translate(" + chart.layout.margin.left + "," + 0 + ")");

    self.g_scatter_circles1 = self.g_scatterplot
        .append("svg:g")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + (chart.layout.margin.top-chart.layout.margin.bottom) + ")")
        .attr("id", id + "svg-scatter-circles1")

    self.g_scatter_circles2 = self.g_scatterplot
        .append("svg:g")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + (chart.layout.margin.top-chart.layout.margin.bottom) + ")")
        .attr("id", id + "svg-scatter-circles2")

    self.g_path_scatter_lr = self.g_scatterplot
        .append("svg:path")
        .attr("clip-path", "url(#clipper)")
        // .attr("transform", "translate(" + chart.layout.margin.left + "," + (chart.layout.margin.top-chart.layout.margin.bottom) + ")")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + (0) + ")")
        .attr("id", id + "svg-scatter-lr")
        .style("stroke-width",2)
        .style("stroke", "green")
        .style("fill", "none");

    // container for all labels
    self.g_labels = self.svg.append("g").attr("id",id+"g-labels");

    self.g_labels.append("svg:text")
        .attr("id", id+ "chart-title")
        .text("")
        .attr("text-anchor", "middle")
        .attr("x", (chart.layout.width / 2))
        .attr("y", 25)
        .attr("class", "chart-title");

    // DomElement: x-axis label
    self.g_labels.append("svg:text")
        .attr("id", id + "chart-x-axis-label")
        .text("Date / Time")
        .attr("text-anchor", "middle")
        .attr("stroke-width", 2)
        .attr("x", (chart.layout.width / 2))
        .attr("y", chart.layout.height-10)
        .attr("class", "chart-label-x");

    // DomElement: y-axis label left
    self.g_labels.append("svg:text")
        .attr("id", id + "chart-y-axis-label-var1")
        .attr("text-anchor", "middle")
        .attr("x", -(container.layout.height / 2))
        .attr("y", container.layout.margin.left / 2)
        .attr("class", "chart-label-y")
        .attr("fill","red")
        .attr("transform", "rotate(270)")
        .text("")

    // DomElement: y-axis label right
    self.g_labels.append("svg:text")
        .attr("id", id + "chart-y-axis-label-var2")
        .attr("text-anchor", "middle")
        .attr("x",  (container.layout.height / 2))
        .attr("y", -(chart.layout.width_m + container.layout.margin.right + 10))
        .attr("class", "chart-label-y")
        .attr("fill","blue")
        .attr("transform", "rotate(90)")
        .text("");

    self.g_axis = self.svg.append("g").attr("id",id+"g-axis");

    // x-axis
    self.g_axis_x = self.g_axis.append("svg:g")
        .attr("id",id + "x-axis")
        .attr("class", "axis")
        .attr("transform", "translate(" + (chart.layout.margin.left) + ", " + (chart.layout.height_m + chart.layout.margin.top) + ")");

    //y-axis left
    self.g_axis_y1 = self.g_axis.append("svg:g")
        .attr("id",id + "y-axis-left")
        .attr("transform","translate("+chart.layout.margin.left +","+chart.layout.margin.top+")")
        .attr("class", "axis");

    //y axis right
    self.g_axis_y2 = self.g_axis.append("svg:g")
        .attr("id",id + "y-axis-right")
        .attr("transform","translate("+(chart.layout.width - chart.layout.margin.right) +","+chart.layout.margin.top+")")
        .attr("class", "axis");

    // display options
    self.d_line_info =  self.tool_container
        .append("div")
        .attr("id",id + "line-info")
        .attr("class","well")
        .style("position","absolute")
        .style("left",
        controls.layout.width
            + chart.layout.margin.left
            + container.layout.margin.right + "px")
        .style("top",chart.layout.height_m - chart.layout.margin.top + "px")

    //.style("left",container.layout.width + container.layout.margin.left + container.layout.margin.right + 3 + "px")
    //.style("top",chart.layout.margin.top + "px")

    self.d_line_info .append("div").attr("id",id+"line-equation");
    self.d_line_info .append("div").attr("id",id+"line-coefficient");

    $( "#" + id + "line-info" ).draggable();


}

EV5_NDBC_Data_Comparator.prototype.dataParse = function ( ds, calcMean, calcStdDev ) {

    // parse data when all required data has successfully downloaded

    var self = this,
        parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse;

    // parsing of original dataset is not necessary. dates will be used as keys

    // parse date and convert csv source to numerical values
    ds.data.forEach(function (d) {
        //d[ds.colX] = parse(d[ds.colX]);
        d[ds.colY] = +d[ds.colY];
    });

    // calculate the mean if necessary
    if ( calcMean ) {
        ds.mean = ( d3.sum(ds.data, function (d) { return d[ds.colY]; }) / ds.data.length);
    }

    // calculate the standard deviation if necessary
    if ( calcStdDev ) {
        ds.stdev = ( d3.values(ds.data).stdev(ds.colY) );
    }

    ds.isParsed = true;
}

EV5_NDBC_Data_Comparator.prototype.dataDatasetInit = function ( station,variable,dateStart,dateEnd,url ) {
    var self = this;
    return {
        "station":station,
        "variable":variable,
        "colY":self.observations[variable].column,
        "colX":"date_time",
        "dateStart":dateStart,
        "dateEnd":dateEnd,
        "url":url,
        "isDrawReady":false
    };

}

EV5_NDBC_Data_Comparator.prototype.dataDownload = function (downloadType) {

    var self = this,
        config = this.tool.configuration.custom,
        datasets = self.tool.datasets;

    // variable 1 and variable 2

    var url1 = self.sos.requestUrlTimeseriesDate(
        config.station,
        config.variable1,
        {
            dateStart:config.date_start,
            dateEnd:config.date_end
        }
    );

    var url2 = self.sos.requestUrlTimeseriesDate(
        config.station,
        config.variable2,
        {
            dateStart:config.date_start,
            dateEnd:config.date_end
        }
    );

    datasets["variable1"] = self.dataDatasetInit( config.station,config.variable1,config.date_start,config.date_end,url1);
    datasets["variable2"] = self.dataDatasetInit( config.station,config.variable2,config.date_start,config.date_end,url2);

    d3.csv( url1, function ( data) {

        var ds = self.tool.datasets["variable1"];
        ds.data = data;

        self.dataParse(ds);

        if ( self.dataParseDatasets() ){
            if ( downloadType=="initialize" ){
                self.dataInitialize();
            }
            else {
                self.transitionChart();
            }
        }
    });

    d3.csv( url2, function (data) {

        var ds = self.tool.datasets["variable2"];

        ds.data = data;

        self.dataParse(ds);

        if( self.dataParseDatasets() ){

            if ( downloadType == "initialize" ){
                self.dataInitialize();
            }
            else {
                self.transitionChart();
            }
        }
    });

}

EV5_NDBC_Data_Comparator.prototype.dataInitialize = function ( ) {

    // test for the current chart view

    var self = this,
        dataset = self.tool.datasets["scatter"],

        chartView = self.tool.configuration.custom.chartView,
        chart = self.tool.chart,
        c = self.tool.container,

        colX = "date_time",
        col1 = dataset.dataset1.column,
        col2 = dataset.dataset2.column,
        units1 = dataset.dataset1.units,
        units2 = dataset.dataset2.units,
        label1 = dataset.dataset1.label,
        label2 = dataset.dataset2.label,

        tooltip = self.tool.chart.tooltip,

        id = self.tool.id_prefix,
        color,
        fill,
        extentX = dataset.extentX,
        extentY1 = dataset.extentY1,
        extentY2 = dataset.extentY2,
        points =[];


    console.log("scatter dataset", dataset)

    // draw timeseries 1

    var lineX = d3.time.scale().range([0, chart.layout.width_m]).domain(extentX);
    var lineX2 = d3.scale.linear().range([0, chart.layout.width_m]).domain(extentY2);
    var lineY1 = d3.scale.linear().range([chart.layout.height_m, 0]).domain(extentY1);
    var lineY2 = d3.scale.linear().range([chart.layout.height_m, 0]).domain(extentY2);

    // todo: add test to see if x axis is drawn. set at tool level

    var axisX =  d3.svg.axis().scale(lineX).orient("bottom");
    var axisX2 = d3.svg.axis().scale(lineX2).orient("bottom");
    var axisY1 = d3.svg.axis().scale(lineY1).orient("left");
    var axisY2 = d3.svg.axis().scale(lineY2).orient("right");

    if (chartView == "timeseries") {
        // timeseries view. load or transition to timeseries

        d3.select("#" + id + "chart-title").text(label1 + " & " + label2)
        d3.select("#" + id + "chart-y-axis-label-var1")
            .text(label1)
            .attr("fill","#B94A48")

        d3.select("#" + id + "chart-y-axis-label-var2")
            .text(label2)
            .style("visibility","visible")
            .attr("fill","#3A87AD")

        var line1 = d3.svg.line()
            .x(function (d) {
                return lineX(d[colX]);
            })
            .y(function (d) {
                return lineY1(d[col1]);
            })

        var line2 = d3.svg.line()
            .x(function (d) {
                return lineX(d[colX]);
            })
            .y(function (d) {
                return lineY2(d[col2]);
            })

        // set the path d attribute of both timeseries
        self.path_timeseries1.transition().attr("d", line1(dataset.data));
        self.path_timeseries2.transition().attr("d", line2(dataset.data))

        var date_format = d3.time.format("%m/%d/%Y-%H:%M");
        // add the symbols for mouse over
        self.g_timeseries_symbol1
            .selectAll("circle")
            .data(dataset.data)
            .enter()
            .append("circle")
            .attr("class", "circle_variable1")
            .attr("title", function (d) {return d[col1];})
            .attr("cx", function (d) {return lineX(d[colX]);})
            .attr("cy", function (d) {return lineY1(d[col1]);})
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "#B94A48")
            .style("stroke-width", 1)
            .on("mouseover", function(d){self.timeseries_mouseover(d,colX,col1,units1,"important")})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});


        var fmt = self.tool.formats.tooltip_num;

        self.g_timeseries_symbol2
            .selectAll("circle")
            .data(dataset.data)
            .enter()
            .append("circle")
            .attr("class", "circle_variable1")
            .attr("title", function (d) {return d[col2];})
            .attr("cx", function (d) {return lineX(d[colX]);})
            .attr("cy", function (d) {return lineY2(d[col2]);})
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "#3A87AD")
            .style("stroke-width", 1)
            .on("mouseover", function(d){self.timeseries_mouseover(d,colX,col2,units2,"info")})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});

//        self.g_timeseries_symbol2
//                .selectAll("path")
//                .data(dataset.data)
//                .enter()
//                .append("path")
//                .attr("class", "symbol-variable1")
//                //.attr("title", function (d) {return d[col2];})
////                .attr("cx", function (d) {return lineX(d[colX]);})
////                .attr("cy", function (d) {return lineY2(d[col2]);})
//                //.attr("r", 3.5)
//                .attr("transform", function(d) {return "translate(" + lineX(d[colX]) + "," + lineY2(d[col2]) + ")";})
//                .attr("d", d3.svg.symbol().type("triangle-up"))
//                .style("fill", "#3A87AD")
//                //.style("stroke", "#3A87AD")
//                //.style("stroke-width", 1)
//                .on("mouseover", function(d){self.timeseries_mouseover(d,colX,col2,units2,"info")})
//                .on("mousemove", function(d){self.mousemove()})
//                .on("mouseout", function(d){self.mouseout()});

        d3.select("#" + id + "x-axis").call(axisX);
        d3.select("#" + id + "y-axis-left").call(axisY1);
        d3.select("#" + id + "y-axis-right").style("visibility","visible").call(axisY2);

        d3.select("#" + id + "chart-y-axis-label-var1").text(label1);
        d3.select("#" + id + "chart-y-axis-label-var2").text(label2);
        d3.select("#" + id + "chart-x-axis-label").text("Date Time");

        //transition title, y-left label, y-right label

        $("#" + id + "line-info").hide();


    }
    else {
        // scatter view. load or transition to scatter plot

        d3.select("#" + id + "chart-title").text(label1 + " vs. " + label2)


        var line = d3.svg.line()
            //.interpolate("monotone")
            .x(function (d) {return lineX2(d[col2]);})
            .y(function (d) {return lineY1(d[col1]);})

        //self.g_scatter_circles1
        self.g_timeseries_symbol1
            .selectAll("circle")
            .data(dataset.data)

            .enter().append("circle")
            //  .attr("class","circles_scatter")
            .attr("cx", function(d) { return lineX2(d[col2]); })
            .attr("cy", function(d) { return lineY1(d[col1]); })
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "orange")
            .style("stroke-width", 1)
            .on("mouseover", function(d){self.scatter_mouseover(d,col1,col2,units1,units2,label1,label2)})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});

        //self.g_scatter_circles2
        self.g_timeseries_symbol2
            .selectAll("circle")
            .data(dataset.data)
            .enter().append("circle")
            .attr("cx", function(d) { return lineX2(d[col2]); })
            .attr("cy", function(d) { return lineY1(d[col1]); })
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "orange")
            .style("stroke-width", 1)
            .on("mouseover", function(d){self.scatter_mouseover(d,col1,col2,units1,units2,label1,label2)})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});


        console.log("col1 min", d3.min(dataset.data,function(d){return d[col1];}))
        console.log("col2 min", d3.min(dataset.data,function(d){return d[col2];}))


        var line_lr_x = d3.scale.linear().range([chart.layout.width_m,0 ]).domain(extentY2);//.domain([points[0].x,points[1].x]);
        var line_lr_y = d3.scale.linear().range([chart.layout.height_m,0 ]).domain(extentY1);//.domain([points[0].y,points[1].y]);
        var line_lr = d3.svg.line()
            .x(function (d) {return line_lr_x(d.x);})
            .y(function (d) {return line_lr_y(d.y);})

        //var linR = self.tool.lin
        // set the linear regression line
        self.g_path_scatter_lr.transition().attr("d", line_lr(dataset.linRegPoints))

        d3.select("#" + id + "line-equation").html("y = " + dataset.linResult.slope  + " x + " + dataset.linResult.intercept);
        d3.select("#" + id + "line-coefficient").html("r2 = " + dataset.linResult.r2 )

        self.g_axis_x.call(axisX2);
        self.g_axis_y1.call(axisY1);

        //d3.select("#" + id + "y-axis-right").style("visibility","hidden");

        d3.select("#" + id + "chart-y-axis-label-var1").text(label1);
        d3.select("#" + id + "chart-y-axis-label-var2").transition().style("visibility","hidden");
        d3.select("#" + id + "chart-x-axis-label").transition().text(label2);

        $("#" + id + "line-info").show();

    }

    self.g_axis_x.selectAll(".tick").style("stroke", "#000000").style("fill","none");
    self.g_axis_x.selectAll(".domain").style("stroke","#000000").style("fill","none");

    self.g_axis_y1.selectAll(".tick").style("stroke", "#000000").style("fill","none");
    self.g_axis_y1.selectAll(".domain").style("stroke","#000000").style("fill","none");

    self.g_axis_y2.selectAll(".tick").style("stroke", "#000000").style("fill","none");
    self.g_axis_y2.selectAll(".domain").style("stroke","#000000").style("fill","none");

    self.img_loading_data.hide();
}

EV5_NDBC_Data_Comparator.prototype.transitionChart = function ( ){

    var self = this,
        dataset = self.tool.datasets["scatter"],

        chartView = self.tool.configuration.custom.chartView,
        chart = self.tool.chart,
        c = self.tool.container,

        colX = "date_time",
        col1 = dataset.dataset1.column,
        col2 = dataset.dataset2.column,
        units1 = dataset.dataset1.units,
        units2 = dataset.dataset2.units,
        label1 = dataset.dataset1.label,
        label2 = dataset.dataset2.label,

        tooltip = self.tool.chart.tooltip,

        id = self.tool.id_prefix,
        color,
        fill,
        extentX = dataset.extentX,
        extentY1 = dataset.extentY1,
        extentY2 = dataset.extentY2,
        points =[];

    console.log("scatter dataset", dataset)

    // draw timeseries 1

    var lineX = d3.time.scale().range([0, chart.layout.width_m]).domain(extentX);
    var lineX2 = d3.scale.linear().range([0, chart.layout.width_m]).domain(extentY2);
    var lineY1 = d3.scale.linear().range([chart.layout.height_m, 0]).domain(extentY1);
    var lineY2 = d3.scale.linear().range([chart.layout.height_m, 0]).domain(extentY2);

    // todo: add test to see if x axis is drawn. set at tool level

    var axisX =  d3.svg.axis().scale(lineX).orient("bottom");
    var axisX2 = d3.svg.axis().scale(lineX2).orient("bottom");
    var axisY1 = d3.svg.axis().scale(lineY1).orient("left");
    var axisY2 = d3.svg.axis().scale(lineY2).orient("right");

    if (chartView == "timeseries") {
        console.log(" timeseries view. load or transition to timeseries");

        d3.select("#" + id + "chart-title").text(label1 + " & " + label2)
        d3.select("#" + id + "chart-y-axis-label-var1")
            .text(label1)
            .style("fill","#B94A48")

        d3.select("#" + id + "chart-y-axis-label-var2")
            .text(label2)
            .style("visibility","visible")
            .style("fill","#3A87AD")

        var line1 = d3.svg.line()
            .x(function (d) {
                return lineX(d[colX]);
            })
            .y(function (d) {
                return lineY1(d[col1]);
            })

        var line2 = d3.svg.line()
            .x(function (d) {
                return lineX(d[colX]);
            })
            .y(function (d) {
                return lineY2(d[col2]);
            })

        self.path_timeseries1
            .style("visibility","hidden")
            .attr("d", line1(dataset.data))
            .transition().delay(1200).duration(2000)
            .style("visibility","visible")

        self.path_timeseries2
            .style("visibility","hidden")
            .attr("d", line2(dataset.data))
            .transition().delay(1200).duration(1000)
            .style("visibility","visible")

        // append circles w/ enter
        var enter_symbol1 = self.g_timeseries_symbol1
            .selectAll("circle").data(dataset.data)

        enter_symbol1
            .enter().append("circle")
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "#B94A48")
            .style("stroke-width", 1)

        enter_symbol1.transition().duration(1000)
            .attr("cx", function (d) {return lineX(d[colX]);})
            .attr("cy", function (d) {return lineY1(d[col1]);})
            .style("stroke", "#B94A48")

        enter_symbol1.exit().remove();

        self.g_timeseries_symbol1.selectAll("circle")
            .on("mouseover", function(d){self.timeseries_mouseover(d,colX,col1,units1,"important")})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});

        var enter_symbol2 = self.g_timeseries_symbol2
            .selectAll("circle").data(dataset.data);

        enter_symbol2
            .enter().append("circle")
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "#3A87AD")
            .style("stroke-width", 1);

        enter_symbol2.transition().duration(1000)
            .attr("cx", function (d) {return lineX(d[colX]);})
            .attr("cy", function (d) {return lineY2(d[col2]);})
            .style("stroke", "#3A87AD");

        enter_symbol2.exit().remove();

        self.g_timeseries_symbol2.selectAll("circle")
            .on("mouseover", function(d){self.timeseries_mouseover(d,colX,col2,units2,"info")})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});


        self.g_path_scatter_lr.transition().duration(1000)
            .attr("d");

        self.g_axis_x.call(axisX);
        self.g_axis_y1.call(axisY1);
        self.g_axis_y2.style("visibility","visible").call(axisY2);
        self.g_axis_y2.selectAll(".tick").style("stroke", "#B94A48").style("fill","none");
        self.g_axis_y2.selectAll(".domain").style("stroke","#000000").style("fill","none");

        d3.select("#" + id + "chart-y-axis-label-var1").text(label1);
        d3.select("#" + id + "chart-y-axis-label-var2").text(label2);
        d3.select("#" + id + "chart-x-axis-label").text("Date Time");

        dataset.isGraphed = true;


    }
    else {
        // scatter view. load or transition to scatter plot

        d3.select("#" +id+ "chart-title").text(label1 + " vs. " + label2)

        d3.select("#" + id + "chart-y-axis-label-var1")
            .text(label1)
            .style("fill","#000000")

        var line = d3.svg.line()
            .interpolate("monotone")
            .x(function (d) {return lineX2(d[col2]);})
            .y(function (d) {return lineY1(d[col1]);})

        self.path_timeseries1.transition().duration(1000).style("visibility","hidden");
        self.path_timeseries2.transition().duration(1000).style("visibility","hidden");

        var enter_symbol1 = self.g_timeseries_symbol1
            .selectAll("circle").data(dataset.data);

        enter_symbol1
            .enter().append("circle")
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "orange")
            .style("stroke-width", 1)

        enter_symbol1.transition().duration(1500)
            .attr("cx", function(d) { return lineX2(d[col2]); })
            .attr("cy", function(d) { return lineY1(d[col1]); })
            .style("stroke","orange")

        enter_symbol1.exit().remove();

        self.g_timeseries_symbol1
            .selectAll("circle").selectAll("circle")
            .on("mouseover", function(d){self.scatter_mouseover(d,col1,col2,units1,units2,label1,label2)})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});


        var enter_symbol2 = self.g_timeseries_symbol2
            .selectAll("circle").data(dataset.data);

        enter_symbol2
            .enter().append("circle")
            .attr("r", 3.5)
            .style("fill", "#FFFFFF")
            .style("stroke", "orange")
            .style("stroke-width", 1)

        enter_symbol2.transition().duration(1500)
            .attr("cx", function(d) { return lineX2(d[col2]); })
            .attr("cy", function(d) { return lineY1(d[col1]); })
            .style("stroke","orange")

        enter_symbol2.exit().remove();

        self.g_timeseries_symbol2.selectAll("circle")
            .on("mouseover", function(d){self.scatter_mouseover(d,col1,col2,units1,units2,label1,label2)})
            .on("mousemove", function(d){self.mousemove()})
            .on("mouseout", function(d){self.mouseout()});


        var line_lr_x = d3.scale.linear().range([chart.layout.width_m,0 ]).domain(extentY2);//.domain([points[0].x,points[1].x]);
        var line_lr_y = d3.scale.linear().range([chart.layout.height_m,0 ]).domain(extentY1);//.domain([points[0].y,points[1].y]);
        var line_lr = d3.svg.line()
            .x(function (d) {return line_lr_x(d.x);})
            .y(function (d) {return line_lr_y(d.y);})

        // console.log("Points A and B. for linear regression model", point_a,point_b);

        console.log("points",dataset.linRegPoints);

        // now draw linear regression line
        self.g_path_scatter_lr.transition().delay(1500).duration(1000).attr("d", line_lr(dataset.linRegPoints))

        self.g_axis_x.call(axisX2);
        self.g_axis_x.selectAll(".tick").style("stroke", "#B94A48").style("fill","none");
        self.g_axis_x.selectAll(".domain").style("stroke","#000000").style("fill","none");

        self.g_axis_y1.call(axisY1);

        self.g_axis_y2.style("visibility","hidden")

        //d3.select("#" + id + "y-axis-right").style("visibility","hidden");

        d3.select("#" + id + "chart-y-axis-label-var1").text(label1);
        d3.select("#" + id + "chart-y-axis-label-var2").transition().style("visibility","hidden");
        d3.select("#" + id + "chart-x-axis-label").transition().text(label2);

    }

    var fmt = self.tool.formats.linearModel;

    d3.select("#" + id + "line-equation").html("y = " + fmt(dataset.linResult.slope)  + " x + " + fmt(dataset.linResult.intercept));
    d3.select("#" + id + "line-coefficient").html("r2 = " + fmt(dataset.linResult.r2) )
    //d3.select("#" + id + "line-equation").html("y = " + d3.round(dataset.linResult.slope,4)  + " x + " + d3.round(dataset.linResult.intercept,4));
    //d3.select("#" + id + "line-coefficient").html("r2 = " + d3.round(dataset.linResult.r2,4) )

    self.img_loading_data.hide();
    //$("#" + id + "img_loading_data").hide();

}


EV5_NDBC_Data_Comparator.prototype.dataParseDatasets = function ( ) {

    var self = this,
        ds = self.tool.datasets,
        ds1 = ds["variable1"],
        ds2 = ds["variable2"],
        var1 = ds1.variable,
        var2 = ds2.variable,
        label1 = self.observations[var1].label,
        label2 = self.observations[var2].label,
        units1 = self.observations[var1].units,
        units2 = self.observations[var2].units;

    if ( ds1.isParsed && ds2.isParsed ){

        console.log("Parsing Datasets: ")

        var col1 = ds1.colY,
            col2 = ds2.colY,
            colX = ds1.colX,
            nest1 = d3.nest().key(function(d) { return d["date_time"]; }).entries(ds1.data),
            nest2 = d3.nest().key(function(d) { return d["date_time"]; }).entries(ds2.data),
            scatter_data = {},
            parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse,
            points = [];

        ds["scatter"] = {
            dataset1:{
                column:col1,
                variable:ds1.variable,
                label:label1,
                units:units1
            },
            dataset2:{
                column:col2,
                variable:ds2.variable,
                label:label2,
                units:units2
            },
            dateStart:ds1.date_start,
            dateEnd:ds1.date_end,
            station:ds1.station
        }

        console.log("Counts", nest1.length,nest2.length)

        nest1.forEach( function ( a ) {

            var col1val;

            if ( a.values[0][col1] == undefined ) {

                //col1val = "";
                col1val = null;
            }
            else{

                col1val = a.values[0][col1];
            }

            var tmp = {};
            tmp["date_time"] = parse(a.key);
            tmp[col1] = col1val;
            //tmp[col2] = undefined;
            tmp[col2] = null;

            scatter_data[a.key] = tmp;
        });

        nest2.forEach( function ( a ) {

            var col2val;

            if( a.values[0][col2] == undefined ){

                //col2val = undefined;
                col2val = null;

            }
            else{

                col2val = a.values[0][col2];
            }

            if ( scatter_data[a.key] == undefined ){
                var tmp = {};
                tmp["date_time"] = parse(a.key);
                tmp[col1] = null;
                //tmp[col1] = undefined;
                tmp[col2] = col2val;

                scatter_data[a.key] = tmp;

                delete scatter_data[a.key];

            }
            else{

                scatter_data[a.key][col2] = a.values[0][col2];
            }

        });

        // now remove data with no match
        $.each( scatter_data, function ( a ) {

            if( scatter_data[a][col1] == null || scatter_data[a][col2] == null){

                delete scatter_data[a];
            }
        });

        ds["scatter"].isParsed = true;

        ds["scatter"].data = d3.values(scatter_data);

        //linear regression
        var xData = [];
        $.each(ds["scatter"].data,function(d){xData.push(ds["scatter"].data[d][col2]);});

        var yData = [];
        $.each(ds["scatter"].data,function(d){yData.push(ds["scatter"].data[d][col1]);});

        ds["scatter"].extentX = d3.extent(ds["scatter"].data, function (d) { return d[colX] });
        ds["scatter"].extentY1 = d3.extent(ds["scatter"].data, function (d) { return d[col1] });
        ds["scatter"].extentY2 = d3.extent(ds["scatter"].data, function (d) { return d[col2] });

//        ds["scatter"].extentX = self.buffer_data(d3.extent(ds["scatter"].data, function (d) { return d[colX] }));
//        ds["scatter"].extentY1 = self.buffer_data(d3.extent(ds["scatter"].data, function (d) { return d[col1] }));
//        ds["scatter"].extentY2 = self.buffer_data(d3.extent(ds["scatter"].data, function (d) { return d[col2] }));

        ds["scatter"].linResult = self.linear_regression(xData,yData);

        points[0] = {
            x:ds["scatter"].extentY2[0],
            y:(ds["scatter"].linResult.slope * ds["scatter"].extentY2[1]) + ds["scatter"].linResult.intercept
        };
        points[1] = {
            x:ds["scatter"].extentY2[1],
            y:(ds["scatter"].linResult.slope * ds["scatter"].extentY2[0]) + ds["scatter"].linResult.intercept
        }

        ds["scatter"].linRegPoints = points;

        ds["variable1"] = null;
        ds["variable2"] = null;

        return true;
    }
    else{
        return false;
    }
}

EV5_NDBC_Data_Comparator.prototype.chart_refresh = function(){

    var self = this,
        id= this.tool.id_prefix,
        config = this.tool.configuration.custom;

    //t odo: validate start and end dates

    var dateStart = config.date_start,
        dateEnd = config.date_end;

    $("#" + id + "img_loading_data").show();

    self.dataDownload("transition");
}


EV5_NDBC_Data_Comparator.prototype.uiControls = function () {
    var self = this,
        container = self.tool.container.layout,
        id= self.tool.id_prefix,
        config = self.tool.configuration.custom;

    var ctrl_dd_station_select = $("<select></select>")
        .attr("id", id + "ctrl-dropdown-station")
        .change(function () {
            self.customization_update();
            // self.update_station();
        })
//
//    // todo: need to adjust for user provided list of allowable observations?
    $.each(self.stations, function (station) {
        ctrl_dd_station_select.append($("<option></option>").html(self.stations[station].label).val(station))
    });

    var ctrl_dd_station = $("<div></div>")
        .addClass("control-dd")
        .append(
        $("<label />")
            .attr({'for':id + 'ctrl-dropdown-station', 'title':"Select a Station"})
            .html("Station")
    )
        .append(ctrl_dd_station_select)

    ctrl_dd_station_select.val(config.station);

//    var ctrl_station_input = $("<input />")
//        .attr({
//            "id": id + "ctrl-station",
//            "type": "text"
//        })
//        .val(config.station);
//
//    var ctrl_station = $("<div></div>")
//        .append(
//            $("<label />")
//                .attr({'for':id + 'ctrl-station', 'title':"Enter a Station"})
//                .html("Station")
//        )
//        .append(ctrl_station_input);



    /***************************************/
    // CONTROLS - Time Series Variables
    /***************************************/
    var ctrl_dd_variable1_select = $("<select></select>")
        .attr("id", id + "ctrl-dropdown-var1")
        .on("change", function () {

            self.update_variables("var1");

        });

    $.each(self.observations, function (param) {
        ctrl_dd_variable1_select.append($("<option></option>").html(self.observations[param].label).val(param))
    });

    ctrl_dd_variable1_select.val(config.variable1);


    var ctrl_dd_variable1 = $("<div></div>")
        .addClass("control-dd")
        .append(
        $("<label />")
            .attr({'for': id + 'ctrl-dropdown-var1', 'title':"Select the an Observation"})
            .html("Variable 1")
    )
        .append(ctrl_dd_variable1_select)


    // y-axis variable 2
    var ctrl_dd_variable2_select = $("<select></select>")
        .attr("id", id + "ctrl-dropdown-var2")
        .on("change", function () {
            // alert("new observation");
            //self.customization_update();
            self.update_variables("var2");
        });

    $.each(self.observations, function (param) {
        ctrl_dd_variable2_select.append($("<option></option>").html(self.observations[param].label).val(param))
    });

    ctrl_dd_variable2_select.val(config.variable2);

    // remove options from other

    console.log("#" +id + 'ctrl-dropdown-var2 > option[value="' + config.variable1 + '"]')


    var ctrl_dd_variable2 = $("<div></div>")
        .addClass("control-dd")
        .append(
        $("<label />")
            .attr({'for':id + 'ctrl-dropdown-var2', 'title':"Select an Observation"})
            .html("Variable 2")
    )
        .append(ctrl_dd_variable2_select)

    self.img_loading_data = $("<img />")
        .attr("id",id + "img_loading_data")
        .attr("src", "http://epe.marine.rutgers.edu/visualization/img/" + "loading_a.gif")
        .css({"float":"right","margin-right":"20px"})
        .hide();

    var ctrl_datepicker_date_start_lbl = $("<label />")
        .attr({'for':id+"ctrl-dp-date-start",'title':"Select the Start Date."})
        .html("Date From");

    var ctrl_datepicker_date_start_input = $("<input />")
        .attr({"id":id + "ctrl-dp-date-start","type":"text"})
        .addClass("datepicker")
        .val(config.date_start)
        .on("change",function(){
            //self.customization_update();
        });

    $(ctrl_datepicker_date_start_input).datepicker({
            "dateFormat":"yy-mm-dd",
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true
        }
    )
        .on("changeDate",function(dp){
            //self.customization_update();
        });

    var ctrl_datepicker_date_start = $("<div></div>")
        //        .addClass("ctlhandle")
        .append(ctrl_datepicker_date_start_lbl)
        .append(ctrl_datepicker_date_start_input);

    /***************************************/
    // CONTROLS - DatePicker - End Date
    /***************************************/

    var ctrl_datepicker_date_end_lbl = $("<label />")
        .attr({'for':id+"ctrl-dp-date-end",title:"Select the End Date."})
        .html("Date To");

    var ctrl_datepicker_date_end_input = $("<input />")
        .attr({"id":id + "ctrl-dp-date-end","type":"text"})
        .addClass("datepicker")
        .val(config.date_end)
        .on("change",function(){
            //    self.customization_update();
        });

    $(ctrl_datepicker_date_end_input).datepicker({
            "dateFormat":"yy-mm-dd",
            changeMonth: true,
            changeYear: true,
            showButtonPanel: true
        }
    )
        .on("changeDate",function(dp){
            //self.customization_update();
        });

    var ctrl_datepicker_date_end = $("<div></div>")
        //.addClass("ctlhandle")
        .append(ctrl_datepicker_date_end_lbl)
        .append(ctrl_datepicker_date_end_input);

    /***************************************/
    // CONTROLS - Refresh Button
    /***************************************/


    var ctrl_button_refresh = $("<div></div>")
        .append(
        $("<a></a>")
            .attr({id:"btn_refresh"})
            .css("margin-bottom","6px")

            .addClass("btn btn-primary").html("Refresh Chart ")
            .append($("<i> </i>").addClass("icon-refresh icon-white"))
            .on("click",function(){
                self.customization_update();
                self.chart_refresh();

            })
    )
        .append(self.img_loading_data)


    var ctrl_button_scatter = $("<div></div>")
        .append(
        $("<a></a>")
            .attr("id",id+"btn-scatterplot-view")
            .addClass("btn btn-primary")
            .html("Switch to Scatter Plot View")
            .on("click",function(){

                self.tool.configuration.custom.chartView = "scatterplot";
                self.transitionChart();

                $("#" + id + "btn-timeseries-view").show();
                $("#" + id + "btn-scatterplot-view").hide();

                $("#" + id + "line-info").show();

            }));

    var ctrl_button_timeseries = $("<div></div>")
        .append(
        $("<a></a>")
            .attr("id",id+"btn-timeseries-view")
            .addClass("btn btn-primary")
            .html("Switch to Time Series View")
            .on("click",function(){

                self.tool.configuration.custom.chartView = "timeseries";
                self.transitionChart();

                $("#" + id + "line-info").hide();

                $("#" + id + "btn-timeseries-view").hide();
                $("#" + id + "btn-scatterplot-view").show();

            }));

    var ctrl_opts_linear_fit = $("<div></div>")
        .css("margin-top","12px")
        .append($("<h3></h3>").html("Display Options"))


        .append(
        $("<label>")
            .html("Show Linear Fit to Data")
            .attr("for",id+"checkbox-linear-fit")
            .css({"display":"inline","margin-right":"6px"})
    )
        .append(
        $("<input>")
            .attr("type","checkbox")
            .attr("id",id+"checkbox-linear-fit")
            .attr("checked","checked")
            .on("click",function(){
                console.log("clicked",this);
                if ( this.checked ) {
                    d3.select("#" + id + "svg-scatter-lr").transition().style("visibility","visible");
                }
                else {
                    d3.select("#" + id + "svg-scatter-lr").transition().style("visibility","hidden");
                }
                console.log("clicked")

            })
    );

    var ctrl_opts_gridlines = $("<div></div>")
        .append(
        $("<label>")
            .attr("for",id+"checkbox-show-gridlines")
            .html("Show Grid Lines")
            .css({"display":"inline","margin-right":"6px"})
    )
        .append(
        $("<input>")
            .attr("type","checkbox")
            .attr("id",id+"checkbox-show-gridlines")
            .attr("checked","checked")
            .on("click",function(){console.log("show gridlines ")})
    );

    // now add all controls

    $("#" + id + "controls-div")
        .addClass("well")
//            .append(
//                $("<h3></h3>").html("Data Source")
//            )

        .append(ctrl_dd_station)
        //.append(ctrl_station)
        .append(ctrl_dd_variable1)
        .append(ctrl_dd_variable2)
        .append(ctrl_datepicker_date_start)
        .append(ctrl_datepicker_date_end)
        .append(ctrl_button_refresh)
        .append(ctrl_button_timeseries)
        .append(ctrl_button_scatter)
        .append(ctrl_opts_linear_fit)
    // .append(ctrl_opts_gridlines)


    // remove repeat options for variable dropdowns
    $("#" + id + 'ctrl-dropdown-var2 > option[value="' + config.variable1 + '"]').remove();
    $("#" + id + 'ctrl-dropdown-var1 > option[value="' + config.variable2 + '"]').remove();

    //hide button that is not the default
    $("#" + id + "btn-"+ config.chartView + "-view").hide();

}

EV5_NDBC_Data_Comparator.prototype.linear_regression = function(x,y){

    var lr = {},n = y.length,sum_x = 0,sum_y = 0,sum_xy = 0,sum_xx = 0,sum_yy = 0;

    for (var i = 0; i < y.length; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += (x[i]*y[i]);
        sum_xx += (x[i]*x[i]);
        sum_yy += (y[i]*y[i]);
    }

    lr['slope'] = (n * sum_xy - sum_x * sum_y) / ( n * sum_xx - sum_x * sum_x);
    lr['intercept'] = ( sum_y - lr.slope * sum_x ) / n;
    lr['r2'] = Math.pow(( n * sum_xy - sum_x * sum_y) / Math.sqrt(( n * sum_xx-sum_x * sum_x)*(n*sum_yy-sum_y*sum_y)),2);

    return lr;
}

EV5_NDBC_Data_Comparator.prototype.update_variables = function(variable){

    var self = this,id = "#"+self.tool.id_prefix;

    switch(variable){
        case "var1":
            console.log("Remove selected variable 1 from variable 2 drop down.");

            var dd1 = $(id + "ctrl-dropdown-var1");
            var dd2 = $(id + "ctrl-dropdown-var2");
            var dd2_selected = dd2.val();

            // rebuild all options build all options
            dd2.children().remove();

            $.each(self.observations, function (param) {
                dd2.append($("<option></option>").html(self.observations[param].label).val(param))
            });

            $(id + 'ctrl-dropdown-var2 > option[value="' + dd1.val() + '"]').remove();
            $(dd2).val(dd2_selected)

            break;

        case "var2":
            var dd1 = $(id + "ctrl-dropdown-var1");
            var dd2 = $(id + "ctrl-dropdown-var2");
            var dd1_selected = dd1.val();

            // rebuild all options build all options

            dd1.children().remove();

            $.each(self.observations, function (param) {
                dd1.append($("<option></option>").html(self.observations[param].label).val(param))
            });

            $(id + 'ctrl-dropdown-var1 > option[value="' + dd2.val() + '"]').remove();
            $(dd1).val(dd1_selected)

            break;
    }
}

EV5_NDBC_Data_Comparator.prototype.buffer_data = function (d) {

    var min = d[0], max = d[1];
    var buffer = (max - min) * 0.05;
    console.log(min + "--" + max + " buffer:" + buffer)
    return [min - buffer, max + buffer];
}

EV5_NDBC_Data_Comparator.prototype.customization_update = function () {
    // this function will update the config file which is used for subsequent calls and lookups
    var self = this, id = "#" + this.tool.id_prefix, config = self.tool.configuration.custom;

    //process current months into months arrays

    config["station"] = $(id + "ctrl-dropdown-station").val();
    config["variable1"] = $(id + "ctrl-dropdown-var1").val();
    config["variable2"] = $(id + "ctrl-dropdown-var2").val();
    config["date_start"] = $(id + "ctrl-dp-date-start").val();
    config["date_end"] = $(id + "ctrl-dp-date-end").val();

    //todo: add in additional settings
    // regression line visibility
    // current visible state (scatter vs. time series)

};

EV5_NDBC_Data_Comparator.prototype.timeseries_mouseover = function (d,colX,colY,units,tooltip_label) {
    var self = this,
        date_format = d3.time.format("%m/%d/%Y-%H:%M"),
        fmt = self.tool.formats.tooltip_num;

    return self.tool.chart.tooltip.style("visibility", "visible")
        .attr("class","label label-"+ tooltip_label )
        .html(date_format(d[colX]) + " - <b>" + fmt(d[colY]) + units + "</b>");
}


EV5_NDBC_Data_Comparator.prototype.scatter_mouseover = function (d,colX,colY,units1,units2,observation1,observation2,tooltip_label) {
    console.log("scatter mouseover");

    var self = this,
        fmt_date = self.tool.formats.tooltip_date,
        fmt_num = self.tool.formats.tooltip_num;

    return self.tool.chart.tooltip
        .style("visibility", "visible")
        .attr("class","label label-info")
        .html(
        d["date_time"]
            + " <br />"
            + observation1 + ": " + fmt_num(d[colY]) + units1 + "<br />"
            + observation2 + ": " + fmt_num(d[colX]) + units2
    )
}

EV5_NDBC_Data_Comparator.prototype.mousemove = function () {
    var self = this;

    return self.tool.chart.tooltip
        .style("top", (d3.event.pageY - 10) + "px")
        .style("left", (d3.event.pageX + 10) + "px");

}

EV5_NDBC_Data_Comparator.prototype.mouseout = function () {
    var self = this;

    return self.tool.chart.tooltip.style("visibility", "hidden");
}