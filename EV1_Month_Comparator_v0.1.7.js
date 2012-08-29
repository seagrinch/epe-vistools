// NDBC Month Comparator (EV-T1)
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Mike Mills, Rutgers University
// Revised 8/7/12
// Version 0.1.3

var EV1_Month_Comparator = function ( dom_id, config_override) {

    var self = this;

    this.evtool = new EVTool();
    this.sos = new ioosSOS();

    this.csv_metadata = {
        webservice:{
            url:"http://sdf.ndbc.noaa.gov/sos/server.php",

            query_params:{
                "request":"GetObservation",
                "service":"SOS",
                "offering":"urn:ioos:station:wmo:44025",
                "observedproperty":"sea_water_temperature",
                "responseformat":"text/csv"

                // eventtime will be added after user makes the selection.. should we have a default?
            }
        },
        columns:{
            x:{name:"date_time"},
            y:{
                //name:"sea_water_temperature (C)", units:"&deg; C"
            }
        }
    };

    /***************************************/
    // SETTINGS - Parameters
    /***************************************/

    this.parameters = {

        "sea_water_temperature":{
            "name":"Sea Water Temperature",
            "label":"Sea Water Temperature (C)",
            "query_param":"sea_water_temperature",
            "column":"sea_water_temperature (C)",
            "units":"&deg;C",
            "units2":"Degrees Celcius"
        },
        "sea_water_salinity":{
            "name":"Sea Water Salinity",
            "label":"Sea Water Salinity",
            "query_param":"sea_water_salinity",
            "column":"sea_water_salinity (psu)",
            "units":"",
            "units2":""
        }
    };

    /***************************************/
    // SETTINGS - Stations
    /***************************************/

        // stations object is populated from the configuration list and overridden with the user configuration
    this.stations = {};

    this.createElementDOM(dom_id);

    // default tool configuration
    this.configuration = {

        "title":"EV TOOL 1",
        "subtitle":"Month Comparator",

        "station_list":"44025|LONG ISLAND 33\n44027|Jonesport, Maine",
        "parameter_list":["sea_water_temperature", "sea_water_salinity"],

        "station":"44025",
        "observation":"sea_water_temperature",
        "months": "2010-01|1|#6699CC\n2010-02|1|#FF0000",
        "mean_lines":true
    };

    this.tool = {

        id_prefix:self.domID + "-",

        configuration:{
            custom:self.configuration,
            default:self.configuration
        }
    };


    // do configuration overrides exist? if so, parse overrides
    this.parse_configuration(config_override);

    this.controls = {
        "station_list": {
            "type": "textarea",
            "label": "Station List",
            "tooltip": "Enter a list of NDBC stations in the format: <br><em>BuoyID|Label Name</em><br>Use a new line for each station.",
            "default_value": self.tool.configuration.custom.station_list,
            "delimiter":"|",
            "namedValues":["Station ID","Station Name"] //? not sure about this approach just yet
        },
//        "observation": {
//            "type": "textbox",
//            "label": "Default Observation",
//            "tooltip": "Enter the default observation.",
//            "default_value": "sea_water_temperature"
//        },
        "months":{
            "type": "textarea",
            "label": "Months",
            "tooltip": "Enter a list of Months stations in the format: <br><em>YYYY-MM|Visibility(0 or 1)|#Hex Color</em><br>Use a new line for each month.",
            "default_value": self.tool.configuration.custom.months,
            "delimiter":"|"
        },
        station:{
            "type": "textbox",
            "label": "Default Station",
            "tooltip": "Enter a list of NDBC stations in the format: <br><em>BuoyID|Label Name</em><br>Use a new line for each station.",
            "default_value": self.tool.configuration.custom.station
        }
    }


    //"2010-01|1|#6699CC","2010-02|1|#FF0000","2010-03|1|#FFFF00","2010-04|1|#333333","2010-05|1|#666666","2010-06|1|#999999","2010-07|1|#336666","2010-08|1|#FFEEEE","2010-09|1|red","2010-10|1|blue","2010-11|1|green","2010-12|1|purple"

    // process the station list from the configuration
    $.each(self.tool.configuration.custom.station_list.split("\n"), function ( index, station) {

        //var parts = self.tool.configuration.station_list[station].split("|");
        var parts = station.split("|");

        var station_id = parts[0];
        var station_name = parts[1];

        self.stations[station_id] = {};
        self.stations[station_id].name = station_name;
        self.stations[station_id].label = station_name + " (" + station_id + ")";
    });

    // tool object to hold various properties and methods

    // tool layout object
    this.tool.layout = {
        container:{
            margin:{top:10, right:10, bottom:10, left:40},
            width:760,
            height:450
        },

        controls:{
            margin:{top:10, right:20, bottom:0, left:200},
            width:200
        },

        graph:{
            margin:{top:40, right:10, bottom:40, left:20},
            padding:{top:10, right:10, bottom:10, left:40},
            width:600
        }
    };

    // tool controls object
    this.tool.controls = {};

    this.tool.graph = {

        timeseries:{
            x:null,
            y:null
        },

        dateFormats:{
            hours:d3.time.format("%H:M"),
            days:d3.time.format("%d"),
            months:d3.time.format("%m/%y"),
            tooltip:d3.time.format("%Y-%m-%d %H:%M %Z"),
            data_source:d3.time.format("%Y-%m-%dT%H:%M:%SZ")
        },
        dateScales:{
            hours:d3.time.scale().tickFormat("%H:M"),
            days:d3.time.scale().tickFormat("%d"),
            months:d3.time.scale().tickFormat("%m/%y"),
            tooltip:d3.time.scale().tickFormat("%Y-%m-%d %H:%M %Z")
        },
        d_format:d3.format("0.2r")
    };

    this.tool.graph.axis = {
        x:d3.svg.axis().scale(self.tool.graph.timeseries.x).orient("bottom").tickFormat(d3.time.format("%m-%d")),
        y:d3.svg.axis().scale(self.tool.graph.timeseries.y).orient("left")
    }

    this.tool.timeseries = {
        observation:"",
        station:"",
        datasets:{},
        extents:{
            x:{},
            y:{}
        }
    };

//    this.tool.configuration = {
//        default:self.configuration,
//        custom:$.extend(true, {}, self.configuration)
//
//    }

    this.inputs = {
        months:{"January":"01", "February":"02", "March":"03", "April":"04", "May":"05", "June":"06", "July":"07", "August":"08", "September":"09", "October":"10", "November":"11", "December":"12"},
        years:["2009", "2010", "2011", "2012"]
    }

    // draw ALL UI CONTROLS
    this.ui_graph();

    // draw ALL UI CONTROLS
    this.ui_controls();

    // load defaults if provided
    this.load_default_timeseries();

    function cL(a, b, c) {
        console.log(a);
        console.log(b);
        console.log(c)
    }

    Array.prototype.stdev = function (key) {

        var sum = 0, diff_ary = [], mean, diff_sum = 0, stddev, len = this.length;

        for (var x = 0; x < len - 1; x++) {
            sum += this[x][key];
        }

        mean = ( sum / this.length );

        for (var x = 0; x < len - 1; x++) {
            diff_ary.push((this[x][key] - mean) * (this[x][key] - mean));
        }

        for (var x = 0; x < diff_ary.length; x++) {
            diff_sum += diff_ary[x];
        }

        stddev = ( diff_sum / ( diff_ary.length - 1)  );

        return stddev;
    };

}

EV1_Month_Comparator.prototype.createElementDOM = function ( divId ) {

    var self = this;

    if ( typeof(divId) == "undefined" ){
        self.domID = "ev-" + ( Math.floor ( Math.random( ) * 9000 ) + 1000 ).toString() + "-";
    }
    else{
        self.domID = divId;
    }
}

EV1_Month_Comparator.prototype.parse_configuration = function(config_override){

    var self = this;

    // console.log(typeof(config_override), config_override);

//    self.tool.configuration = {
//        default : self.configuration,
//        custom : self.configuration
//    }

    //console.log("config override type:",config_override,typeof(config_override));

    if( typeof(config_override) == "undefined" ){
        //console.log("no settings passed, default configuration loaded");

        $.extend( true, self.tool.configuration.custom, self.configuration)

    }
    else{

        //override settings exist, so merge overrides into configuration
        $.extend( true, self.tool.configuration.custom, config_override);
    }
};

EV1_Month_Comparator.prototype.ui_graph = function () {

    var self = this;

    var layout = this.tool.layout,
        container = layout.container,
        graph = this.tool.graph,
        controls = this.tool.controls,
        config = this.tool.configuration.custom,
        id = this.tool.id_prefix;

    // some calculations for width and height minus margins
    container.width_m = container.width - container.margin.left - container.margin.right;
    container.height_m = container.height - container.margin.top - container.margin.bottom;

    layout.graph.height = container.height_m;
    layout.graph.height_m = layout.graph.height - layout.graph.margin.top - layout.graph.margin.bottom;

    // adjust the d3 line details
    graph.timeseries.y = d3.scale.linear().range([layout.graph.height_m, 0]);

    /***************************************/
    // d3 elements
    /***************************************/

    self.x_vals = d3.scale.linear().range([0, layout.graph.width]).domain([1, 32])
    self.x_axis = d3.svg.axis().scale(self.x_vals).ticks(6).tickSubdivide(false);

    /***************************************/
    // jQuery DOM Elements
    /***************************************/

        // DomElement: tooltip
    self.tool.graph.tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style('background-color', '#FFFFFF')
        .style("padding", "3px")
        .style("border", "1px solid #333333")
        .text("");

    self.tool_container = d3.select("#" + self.domID)
        .append("div")
        .attr("id", id + "tool-container");

//    self.tool_container.append("defs").append("clipPath")
//            .attr("id", "clip")
//            .append("rect")
//            .attr("width", container.width_m)
//            .attr("height", container.height_m);

    self.d_controls = self.tool_container.append("div")
        .attr("id",  id + "controls-container")
        .style("margin-top", "10px")
        .append("div")
        .attr("id",  id + "controls-div")
        .style("position", "absolute")
        .style("margin-left", layout.graph.width + layout.container.margin.left + layout.graph.margin.left + layout.graph.margin.right + "px")
        .style("width", layout.controls.width + "px")
    //.style("height", layout.container.height_m - 20 + "px")

    // loading div
    self.d_loading = self.tool_container.append("div")
        .attr("id",  id + "div-loading")
        .style("z-index", "100")
        .style("float", "left")
        .style("position", "absolute")
        .style("width", self.tool.layout.container.width + "px")
        .style("height", self.tool.layout.container.height + "px")
        .style("opacity", ".8")
        .style("background-color", "#CCCCCC")
        .style("visibility", "hidden")
        .append("div")
        .append("img")
        .attr("src", "http://epe.marine.rutgers.edu/visualization/img/" + "chart_loading.gif")
        .attr("alt", "LOADING....")
        .style("position", "absolute")
        .style("top", (self.tool.layout.container.height) / 2 - 20 + "px")
        .style("left", (self.tool.layout.container.width / 2) - 30 + "px")

    // DomElement: svg container
    self.svg = self.tool_container.append("svg")
        .attr("id",  id + "svg_main")
        .attr("width", container.width)
        //.attr("width", container.width + container.margin.left + container.margin.right)
        .attr("height", container.height);

    // DomElement: svg g (grouping) for timeseries data
    self.d_timeseries = this.svg.append("g")
        .attr("id", id + "timeseries-g")
        //.attr("transform","translate(0,"+ layout.graph.margin.top +")")
        .attr("transform", "translate(" + container.margin.left + "," + 0 + ")");

    // add the dom elements

    /***************************************/
    // d3 element drawing
    /***************************************/

        // DomElement: title
    self.svg.append("svg:text")
        .attr("id",  id + "graph-title")
        .text("")
        .attr("text-anchor", "middle")
        .attr("x", (container.width / 2) - (container.margin.left + container.margin.right) / 2)
        .attr("y", 15)
        .attr("class", "graph_title");

    // DomElement: x-axis label
    d3.select("#" + id + "svg_main")
        .append("svg:text")
        .attr("id",  id + "graph-x-axis-label")
        .text("Day of Month")
        .attr("text-anchor", "middle")
        .attr("stroke-width", 2)
        .attr("x", (layout.graph.width / 2) + 50)
        .attr("y", layout.graph.height + 10)
        .attr("class", "graph_title");

    // DomElement: y-axis label
    d3.select("#" +  id + "svg_main")
        .append("svg:text")
        .attr("id",  id + "graph-y-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", -(container.height / 2))
        .attr("y", container.margin.left / 2)
        .attr("class", "graph_title")
        .attr("transform", "rotate(270)")
        .text("Degrees Celcius")

    //todo: change to configuration label

    d3.select("#" +  id + "svg_main")
        .append("svg:g")
        .attr("class", "axis")
        .call(self.x_axis)
        .attr("fill", "none")
        .attr("stroke", "#000000")
        .attr("stroke-width", "1")
        .attr("transform", "translate(" + (container.margin.left + layout.graph.margin.left) + ", " + (layout.graph.height - layout.graph.margin.bottom) + ")");

}

EV1_Month_Comparator.prototype.load_default_timeseries = function () {
    var self = this,
        config = self.tool.configuration.custom,
        datasets = self.tool.timeseries.datasets,
        id = self.tool.id_prefix;

    if (config.months.length > 0) {

        console.log("There are " + config.months.length + " months of default data.")

        $.each(config.months.split("\n"), function( index, m ) {

            console.log("CONFIG MONTH",m)

            console.log("splitting up config.months[m] with " + m);
            console.log(config.months);

            var part_month = m;
            var parts = part_month.split("|");

            var visibility = parts[1],
                color = parts[2],
                year_month = parts[0].split("-"),
                year = year_month[0],
                month = year_month[1],
                station = config.station,
                observation = config.observation,
                dstmp = month + "_" + year,
                nextDate = new Date(year, month, 1),
                nextMonth = nextDate.getMonth() + 1;

            if (nextMonth < 10) {
                nextMonth = "0" + nextMonth;
            }

            var event_time = "eventtime=" + year + "-" + month + "-01T00:00Z/" + nextDate.getFullYear() + "-" + nextMonth + "-01T00:00Z";

            var url = "http://epe.marine.rutgers.edu/visualization/" + "proxy_ndbc.php?"
                + "http://sdf.ndbc.noaa.gov/sos/server.php?"
                + "request=GetObservation"
                + "&" + "service=SOS"
                + "&" + "offering=urn:ioos:station:wmo:" + station
                + "&" + "observedproperty=" + observation
                + "&" + "responseformat=text/csv"
                + "&" + event_time

            console.log("Month:" + month + "Year: " + year + "Station: " + station + "  Observation: " + observation);
            console.log("setting default loaded timeseries for " + dstmp)
            console.log(" CSV Via Proxy: " + url);

            // set all dataset properties
            datasets[dstmp] = {

                observation:observation,
                colY:self.parameters[observation].column,
                month:month,
                year:year,
                color:color,
                station:station,
                visibility:1,
                config:year + "-" + month + "|1|" + color,
                url:url,
                isDrawReady:false
            };

            if (m == 0) {
                $("#" +  id + "graph-title").text(self.parameters[observation].label + " at " + self.stations[station].label);
                $("#" +  id + "graph-y-axis-label").text(self.parameters[observation].label);

            }

            d3.csv(datasets[dstmp].url, function (ts_data) {
                //console.log(ts
                var datetime = ts_data[0]["date_time"].substring(0, 7),
                    year_month = datetime.split("-"),
                    dset_name = year_month[1] + "_" + year_month[0];

                datasets[dset_name].data = ts_data;

                self.timeseries_parse_data(dset_name);

            });
        });
    }
}


EV1_Month_Comparator.prototype.toggle_mean_lines = function () {
    var self = this, id = self.tool.id_prefix;

    if ($('#' +  id + 'ctrl-checkbox-mean-lines').is(':checked')) {
        $(".svg_mean").css("visibility", "visible");
    }
    else {

//        $(".svg_mean").each(
//            function(a){
//                // test if visible in legend
//                $(a).style("visibility","visible");
//            }
//        );
        $(".svg_mean").css("visibility", "hidden");
    }

}

EV1_Month_Comparator.prototype.ui_controls = function () {
    var self = this;

    var container = self.tool.layout.container,
        id = self.tool.id_prefix;

    /***************************************/
    // CONTROLS - Legend
    /***************************************/


    var ctrl_legend = $("<div></div>")
        .attr("id",  id + "legend-container")
//            .addClass("well")
//            .css({
//                "height":(container.height_m / 2) + "px",
//                "border":"1px solid green"}
//    )
        .append(
        $("<div></div>")
            .attr("id",  id + "legend")
        // .addClass("well")
    )

        .append(
        $("<button></button>")
            .attr("id",  id + "btn_add_month")
            .addClass("btn")
            .on("click", function (evt) {

                //console.log("Add Month Event: ",event);
                //console.log("Add Month Event (evt): ",evt);

                // get position of btn_add_month

                $("#"+ id + "add-month-div")

                    .css(
                    {
                        "top":evt.pageY + "px",
                        //"left":evt.clientX + "px",
                        "height":"200px",
                        "width":"200px",
                        "position":"absolute"
                    })
                    .show()
            })
            .html("Add Month")
    )

    /***************************************/
    // CONTROLS - STATIONS
    /***************************************/
    var ctrl_dd_station_select = $("<select></select>")
        .attr("id", id + "ctrl-dropdown-station")
        .change(function () {
            self.customization_update();
            self.update_station();
        })

    $.each(self.stations, function (station) {
        ctrl_dd_station_select.append($("<option></option>").html(self.stations[station].label).val(station))
    });


    var ctrl_dd_station = $("<div></div>")
        .addClass("control-dd")
        .append(
        $("<label />")
            .attr({'for': id + 'ctrl-dropdown-station', 'title':"Select a Station"})
            .css("display", "inline-block")
            .html("Station")
    )
        .append(ctrl_dd_station_select)

    ctrl_dd_station_select.val(self.tool.configuration.custom.station);

    /***************************************/
    // CONTROLS - Observation
    /***************************************/
    var ctrl_dd_parameter_select = $("<select></select>")
        .attr("id", id + "ctrl-dropdown-observation")
        .on("change", function () {
            // alert("new observation");
            self.customization_update();
            self.update_observation();
        });

    $.each(self.parameters, function (param) {
        ctrl_dd_parameter_select.append($("<option></option>").html(self.parameters[param].label).val(param))
    });

    var ctrl_dd_parameter = $("<div></div>")
        .addClass("control-dd")
        .append(
        $("<label />")
            .attr({'for': id + 'ctrl-dropdown-observation', 'title':"Select an Observation"})
            .css("display", "inline-block")
            .html("Observation")
    )
        .append(ctrl_dd_parameter_select)

    //ctrl_dd_parameter_select.val(self.configuration.parameter);

    /***************************************/
    // CONTROLS - MEAN LINE TOGGLE
    /***************************************/

    var ctrl_checkbox_mean_lines = $("<div></div>")

        .append(

        $("<input />")
            .attr({
                'id': id + "ctrl-checkbox-mean-lines",
                'type':'checkbox',
                //'value':control.default_value,
                'title':"Toggle the visibility of the Monthly Mean Lines",
                'checked':'checked'
                //    ,
                //'maxlength':typeof(control.maxlength)=="undefined"?"":control.maxlength

            })
            .on("click", function () {
                self.toggle_mean_lines()
            })
    )

        .append(
        $("<label />")
            .attr({"for": id + "ctrl-checkbox-mean-lines",
                "title":"Toggle the visibility of the Monthly Mean Lines"})
            .css({"display":"inline-block", "margin":"6px"})
            .html("Show Mean Lines")
    )


    /***************************************/
    // CONTROLS - MONTH
    /***************************************/

    var ctrl_dd_month_select = $("<select></select>")
        .attr("id",  id + "ctrl-dropdown-month")
        .change(function () {
            self.customization_update();
        })

    $.each(self.inputs.months, function (month) {
        ctrl_dd_month_select.append($("<option></option>").html(month).val(self.inputs.months[month]))
    });

    var ctrl_dd_month = $("<div></div>")
        .addClass("control-dd")
        .append(
        $("<label />")
            .attr({'for': id + 'ctrl-dropdown-month', 'title':"Select a Month"})
            .css("display", "inline-block")
            .html($("<h4>Month: </h4>"))
    )
        .append(ctrl_dd_month_select)

    //select_month.val("02")

    /***************************************/
    // CONTROLS - YEAR
    /***************************************/

    var ctrl_dd_year_select = $("<select></select>")
        .attr("id",  id + "ctrl-dropdown-year")
        .change(function () {
            self.customization_update();
        });

    $.each(self.inputs.years, function (year) {
        ctrl_dd_year_select.append($("<option></option>").html(self.inputs.years[year]).val(self.inputs.years[year]))
    });

    //select_year.val("2010")

    var ctrl_dd_year = $("<div></div>")
        .addClass("control-dd")
        .append(
        $("<label />")
            .attr({'for': id + 'ctrl-dropdown-year', 'title':"Select a Year"})
            .css("display", "inline-block")
            .html($("<h4>Year: </h4>"))
    )
        .append(ctrl_dd_year_select)

    /***************************************/
    // CONTROLS - Color Picker
    /***************************************/

    var ctrl_colorpicker_lbl = $("<label />")
        .attr({'for': id + "ctrl-colorpicker-cp", 'title':"Select a color for the month to be added."})
        .html($("<h4>Color: </h4>"))

    var ctrl_colorpicker_input = $("<input />")
        .attr({"id": id + "ctrl-colorpicker", "type":"text"})
        .addClass("readonly span2")
        .val("#6699CC");

    var ctrl_colorpicker_i = $("<i></i>").css("background-color", "#6699CC");
    var ctrl_colorpicker_span = $("<span></span>").addClass("add-on").append(ctrl_colorpicker_i);

    var ctrl_colorpicker_div = $("<div></div>")
        .addClass("input-append color")
        .attr({"id": id + "ctrl-colorpicker-cp", "data-color":"#6699CC", "data-color-format":"hex"})
        .append(ctrl_colorpicker_input)
        .append(ctrl_colorpicker_span)

    $(ctrl_colorpicker_div)
        .colorpicker()
        .on("changeColor", function (cp) {
            $("#" + id + "ctrl-colorpicker").val(
                cp.color.toHex()
            )
            //self.updateJSON();
            self.customization_update();
        });

    var ctrl_colorpicker = $("<div></div>")
        .addClass("ctlhandle")
        .append(ctrl_colorpicker_lbl)
        .append(ctrl_colorpicker_div);

    var ctrl_btn_addmonth = $("<button></button>")
        .attr("id",  id + "btn_add_timeseries")
        .addClass("btn")
        .on("click", function () {
            //add_month_timeseries()
            self.request_data();
        })
        .html("Add Month")

    var loading_data_image = $("<img />")
        .attr("id", id + "img_loading_data")
        .attr("src", "http://epe.marine.rutgers.edu/visualization/img/" + "loading_a.gif")
        .css({"float":"right","margin-right":"20px"})
        .hide();

    var ctrl_add_month = $("<div></div>")
        .attr("id", id + "add-month-div")

        .addClass("well")
        .hide()
        .append(
        $("<button>x</button>").addClass("close").on("click", function () {
            $("#" + id + "add-month-div").hide()
        })
    )
        .append(
        $("<h3>Add Month</h3>")
    )
        .append(ctrl_dd_month)
        .append(ctrl_dd_year)
        .append(ctrl_colorpicker)
        .append(ctrl_btn_addmonth)
        .append(loading_data_image)

    /***************************************/
    // CONTROLS - SET ALL
    /***************************************/

    $("#"+ id + "controls-div")
        .addClass("well")
        .append(ctrl_legend)
        .append($("<hr/>"))
        .append(ctrl_dd_station)
        .append(ctrl_dd_parameter)
        .append(ctrl_checkbox_mean_lines)
        .append(ctrl_add_month);
}

EV1_Month_Comparator.prototype.request_data = function () {

    console.log("Loading CSV....");


    var self = this, id = self.tool.id_prefix;

    $("#"+ id + "img_loading_data").show();

    // format the web service url request using drop downs.

    var month = $("#" +  id + "ctrl-dropdown-month").val(),
        year = $("#" + id + "ctrl-dropdown-year").val(),
        color = $("#" + id + "ctrl-colorpicker").val();

    var ds_name = month + '_' + year;

    if ( typeof(self.tool.timeseries.datasets[ds_name]) == "undefined") {

        var station = $("#" +  id + "ctrl-dropdown-station").val(),
            observation = $("#" +  id + "ctrl-dropdown-observation").val(),
            event_time;

        console.log("Month:" + month + "Year: " + year + "Station: " + station + "  Observation: " + observation);

        var nextDate = new Date(year, month, 1);
        var nextMonth = nextDate.getMonth() + 1;

        if (nextMonth < 10) {
            nextMonth = "0" + nextMonth;
        }

        event_time = "eventtime=" + year + "-" + month + "-01T00:00Z/" + nextDate.getFullYear() + "-" + nextMonth + "-01T00:00Z";

        var url = "http://sdf.ndbc.noaa.gov/sos/server.php?"
            + "request=GetObservation"
            + "&" + "service=SOS"
            + "&" + "offering=urn:ioos:station:wmo:" + station
            + "&" + "observedproperty=" + observation
            + "&" + "responseformat=text/csv"
            + "&" + event_time;

        var request_url = "http://epe.marine.rutgers.edu/visualization/" + "proxy_ndbc.php?" + url;

        console.log("CSV Via Proxy: " + request_url);

        // request CSV data, send response to callback function
        d3.csv(request_url, function (ts_data) {

            // todo:check length here to report empty dataset?

            self.tool.timeseries.datasets[ds_name] = {
                data:ts_data,
                observation:observation,
                colY:self.parameters[observation].column,
                month:month,
                station:station,
                year:year,
                color:color,
                visibility:1,
                config:year + "-" + month + "|1|" + color,
                isDrawReady:false
                //todo: get reference to observation
            };

            self.timeseries_parse_data(ds_name);

            self.tool.configuration.custom.months += "\n" + year + "-" + month + "|1|" + color;

            //todo: now see if all data has been requested

        });
    }
    else {
        alert("This dataset was previously requested. Select a new Month and Year.")
        $("#"+ id + "csv_loading").hide();
        $("#"+ id + "img_loading_data").hide();
    }
}

EV1_Month_Comparator.prototype.timeseries_add = function (ds_name) {

    var self = this,
        ds = self.tool.timeseries.datasets[ds_name],
        extents = self.tool.timeseries.extents,
        g = self.tool.layout.graph,
        c = self.tool.layout.container,
        layout = self.tool.layout,
        data = ds.data,
        dates = ds.dates,
        mean = ds.mean,
        colX = "date_time",
        colY = ds.colY,
        tooltip = self.tool.graph.tooltip,
        line_y = self.tool.graph.timeseries.y,
        line_x = self.tool.graph.timeseries.x,
        units = self.parameters[ds.observation].units,
        id = self.tool.id_prefix;

    var scaled_width = ( layout.graph.width / 31) * dates.month_days;

    var line_x = d3.time.scale().range([g.margin.left, scaled_width]).domain([dates.range_begin, dates.range_end]);

    // update extents for y
    line_y.domain(self.buffer_data([extents.y.min, extents.y.max]));

    var line = d3.svg.line()
        //.interpolate("monotone")
        .x(function (d) {
            return line_x(d[colX]);
        })
        .y(function (d) {
            return line_y(d[colY]);
        })

    var svg_container = d3.select("#" +  id + "timeseries-g")
        .append("svg:path")
        .attr("transform", "translate(" + 0 + "," + g.margin.top + ")")
        .attr("id",  id + "svg_" + ds_name)
        .attr("class", "svg_timeseries")
        .attr("d", line(data))
        .style("stroke", ds.color)
        .style("fill", "none")
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible")
                .text(dates.month)
                .style('background-color', '#FFFFFF')
                .style("padding", "3px")
                .style("border", "1px solid #333333");
        })
        .on("mousemove", function () {
            return tooltip.style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });

    var date_format = d3.time.format("%m/%d/%Y-%H:%M");

    var tooltips = d3.select("#" + id + "timeseries-g")
        .append("svg:g")
        .attr("transform", "translate(" + 0 + "," + g.margin.top + ")")
        .attr("id",  id + "svg_circles_" + ds_name)
        .selectAll("circle.area")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "area circle_" + ds_name)
        .attr("title", function (d) {
            return d[colY];
        })
        .attr("cx", function (d) {
            return line_x(d[colX]);
        })
        .attr("cy", function (d) {
            return line_y(d[colY]);
        })
        .attr("r", 3.5)
        .style("fill", "#FFFFFF")
        .style("stroke", ds.color)
        .style("stroke-width", 2)
        .on("mouseover", function (d) {
            return tooltip.style("visibility", "visible")
                .html(date_format(d[colX]) + " - <b>" + self.tool.graph.d_format(d[colY]) + units + "</b>")
                .style('background-color', '#FFFFFF')
                .style("padding", "3px")
                .style("border", "1px solid #333333");
        }
    )
        .on("mousemove", function () {
            return tooltip.style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        }
    )
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        }
    );

    ds.isGraphed = true;

    var meanline = d3.svg.line()
        //.interpolate("monotone")
        .x(function (d) {
            return line_x(d[colX]);
        })
        .y(function (d) {
            return line_y(mean);
        })

    console.log("SVG MEAN LINE: " + ds_name)

    var lineMean = d3.select("#" + id + "timeseries-g")
        .append("svg:path")
        .attr("id",  id + "svgmean_" + ds_name)
        .attr("class", "svg_mean")
        .attr("transform", "translate(" + (0) + "," + (g.margin.top) + ")")
        .attr("d", meanline(data))
        .style("stroke", ds.color)
        .style("stroke-dasharray", "9, 5")
        .on("mouseover", function () {
            return tooltip.style("visibility", "visible")
                .html(dates.month + " mean: <b>" + self.tool.graph.d_format(mean) + units + "</b>")
                .style('background-color', '#FFFFFF')
                .style("padding", "3px")
                .style("border", "1px solid #333333");
        })
        .on("mousemove", function () {
            return tooltip.style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
        });

    self.legend_add(ds_name);

    self.redraw_y();

    $("#"+ id + "img_loading_data").hide();

}

EV1_Month_Comparator.prototype.redraw_y = function () {

    var self = this;

    var g = self.tool.layout.graph,
        c = self.tool.layout.container,
        e = self.tool.timeseries.extents,
        count = 0,
        datasets = self.tool.timeseries.datasets,
        colX = "date_time", yAxis,
        id = self.tool.id_prefix;

    //update y axis using global y scale

    for (var dataset in datasets) {

        var dset = datasets[dataset];

        if (dset.isDrawReady) {

            console.log("dataset")
            console.log(dataset);

            count++;

            var line_y = self.tool.graph.timeseries.y;

            colY = dset.colY;

            var scaled_width = ( g.width / 31) * dset.dates.month_days;

            var line_x = d3.time.scale().range([g.margin.left, scaled_width]).domain([dset.dates.range_begin, dset.dates.range_end]);

            // update domain for current line with min and max across datasets
            line_y.domain(self.buffer_data([e.y.min, e.y.max]));

            // line to transition to
            var newline = d3.svg.line()
                // .interpolate("monotone")
                .x(function (d) {
                    return line_x(d[colX]);
                })
                .y(function (d) {
                    return line_y(d[colY]);
                })

            var meanline = d3.svg.line()
                .x(function (d) {
                    return line_x(d[colX]);
                })
                .y(function (d) {
                    return line_y(dset.mean);
                })

            // xtransition lines
            var newpath = d3.selectAll("#" +  id + "svg_" + dataset)
                .transition()
                // .duration(750)
                .attr("d", newline(dset.data));

            // only transition Y!!!
            var newcircles = d3.selectAll(".circle_" + dataset)
                .data(dset.data)
                .transition()
                .duration(750)
                .attr("cy", function (d) {
                    return line_y(d[colY]);
                })

            // new mean line..
            var newmeanlines = d3.selectAll("#" +  id + "svgmean_" + dataset)
                .data(dset.data)
                .transition()
                .duration(750)
                .attr("d", meanline(dset.data));

            yAxis = d3.svg.axis().scale(line_y).ticks(8).tickSubdivide(true).orient("left");

            $("#"+ id + "dynamic_y").remove();

            var svg_c = d3.select("#" + id + "svg_main")
                .append("svg:g")
                .attr("id",  id + "dynamic_y")
                .attr("class", "y axis")
                //.attr("clip-path", "url(#clip)")
                .call(yAxis)
                .attr("fill", "none")
                .attr("stroke", "#000000")
                .attr("shape-rendering", "crispEdges")
                .attr("transform", "translate(" + (g.margin.left + c.margin.left) + "," + (g.margin.top) + ")")

//            var rules = svg_c.selectAll("line")
//                    .attr("x1", 0)
//                    .attr("x2", g.width - g.margin.right)
//                    .attr("y1", line_y)
//                    .attr("y2", line_y)
        }
    }
}

EV1_Month_Comparator.prototype.buffer_data = function (d) {

    var min = d[0], max = d[1];
    var buffer = (max - min) * 0.05;
    console.log(min + "--" + max + " buffer:" + buffer)
    return [min - buffer, max + buffer];
}

EV1_Month_Comparator.prototype.timeseries_parse_data = function (ds_name) {

    var self = this;
    var datasets = self.tool.timeseries.datasets;
    var ds = datasets[ds_name], color = ds.color, id = self.tool.id_prefix;

    // check to see if there is any data, besides headers.. -> empty dataset
    if (ds.data.length == 0) {

        $("#"+ id + "legend-stats").append(


            $("<div></div>")
                .attr("id", id + "stats_" + ds_name)
                .addClass("row-fluid")
//                        .on("click",function(a){
//
//                            if( $("#"+ id + "svg_"+ ds_name).css("visibility")=="hidden"){
//
//                                $("#"+ id + "svg_"+ ds_name).css("visibility","visible")
//                                $("#"+ id + "svgmean_"+ ds_name).css("visibility","visible");
//                                $("#"+ id + "svg_circles_"+ ds_name).css("visibility","visible");
//
//                                $("#"+ id + "svg_legend_toggle_"+ds_name).attr("fill",color)
//                            }
//                            else{
//                                $("#"+ id + "svg_"+ ds_name).css("visibility","hidden")
//                                $("#"+ id + "svgmean_"+ ds_name).css("visibility","hidden");
//                                $("#"+ id + "svg_circles_"+ ds_name).css("visibility","hidden");
//                                $("#"+ id + "svg_legend_toggle_"+ds_name).attr("fill","none")
//                            }
//
//                        })
                .append($("<div></div>").addClass("span2").attr("id", id + "stats_svg_" + ds_name))
                .append($("<div></div>").addClass("span4").css("text-decoration", "line-through").html(ds_name.replace("_", "/")))
                .append($("<div></div>").addClass("span3").html(" --- "))
                .append($("<div></div>").addClass("span3").html(" --- "))
        )


        d3.select("#" +  id + "stats_svg_" + ds_name)
            .append("svg")
            .attr("width", "20")
            .attr("height", "20")
            .append("circle")
            .attr("id",  id + "svg_legend_toggle_" + ds_name)
            .attr("cx", 10)
            .attr("cy", 8)
            .attr("r", 6)
            .attr("stroke", color)
            .attr("stroke-width", "2")
            .attr("fill", "none")

        //    alert("Your request returned an empty dataset. ");
        //todo: show notification box of empty dataset..
        //todo: show a strickthrough in legend?


    }
    else {

        var colY = ds.colY,
            colX = "date_time",
            extents = self.tool.timeseries.extents;

        var parse = d3.time.format("%Y-%m-%dT%H:%M:%SZ").parse,
            month_format = d3.time.format("%B - %Y"),
            end_month, end_year;

        // parse date and convert csv source to numerical values
        ds.data.forEach(function (d) {
            d[colX] = parse(d[colX]);
            d[colY] = +d[colY];
        });

        var ts_min = d3.min(ds.data, function (d) {
            return d[colY];
        });
        var ts_max = d3.max(ds.data, function (d) {
            return d[colY];
        });

        var ts_min_date = d3.min(ds.data, function (d) {
            return d[colX];
        });
        var ts_max_date = d3.max(ds.data, function (d) {
            return d[colX];
        });

        if (typeof (extents.y.min) === "undefined") {
            extents.y.min = ts_min;
            extents.y.max = ts_max;
            //extents.x.min = ts_min_date;
            //extents.x.max = ts_max_date;
        }
        else {
            console.log("calculating extent")
            if (ts_min < extents.y.min) {
                extents.y.min = ts_min;
            }
            if (ts_max > extents.y.max) {
                extents.y.max = ts_max;
            }
            //if(ts_min_date < extents.x.min){extents.x.min = ts_min_date;}
            //if(ts_max_date > extents.x.max){extents.x.max = ts_max_date;}
        }

        // any need to find min and max x?
        // find min and max for x and y colums
        var //minX = extents.x.min,
        //maxX = extents.x.max,
            minY = extents.y.min,
            maxY = extents.y.max;

        // adjust end date for timeseries requesting.
        switch (ts_min_date.getMonth()) {
            case 12:
                end_month = 1;
                end_year = ts_min_date.getFullYear() + 1;
                break;

            default:
                end_month = ts_min_date.getMonth() + 1;
                end_year = ts_min_date.getFullYear();
        }

        ds.isDrawReady = true;
        ds.mean = ( d3.sum(ds.data, function (d) {
            return d[colY];
        }) / ds.data.length);
        ds.stdev = ( d3.values(ds.data).stdev(colY) );
        ds.dates = {
            "month":month_format(ts_min_date),
            "range_begin":new Date(ts_min_date.getFullYear(), ts_max_date.getMonth(), 1),
            "range_end":new Date(end_year, end_month, 1),
            "month_days":new Date(ts_min_date.getFullYear(), ts_min_date.getMonth() + 1, 0).getDate()
        };

        self.timeseries_add(ds_name);

    }

    // hide loading image
    $("#"+ id + "csv_loading").hide();

}


EV1_Month_Comparator.prototype.legend_add = function (ds_name) {

    var self = this,
        dataset = self.tool.timeseries.datasets[ds_name],
        dstats, legend_header, tbl, color = dataset.color,
        id = self.tool.id_prefix;


    if ($("#"+ id + "legend-stats").length == 0) {

        legend_header = $("<div></div>")
            .attr("id",  id + "legend-stats")
            .addClass("container-fluid")
            .append(
            $("<div></div>")
                .addClass("row-fluid")
                .append($("<div></div>").addClass("span2").css("font-weight", "bold").html("&nbsp;&nbsp"))
                .append($("<div></div>").addClass("span4").css("font-weight", "bold").html("MONTH"))
                .append($("<div></div>").addClass("span3").css("font-weight", "bold").html("AVG"))
                .append($("<div></div>").addClass("span3").css("font-weight", "bold").html("STDV"))

        )

        $("#" + id + "legend").append(legend_header)

    }

    var d_mean = self.tool.graph.d_format(dataset.mean),
        d_stdev = self.tool.graph.d_format(dataset.stdev);

    $("#"+ id + "legend-stats").append(


        $("<div></div>")
            .attr("id",  id + "stats_" + ds_name)
            .addClass("row-fluid")
            .on("click", function (a) {

                if ($("#"+ id + "svg_" + ds_name).css("visibility") == "hidden") {

                    $("#"+ id + "svg_" + ds_name).css("visibility", "visible")
                    $("#"+ id + "svgmean_" + ds_name).css("visibility", "visible");
                    $("#"+ id + "svg_circles_" + ds_name).css("visibility", "visible");

                    $("#"+ id + "svg_legend_toggle_" + ds_name).attr("fill", color)
                }
                else {
                    $("#"+ id + "svg_" + ds_name).css("visibility", "hidden")
                    $("#"+ id + "svgmean_" + ds_name).css("visibility", "hidden");
                    $("#"+ id + "svg_circles_" + ds_name).css("visibility", "hidden");
                    $("#"+ id + "svg_legend_toggle_" + ds_name).attr("fill", "none")
                }

            })
            .append($("<div></div>").addClass("span2").attr("id", id + "stats_svg_" + ds_name))
            .append($("<div></div>").addClass("span4").html(ds_name.replace("_", "/")))
            .append($("<div></div>").addClass("span3").html(d_mean))
            .append($("<div></div>").addClass("span3").html(d_stdev))
    )


    d3.select("#"+ id + "stats_svg_" + ds_name)
        .append("svg")
        .attr("width", "20")
        .attr("height", "20")
        .append("circle")
        .attr("id", id + "svg_legend_toggle_" + ds_name)
        .attr("cx", 10)
        .attr("cy", 8)
        .attr("r", 6)
        .attr("stroke", color)
        .attr("stroke-width", "2")
        .attr("fill", color);


    // alert($("#add-month-div").top)
    //$("#"+ id + "add-month-div").css("top", ( $("#" + id + "add-month-div").offset().top + 20 ) + "px")

}


EV1_Month_Comparator.prototype.update_observation = function () {

    var self = this, id = self.tool.id_prefix;
    var observation = $("#" + id + "ctrl-dropdown-observation").val();

    // create new dataset requests, maintain color and visibility setting

    var datasets = self.tool.timeseries.datasets;

    self.tool.timeseries.extents = {x:{},
        y:{}};

    for (var dataset in datasets) {

        var current_property = datasets[dataset].observation;

        // var url = datasets[dataset].url;
        // url = url.replace("observedproperty=" + current_property, "observedproperty=" + observation);
        //console.log("url: " + url)
        //console.log(" replacing (observedproperty=" + current_property, ") with (observedproperty=" + observation + ")")

        var year = datasets[dataset].year,
            month = datasets[dataset].month,
            station = datasets[dataset].station,
            dstmp = month + "_" + year,
            nextDate = new Date(year, month, 1),
            nextMonth = nextDate.getMonth() + 1;

        if (nextMonth < 10) {
            nextMonth = "0" + nextMonth;
        }

        var event_time = "eventtime=" + year + "-" + month + "-01T00:00Z/" + nextDate.getFullYear() + "-" + nextMonth + "-01T00:00Z";

        var url = "http://epe.marine.rutgers.edu/visualization/" + "proxy_ndbc.php?"
            + "http://sdf.ndbc.noaa.gov/sos/server.php?"
            + "request=GetObservation"
            + "&" + "service=SOS"
            + "&" + "offering=urn:ioos:station:wmo:" + station
            + "&" + "observedproperty=" + observation
            + "&" + "responseformat=text/csv"
            + "&" + event_time;

        datasets[dataset].url = url;

        console.log("url: " + url)

        // set all dataset properties
        datasets[dataset].colY = self.parameters[observation].column;
        datasets[dataset].url = url;
        datasets[dataset].isDrawReady = false;
        datasets[dataset].data = null;
        datasets[dataset].observation = observation;

        // remove all svg and legend items for this dataset
        d3.selectAll("#" + id + "svg_circles_" + dataset).remove();
        d3.selectAll("#" + id + "svgmean_" + dataset).remove();
        d3.selectAll("#" + id + "svg_" + dataset).remove();
        d3.select("#" + id + "stats_" + dataset).remove();

        d3.select("#" + id + "graph-y-axis-label").text(self.parameters[observation].label);
        d3.select("#" + id + "graph-title").text(self.parameters[observation].label + " at " + self.stations[station].label);

        d3.csv(datasets[dataset].url, function (ts_data) {

            if(ts_data.length>0)
            {
                var datetime = ts_data[0]["date_time"].substring(0, 7),
                    year_month = datetime.split("-"),
                    dset_name = year_month[1] + "_" + year_month[0];

                datasets[dset_name].data = ts_data;

                self.timeseries_parse_data(dset_name);
            }
            else{
                console.log("dataset error");
            }

        });
    }

}


EV1_Month_Comparator.prototype.update_station = function () {

    var self = this, id = self.tool.id_prefix;
    var observation = $("#" + id + "ctrl-dropdown-observation").val();
    var station = $("#" + id + "ctrl-dropdown-station").val();

    // create new dataset requests, maintain color and visibility setting

    var datasets = self.tool.timeseries.datasets;

    self.tool.timeseries.extents = {x:{},
        y:{}};

    for (var dataset in datasets) {

        var current_property = datasets[dataset].observation;

        // var url = datasets[dataset].url;
        // url = url.replace("observedproperty=" + current_property, "observedproperty=" + observation);
        //console.log("url: " + url)
        //console.log(" replacing (observedproperty=" + current_property, ") with (observedproperty=" + observation + ")")

        var year = datasets[dataset].year,
            month = datasets[dataset].month,
        //station = datasets[dataset].station,
            dstmp = month + "_" + year,
            nextDate = new Date(year, month, 1),
            nextMonth = nextDate.getMonth() + 1;

        if (nextMonth < 10) {
            nextMonth = "0" + nextMonth;
        }

        var event_time = "eventtime=" + year + "-" + month + "-01T00:00Z/" + nextDate.getFullYear() + "-" + nextMonth + "-01T00:00Z";

        var url = "http://epe.marine.rutgers.edu/visualization/" + "proxy_ndbc.php?"
            + "http://sdf.ndbc.noaa.gov/sos/server.php?"
            + "request=GetObservation"
            + "&" + "service=SOS"
            + "&" + "offering=urn:ioos:station:wmo:" + station
            + "&" + "observedproperty=" + observation
            + "&" + "responseformat=text/csv"
            + "&" + event_time;

        datasets[dataset].url = url;

        console.log("url: " + url)

        // set all dataset properties
        datasets[dataset].colY = self.parameters[observation].column;
        datasets[dataset].url = url;
        datasets[dataset].isDrawReady = false;
        datasets[dataset].data = null;
        datasets[dataset].observation = observation;

        // remove all svg and legend items for this dataset
        d3.selectAll("#" + id + "svg_circles_" + dataset).remove();
        d3.selectAll("#" + id + "svgmean_" + dataset).remove();
        d3.selectAll("#" + id + "svg_" + dataset).remove();
        d3.select("#" + id + "stats_" + dataset).remove();

        d3.select("#" + id + "graph-y-axis-label").text(self.parameters[observation].label);
        d3.select("#" + id + "graph-title").text(self.parameters[observation].label + " at " + self.stations[station].label);

        d3.csv(datasets[dataset].url, function (ts_data) {

            if(ts_data.length>0)
            {
                var datetime = ts_data[0]["date_time"].substring(0, 7),
                    year_month = datetime.split("-"),
                    dset_name = year_month[1] + "_" + year_month[0];

                datasets[dset_name].data = ts_data;

                self.timeseries_parse_data(dset_name);
            }
            else{
                console.log("dataset error");
            }

        });
    }

}

EV1_Month_Comparator.prototype.calc_y_extents = function (ts_min, ts_max) {

    var self = this;
    var ts = self.tool.timeseries; //todo:

    if (ts_min < ts.extents.y.min) {
        ts.extents.y.min = ts_min;
    }
    if (ts_max > ts.extents.y.max) {
        ts.extents.y.max = ts_max;
    }

}

EV1_Month_Comparator.prototype.customization_update = function () {
    // this function will update the config file which is used for subsequent calls and lookups
    var self = this, id = self.tool.id_prefix, config = self.tool.configuration.custom;

    //process current months into months arrays

    //  self.tool.configuration.custom = {

    // TODO: function to create pipe delimited station list

    // "station_list":["44025|LONG ISLAND 33", "44027|Jonesport, Maine"],

    // TODO: function to recreate array of parameters
    // "parameter_list":["sea_water_temperature", "sea_water_salinity"],

    config.station = $("#" + id + "ctrl-dropdown-station").val();

    config.observation = $("#" + id + "ctrl-dropdown-observation").val();

    // TODO: function to recreate array of pipe delimted timeseries --> date,visibility,color
    //"months":["2010-01|1|#FF0000", "2010-02|1|#6699CC"],

    config.mean_lines = $("#"+ id + "ctrl-dataset-checkbox-mean_lines").val();
    //   }
};