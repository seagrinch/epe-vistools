// Glider Profile Explorer
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University
// Revised 10/23/12
// Version 0.1.8.1

var EV3_Glider_Profile_Explorer = function (divId, customToolConfiguration) {

    var self = this;

    this.evTool = new EVTool();

    /***************************************/
    // SETTINGS - Observations
    /***************************************/

   this.observations = {

        "tempwat"   : {
            "name"   : "Seawater Temperature",
            "label"  : "Seawater Temperature (C)",
            "units"  : "&deg;C",
            "units2" : "Degrees Celcius"
        },
        "pracsal"      : {
            "name"   : "Seawater Salinity",
            "label"  : "Seawater Salinity",
            "units"  : "",
            "units2" : ""
        },
        "density"       : {
            "name"   : "Seawater Density",
            "label"  : "Seawater Density (kg m^-3)",
            "units"  : "(kg m^-3)",
            "units2" : "m^-3"
        },
        "cdomflo"  : {
            "name"   : "CDOM",
            "label"  : "CDOM (µg L-1)",
            "units"  : "(ppb)",
            "units2" : "ppb"
        },
        "chlaflo" : {
            "name"   : "Chlorophyll",
            "label"  : "Chlorophyll (µg L-1)",
            "units"  : "(µg L-1)",
            "units2" : "µg L-1"
        },
        "optparw" :{
            "name"   : "PAR",
            "label"  : "Photosynthetically Active Radiation (PAR)",
            "units"  : "",
            "units2" : ""
        },
        "flubsct" :{
            "name"   : "Optical Backscatter",
            "label"  : "Optical Backscatter (red wavelengths)",
            "units"  : "",
            "units2" : ""
        }

    };

    // obsdate,latitude,longitude,depth,
    // tempwat, sea_water_temperature
    // pracsal, sea_water_salinity
    // density, sea_water_density
    // cdomflo, sci_bbfl2s_cdom_scaled
    // chlaflo, sci_bbfl2s_chlor_scaled


    // condwat, conductivity
    // optparw, Photosynthetically Active Radiation (PAR)
    // flubsct, Optical Backscatter
    // doconcs  Oxygen Concentration

    // stations object is populated from the configuration list and overridden with the user configuration
    this.stations = {};

    // default tool configuration
    this.configuration = {

        "title":"EV TOOL 3",
        "subtitle":"Glider Profile Explorer",
        "deployment":"221",
        "profile_id":"2",
        "observation":"tempwat",
        "observation_list":"" //?

    };

    // tool object to hold various properties and methods
    this.tool = {
        "domID":self.evTool.domToolID(divId),
        "container":{
            "layout":{
                "margin":{"top":20, "right":0, "bottom":0, "left":0},
                "width":0,
                "height":540
            }
        },
        "controls":{
            "layout":{
                "margin":{"top":10, "right":10, "bottom":0, "left":20}

            }
        },
        "chart":{
            "axis":{},
            "layout":{
                "margin":{"top":20, "right":10, "bottom":30, "left":60}
            }
        },
        "map":{
            "layout":{"height":290}
        },
        "formats":{
            "tooltip_num" : d3.format("g"),
            "tooltip_date" : d3.time.format("%Y-%m-%d %H:%M %Z"),
            "obsdate" : d3.time.format("%Y-%m-%dT%H:%M:%SZ"),
            "dateDisplay" : d3.time.format("%Y-%m-%d %H:%M %Z")

        },
        "scales":{
            "datetime":{
                "hours":d3.time.scale().tickFormat("%H:M"),
                "days":d3.time.scale().tickFormat("%d"),
                "months":d3.time.scale().tickFormat("%m/%y")
            }
        },
        "configuration":{
            "original" : self.configuration,
            "custom" : self.configuration
        },
        "datasets":{}
    };

    this.evTool.configurationParse(self.tool.configuration.custom, customToolConfiguration );

    this.controls = {

        "deployment":{
            "type":"textbox",
            "label":"Deployment ID",
            "tooltip":"Enter the default deployment id.",
            "default_value":self.tool.configuration.custom.deployment
        }
    };

    this.trackMap = {};

    this.tool.ui = {
        uiContainer:{},
        uiControls:{},
        uiChart:{}
    }

    // set interface container and get dimensions for layout
    this.uiToolInterface();

    // calculate dimensions for the remaining tool parts
    this.uiDimensions();

    // draw chart
    this.uiChart();

    // request esri arcgis jsapi, callback will requires esri.map,  continue loading tool

    $.getScript("http://serverapi.arcgisonline.com/jsapi/arcgis/?v=3.2compact", function(data, textStatus, jqxhr) {
        // CONSOLE-OFF console.log(data); //data returned
        // CONSOLE-OFF console.log(textStatus); //success
        // CONSOLE-OFF console.log(jqxhr.status); //200
        // CONSOLE-OFF console.log('Load was performed.');

        dojo.require('esri.map');

        self.loadDeferred();
    });

}

EV3_Glider_Profile_Explorer.prototype.loadDeferred = function ( ) {

    // continue loading tool once arcgis jsapi is called and dojo is required.

    // draw ALL UI CONTROLS
    this.uiControls();

    this.mapInitialize();

    this.getDeployments(this.tool.configuration.custom.deployment);

    this.getTrack(this.tool.configuration.custom.deployment, this.tool.configuration.custom.profile_id);

}

EV3_Glider_Profile_Explorer.prototype.mapInitialize = function ( ) {

    var self = this;

    function loadMap(){

        self.trackMap.symbols = {
            smsSelected : new esri.symbol.SimpleMarkerSymbol({
                "type": "esriSMS",
                "style": "esriSMSSquare",
                "color": [0,0,0,0],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline":
                    {
                        "color": [200,0,0,255],
                        "width": 2
                    }
            }),
            smsUp : new esri.symbol.SimpleMarkerSymbol({
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [255,0,0,255],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline":
                    {
                        "color": [100,100,100,255],
                        "width": .5
                    }
            }),

            smsDown : new esri.symbol.SimpleMarkerSymbol({
                "type": "esriSMS",
                "style": "esriSMSSquare",
                "color": [0,255,0,255],
                "size": 6,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline":
                    {
                        "color": [100,100,100,255],
                        "width": .5
                    }
            })
        };

        // create the initial extent
        var initExtent = new esri.geometry.Extent({"xmin":-74,"ymin":38,"xmax":-69,"ymax":44,"spatialReference":{ "wkid":4326 }});

        // create the map object
        self.trackMap.map = new esri.Map( self.tool.domID + "track-map" ,{
            extent:esri.geometry.geographicToWebMercator(initExtent)
        });

        // map event listening connectors to show coordinates
        dojo.connect(self.trackMap.map, "onLoad", function() {
            dojo.connect(self.trackMap.map, "onMouseMove", showCoordinates);
            dojo.connect(self.trackMap.map, "onMouseDrag", showCoordinates);
        });

        // create the tiled map service layer.. use Ocean Basemap
        self.trackMap.tiledMapServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer(
            // "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
            //"http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer"
            "http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer"
        );

        // add ocean basemap to map
        self.trackMap.map.addLayer( self.trackMap.tiledMapServiceLayer );

        // create graphics layers
        self.trackMap.glTrack = new esri.layers.GraphicsLayer({ "id": "layer_track" });
        self.trackMap.glProfilesUp = new esri.layers.GraphicsLayer({ "id": "layer_ProfilesUp" });
        self.trackMap.glProfilesDown = new esri.layers.GraphicsLayer({ "id": "layer_ProfilesDown" });
        self.trackMap.glProfileSelected = new esri.layers.GraphicsLayer({"id": "layer_ProfileSelected"});

        // add graphics layers to the map
        self.trackMap.map.addLayer( self.trackMap.glTrack);
        self.trackMap.map.addLayer( self.trackMap.glProfilesDown);
        self.trackMap.map.addLayer( self.trackMap.glProfilesUp);
        self.trackMap.map.addLayer( self.trackMap.glProfileSelected);

        // map event listening functions

        // show coordinates beneath map
        function showCoordinates(evt) {
            var mp = esri.geometry.webMercatorToGeographic(evt.mapPoint);

            //display mouse coordinates
            dojo.byId(self.tool.domID + "-track-map-info").innerHTML = self.evTool.formatLat(mp.y) + ", " + self.evTool.formatLong(mp.x);

        }
    }

    dojo.addOnLoad(loadMap);

};

EV3_Glider_Profile_Explorer.prototype.uiToolInterface = function() {
    "use strict";

    var self = this, id = self.tool.domID, ui = self.tool.ui;


    ui.uiControls = $("<div></div>")
        .attr("id", id + "-uiControls")
        .addClass("span6")

    ui.uiChart = $("<div></div>")
        .attr("id", id + "-uiChart")
        .addClass("span6")

    ui.uiContainer.div = $("<div></div>")
        .attr("id",id + "-tool-container")
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
                    $("<h2></h2>").html("Glider Profile Explorer").css("border-bottom","2px solid #CCCCCC")
                )
            )
        )
        .append(
            $("<div></div>")
                .css({
                    "height":"500px",
                    "margin-top":"6px"
                })
                .addClass("row-fluid")

                .append(ui.uiControls)
                .append(ui.uiChart)

        )

    $("#" + id).append(ui.uiContainer.div);

    ui.uiChart.width = $(ui.uiChart).width();
    ui.uiControls.width = $(ui.uiControls).width();


    self.tool_container = d3.select("#" + id); //"#" + id + "tool")

};

EV3_Glider_Profile_Explorer.prototype.uiDimensions = function() {

    var self = this,
        container = self.tool.container.layout,
        chart = self.tool.chart.layout;

    // calculations for controls and chart areas

    container.height_m = container.height - container.margin.top - container.margin.bottom;

    chart.height = container.height_m;
    chart.height_m = chart.height - chart.margin.top - chart.margin.bottom;

    chart.width = self.tool.ui.uiChart.width;
    chart.width_m = self.tool.ui.uiChart.width - chart.margin.left - chart.margin.right;

}

EV3_Glider_Profile_Explorer.prototype.uiChart = function () {

    var self = this;

    var container = self.tool.container,
        chart = self.tool.chart,
        controls = self.tool.controls,
        config = self.tool.configuration.custom,
        id = self.tool.domID;

    self.tool.chart.tooltip = d3.select("#" + id + "-tool-container")
        .append("div")
        .attr("id",id + "tooltip-div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");

    self.svg = d3.select("#"+ id + "-uiChart").append("div")
        .attr("id",id + "-chart_container")
        .append("svg")
        .attr("id", id + "-svg-main")
        .attr("width", chart.layout.width)
        .attr("height", chart.layout.height);

    //border svg rectangle
    self.svg.append("rect")
        .attr("width",chart.layout.width_m)
        .attr("height",chart.layout.height_m)
        .style("stroke","#000000")
        .style("stroke-width",1)
        .style("fill","none")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + chart.layout.margin.top + ")");

    // DomElement: svg g (grouping) for timeseries data

    self.g_path_container = self.svg.append("g")
        .attr("id", id + "g-path-container")
        .attr("width", chart.layout.width_m)
        .attr("height", chart.layout.height_m)
        .attr("transform", "translate(" + chart.layout.margin.left + "," + 0 + ")");


    self.g_path = self.g_path_container
        .append("svg:path")
        .attr("width", chart.layout.width_m)
        .attr("height", chart.layout.height_m)
        .attr("transform", "translate(" + 0 + "," + chart.layout.margin.top + ")")
        .attr("id", id + "svg-path")
        .attr("class", "svg-path")
        .style("stroke-width",2)
        .style("stroke", "#B94A48")
        .style("fill", "none")

    self.g_path_symbols = self.g_path_container
        .append("svg:g")
        .attr("transform", "translate(" + 0 + "," + chart.layout.margin.top + ")")
        .attr("id", id + "svg-path-symbol")

    self.g_axis = self.svg.append("g")
        .attr("id", id +"g-axis")
        .attr("transform", "translate(" + chart.layout.margin.left + "," + chart.layout.margin.top + ")");

    // x-axis
    self.g_axis_x = self.g_axis.append("svg:g")
        .attr("id",id + "x-axis")
        .attr("class", "axis")
        .attr("transform", "translate(" + 0 + ","+ chart.layout.height_m +")");

    //y-axis left
    self.g_axis_y = self.g_axis.append("svg:g")
        .attr("id",id + "y-axis-left")
        .attr("class", "axis")

    // container for all labels
    self.g_labels = self.svg.append("g")
        .attr("width",chart.layout.width)
        .attr("height",container.layout.height)
        .attr("id", id + "g-labels")

    var ctrl_dd_observations_select = $("<select></select>")
        .attr("id",id+"-dd-observations")
        .change(function(a){

            self.customization_update();
            self.transitionChart();

            //$(this).parent().css("visibility","hidden");

            $("#" + id + "chart-x-axis-label").css("visibility","visible");
        });

    $.each(self.observations,function(observation){
        var obs = self.observations[observation];

        $(ctrl_dd_observations_select)
            .append(
            $('<option></option>')
                .val(observation)
                .html(obs.label)
            //.html(obs.name)
            // obs.name can be used in place of obs.label
        );
    });


    $("#" + id + "-chart_container")
        .append(
            $("<div></div>")
                .css({"text-align":"center","margin-left": self.tool.chart.layout.margin.left + 'px'})
                .append(
                    ctrl_dd_observations_select
                )
    )

    // DomElement: y-axis label
    self.g_labels.append("svg:text")
        .attr("id", id + "chart-y-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", -(container.layout.height / 2))
        .attr("y", container.layout.margin.left / 2)
        .attr("class", "chart-label-y")
        .attr("fill","#000000")
        .attr("transform", "rotate(270) translate(0,"+ chart.layout.margin.left/3 +")")
        .text("Depth (m)")
}

EV3_Glider_Profile_Explorer.prototype.uiControls = function () {
    var self = this,
        container = self.tool.container.layout,
        id= self.tool.domID,
        config = self.tool.configuration.custom,
        uiControls = self.tool.ui.uiControls;

    var ctrl_deployment_info = $("<div></div>")

        .append(

        $("<div></div>")
            .append(
            $('<h3 class="page-header"></h3>')
                .css({"padding-bottom":"0","margin":"0"})
                .html("Glider Deployment:  ")
                .append(
                $("<small></small>")
                    .addClass("attribute")
                    .attr("id",id+"deployment-info-name")
            )
        )
            .append(
            $("<h5></h5>")
                .html("Start Time: ")
                .append(
                $("<span></span>")
                    .addClass("attribute")
                    .attr("id",id+"deployment-info-start-time")
            )

        )
            .append(
            $("<h5></h5>")
                .html("End Time: ")
                .append(
                $("<span></span>")
                    .addClass("attribute")
                    .attr("id",id+"deployment-info-end-time")
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
    )

    var ctrl_profile_selection = $("<div></div>")
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
                            .html('<i class="icon-arrow-left"></i>')
                            .on("click",function(){

                                var slider = $("#"+ self.tool.domID+"-profile-slider");

                                var val = slider.slider("option","value");

                                console.log("Previous Click - Slider Value:" + val);

                                if ( val != slider.slider("option","min")){
                                    slider.slider("value", +val - 1 )
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

                    .attr("id",id + "-profile-slider")
                    .slider({
                        slide: function(event, ui) {
                            // CONSOLE-OFF console.log("here we can possibly highlight the profile as we slide across")

                            $("#" + id + "-profile-info-id").html(
                                //self.tool.datasets[self.tool.configuration.custom.deployment].profiles[ui.value]
                                ui.value
                            );

                        },
                        change: function(event, ui) {

                            self.slideProfile(+ui.value - 1 );

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
                    .attr("id", id + "deployment-info-profile-count")
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
                        .html('<i class="icon-arrow-right"></i>')
                        .on("click",function(){

                            var slider = $("#"+ self.tool.domID+"-profile-slider");
                            var val = slider.slider("option","value");

                            console.log("Next Click - Slider Value:" + val);

                            if ( val != slider.slider("option","max")){
                                slider.slider("value", +val + 1 )
                            }
                        })
                )
            )
        )
    );

    var ctrl_trackMap = $("<div></div>")
        .addClass("ctrl map")
        .append(

        $("<div></div>")
            .attr("id",id + "track-map")
            .css("height",self.tool.map.layout.height + "px")
    )
        .append(

        $("<div></div>")
            .css("float","right")
            .attr("id",id + "-track-map-info")
            .html("&nbsp;")
    )
        .append(

        $("<div></div>")
            .attr("id",id + "track-map-legend")
            .append(
                $('<button class="btn btn-mini" type="button" style="float:left;margin-top:3px;" id="' + id + '-mapZoomExtent"><i class="icon-zoom-in"></i> Zoom To Track Extent</button>' +
                    '<svg height="24" width="'+ uiControls.width+'">' +
                    '<g id="' + id + 'svgMapToggleUp" >' +
                    '<circle cx="8" cy="9" r="6" stroke="#FF0000" stroke-width="2px" fill="#FF0000" ></circle>' +
                    '<text x="18" y="14">Up Casts</text></g>' +
                    '<g id="' + id + 'svgMapToggleDown">' +
                    '<rect x="84" y="4" width="10" height="10" fill="#00FF00" stroke="#00FF00" stroke-width="2"></rect>' +
                    '<text x="100" y="14">Down Casts</text></g>' +
                    '</svg>')
            )
    )

    var ctrl_profile_info= $("<div></div>")
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
                    .html('<h3 style="text-align:center">Location </h3>' +
                    '<div style="text-align:center" id="' + id + '-profile-info-lat"></div>' +
                    '<div style="text-align:center" id="' + id + '-profile-info-long"></div>')

                    //'<div>Latitude: <span style="float:right" id="' + id + '-profile-info-lat"></span></div>' +
                    //'<div>Longitude: <span style="float:right" id="' + id + '-profile-info-long"></span></div>')

        )
            .append(

                $("<div></div>")
                    .addClass("span3 profile-info-box")
                    .css("text-align","center")
                    .html('<h3>Direction</h3>'+
                    '<div><img id="' + id + '-profile-info-direction" /></div>')

        )
            .append(

                $("<div></div>")
                    .addClass("span3 profile-info-box")
                    .css("text-align","center")
                    .html('<h3>Date</h3>'+
                    '<div><span id="' + id + '-profile-info-date"></span></div>')

        )
    );

    $("#" + id + "-uiControls")
        .addClass("controls")
        .append(ctrl_deployment_info)
        .append(ctrl_trackMap)
        .append(ctrl_profile_info)
        .append(ctrl_profile_selection);

    d3.select("#" + id + "svgMapToggleDown")
        .on("click",function(b){

            var a = d3.select("#" + id + "svgMapToggleDown").select("rect");

            if(a.attr("fill") == "#FFF"){

                a.attr("fill","#00FF00");
                self.trackMap.glProfilesDown.show();

            }else{

                a.attr("fill","#FFF");
                self.trackMap.glProfilesDown.hide();
            }

        });


    d3.select("#" + id + "svgMapToggleUp")
        .on("click",function(b){

            var a = d3.select("#" + id + "svgMapToggleUp")
                .select("circle");

            if(a.attr("fill") == "#FFF"){

                a.attr("fill","#FF0000");
                self.trackMap.glProfilesUp.show();

            }else{

                a.attr("fill","#FFF");
                self.trackMap.glProfilesUp.hide();
            }
        });

}

EV3_Glider_Profile_Explorer.prototype.slideProfile = function ( profilePosition ) {

    var self = this, config = self.tool.configuration.custom,
        deployment = config.deployment,
        profile = self.tool.datasets[deployment].profiles[profilePosition];

    // add point to the path collection
    var pt = new esri.geometry.Point(
        profile.longitude,
        profile.latitude, {"wkid":4326} );

    // pan to center point on map
    self.trackMap.map.centerAt(esri.geometry.geographicToWebMercator(pt));

    // add selected graphic
    self.trackMap.glProfileSelected.clear();

    // todo: convert to sms in trackmap and reference there. no need to do this every time.
    self.trackMap.glProfileSelected.add(new esri.Graphic(
        esri.geometry.geographicToWebMercator(pt),
        new esri.symbol.SimpleMarkerSymbol( {
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "color": [0,0,0,0],
            "size": 12,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "outline":
                    {
                        "color": [255,0,0,255],
                        "width": 2
                    }
        })
    ));

    //config.profile_id = profile.profile_id;
    config.profile_id = profilePosition;

    self.displayInfoCast(profilePosition, profile);

    self.getCast(deployment, profile.profile_id, profilePosition);

}

EV3_Glider_Profile_Explorer.prototype.getDeployments = function (deploymentId){

//    http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getdeployments
//
//        id,name,start_time,end_time,casts
//        246,"RU07 MURI/OOI",2011-12-14T17:11:00Z,2012-01-07T14:47:00Z,1651


// http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getdeployments
//  updated web service response

//    id,start_time,end_time,glider_id,name
//    221,2011-08-10T13:30:00Z,2011-09-09T05:00:00Z,3,"RU16 - EPA run on the NJ coast"
//    359,2012-08-14T15:19:00Z,2012-08-30T12:59:00Z,4,"RU28 - EPA run on the NJ coast"
//    367,2012-09-13T15:12:00Z,2012-10-04T13:28:00Z,5,"RU07 - EPA run on the NJ coast"

    var self = this, id = self.tool.domID, config = self.tool.configuration.custom;

    var url = "http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getdeployments";

    d3.csv( url, function ( data) {

        var datasets = self.tool.datasets;
        datasets["deployment"] = {};

        var ds = datasets["deployment"];
        ds.data = data;

        var deployObj = {};

        ds.data.forEach(function (d){

            d.start_time = self.tool.formats.obsdate.parse(d.start_time);
            d.end_time = self.tool.formats.obsdate.parse(d.end_time);

            if( d.id == config.deployment ){

                self.displayInfoDeployment(d);
            }
        });
    });

};

EV3_Glider_Profile_Explorer.prototype.displayInfoCast = function ( profileIndex, cast ){

    var self = this, id = self.tool.domID, imgDirection;

//    $("#" + id + "profile-selection")
//        .html(cast.profile_id);

    $("#" + id + "-profile-info-id")
        .html(profileIndex);

    //$("#" + id + "ctrl_profile_info_date").html();
    $("#" + id + "-profile-info-lat")
        .html(self.evTool.formatLat(cast.latitude));

    $("#" + id + "-profile-info-long")
        .html(self.evTool.formatLong(cast.longitude));

    $("#" + id + "-profile-info-direction")
        .attr("src", "http://epe.marine.rutgers.edu/visualization/img/gliderDirection" + cast.direction + "32.png");

    $("#" + id + "-profile-info-date").html(self.tool.formats.dateDisplay(cast.obsdate));

}

EV3_Glider_Profile_Explorer.prototype.displayInfoDeployment = function ( d ){

    var self = this, id = self.tool.domID;

    // CONSOLE-OFF console.log("displayInfoDeployment",d);
    console.log("diplayInfo:", d)

    $("#" + id + "deployment-info-name").html(d.name);

    //$("#" + id + "deployment-info-profile-count").html(d.casts);

    $("#" + id + "deployment-info-start-time").html(self.tool.formats.dateDisplay(d.start_time));
    $("#" + id + "deployment-info-end-time").html(self.tool.formats.dateDisplay(d.end_time));

};

EV3_Glider_Profile_Explorer.prototype.getTrack = function ( deploymentId ){

//    http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=gettrack&deploymentid=246

//        deployment_id,obsdate,latitude,longitude,profile_id,direction
//        246,2011-12-14T17:32:14Z,41.343,-70.9957,1,0
//        246,2011-12-14T17:34:55Z,41.3426,-70.9951,2,1

// web service update
//    obsdate,latitude,longitude,profile_id,direction
//    2011-08-10T13:31:46Z,40.351064,-73.8798,1934,d
//    2011-08-10T13:34:48Z,40.350741,-73.88019,1935,u

    var self = this;
    var deployment = deploymentId;

    var url = "http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=gettrack&deploymentid=" + deployment;

    console.log("get Track:" , url);

    d3.csv( url, function ( data) {

        // CONSOLE-OFF console.log( "get track csv call data: " , data)

        var datasets = self.tool.datasets;
        datasets[deployment] = {};

        var dateParse = self.tool.formats.obsdate;

        data.forEach(function(d){

            if( d.direction == "d" ){
                d.direction = "Down";
            }
            else{
                d.direction = "Up";
            }

            d["longitude"] = +d["longitude"];
            d["latitude"] = +d["latitude"];
            d["obsdate"] = dateParse.parse(d["obsdate"]);

        });

        datasets[deployment].profiles = data;

        self.mapTrack();

        // set slider min and max
        self.setSlider(1, data.length);

    });
}

EV3_Glider_Profile_Explorer.prototype.setSlider = function ( min, max) {
    var self=this;
    $("#"+ self.tool.domID+"-profile-slider").slider(
        {
            min:min,
            max: max,
           //value:self.getProfileKey(self.tool.configuration.custom.profile_id)
            value: self.tool.configuration.custom.profile_id

        }
    );
}

EV3_Glider_Profile_Explorer.prototype.mapTrack = function ( linePoints ) {

    var self = this,
        config = self.tool.configuration.custom,
        data = self.tool.datasets[config.deployment].profiles,
        id = self.tool.domID;

    self.trackMap.trackPoints = [];
    self.trackMap.trackLine = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));

    // CONSOLE-OFF console.log("trackmap data: ", data)

    data.forEach( function( d ) {

        // add point to the path collection
        var pt = new esri.geometry.Point(
            +d["longitude"] ,
            +d["latitude"], {"wkid":4326} );

        var sms;

        self.trackMap.trackPoints.push(pt);

        self.trackMap["glProfiles"+ d.direction].add(
            new esri.Graphic(
                esri.geometry.geographicToWebMercator(pt),
                self.trackMap.symbols["sms"+ d.direction],
                d,
                null));
    });

    // now add graphic for selected point selected point

    self.trackMap.trackLine.addPath( self.trackMap.trackPoints );

    // project line geometry, set symbol
    self.trackMap.trackGraphic = new esri.Graphic(
        esri.geometry.geographicToWebMercator(self.trackMap.trackLine),
        new esri.symbol.SimpleLineSymbol()
    );

    self.trackMap.glTrack.add(self.trackMap.trackGraphic);

    // get track graphic geometric extent
    self.trackMap.trackExtent = self.trackMap.trackGraphic.geometry.getExtent();

    // zoom map to track graphic extent
    self.trackMap.map.setExtent(self.trackMap.trackExtent);

    // add listener for up profiles mouse over
    dojo.connect(self.trackMap.glProfilesUp,"onMouseOver",function(evt){
        //map.graphics.clear();  //use the maps graphics layer as the highlight layer
        var cast = evt.graphic.attributes;

        console.log("MAP MOUSE EVENT:",evt)

        self.tool.chart.tooltip
            .style("visibility", "visible")
            .attr("class","label label-info" )
            .html("Profile: " + self.getProfileKey(cast.profile_id) + " <br />Direction: " + cast.direction)
            //.style("top", evt.screenPoint.y + 30 + "px")
            //.style("left", evt.screenPoint.x + "px");
            .style("top", evt.pageY + 30 + "px")
            .style("left", evt.pageX + "px");

    });

    // listener for up profiles mouse out
    dojo.connect(self.trackMap.glProfilesUp,"onMouseOut",function(evt){
        self.tool.chart.tooltip.style("visibility", "hidden");
    });

    // add listener for down profiles mouse over
    dojo.connect(self.trackMap.glProfilesDown,"onMouseOver",function(evt){

        //map.graphics.clear();  //use the maps graphics layer as the highlight layer
        var cast = evt.graphic.attributes;


        self.tool.chart.tooltip
            .style("visibility", "visible")
            .attr("class","label label-info" )
            .html("Profile: " + self.getProfileKey(cast.profile_id) + " <br />Direction: " + cast.direction)
            .style("top", evt.pageY + 30 + "px")
            .style("left", evt.pageX + "px");
    });

    // listener for mouse out
    dojo.connect(self.trackMap.glProfilesDown,"onMouseOut",function(evt){
        self.tool.chart.tooltip.style("visibility", "hidden");
    });

    // map click events for up and down profiles
    dojo.connect(self.trackMap.glProfilesUp,"onClick",function(evt){
        //map.graphics.clear();  //use the maps graphics layer as the highlight layer

        var cast = evt.graphic.attributes;
        console.log("CAST:" , cast)

        var profilePosition = self.getProfileKey(cast.profile_id)

        config.profile_id = profilePosition;

        self.displayInfoCast(profilePosition, cast);

        // add point to the path collection
        var pt = new esri.geometry.Point(
            cast.longitude,
            cast.latitude, {"wkid":4326} );

        self.trackMap.map.centerAt(esri.geometry.geographicToWebMercator(pt));

        // add selected graphic
        self.trackMap.glProfileSelected.clear();

        self.trackMap.glProfileSelected.add(new esri.Graphic(
            esri.geometry.geographicToWebMercator(pt),
            new esri.symbol.SimpleMarkerSymbol( {
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "color": [0,0,0,0],
                "size": 12,
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "outline":
                        {
                            "color": [255,0,0,255],
                            "width": 2
                        }
            })
        ));

        $("#"+ self.tool.domID + "-profile-slider")
            .slider("value", profilePosition);

    });

    dojo.connect(self.trackMap.glProfilesDown,"onClick",function(evt){
        //map.graphics.clear();  //use the maps graphics layer as the highlight layer

        var cast = evt.graphic.attributes;
        //alert(content);
        //map.infoWindow.setContent(content);
        //var title = evt.graphic.getTitle();
        //map.infoWindow.setTitle(title);
        //map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
//       console.log(this,content);

        var profilePosition = self.getProfileKey(cast.profile_id)

        config.profile_id = profilePosition;

        self.displayInfoCast(profilePosition, cast);

        // add point to the path collection
        var pt = new esri.geometry.Point(
            cast.longitude,
            cast.latitude, {"wkid":4326} );

        self.trackMap.map.centerAt(esri.geometry.geographicToWebMercator(pt));

        // add selected graphic
        self.trackMap.glProfileSelected.clear();
        self.trackMap.glProfileSelected.add(new esri.Graphic(
            esri.geometry.geographicToWebMercator(pt),
            new esri.symbol.SimpleMarkerSymbol(
                {
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "color": [0,0,0,0],
                    "size": 12,
                    "angle": 0,
                    "xoffset": 0,
                    "yoffset": 0,
                    "outline":
                            {
                                "color": [255,0,0,255],
                                "width": 2
                            }
                }
            )
        ));

        // find profile array key here. apply to slider
        $("#"+ self.tool.domID + "-profile-slider")
            .slider(
            "value",profilePosition
        );
    });

    // listener for zoom to extent button
    $("#" + id + "-mapZoomExtent").on("click",function(){
        self.trackMap.map.setExtent(self.trackMap.trackExtent);
    });
};

EV3_Glider_Profile_Explorer.prototype.getProfilePrevNext = function ( profileId, prevNext ){

    //todo: get next profile of particular type when only one is shown on map. next or or next down...
    var self = this;

    // doesn't matter which direction current profile is.. we only care about what is visible on the map

    // get the array key of current profile
    var key = self.getProfileKey(profileId);

    // find which one is visible
    var lookingForDirection = "Up";

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

}

EV3_Glider_Profile_Explorer.prototype.getProfileKey = function ( profileId ){

    var self = this;

    var ds = this.tool.datasets[self.tool.configuration.custom.deployment].profiles;

    for( var i = 0; i < ds.length; i++ ){
        if(+ds[i]["profile_id"] == profileId)
            return i;
    }
};

EV3_Glider_Profile_Explorer.prototype.getCast = function (deploymentId, profileId, profilePosition){

//    http://epe.marine.rutgers.edu/visualization/proxy_glider.php?request=getcast&deploymentid=246&castid=3

//        deployment_id,obsdate,depth,latitude,longitude,sea_water_temperature,sea_water_salinity,sea_water_density,sci_bb3slo_b470_scaled,sci_bb3slo_b532_scaled,sci_bb3slo_b660_scaled,sci_bbfl2s_cdom_scaled,sci_bbfl2s_chlor_scaled,profile_id,direction
//        246,2011-12-14T18:22:35Z,5,41.3379,-70.992,10.7205,32.0093,1024.52,0.0023013,0.0022987,0.0011,3.57494,1.91421,3,0
//        246,2011-12-14T18:22:40Z,6,41.3379,-70.992,10.7171,32.0103,1024.53,0.00214054,0.00200541,0.00103514,3.07183,1.88258,3,0

// web service update
// data_id,profile_id,obsdate,latitude,longitude,depth,tempwat,condwat,pracsal,density,optparw,flubsct,cdomflo,chlaflo,doconcs
// 43662,1934,2011-08-10T13:30:48Z,40.3512,-73.8797,3,24.0778,4.4734,29.4986,1019.4749,,,,,
// 43663,1934,2011-08-10T13:30:54Z,40.3512,-73.8797,4,24.0975,4.4956,29.6487,1019.5849,,,,,

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

        datasets[deploymentId][profilePosition] = {
            data:data
        };

       // $("#" + id + "profile-info-records").html(data.length-1);

        self.transitionChart();
    });

}

EV3_Glider_Profile_Explorer.prototype.parseCastData = function ( deploymentId, profilePosition, observation) {

    var self = this,
        ds = self.tool.datasets[deploymentId][profilePosition];

    ds.data.forEach( function ( d ) {
        d[observation] = +d[observation];

    });
};

EV3_Glider_Profile_Explorer.prototype.transitionChart = function ( ){

    var self = this,
        datasets = self.tool.datasets,
        config = self.tool.configuration.custom,
        units = self.observations[config.observation].units,
        colX = config.observation,
        colY = "depth",
        ds = datasets[config.deployment][config.profile_id];

    console.log("Transition Chart ProfileID: " + config.profile_id)

    self.parseCastData(config.deployment, config.profile_id, config.observation);

    var extentX = d3.extent(ds.data,function(d){return d[colX];}),
        extentY = d3.extent(ds.data,function(d){return d[colY];}),
        lineX = d3.scale.linear()
            .range([0, self.tool.chart.layout.width_m])
            .domain(extentX),
        lineY = d3.scale.linear()
            .range([ 0,self.tool.chart.layout.height_m])
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
            .y(function (d) {return lineY(d[colY]);})

    self.g_path
        .transition().duration(1000)
        .attr("d", line(ds.data))

    // append circles w/ enter
    var enter_symbol1 = self.g_path_symbols
        .selectAll("circle").data(ds.data);

    enter_symbol1
        .enter().append("circle")
        .attr("r", 3.5)
        .style("fill", "#FFFFFF")
        .style("stroke", "#B94A48")
        .style("stroke-width", 1);

    enter_symbol1.transition().duration(1000)
        .attr("cx", function (d) {return lineX(d[colX]);})
        .attr("cy", function (d) {return lineY(d[colY]);})
        .style("stroke", "#B94A48");

    enter_symbol1.exit().remove();

    self.g_path_symbols.selectAll("circle")
        .on("mouseover", function(d){self.chart_mouseover(d,colX,colY,units,"important")})
        .on("mousemove", function(d){self.mousemove()})
        .on("mouseout", function(d){self.mouseout()});

    self.g_axis_x.call(axisX);
    self.g_axis_y.call(axisY);

    // do this here vs. in CSS for svg export capabilities
    d3.selectAll(".tick").style("stroke", "#000000").style("fill","none");
    d3.selectAll(".domain").style("stroke","#000000").style("fill","none");

    d3.select("#" + self.tool.domID + "chart-x-axis-label")
        .text(self.observations[config.observation].label);

    ds.isGraphed = true;

};

EV3_Glider_Profile_Explorer.prototype.buffer_data = function (d) {

    var min = d[0], max = d[1];
    var buffer = (max - min) * 0.05;
    // CONSOLE-OFF console.log(min + "--" + max + " buffer:" + buffer)
    return [min - buffer, max + buffer];
};

EV3_Glider_Profile_Explorer.prototype.customization_update = function () {
    // this function will update the config file which is used for subsequent calls and lookups
    var self = this, id = this.tool.domID;

    // todo: update config for EV 3 tool

    var config_updates = {

        //"deployment":$("#" + id + "ctrl-deployment").val(),
        //"cast":"1",
        "observation": $("#"+ id + "-dd-observations").val()
    };

    $.extend(self.tool.configuration.custom, config_updates);

};

EV3_Glider_Profile_Explorer.prototype.chart_mouseover = function (d,colX,colY,units) {
    var self = this,
        date_format = d3.time.format("%m/%d/%Y-%H:%M"),
        fmt = self.tool.formats.tooltip_num;

    return self.tool.chart.tooltip.style("visibility", "visible")
        .attr("class","label label-info" )
        .html(
        "Date: " + self.tool.formats.tooltip_date(d.obsdate) + "<br />" +
            "Depth: " + d[colY] + " meters <br />" +
            self.observations[colX].name + ": " + fmt(d[colX]) + units + "</b>");

}

EV3_Glider_Profile_Explorer.prototype.mousemove = function () {
    return this.tool.chart.tooltip
        .style("top", (d3.event.pageY - 10) + "px")
        .style("left", (d3.event.pageX + 10) + "px");

    //todo: this is not working in older versions of firefox. might need to convert to d3.mouse

};

EV3_Glider_Profile_Explorer.prototype.mouseout = function () {
    return this.tool.chart.tooltip.style("visibility", "hidden");
}