// Glider Profile Explorer
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University
// Revised 8/24/12
// Version 0.1.6

var EV3_Glider_Profile_Explorer = function (divId, customToolConfiguration) {

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

    this.webservice = {

        fields:{
            "deployment":["id","name","start_time","end_time","casts"],
            "tracks":["deployment_id","obsdate","latitude","longitude","profile_id","direction"],
            "casts":["deployment_id","obsdate","depth","latitude","longitude","sea_water_temperature","sea_water_salinity","sea_water_density","sci_bb3slo_b470_scaled","sci_bb3slo_b532_scaled","sci_bb3slo_b660_scaled","sci_bbfl2s_cdom_scaled","sci_bbfl2s_chlor_scaled","profile_id","direction"]
        },
        getdeployments:{
            "id":"id",
            "Name":"name",
            "Start Time":"start_time",
            "End Time":"end_time",
            "Cast Count":"casts"
        },
        gettracks:{
            "Deployment ID":"deployment_id",
            "Observation Data":"obsdate",
            "Latitude":"latitude",
            "Longitude":"longitude",
            "Profile Id":"profile_id",
            "Direction":"direction"
        },
        getcast:{
            "Deployment ID":"deployment_id",
            "Observation Date":"obsdate",
            "Depth":"depth",
            "Latitude":"latitude",
            "Longitude":"longitude",
            "Seawater Temperature":"sea_water_temperature",
            "Seawater Salinity":"sea_water_salinity",
            "Seawater Density":"sea_water_density",
            "Volume Scattering":"sci_bb3slo_b470_scaled",
            "Volume Scattering":"sci_bb3slo_b532_scaled",
            "Volume Scattering":"sci_bb3slo_b660_scaled",
            "CDOM":"sci_bbfl2s_cdom_scaled",
            "Chlorophyll":"sci_bbfl2s_chlor_scaled",
            "Profile ID":"profile_id",
            "Direction":"direction"

        }
    }

    // stations object is populated from the configuration list and overridden with the user configuration
    this.stations = {};

    // default tool configuration
    this.configuration = {

        "title":"EV TOOL 3",
        "subtitle":"Glider Profile Explorer",
        "deployment":"246",
        "profile_id":"1",
        "observation":"sea_water_temperature",
        "observation_list":"" //?

    };

    // tool object to hold various properties and methods
    this.tool = {
        domID:self.evTool.domToolID(divId),
        container:{
            layout:{
                margin:{top:20, right:0, bottom:0, left:0},
                width:860,
                height:570
            }
        },
        controls:{
            layout:{
                margin:{top:10, right:10, bottom:0, left:20},
                width:420
            }
        },
        chart:{
            axis:{},
            layout:{
                margin:{top:40, right:10, bottom:20, left:60}
            }
        },
        map:{
            layout:{height:270}
        },
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

    // request esri arcgis jsapi, callback will requires esri.map,  continue loading tool

    $.getScript("http://serverapi.arcgisonline.com/jsapi/arcgis/?v=3.0compact", function(data, textStatus, jqxhr) {
        // CONSOLE-OFF console.log(data); //data returned
        // CONSOLE-OFF console.log(textStatus); //success
        // CONSOLE-OFF console.log(jqxhr.status); //200
        // CONSOLE-OFF console.log('Load was performed.');

        dojo.require('esri.map');

        self.loadDeferred();
    });

}

EV3_Glider_Profile_Explorer.prototype.loadDeferred = function (config_override) {

    // continue loading tool once arcgis jsapi is called and dojo is required.

    var self = this;

    // calculate dimensions for the tool
    this.uiDimensions();

    // draw chart
    this.uiChart();

    // draw ALL UI CONTROLS
    this.uiControls();

    this.mapInitialize();

    this.getDeployments(this.tool.configuration.custom.deployment);

    this.getTrack(this.tool.configuration.custom.deployment,this.tool.configuration.custom.profile_id);

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

        var initExtent = new esri.geometry.Extent({"xmin":-74,"ymin":38,"xmax":-69,"ymax":44,"spatialReference":{ "wkid":4326 }});

        self.trackMap.map = new esri.Map( self.tool.domID + "track-map" ,{
            extent:esri.geometry.geographicToWebMercator(initExtent)
        });

        // map event listening connectors
        dojo.connect(self.trackMap.map, "onLoad", function() {
            dojo.connect(self.trackMap.map, "onMouseMove", showCoordinates);
            dojo.connect(self.trackMap.map, "onMouseDrag", showCoordinates);
        });

        self.trackMap.tiledMapServiceLayer = new esri.layers.ArcGISTiledMapServiceLayer(
            // "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
            //"http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer"
            "http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer"
        );

        self.trackMap.map.addLayer( self.trackMap.tiledMapServiceLayer );

        // create graphics layers
        self.trackMap.glTrack = new esri.layers.GraphicsLayer({ "id": "layer_track" });
        self.trackMap.glProfilesUp = new esri.layers.GraphicsLayer({ "id": "layer_ProfilesUp" });
        self.trackMap.glProfilesDown = new esri.layers.GraphicsLayer({ "id": "layer_ProfilesDown" });
        self.trackMap.glProfileSelected = new esri.layers.GraphicsLayer({"id": "layer_ProfileSelected"});

        // add graphics layers to the map
        self.trackMap.map.addLayer( self.trackMap.glTrack);
        self.trackMap.map.addLayer( self.trackMap.glProfilesUp);
        self.trackMap.map.addLayer( self.trackMap.glProfilesDown);
        self.trackMap.map.addLayer( self.trackMap.glProfileSelected);

        // map event listening funcitons
        function showCoordinates(evt) {
            var mp = esri.geometry.webMercatorToGeographic(evt.mapPoint);
            //display mouse coordinates
            dojo.byId(self.tool.domID + "track-map-info").innerHTML = d3.round(mp.x,4) + ", " + d3.round(mp.y,4);

        }
    }

    dojo.addOnLoad(loadMap);

}

EV3_Glider_Profile_Explorer.prototype.uiDimensions = function() {

    // do some calculations here for the tool dimensions

    var self = this,
        container = self.tool.container.layout,
        chart = self.tool.chart.layout,
        controls = self.tool.controls.layout;

    // some calculations for width and height minus margins
    container.width_m = container.width - container.margin.left - container.margin.right;
    container.height_m = container.height - container.margin.top - container.margin.bottom;

    chart.height = container.height_m;// - chart.margin.top - chart.margin.bottom;
    chart.height_m = chart.height - chart.margin.top - chart.margin.bottom;

    chart.width = container.width_m - controls.width;
    chart.width_m = chart.width - chart.margin.left - chart.margin.right;

}

EV3_Glider_Profile_Explorer.prototype.uiChart = function () {

    var self = this;

    var container = self.tool.container,
        chart = self.tool.chart,
        controls = self.tool.controls,
        config = self.tool.configuration.custom,
        id = self.tool.domID,
        chart_title = "";

    self.tool_container = d3.select("#" + self.tool.domID) //"#" + id + "tool")
        .append("div")
        .attr("id", id + "tool-container")
        .style("margin-left", container.layout.margin.left+ "px")

    self.tool.chart.tooltip = d3.select("#" + id + "tool-container")
        .append("div")
        .attr("id",id + "tooltip-div")
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
        .style("margin","10px 10px 10px 10px")

    // DomElement: svg container
    self.svg = self.tool_container.append("div")
        .attr("id",id + "chart_container")
        .append("svg")
        .attr("id", id + "svg-main")
        .attr("width", chart.layout.width)
        .attr("height", container.layout.height);

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
        .attr("height",container.layout.height + 30)
        .attr("id", id + "g-labels")

    // CONSOLE-OFF console.log("width:", chart.layout.width)
    // CONSOLE-OFF console.log("height:", chart.layout.height)

//    self.g_labels.append("svg:text")
//            .attr("id", id+ "chart-title")
//            .text("title")
//           // .attr("width",chart.layout.width + (chart.layout.width - chart.layout.width_m))
//            .attr("text-anchor", "middle")
//            //.attr("x", (chart.layout.width + (chart.layout.margin.left))/2)
//            .attr("x", chart.layout.width)
//            .attr("y", chart.layout.margin.top/3)
//            .attr("class", "chart-title");

    // DomElement: x-axis label
    self.g_labels.append("svg:text")
        .attr("id", id + "chart-x-axis-label")
        //.attr("width",chart.layout.width)
        .text("x-axis")
        .attr("text-anchor", "middle")
        .attr("stroke-width", 2)
        .attr("fill","#b94a48")
        .attr("x", chart.layout.margin.left + chart.layout.width_m/2)
        .attr("y", chart.layout.height + chart.layout.margin.bottom - 4 )
        .attr("class", "chart-label-x")
        .on("click",function(d){

            var position = $(this).position();

            // get the top left position of the
            d3.select("#"+id+"ctrl-observations")
                .style("visibility","visible")
                .style("top", (position.top - 2) + "px")
                .style("left", (position.left - 5 ) + "px");

            $(this).css("visibility","hidden");
        })

    // DomElement: y-axis label left
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
        controls = self.tool.controls.layout;

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
                        .html("&larr;")
                        .on("click",function(){

                            var slider = $("#"+ self.tool.domID+"profile-slider");
                            var val = slider.slider("option","value");

                            if ( val != slider.slider("option","min")){
                                slider.slider("value", val - 1 )
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

                    .attr("id",id+"profile-slider")
                    .slider({
                        slide: function(event, ui) {
                            // CONSOLE-OFF console.log("here we can possibly highlight the profile as we slide across")
                            //$("#" + id + "profile-selection").html(
                            $("#" + id + "profile-info-id").html(
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
                        //.attr("href","#")
                        .html("&rarr;")
                        .on("click",function(){

                            var slider = $("#"+ self.tool.domID+"profile-slider");
                            var val = slider.slider("option","value");

                            if ( val != slider.slider("option","max")){
                                slider.slider("value", val + 1 )
                            }
                        })
                )
            )
        )
    )

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
            .attr("id",id + "track-map-info")
            .html("&nbsp;")
    )
        .append(

        $("<div></div>")
            .attr("id",id + "track-map-legend")
            .append(
            $('<svg height="24" width="'+ self.tool.controls.layout.width+'">' + //' +  controls.width - 40 + '
                '<g transform="translate(240,0)" id="' + id + 'svgMapToggleUp" >' +
                '<circle cx="8" cy="9" r="6" stroke="#FF0000" stroke-width="2px" fill="#FF0000" ></circle>' +
                '<text x="18" y="14">Up Casts</text></g>' +
                '<g transform="translate(240,0)" id="' + id + 'svgMapToggleDown">' +
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
                    .attr("id", id + "profile-info-id")
            )
        )
            .append(

            $("<div></div>")
                .addClass("span4 profile-info-box")
                //.css("text-align","right")
                .html('<h3 style="text-align:center">Location <i class="icon-zoom-in"></i></h3>' +
                '<div>Latitude: <span style="float:right" id="'+id+'profile-info-lat"></span></div>' +
                '<div>Longitude: <span style="float:right" id="'+id+'profile-info-long"></span></div>')

        )
            .append(

            $("<div></div>")
                .addClass("span3 profile-info-box")
                .css("text-align","center")
                .html('<h3>Direction</h3>'+
                '<div><img id="'+id+'profile-info-direction" /></div>')

        )
            .append(

            $("<div></div>")
                .addClass("span3 profile-info-box")
                .css("text-align","center")
                .html('<h3>Date</h3>'+
                '<div><span id="'+id+'profile-info-date"></span></div>')

        )
    )

    var ctrl_dd_observations_select = $("<select></select>")
        .attr("id",id+"dd-observations")
        .change(function(a){

            self.customization_update();
            self.transitionChart();

            $(this).parent().css("visibility","hidden");

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

    // observation pop on for inline control
    var ctrl_dd_observations = $("<div></div>")
        .attr("id",id+"ctrl-observations")
        .css({
            "z-index":"100",
            "position":"absolute",
            "width":"220px",
            //"height":"300px",
            "height":"auto",
            //"width":self.chart.layout.container.width + "px",
            //"height":self.chart.layout.container.height + "px",
            "visibility":"hidden"
        })
        .append(ctrl_dd_observations_select)

    $("#" + id + "controls-div")
        .addClass("controls")
        .append(ctrl_deployment_info)
        .append(ctrl_trackMap)
        .append(ctrl_profile_info)
        .append(ctrl_profile_selection)

    $("body").append(ctrl_dd_observations);


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

        })


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
        })

}


EV3_Glider_Profile_Explorer.prototype.slideProfile = function ( a ) {

    var self = this, config = self.tool.configuration.custom,
        deployment = config.deployment,
        profile = self.tool.datasets[deployment].profiles[a];

    // if(config.profile_id != a){

    // get a reference to the graphics layer
    //self.trackMap.centerAt(esri.geometry.we)

    // add point to the path collection
    var pt = new esri.geometry.Point(
        profile.longitude,
        profile.latitude, {"wkid":4326} );

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

    config.profile_id = profile.profile_id;

    self.displayInfoCast(profile);

    self.getCast(deployment,profile.profile_id);

}

EV3_Glider_Profile_Explorer.prototype.getDeployments = function (deploymentId){

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

            console.log("getdeployment data",d)

//                "id":"id",
//                "Name":"name",
//                "Start Time":"start_time",
//                "End Time":"end_time",
//                "Cast Count":"casts"

//            for( var deployment in self.webservice.getdeployments){
//                deployObj[self.webservice.getdeployments[deployment]] = d[self.webservice.getdeployments[deployment]];
//            }
            d.casts = +d.casts;
            d.start_time = self.tool.formats.obsdate.parse(d.start_time);
            d.end_time = self.tool.formats.obsdate.parse(d.end_time);

            if( d.id == config.deployment ){

                self.displayInfoDeployment(d);
            }
        });
    });

}

EV3_Glider_Profile_Explorer.prototype.displayInfoCast = function ( cast ){

    var self = this, id = self.tool.domID, imgDirection;

    $("#" + id + "profile-selection")
        .html(cast.profile_id);

    $("#" + id + "profile-info-id")
        .html(cast.profile_id);
    //$("#" + id + "ctrl_profile_info_date").html();
    $("#" + id + "profile-info-lat")
        .html(cast.latitude);
    $("#" + id + "profile-info-long")
        .html(cast.longitude);

    $("#" + id + "profile-info-direction")
        .attr("src", "http://epe.marine.rutgers.edu/visualization/img/gliderDirection" + cast.direction + "32.png");

    $("#" + id + "profile-info-date").html(self.tool.formats.dateDisplay(cast.obsdate));

}

EV3_Glider_Profile_Explorer.prototype.displayInfoDeployment = function ( d ){

    var self = this, id = self.tool.domID;

    // CONSOLE-OFF console.log("displayInfoDeployment",d);
    // CONSOLE-OFF console.log("arguments",arguments);
    console.log("diplayInfo:", d)

    $("#" + id + "deployment-info-name").html(d.name);

    $("#" + id + "deployment-info-profile-count").html(d.casts);


    $("#" + id + "deployment-info-start-time").html(self.tool.formats.dateDisplay(d.start_time));
    $("#" + id + "deployment-info-end-time").html(self.tool.formats.dateDisplay(d.end_time));

//
//        casts: "1651"
//        end_time: "2012-01-07T14:47:00Z"
//        id: "246"
//        name: "RU07 MURI/OOI"
//        start_time: "2011-12-14T17:11:00Z"
//

}

EV3_Glider_Profile_Explorer.prototype.getTrack = function ( deploymentId, profileId ){

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

        self.setSlider(data.length-1);

        self.mapTrack();

    });
}

EV3_Glider_Profile_Explorer.prototype.setSlider = function ( max ) {
    var self=this;
    $("#"+ self.tool.domID+"profile-slider").slider(
        { max: max,
            value:self.getProfileKey(self.tool.configuration.custom.profile_id)
        }
    );
}

EV3_Glider_Profile_Explorer.prototype.mapTrack = function ( linePoints ) {

    var self = this,
        config = self.tool.configuration.custom,
        data = self.tool.datasets[config.deployment].profiles,
        zoomExtent, id = self.tool.domID;

    self.trackMap.trackPoints = [];
    self.trackMap.trackLine = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));

    // CONSOLE-OFF console.log("trackmap data: ", data)

    data.forEach( function( d ) {

        // add point to the path collection
        var pt = new esri.geometry.Point(
            +d["longitude"] ,
            +d["latitude"], {"wkid":4326} );

        var sms,direction;

        self.trackMap.trackPoints.push(pt);

//        var attributes = {
//            "cast" : d.profile_id,
//            "direction" : d.direction,
//            "longitude" : +d["longitude"],
//            "latitude" : +d["latitude"],
//            "obsdate" : d["obsdate"]
//        };

        //console.log("attributes", attributes,d)
//        var graphic = new esri.Graphic(
//                esri.geometry.geographicToWebMercator(pt),
//                sms,
//                attributes,
//                null);

        // is this the selected cast
        if( +d.profile_id == +config.profile_id ){

            self.trackMap.glProfileSelected.add(
                new esri.Graphic(
                    esri.geometry.geographicToWebMercator(pt),
                    self.trackMap.symbols["smsSelected"],
                    d,
                    null)
            );
        }
        else if( d.direction == "Up" ) {

            self.trackMap.glProfilesUp.add(
                new esri.Graphic(
                    esri.geometry.geographicToWebMercator(pt),
                    self.trackMap.symbols["smsUp"],
                    d,
                    null));
        }
        else{

            self.trackMap.glProfilesDown.add(
                new esri.Graphic(
                    esri.geometry.geographicToWebMercator(pt),
                    self.trackMap.symbols["smsDown"],
                    d,
                    null)
            );
        }

    });

    self.trackMap.trackLine.addPath( self.trackMap.trackPoints );

    // project line geometry, set symbol
    self.trackMap.trackGraphic = new esri.Graphic(
        esri.geometry.geographicToWebMercator(self.trackMap.trackLine),
        new esri.symbol.SimpleLineSymbol()
    );

    self.trackMap.glTrack.add(self.trackMap.trackGraphic);

    dojo.connect(self.trackMap.glProfilesUp,"onMouseOver",function(evt){
        //map.graphics.clear();  //use the maps graphics layer as the highlight layer
        var cast = evt.graphic.attributes;

        console.log("MAP MOUSE EVENT:",evt)

        self.tool.chart.tooltip
            .style("visibility", "visible")
            .attr("class","label label-info" )
            .html("Profile: " + cast.profile_id + " <br />Direction: " + cast.direction)
            //.style("top", evt.screenPoint.y + 30 + "px")
            //.style("left", evt.screenPoint.x + "px");
            .style("top", evt.pageY + 30 + "px")
            .style("left", evt.pageX + "px");

    });

    dojo.connect(self.trackMap.glProfilesUp,"onMouseOut",function(evt){

        self.tool.chart.tooltip.style("visibility", "hidden");
    });

    dojo.connect(self.trackMap.glProfilesDown,"onMouseOver",function(evt){
        //map.graphics.clear();  //use the maps graphics layer as the highlight layer
        var cast = evt.graphic.attributes;

        self.tool.chart.tooltip
            .style("visibility", "visible")
            .attr("class","label label-info" )
            .html("Profile: " + cast.profile_id + " <br />Direction: " + cast.direction)
            .style("top", evt.pageY + 30 + "px")
            .style("left", evt.pageX + "px");

    });

    dojo.connect(self.trackMap.glProfilesDown,"onMouseOut",function(evt){

        self.tool.chart.tooltip.style("visibility", "hidden");

    });

    // map click events

    dojo.connect(self.trackMap.glProfilesUp,"onClick",function(evt){
        //map.graphics.clear();  //use the maps graphics layer as the highlight layer

        var cast = evt.graphic.attributes;
        //alert(content);
        //map.infoWindow.setContent(content);
        //var title = evt.graphic.getTitle();
        //map.infoWindow.setTitle(title);
        //map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
//       console.log(this,content);

        config.profile_id = cast.profile_id;

        self.displayInfoCast(cast);
        self.getCast(config.deployment,cast.profile_id,cast);

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

        // find profile array key here. apply to slider

        $("#"+ self.tool.domID+"profile-slider")
            .slider(
            "value",
            self.getProfileKey(cast.profile_id)
        );

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

        config.profile_id = cast.profile_id;

        self.displayInfoCast(cast);

        //self.getCast(config.deployment,attr.profile_id);

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
        $("#"+ self.tool.domID+"profile-slider")
            .slider(
            "value",
            self.getProfileKey(cast.profile_id)
        );
    });
}


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

EV3_Glider_Profile_Explorer.prototype.getProfileKey = function (profileId){

    var self = this;

    var ds = this.tool.datasets[self.tool.configuration.custom.deployment].profiles;

    for( var i = 0; i < ds.length; i++ ){
        if(+ds[i]["profile_id"] == profileId)
            return i;
    }
}

EV3_Glider_Profile_Explorer.prototype.getCast = function (deploymentId, profileId){

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

        datasets[deploymentId][profileId] = {
            data:data
        };

        $("#" + id + "profile-info-records").html(data.length);

        self.transitionChart();
    });

}

EV3_Glider_Profile_Explorer.prototype.parseCastData = function ( deploymentId, profileId, observation) {

    var self = this,
        ds = self.tool.datasets[deploymentId][profileId];

    ds.data.forEach( function ( d ) {
        d[observation] = +d[observation];

    });
}

EV3_Glider_Profile_Explorer.prototype.transitionChart = function ( ){

    var self = this,
        datasets = self.tool.datasets,
        config = self.tool.configuration.custom,
        units = self.observations[config.observation].units,
        colX = config.observation,
        colY = "depth",
        ds = datasets[config.deployment][config.profile_id];

    self.parseCastData(config.deployment,config.profile_id,config.observation);

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

    //$("#" + id + "img_loading_data").hide();

}

EV3_Glider_Profile_Explorer.prototype.buffer_data = function (d) {

    var min = d[0], max = d[1];
    var buffer = (max - min) * 0.05;
    // CONSOLE-OFF console.log(min + "--" + max + " buffer:" + buffer)
    return [min - buffer, max + buffer];
}

EV3_Glider_Profile_Explorer.prototype.customization_update = function () {
    // this function will update the config file which is used for subsequent calls and lookups
    var self = this, id = this.tool.domID;

    // todo: update config for EV 3 tool

    var config_updates = {

        //"deployment":$("#" + id + "ctrl-deployment").val(),
        //"cast":"1",
        "observation": $("#"+ id + "dd-observations").val()
    };

    $.extend(self.tool.configuration.custom,config_updates);

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

}

EV3_Glider_Profile_Explorer.prototype.mouseout = function () {
    return this.tool.chart.tooltip.style("visibility", "hidden");
}