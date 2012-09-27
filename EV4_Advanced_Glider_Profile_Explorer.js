// Advanced Glider Profile Explorer
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University
// Revised 8/27/12
// Version 0.1.3

/*

 todo:

 chartProfiles

 chartScatterplot
 svg container
 svg y axis label
 svg scatterplot

 Notes:

 - if only one option (static chart) don't show dropdown ?

 */

var EV4_Advanced_Glider_Profile_Explorer = function (divId, customToolConfiguration) {

    var self = this;

    this.evTool = new EVTool();

    /***************************************/
    // SETTINGS - Parameters
    /***************************************/

    this.observations = {

        "sea_water_temperature":{
            "name":"Seawater Temperature",
            "label":"Seawater Temperature (C)",
            "column":"sea_water_temperature (C)",
            "units":"&deg;C",
            "units2":"Degrees Celcius"
        },
        "sea_water_salinity":{
            "name":"Seawater Salinity",
            "label":"Seawater Salinity",
            "column":"sea_water_salinity (psu)",
            "units":"",
            "units2":""
        },
        "sea_water_density":{
            "name":"Seawater Density",
            "label":"Seawater Density (kg m^-3)",
            "column":"sea_water_density",
            "units":"(kg m^-3)",
            "units2":"m^-3"
        },
        "sci_bb3slo_b470_scaled":{
            "name":"Volume Scattering",
            "label":"Volume Scattering",
            "column":"sci_bb3slo_b470_scaled",
            "units":"",
            "units2":""
        },
        "sci_bb3slo_b532_scaled":{
            "name":"Volume Scattering",
            "label":"Volume Scattering",
            "column":"sci_bb3slo_b532_scaled",
            "units":"",
            "units2":""
        },
        "sci_bb3slo_b660_scaled":{
            "name":"Volume Scattering",
            "label":"Volume Scattering",
            "column":"sci_bb3slo_b660_scaled",
            "units":"",
            "units2":""
        },
        "sci_bbfl2s_cdom_scaled":{
            "name":"CDOM",
            "label":"CDOM (µg L-1)",
            "column":"sci_bbfl2s_cdom_scaled",
            "units":"(ppb)",
            "units2":"ppb"
        },
        "sci_bbfl2s_chlor_scaled":{
            "name":"Chlorophyll",
            "label":"Chlorophyll (µg L-1)",
            "column":"sci_bbfl2s_chlor_scaled",
            "units":"(µg L-1)",
            "units2":"µg L-1"
        }
    };

//    this.webservice = {
//
//        fields:{
//            "deployment":["id","name","start_time","end_time","casts"],
//            "tracks":["deployment_id","obsdate","latitude","longitude","profile_id","direction"],
//            "casts":["deployment_id","obsdate","depth","latitude","longitude","sea_water_temperature","sea_water_salinity","sea_water_density","sci_bb3slo_b470_scaled","sci_bb3slo_b532_scaled","sci_bb3slo_b660_scaled","sci_bbfl2s_cdom_scaled","sci_bbfl2s_chlor_scaled","profile_id","direction"]
//        },
//        getdeployments:{
//            "id":"id",
//            "Name":"name",
//            "Start Time":"start_time",
//            "End Time":"end_time",
//            "Cast Count":"casts"
//        },
//        gettracks:{
//            "Deployment ID":"deployment_id",
//            "Observation Data":"obsdate",
//            "Latitude":"latitude",
//            "Longitude":"longitude",
//            "Profile Id":"profile_id",
//            "Direction":"direction"
//        },
//        getcast:{
//            "Deployment ID":"deployment_id",
//            "Observation Date":"obsdate",
//            "Depth":"depth",
//            "Latitude":"latitude",
//            "Longitude":"longitude",
//            "Seawater Temperature":"sea_water_temperature",
//            "Seawater Salinity":"sea_water_salinity",
//            "Seawater Density":"sea_water_density",
//            "Volume Scattering":"sci_bb3slo_b470_scaled",
//            "Volume Scattering2":"sci_bb3slo_b532_scaled",
//            "Volume Scattering3":"sci_bb3slo_b660_scaled",
//            "CDOM":"sci_bbfl2s_cdom_scaled",
//            "Chlorophyll":"sci_bbfl2s_chlor_scaled",
//            "Profile ID":"profile_id",
//            "Direction":"direction"
//
//        }
//    };

    // default tool configuration
    this.configuration = {

        "title":"EV TOOL 4",
        "subtitle":"Advanced Glider Profile Explorer",
        "deployment":"246",
        "profile_id":"1",
        "observationA":"sea_water_temperature",
        "observationB":"sea_water_salinity"

    };

    // tool object to hold various properties and methods
    this.tool = {
        domID:self.evTool.domToolID(divId),
        formats:{
            tooltip_num:d3.format("g"),
            tooltip_date:d3.time.format("%Y-%m-%d %H:%M %Z"),
            obsdate: d3.time.format("%Y-%m-%dT%H:%M:%SZ"),
            dateDisplay: d3.time.format("%Y-%m-%d %H:%M %Z")

        },
        scales:{
            datetime:{
                hours:d3.time.scale().tickFormat("%H:M"),
                days:d3.time.scale().tickFormat("%d"),
                months:d3.time.scale().tickFormat("%m/%y")
            }
        },
        configuration:{
            original:self.configuration,
            custom:self.configuration
        },
        datasets:{}
    };

    this.evTool.configurationParse( self.tool.configuration.custom, customToolConfiguration );

    this.controls = {

        "deployment":{
            "type":"textbox",
            "label":"Deployment ID",
            "tooltip":"Enter the default deployment id.",
            "default_value":self.tool.configuration.custom.deployment
        },
        "profile_id":{
            "type":"textbox",
            "label":"Profile ID",
            "tooltip":"Enter the default profile id.",
            "default_value":self.tool.configuration.custom.profile
        },
        "observationA":{
            "type":"dropdown",
            "label:":"Observation A",
            "tooltip":"Select the default observation for chart A.",
            "default_value":self.tool.configuration.custom.observationA,
            "options":{}
        },
        "observationB":{
            "type":"dropdown",
            "label:":"Observation B",
            "tooltip":"Select the default observation for chart B.",
            "default_value":self.tool.configuration.custom.observationB,
            "options":{}
        }
    };

    // set the control observation dropdowns
    $.each( this.observations,function( i,observation ){

        self.controls.observationA.options[i]={
            "name": observation.name,
            "value":i
        }

        self.controls.observationB.options[i]={
            "name": observation.name,
            "value":i
        }

    });

    // draw chart
    this.uiToolInterface();

    // draw ALL UI CONTROLS
    this.uiControls();

    // retrieve deployment information
    this.getDeployments( this.tool.configuration.custom.deployment );

    // retrieve track information for the default deployment
    this.getTrack( this.tool.configuration.custom.deployment,this.tool.configuration.custom.profile_id );

};

EV4_Advanced_Glider_Profile_Explorer.prototype.uiToolInterface = function () {

    var self = this,
        id = self.tool.domID;

    var container = self.tool.container,
        chart = self.tool.chart,
        controls = self.tool.controls,
        config = self.tool.configuration.custom,
        chart_title = "",
        ui = self.tool.ui = {};

    ui.container = {};

    ui.container.div = $("<div></div>")
        .attr("id",id + "tool-container")
        .css({
            "border":"2px solid #666666",
            "-moz-border-radius": "5px",
            "border-radius": "5px"
        })
        .addClass("container-fluid")
        .append(
            $("<div></div>")
                .addClass("row-fluid")
                .append(
                $("<div></div>")
                    .addClass("span12")
                    .attr("id", id + "-title")
                    .append(
                    $("<h2></h2>").html("Advanced Glider Profile Explorer").css("border-bottom","2px solid #CCCCCC")
                )
            )
        )
        .append(
        $("<div></div>")
            .attr("id",id+"-chartsRow")
            .css({
                "height":"400px",
                "margin-top":"6px"
            })
            .addClass("row-fluid")
            .append(

            //
            // PROFILES DIV
            //

            $("<div></div>")
                .attr("id", id + "-chart-profiles")
                .addClass("span7 ev-chart")
                .css({
                    //"border":"2px solid #CCCCCC",
                    //"-moz-border-radius": "5px",
                    //"border-radius": "5px",
                    "padding":"2px"
                })
        )
            .append(

            //
            // SCATTERPLOT DIV
            //

            $("<div></div>")
                .attr("id", id + "-chart-scatterplot")
                .addClass("span5 ev-chart")
                .css({
                    //"border":"2px solid #CCCCCC",
                    //"-moz-border-radius": "5px",
                    //"border-radius": "5px",
                    "padding":"3px"
                })
        )
    )
        .append(
        $("<div></div>")
            .addClass("row-fluid")
            .append(
            $("<div></div>").addClass("span7").attr("id", id + "-control-slider")
        )
            .append(
            $("<div></div>").addClass("span5").attr("id", id + "-profile-info")
        )
    );

    // add primary tool container to dom to obtain dimenions
    $("#"+id).append(ui.container.div);

    //tooltips
    ui.tooltips = $("<div></div>")
        .attr("id",id + "-tooltip")
        .css({"position":"absolute","z-index":"10","visibility":"hidden"})
        .text("");
    ui.container.div.append(ui.tooltips);


    // now that container has been placed in the dom, we can calculate the available space
    self.userInterfaceDimensions();

    //
    // PROFILE CHARTS
    //

    var charts = ui.charts;

    // Chart A.. Profile Chart on left
    // chart B.. Profile Chart in middle
    // Chart C.. Scatterplot chart

    var profiles = charts.profiles,
        scatterplots = charts.scatterplot,
        chartA = profiles.a = {},
        chartB = profiles.b = {},
        chartC = scatterplots.a = {};

    // get ui placeholder div for profile charts at left
    var chartProfiles = d3.select("#" + id + "-chart-profiles");

    // Profile Chart A containers for svg, svg:path, svg:g, and svg:rect

    chartA.axisY = chartProfiles.append("svg")
        .attr("id", id + "-chartProfileLabel-svg")
        .attr("width", profiles.properties.yAxisLabelWidth)
        .attr("height", profiles.properties.chartAreaHeight)
        .append("svg:text")
        .attr("id",id+"-profiles-label")
        .attr("transform","translate(0," + profiles.properties.chartAreaHeight/2 + ") rotate(270)")
        .attr("x",0)
        .attr("y",profiles.properties.yAxisLabelWidth/2)
        .attr("fill","purple")
        .attr("text-anchor","middle")
        .text("Depth (m)");

    chartA.svg = chartProfiles.append("svg")
        .attr("id", id + "-chartA-svg")
        .attr("width", profiles.properties.chartWidthA)
        .attr("height", profiles.properties.chartAreaHeight);

    chartA.svgPath  = chartA.svg.append("svg:path")
        .attr("width", profiles.properties.chartWidth) // -4
        .attr("height", profiles.properties.chartAreaHeight)
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("id", id + "-profileA-svg-path")
        .attr("class", "svg-path")
        .attr("stroke-width",2)
        .attr("stroke", "#B94A48")
        .attr("fill", "none");

    chartA.svgSymbols = chartA.svg.append("svg:g")
        .attr("id", id + "-profileA-svg-symbols")
        .attr("width",profiles.properties.chartWidth)
        .attr("height",profiles.properties.chartAreaHeight);

    // add the chart border
    chartA.svg.append("rect")
        .attr("width",profiles.properties.chartWidthA) // -4
        .attr("height",profiles.properties.chartAreaHeight)
        .attr("stroke","#000000")
        .attr("stroke-width",1)
        .attr("fill","none");

    // Profile Chart B containers for svg, svg:path, svg:g, and svg:rect
    chartB.svg = chartProfiles.append("svg")
        .attr("id", id + "-chartB-svg")
        .attr("width", profiles.properties.chartWidthB)
        .attr("height", profiles.properties.chartAreaHeight);

    chartB.svgPath = chartB.svg.append("svg:path")
        .attr("width", profiles.properties.chartWidth)
        .attr("height", profiles.properties.chartAreaHeight)
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("id", id + "-profileB-svg-path")
        .attr("class", "svg-path")
        .attr("stroke-width",2)
        .attr("stroke", "#B94A48")
        .attr("fill", "none");

    chartB.svgSymbols = chartB.svg.append("svg:g")
        .attr("id", id + "-profileB-svg-symbols")
        .attr("width",profiles.properties.chartWidth)
        .attr("height",profiles.properties.chartAreaHeight);

    chartB.svg.append("rect")
        .attr("width",profiles.properties.chartWidthB)
        .attr("height",profiles.properties.chartAreaHeight)
        .attr("stroke","#000000")
        .attr("stroke-width",1)
        .attr("fill","none");

    //
    // Scatterplot Chart Container
    //

    var chartScatterplot =  d3.select("#" + id + "-chart-scatterplot");

    chartC.axisY = chartScatterplot.append("svg")
        .attr("id", id + "-chart-scatterplot-svg-label")
        .attr("width", scatterplots.properties.yAxisLabelWidth)
        .attr("height", scatterplots.properties.chartAreaHeight)
        .append("svg:text")
        .attr("id",id+"-scatterplot-label")
        .attr("transform","translate(0,"+ scatterplot.properties.chartAreaHeight/2 +") rotate(270)")
        .attr("x",0)
        .attr("y",scatterplots.properties.yAxisLabelWidth/2)
        .attr("fill","purple")
        .attr("text-anchor","middle")
        .text(self.observations[config.observationA].label);

    chartC.svg = chartScatterplot.append("svg")
        .attr("id", id + "-scatterplot-svg")
        .attr("width", scatterplots.properties.chartWidth)
        .attr("height", scatterplots.properties.chartAreaHeight);

    chartC.svg.append("rect")
        .attr("width",scatterplots.properties.chartWidth)
        .attr("height",scatterplots.properties.chartAreaHeight)
        .attr("stroke","#000000")
        .attr("stroke-width",1)
        .attr("fill","none");

    chartC.svgPath = chartC.svg.append("svg:path")
        .attr("width", scatterplots.properties.chartWidth)
        .attr("height", scatterplots.properties.chartAreaHeight)
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("id", id + "-scatterplot-svg-path")
        .attr("class", "svg-path")
        .attr("stroke-width",2)
        .attr("stroke", "#B94A48")
        .attr("fill", "none");

    chartC.svgPathRegression = chartC.svg.append("svg:path")
        .attr("width", scatterplots.properties.chartWidth)
        .attr("height", scatterplots.properties.chartAreaHeight)
        .attr("transform", "translate(" + 0 + "," + 0 + ")")
        .attr("id", id + "-scatterplot-svg-regression")
        .attr("class", "svg-path")
        .attr("stroke-width",2)
        .attr("stroke", "#B94A48")
        .attr("fill", "none");

    chartC.svgSymbols = chartC.svg.append("svg:g")
        .attr("id", id + "-scatterplot-svg-symbols")
        .attr("width", scatterplots.properties.chartWidth)
        .attr("height", scatterplots.properties.chartAreaHeight);

    // CONTROLS

    var chartProfilesControls = chartProfiles.append("div")
        .attr("id", id + "-chart-profile-controls")
       // .style("background-color","#FFF")
        .style("height",profiles.properties.chartFooterHeight + "px")
        .style("width",profiles.properties.width - profiles.properties.yAxisLabelWidth - 8 + "px")
        .style("margin-left",profiles.properties.yAxisLabelWidth+ "px")
        .append("div").attr("class","container-fluid")
        .append("div").attr("class","row-fluid");

    // append div for observation A dropdown
    chartProfilesControls
        .append("div")
        .attr("id",id+"-control-dropdown-observationA")
        .attr("class","span6")
        .style("text-align","center");

    // append div for observation A dropdown
    chartProfilesControls
        .append("div")
        .attr("id",id+"-control-dropdown-observationB")
        .attr("class","span6")
        .style("text-align","center");

    var chartScatterplotControls = chartScatterplot.append("div")
        .attr("id", id + "-scatterplot-controls")
       // .style("background-color","#FFF")
        .style("height",scatterplots.properties.chartFooterHeight + "px")
        .style("width",scatterplots.properties.width - scatterplots.properties.yAxisLabelWidth - 8 + "px")
        .style("margin-left",scatterplots.properties.yAxisLabelWidth+ "px")
        .append("div").attr("class","container-fluid")
        .append("div").attr("class","row-fluid");

    // x axis label

    // append div for observation A dropdown
    chartScatterplotControls
        .append("div")
        .attr("id",id+"-scatterplot-label-x")
        .attr("class","span12")
        .style("text-align","center");


    //todo: incorporate margins in chart area div
//    $("#" + id+ "-chart-profiles").html($("#" + id+ "-chart-profiles").width());
//    $("#" + id+ "-chart-scatterplot").html($("#" + id+ "-chart-scatterplot").width());


    //   $("#" + id+ "-profile-info").html("PROFILE INFO");
    //   $("#" + id+ "-control-slider").html("_SLIDER");


//
//    self.tool.chart.tooltip = d3.select("#" + id + "tool-container")
//        .append("div")
//        .attr("id",id + "tooltip-div")
//        .style("position", "absolute")
//        .style("z-index", "10")
//        .style("visibility", "hidden")
//        .text("");
//
//
//
//    self.d_controls = self.tool_container.append("div")
//        .attr("id", id + "controls-container")
//        //.style("margin-top", container.layout.margin.top)
//        .append("div")
//        .attr("id", id + "controls-div")
//        .style("float", "left")
//        .style("height",container.layout.height + "px")
//        .style("width", controls.layout.width + "px")
//        .style("margin","10px 10px 10px 10px")
//
//    // DomElement: svg container
//    self.svg = self.tool_container.append("div")
//        .attr("id",id + "chart_container")
//        .append("svg")
//        .attr("id", id + "svg-main")
//        .attr("width", chart.layout.width)
//        .attr("height", container.layout.height);
//
//    //border svg rectangle
//    self.svg.append("rect")
//        .attr("width",chart.layout.width_m)
//        .attr("height",chart.layout.height_m)
//        .style("stroke","#000000")
//        .style("stroke-width",1)
//        .style("fill","none")
//        .attr("transform", "translate(" + chart.layout.margin.left + "," + chart.layout.margin.top + ")");
//
//    // DomElement: svg g (grouping) for timeseries data
//
//    self.g_path_container = self.svg.append("g")
//        .attr("id", id + "g-path-container")
//        .attr("width", chart.layout.width_m)
//        .attr("height", chart.layout.height_m)
//        .attr("transform", "translate(" + chart.layout.margin.left + "," + 0 + ")");
//
//
//    self.g_path = self.g_path_container
//        .append("svg:path")
//        .attr("width", chart.layout.width_m)
//        .attr("height", chart.layout.height_m)
//        .attr("transform", "translate(" + 0 + "," + chart.layout.margin.top + ")")
//        .attr("id", id + "svg-path")
//        .attr("class", "svg-path")
//        .style("stroke-width",2)
//        .style("stroke", "#B94A48")
//        .style("fill", "none")
//
//    self.g_path_symbols = self.g_path_container
//        .append("svg:g")
//        .attr("transform", "translate(" + 0 + "," + chart.layout.margin.top + ")")
//        .attr("id", id + "svg-path-symbol")
//
//    self.g_axis = self.svg.append("g")
//        .attr("id", id +"g-axis")
//        .attr("transform", "translate(" + chart.layout.margin.left + "," + chart.layout.margin.top + ")");
//
//    // x-axis
//    self.g_axis_x = self.g_axis.append("svg:g")
//        .attr("id",id + "x-axis")
//        .attr("class", "axis")
//        .attr("transform", "translate(" + 0 + ","+ chart.layout.height_m +")");
//
//    //y-axis left
//    self.g_axis_y = self.g_axis.append("svg:g")
//        .attr("id",id + "y-axis-left")
//        .attr("class", "axis")
//
//    // container for all labels
//    self.g_labels = self.svg.append("g")
//        .attr("width",chart.layout.width)
//        .attr("height",container.layout.height + 30)
//        .attr("id", id + "g-labels")
//
//
//    // x-axis label
//    self.g_labels.append("svg:text")
//        .attr("id", id + "chart-x-axis-label")
//        //.attr("width",chart.layout.width)
//        .text("x-axis")
//        .attr("text-anchor", "middle")
//        .attr("stroke-width", 2)
//        .attr("fill","#b94a48")
//        .attr("x", chart.layout.margin.left + chart.layout.width_m/2)
//        .attr("y", chart.layout.height + chart.layout.margin.bottom - 4 )
//        .attr("class", "chart-label-x")
//        .on("click",function(d){
//
//            var position = $(this).position();
//
//            // get the top left position of the
//            d3.select("#"+id+"ctrl-observations")
//                .style("visibility","visible")
//                .style("top", (position.top - 2) + "px")
//                .style("left", (position.left - 5 ) + "px");
//
//            $(this).css("visibility","hidden");
//        })
//
//    // DomElement: y-axis label left
//    self.g_labels.append("svg:text")
//        .attr("id", id + "chart-y-axis-label")
//        .attr("text-anchor", "middle")
//        .attr("x", -(container.layout.height / 2))
//        .attr("y", container.layout.margin.left / 2)
//        .attr("class", "chart-label-y")
//        .attr("fill","#000000")
//        .attr("transform", "rotate(270) translate(0,"+ chart.layout.margin.left/3 +")")
//        .text("Depth (m)")
};

EV4_Advanced_Glider_Profile_Explorer.prototype.userInterfaceDimensions = function ( ) {

    // calculate the dimensions for all ui elements
    var self = this, ui = self.tool.ui, id = self.tool.domID;

    var container = ui.container,
        charts = ui.charts = {},

        props = container.properties = {};

    // get width of tool container dom element
    props.width = $(container.div).width();

    props.chartRowHeight = $("#"+id+"-chartsRow").height();
    props.chartMargins = {top:5,right:5,bottom:20,left:5};
    props.chartFooterHeight = 30;
    props.chartAreaHeight = props.chartRowHeight - props.chartMargins.top - props.chartMargins.bottom;
    //chartAreaHeight = chartRowHeight - chartMargins.top - chartMargins.bottom - chartFooterHeight;

    profiles = charts.profiles = {};
    scatterplot = charts.scatterplot = {};

    profiles.properties = {
        "yAxisLabelWidth":20,
        "chartFooterHeight": props.chartFooterHeight,
        "margin": {top:0,right:0,bottom:0,left:0},
        "height" : props.chartAreaHeight,
        "width":$("#" + id+ "-chart-profiles").width(),
        "chartAreaHeight":props.chartAreaHeight,
        "chartHeight":"",
        "chartWidth":0

    };

    scatterplot.properties = {
        "yAxisLabelWidth":20,
        "chartFooterHeight":props.chartFooterHeight,
        "margin": {top:5,right:5,bottom:5,left:5},
        "height" : props.chartAreaHeight,
        "chartAreaHeight": props.chartAreaHeight,
        "width":$("#" + id+ "-chart-scatterplot").width()
    };

    profiles.properties.chartWidth =
        profiles.properties.chartWidthA =
            profiles.properties.chartWidthB = ( profiles.properties.width - profiles.properties.yAxisLabelWidth - 8 ) / 2;

    scatterplot.properties.chartWidth = scatterplot.properties.width - scatterplot.properties.yAxisLabelWidth - 10;

};

EV4_Advanced_Glider_Profile_Explorer.prototype.uiControls = function () {
    var self = this,
        id= self.tool.domID,
        config = self.tool.configuration.custom,
        ui=self.tool.ui,
        controls = ui.controls = {};

    controls.ctrlDeplymentInfo = $("<div></div>")

        .append(

        $("<div></div>")
            .append(
            $('<h3 class="page-header"></h3>')
                .css({"padding-bottom":"0","margin":"0"})
                .html("Glider Deployment:  ")
                .append(
                $("<small></small>")
                    .addClass("attribute")
                    .attr("id",id+"-deployment-info-name")
            )
        )
            .append(
            $("<h5></h5>")
                .html("Start Time: ")
                .append(
                $("<span></span>")
                    .addClass("attribute")
                    .attr("id",id+"-deployment-info-start-time")
            )

        )
            .append(
            $("<h5></h5>")
                .html("End Time: ")
                .append(
                $("<span></span>")
                    .addClass("attribute")
                    .attr("id",id+"-deployment-info-end-time")
            )

        )
//                .append(
//                        $("<h5></h5>")
//                            .html("Profile Count: ")
//                            .append(
//                                $("<span></span>")
//                                    .addClass("attribute")
//                                    .attr("id",id+"deployment-info-profile-count")
//                            )
//                )
    );

    controls.ctrlProfileSelection = $("<div></div>")
        .css({"padding":"0","margin":"14px 0"})
        .addClass("container-fluid")
        .append(

        $("<div></div>")
            .addClass("row-fluid")
            .append(
            $("<div></div>")
                .addClass("span2")
                .append(
                $("<li></li>")
                    .addClass("pager previous")
                    .append(
                    $("<a></a>")
                        .html("&larr;")
                        .on("click",function(){

                            var slider = $("#"+ self.tool.domID+"-control-profile-slider");
                            var val = slider.slider("option","value");

                            if ( val != slider.slider("option","min") ){
                                slider.slider("value", val - 1 );
                            }
                        })
                )
            )
        )

            .append(
            $("<div></div>")
                .addClass("span8")
                .append(
                $("<div></div>")

                    .attr("id",id+"-control-profile-slider")
                    .slider({
                        slide: function(event, ui) {
                            // CONSOLE-OFF console.log("here we can possibly highlight the profile as we slide across")
                            //$("#" + id + "profile-selection").html(
                            $("#" + id + "-profile-info-id").html(
                                self.tool.datasets[self.tool.configuration.custom.deployment].profiles[ui.value].profile_id
                            );

                        },
                        change: function(event, ui) {

                            self.slideProfile(ui.value);

                        }
                    })
            )
                .append(
                $("<div></div>")
                    .css({"float":"left","font-weight":"bold"})
                    .html("1")
            )
                .append(
                $("<div></div>")
                    .attr("id", id + "-deployment-info-profile-count")
                    .css({"float":"right","font-weight":"bold"})
                    .html("&nbsp;")
            )
        )
            .append(
            $("<div></div>")
                .addClass("span2")
                .append(
                $("<li></li>")
                    .addClass("pager next")
                    .append(
                    $("<a></a>")
                        //.attr("href","#")
                        .html("&rarr;")
                        .on("click",function(){

                            var slider = $("#"+ self.tool.domID+"-control-profile-slider");
                            var val = slider.slider("option","value");

                            if ( val != slider.slider("option","max")){
                                slider.slider("value", val + 1 );
                            }
                        })
                )
            )
        )
    );

    controls.ctrlProfileInfo = $("<div></div>")
        .css({"margin-top":"12px","padding":"0","margin":"0"})
        .addClass("container-fluid")
        .append(

        $("<div></div>")
            .addClass("row-fluid")
            .append(

            $("<div></div>")
                .addClass("span2 profile-info-box")
                .css("text-align","center")
                .html("<h3>Profile</h3>")
                .append(
                $("<h2></h2>")
                    .attr("id", id + "-profile-info-id")
            )
        )
            .append(

            $("<div></div>")
                .addClass("span4 profile-info-box")
                //.css("text-align","right")
                .html('<h3 style="text-align:center">Location <i class="icon-zoom-in"></i></h3>' +
                '<div>Latitude: <span style="float:right" id="'+id+'-profile-info-lat"></span></div>' +
                '<div>Longitude: <span style="float:right" id="'+id+'-profile-info-long"></span></div>')

        )
            .append(

            $("<div></div>")
                .addClass("span3 profile-info-box")
                .css("text-align","center")
                .html('<h3>Direction</h3>'+
                '<div><img id="'+id+'-profile-info-direction" /></div>')
        )
            .append(

            $("<div></div>")
                .addClass("span3 profile-info-box")
                .css("text-align","center")
                .html('<h3>Date</h3>'+
                '<div><span id="'+id+'-profile-info-date"></span></div>')
        )
    );

    controls.ctrlDropdownObservationsSelectA = $("<select></select>")
        //.attr("id",id+"dd-observations")
        .change(function(a){

            self.customizationUpdate();

            self.transitionChartProfile("a", $(this).val() );

            self.transitionChartScatterplot("a");

        });

    controls.ctrlDropdownObservationsSelectB = $("<select></select>")
        //.attr("id",id+"dd-observations")
        .change(function(a){

            self.customizationUpdate();

            self.transitionChartProfile("b", $(this).val() );

            self.transitionChartScatterplot("a");

        });

    self.updateDropdownObservations();

    $("#" + id+ "-profile-info")
        .append(controls.ctrlProfileInfo);

    $("#" + id+ "-control-slider")
        .append(controls.ctrlProfileSelection);

    $("#" + id+ "-control-dropdown-observationA")
        .append(controls.ctrlDropdownObservationsSelectA);

    $("#" + id+ "-control-dropdown-observationB")
        .append(controls.ctrlDropdownObservationsSelectB);

};

EV4_Advanced_Glider_Profile_Explorer.prototype.getDeployments = function (deploymentId){

//    http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getdeployments
//
//        id,name,start_time,end_time,casts
//        246,"RU07 MURI/OOI",2011-12-14T17:11:00Z,2012-01-07T14:47:00Z,1651

    var self = this, id = self.tool.domID, config = self.tool.configuration.custom;

    var url = "http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getdeployments";

    d3.csv( url, function ( data) {

        var datasets = self.tool.datasets;
        datasets["deployment"] = {};

        var ds = datasets["deployment"];
        ds.data = data;

        var deployObj = {};

        ds.data.forEach(function (d){

            console.log("getdeployment data",d);

//                "id":"id",
//                "Name":"name",
//                "Start Time":"start_time",
//                "End Time":"end_time",
//                "Cast Count":"casts"

            d.casts = +d.casts;
            d.start_time = self.tool.formats.obsdate.parse(d.start_time);
            d.end_time = self.tool.formats.obsdate.parse(d.end_time);

            if( d.id == config.deployment ){

                self.displayInfoDeployment(d);
            }
        });
    });

};

EV4_Advanced_Glider_Profile_Explorer.prototype.displayInfoDeployment = function ( d ){

    var self = this, id = self.tool.domID;

    // CONSOLE-OFF console.log("displayInfoDeployment",d);
    // CONSOLE-OFF console.log("arguments",arguments);
    console.log("diplayInfo:", d);

    $("#" + id + "-deployment-info-name").html(d.name);

    $("#" + id + "-deployment-info-profile-count").html(d.casts);

    $("#" + id + "-deployment-info-start-time").html(self.tool.formats.dateDisplay(d.start_time));
    $("#" + id + "-deployment-info-end-time").html(self.tool.formats.dateDisplay(d.end_time));

//
//        casts: "1651"
//        end_time: "2012-01-07T14:47:00Z"
//        id: "246"
//        name: "RU07 MURI/OOI"
//        start_time: "2011-12-14T17:11:00Z"
//

};

EV4_Advanced_Glider_Profile_Explorer.prototype.getTrack = function ( deploymentId, profileId ){

//    http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=gettrack&deploymentid=246

//        deployment_id,obsdate,latitude,longitude,profile_id,direction
//        246,2011-12-14T17:32:14Z,41.343,-70.9957,1,0
//        246,2011-12-14T17:34:55Z,41.3426,-70.9951,2,1

    var self = this;
    var deployment = deploymentId, profile = profileId;

    var url = "http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=gettrack&deploymentid=" + deployment;

    console.log("getTrack:" , url);

    d3.csv( url, function ( data) {

        // CONSOLE-OFF console.log( "get track csv call data: " , data)

        var datasets = self.tool.datasets;
        datasets[deployment] = {};

        var dateParse = self.tool.formats.obsdate;

        data.forEach(function(d){

            if( +d.direction == 0 ){
                d.direction = "Down";
            }
            else{
                d.direction = "Up";
            }

            d["longitude"] = +d["longitude"];
            d["latitude"] = +d["latitude"];
            d["obsdate"] = dateParse.parse(d["obsdate"]);

//            "cast" : d.profile_id, /??
//            "direction" : d.direction,
//            "longitude" : +d["longitude"],
//            "latitude" : +d["latitude"],
//            "obsdate" : d["obsdate"]

        });

        datasets[deployment].profiles = data;

        self.setSlider( data.length - 1 );

        self.getCast( self.tool.configuration.custom.deployment, self.tool.configuration.custom.profile_id );


    });
};

EV4_Advanced_Glider_Profile_Explorer.prototype.getCast = function (deploymentId, profileId){

//    http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getcast&deploymentid=246&castid=3

//        deployment_id,obsdate,depth,latitude,longitude,sea_water_temperature,sea_water_salinity,sea_water_density,sci_bb3slo_b470_scaled,sci_bb3slo_b532_scaled,sci_bb3slo_b660_scaled,sci_bbfl2s_cdom_scaled,sci_bbfl2s_chlor_scaled,profile_id,direction
//        246,2011-12-14T18:22:35Z,5,41.3379,-70.992,10.7205,32.0093,1024.52,0.0023013,0.0022987,0.0011,3.57494,1.91421,3,0
//        246,2011-12-14T18:22:40Z,6,41.3379,-70.992,10.7171,32.0103,1024.53,0.00214054,0.00200541,0.00103514,3.07183,1.88258,3,0

    var self = this, id = self.tool.domID;

    var url = "http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getcast&deploymentid=" + deploymentId + "&castid=" + profileId;

    console.log("getcast:" , url);

    d3.csv( url, function ( data) {

        var datasets = self.tool.datasets;

        // CONSOLE-OFF console.log("deployment",deploymentId,"profile",profileId, "data",data)

        data.forEach( function ( d ) {
            d["depth"] = +d["depth"];
            d.obsdate = self.tool.formats.obsdate.parse(d.obsdate);

        });

        console.log( datasets, deploymentId, profileId );

        //datasets[deploymentId][profileId] = {
        datasets[deploymentId][profileId] = {
            data:data
        };

        //$("#" + id + "profile-info-records").html(data.length);

        self.transitionChartProfile("a",self.tool.configuration.custom.observationA);
        self.transitionChartProfile("b",self.tool.configuration.custom.observationB);

        self.transitionChartScatterplot("a");

    });

};

EV4_Advanced_Glider_Profile_Explorer.prototype.displayInfoCast = function ( cast ){

    var self = this, id = self.tool.domID, imgDirection;

    $("#" + id + "-profile-selection")
        .html(cast.profile_id);

    $("#" + id + "-profile-info-id")
        .html(cast.profile_id);
    //$("#" + id + "ctrl_profile_info_date").html();
    $("#" + id + "-profile-info-lat")
        .html(cast.latitude);
    $("#" + id + "-profile-info-long")
        .html(cast.longitude);

    $("#" + id + "-profile-info-direction")
        .attr("src", "http://epe.marine.rutgers.edu/visualization/img/gliderDirection" + cast.direction + "32.png");

    $("#" + id + "-profile-info-date").html(self.tool.formats.dateDisplay(cast.obsdate));

};

EV4_Advanced_Glider_Profile_Explorer.prototype.getProfileKey = function ( profileId ){

    var self = this;

    var ds = this.tool.datasets[self.tool.configuration.custom.deployment].profiles;

    for( var i = 0; i < ds.length; i++ ){
        if(+ds[i]["profile_id"] == profileId)
            return i;
    }
};

EV4_Advanced_Glider_Profile_Explorer.prototype.setSlider = function ( max ) {
    var self=this;
    $("#"+ self.tool.domID+"-control-profile-slider").slider(
        { max: max,
            value:self.getProfileKey(self.tool.configuration.custom.profile_id)
        }
    );
};

EV4_Advanced_Glider_Profile_Explorer.prototype.slideProfile = function ( a ) {

    var self = this, config = self.tool.configuration.custom,
        deployment = config.deployment,
        profile = self.tool.datasets[deployment].profiles[a];

    config.profile_id = profile.profile_id;

    self.displayInfoCast( profile );

    self.getCast( deployment, profile.profile_id );

};

EV4_Advanced_Glider_Profile_Explorer.prototype.parseCastData = function ( deploymentId, profileId, observation) {

    var self = this,
        ds = self.tool.datasets[deploymentId][profileId];

    ds.data.forEach( function ( d ) {
        d[observation] = +d[observation];

    });
};

EV4_Advanced_Glider_Profile_Explorer.prototype.getProfilePrevNext = function ( profileId, prevNext ){

    //todo: get next profile of particular type when only one is shown on map. next or or next down...
    var self = this;

    // doesn't matter which direction current profile is.. we only care about what is visible on the map

    // get the array key of current profile
    var key = self.getProfileKey(profileId);

    // find which one is visible
    var lookingForDirection = "Up";

    // find visibilities of graphics layers?

    var ds = this.tool.datasets[self.tool.configuration.custom.deployment].profiles;

    if( prevNext == "previous"){

        for( var i = key; i >= 0; i-- ){
            if(+ds[i]["direction"] == lookingForDirection)
                return i;
        }
    }

    if( prevNext == "next"){

        for( var i = key; i < ds.length ; i++ ){
            if(+ds[i]["direction"] == lookingForDirection)
                return i;
        }
    }

};

EV4_Advanced_Glider_Profile_Explorer.prototype.transitionChartProfile = function ( profileChart, observation ){

    var self = this,
        datasets = self.tool.datasets,
        config = self.tool.configuration.custom,
        obs = self.observations[observation],
        units = obs.units,
        colX = observation,
        colY = "depth",
        id = self.tool.domID,
        ds = datasets[config.deployment][config.profile_id],
        ui = self.tool.ui;

    self.parseCastData( config.deployment, config.profile_id, observation );

    var chart = ui.charts.profiles[profileChart],
        chartPath = chart.svgPath,
        chartSymbols = chart.svgSymbols;

    var width = ui.charts.profiles.properties.chartWidthA,
        height = ui.charts.profiles.properties.chartAreaHeight;

    var extentX = d3.extent(ds.data,function(d){return d[colX];}),
        extentY = d3.extent(ds.data,function(d){return d[colY];}),
        lineX = d3.scale.linear()
            .range([0, width])
            .domain(extentX),
        lineY = d3.scale.linear()
            .range([ 0,height])
            .domain(extentY),
        axisX =  d3.svg.axis()
            .scale(lineX)
            .orient("bottom")
            .ticks(7),
        axisY = d3.svg.axis()
            .scale(lineY)
            .orient("left"),
        line = d3.svg.line()
            .x(function (d) {return lineX(d[colX]);})
            .y(function (d) {return lineY(d[colY]);});

    chartPath
        .transition().duration(1000)
        .attr("d", line(ds.data));

    var symbols = chartSymbols
        .selectAll("circle").data(ds.data);

    symbols
        .enter().append("circle")
        .attr("r", 3.5)
        .attr("fill", "#FFFFFF")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    symbols.transition().duration(1000)
        .attr("cx", function(d) { return lineX(d[colX]); })
        .attr("cy", function(d) { return lineY(d[colY]); })
        .attr("stroke","steelblue");

    symbols.exit().remove();

    symbols
        .on("mouseover", function(d){self.chartProfileMouseOver(d,colX,colY,units);})
        .on("mousemove", function(d){self.chartMousemove();})
        .on("mouseout", function(d){self.chartMouseout();});

    d3.select("#" + self.tool.domID + "chart-x-axis-label")
        .text(obs.label);

    //$("#" + id + "img_loading_data").hide();

};

EV4_Advanced_Glider_Profile_Explorer.prototype.transitionChartScatterplot = function ( scatterChart ){

    var self = this,
        datasets = self.tool.datasets,
        config = self.tool.configuration.custom,
        obsA = config.observationA,
        obsB = config.observationB,
        obsObjA = self.observations[obsA],
        obsObjB = self.observations[obsB],
        unitsA = obsObjA.units,
        unitsB = obsObjB.units,
        colX = obsA,
        colY = obsB,
        ds = datasets[config.deployment][config.profile_id],
        id = self.tool.domID,
        ui = self.tool.ui,
        properties = ui.charts.scatterplot.properties;

    var scatterplots = ui.charts.scatterplot;
    var chart = scatterplots[scatterChart],
        chartPath =  chart.svgPath,
        chartSymbols = chart.svgSymbols,
        chartRegression = chart.svgPathRegression;

    var width = properties.chartWidth - properties.margin.right - properties.margin.left,
        height = properties.chartAreaHeight;

    var extentX = d3.extent(ds.data,function(d){return d[colX];}),
        extentY = d3.extent(ds.data,function(d){return d[colY];}),
        lineX = d3.scale.linear()
            .range([0, width])
            .domain(extentX),
        lineY = d3.scale.linear()
            .range([ 0,height])
            .domain(extentY),
        axisX =  d3.svg.axis()
            .scale(lineX)
            .orient("bottom")
            .ticks(7),
        axisY = d3.svg.axis()
            .scale(lineY)
            .orient("left"),
        line = d3.svg.line()
            .x(function (d) {return lineX(d[colX]);})
            .y(function (d) {return lineY(d[colY]);});

//    chartPath
//        .transition().duration(1000)
//        .attr("d", line(ds.data))

    var symbols = chartSymbols
        .selectAll("circle").data(ds.data);

    symbols
        .enter().append("circle")
        .attr("r", 3.5)
        .attr("fill", "#FFFFFF")
        .attr("stroke", "orange")
        .attr("stroke-width", 1);

    symbols.transition().duration(1000)
        .attr("cx", function(d) { return lineX(d[colX]); })
        .attr("cy", function(d) { return lineY(d[colY]); })
        .attr("stroke","orange");

    symbols.exit().remove();

    symbols
        .on("mouseover", function(d){self.chartScatterplotMouseOver(d,colX,colY,unitsA,unitsB);})
        .on("mousemove", function(d){self.chartMousemove();})
        .on("mouseout", function(d){self.chartMouseout();});


    var xData = [], yData = [], points = [];

    $.each(ds.data,function(i,d){
        xData.push(d[obsB]);
        yData.push(d[obsA]);

        //console.log("d",d)
    });

    reg = scatterplots.regression = {};

    //reg.extentX = d3.extent(ds.data, function (d) { return d[colX]; });

    reg.extentY1 = d3.extent(ds.data, function (d) { return d[obsA]; });
    reg.extentY2 = d3.extent(ds.data, function (d) { return d[obsB]; });

    reg.linResult = self.evTool.linearRegression(xData,yData);

    points[0] = {
        x:reg.extentY2[0],
        y:(reg.linResult.slope * reg.extentY2[1]) + reg.linResult.intercept
    };
    points[1] = {
        x:reg.extentY2[1],
        y:(reg.linResult.slope * reg.extentY2[0]) + reg.linResult.intercept
    };

    reg.linRegPoints = points;

    var line_lr_x = d3.scale.linear().range([0,width ]).domain(reg.extentY2);//.domain([points[0].x,points[1].x]);
    var line_lr_y = d3.scale.linear().range([height,0 ]).domain(reg.extentY1);//.domain([points[0].y,points[1].y]);
    var line_lr = d3.svg.line()
        .x(function (d) {return line_lr_x(d.x);})
        .y(function (d) {return line_lr_y(d.y);});

    // console.log("Points A and B. for linear regression model", point_a,point_b);

    console.log("points",reg.linRegPoints);

    chartRegression.transition().delay(1500).duration(1000).attr("d", line_lr(reg.linRegPoints));

    $("#"+id+"-scatterplot-label-x").html(obsObjB.label);

    ds.isGraphed = true;

    //$("#" + id + "img_loading_data").hide();

};

EV4_Advanced_Glider_Profile_Explorer.prototype.customizationUpdate = function ( ) {
    // this function will update the config file which is used for subsequent calls and lookups
    var self = this, id = this.tool.domID,controls = self.tool.ui.controls;

    // todo: update config for EV

    var config_updates = {

        //"deployment":$("#" + id + "ctrl-deployment").val(),
        //"cast":"1",
        "observationA": controls.ctrlDropdownObservationsSelectA.val(),
        "observationB": controls.ctrlDropdownObservationsSelectB.val()

    };

    $.extend(self.tool.configuration.custom,config_updates);

};

EV4_Advanced_Glider_Profile_Explorer.prototype.chartProfileMouseOver = function (d,colX,colY,units) {
    var self = this, formats = self.tool.formats;

    return self.tool.ui.tooltips
        .css("visibility", "visible")
        .attr("class","label label-info" )
        .html(
        "Date: " + formats.tooltip_date(d.obsdate) + "<br />" +
            "Depth: " + d[colY] + " m <br />" +
            self.observations[colX].name + ": " + formats.tooltip_num( d[colX]) + units + "</b>");

};

EV4_Advanced_Glider_Profile_Explorer.prototype.chartScatterplotMouseOver = function (d,colX,colY,unitsA,unitsB) {
    var self = this,
        formats = self.tool.formats;

    return self.tool.ui.tooltips
        .css("visibility", "visible")
        .addClass("label label-info")
        .html(
        "Date: " + formats.tooltip_date(d.obsdate) + "<br />" +
            "Depth: " + d["depth"] + " m <br />" +
            self.observations[colX].name + ": " + formats.tooltip_num(d[colX]) + unitsA + "</b><br />" +
            self.observations[colY].name + ": " + formats.tooltip_num(d[colY]) + unitsB + "</b>");

};

EV4_Advanced_Glider_Profile_Explorer.prototype.chartMousemove = function () {
    return this.tool.ui.tooltips
        .css("top", (d3.event.pageY - 10) + "px")
        .css("left", (d3.event.pageX + 10) + "px");

    //todo: this is not working in older versions of firefox. might need to convert to d3.mouse

};

EV4_Advanced_Glider_Profile_Explorer.prototype.chartMouseout = function () {
    return this.tool.ui.tooltips
        .css("visibility", "hidden");
};

EV4_Advanced_Glider_Profile_Explorer.prototype.updateDropdownObservations = function( a ){

    var self = this,id = "#"+self.tool.id_prefix, config = self.tool.configuration.custom, controls = self.tool.ui.controls;

    console.log("this, this.parent", this, this.parent);

    var obsA = self.tool.configuration.custom.observationA;
    var obsB = self.tool.configuration.custom.observationB;

    controls.ctrlDropdownObservationsSelectA.children().remove();
    controls.ctrlDropdownObservationsSelectB.children().remove();

    $.each(self.observations, function (observation) {

        controls.ctrlDropdownObservationsSelectA
            .append( new Option(self.observations[observation].label,observation) );

        controls.ctrlDropdownObservationsSelectB
            .append( new Option(self.observations[observation].label,observation) );

    });

    controls.ctrlDropdownObservationsSelectA.val(config.observationA);
    controls.ctrlDropdownObservationsSelectB.val(config.observationB);

    controls.ctrlDropdownObservationsSelectA
        .filter('option[value="' + config.observationB + '"]').remove();

    controls.ctrlDropdownObservationsSelectB
        .filter('option[value="' + config.observationA + '"]').remove();


    //$("#" + id + '-control-dropdown-observationA > option[value="' + controls.ctrlDrop.val() + '"]').remove();

}
