// EV Tool Library
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University
// Revised 10/25/12
// version 1.0.1


var EVTool = function () { };

EVTool.prototype.staticMonths = function () {

    return {
        "January"   : "01",
        "February"  : "02",
        "March"     : "03",
        "April"     : "04",
        "May"       : "05",
        "June"      : "06",
        "July"      : "07",
        "August"    : "08",
        "September" : "09",
        "October"   : "10",
        "November"  : "11",
        "December"  : "12"
    };
};

EVTool.prototype.getYearsToPresent = function ( yearStart ) {

    var presenetDate = new Date(),
        presenetYear = presenetDate.getFullYear(),
        yearsAry = [];

    for (var x = yearStart; x <= presenetYear; x++ ){
        yearsAry.push( x );
    }

    return yearsAry;
};

EVTool.prototype.getFormatDate = function ( dateFormatType ) {

    switch( dateFormatType ){
        case "hours":
            return d3.time.format("%H:M");

        case "days":
            return d3.time.format("%d");

        case "months":
            return d3.time.format("%m/%y");

        case "tooltip":
            return d3.time.format("%Y-%m-%d %H:%M %Z");

        case "context":
            return d3.time.format("%m-%d");

        case "data_source":
            return d3.time.format("%Y-%m-%dT%H:%M:%SZ");

        default:
            return d3.time.format("%Y-%m-%d %H:%M %Z");

    }
};

EVTool.prototype.getFormatDateTicks = function ( dateTickFormatType) {

    switch( dateTickFormatType ){

        case  "hours" :
            return d3.time.scale().tickFormat("%H:M");

        case  "days" :
            return d3.time.scale().tickFormat("%d");

        case  "months" :
            return d3.time.scale().tickFormat("%m/%y");

        case  "tooltip" :
            return d3.time.scale().tickFormat("%Y-%m-%d %H:%M %Z");

        case  "context" :
            return d3.time.scale().tickFormat("%m-%d");

        default:
            return d3.time.scale().tickFormat("%Y-%m-%d %H:%M");

    }
};

EVTool.prototype.formatLat = function (lat){
    //40.350741
    return d3.round(Math.abs(lat),4) + (+lat > 0 ? "N" : "S");

};

EVTool.prototype.formatLong = function (long){

//    -73.882319
    return d3.round(Math.abs(long),4) + (+long > 0 ? "E" : "W");

};

EVTool.prototype.formatGliderObs = function ( n, obs ) {

    var f, ff;

    // find format for observation. if observation not found, format string is obs
    switch(obs){

        case "density" : f = ".6r"; break;
        case "tempwat" : f = ".3r"; break;
        case "pracsal" :
        case "cdomflo" :
        case "chlaflo" :
        case "optparw" :
        case "flubsct" : f = "0.2r"; break;
        default : f = obs;
    }

    ff = d3.format(f);

    return ff(n);

};

//
//  C O N F I G U R A T I O N   P A R S I N G
//

EVTool.prototype.configuration = function () {};

EVTool.prototype.configurationParse = function( configCustom, objConfigOverride ){

    //unified tool configuration parsing.

    //CONSOLE LOG//console.log("objConfigOverride type is: ", typeof(objConfigOverride));

    if(  typeof ( objConfigOverride ) === "undefined" ||  typeof ( objConfigOverride ) === "string" )  {
        console.log("no settings passed, default configuration loaded");
    }
    else{
        //override settings exist, so merge overrides into configuration
        //CONSOLE LOG//console.log("referenced configuration", configCustom)
        $.extend( true, configCustom, objConfigOverride );
    }
};

//
//  D A T A   R E Q U E S T   A N D   P A R S I N G
//

EVTool.prototype.dataRequest = function () {
    // there are currently multiple data request methods.. these will be combined here.
};
EVTool.prototype.dataParse = function () {
    // data parsing methods will be combined
};

//
//  D O M   M A N I P U L A T I O N
//

EVTool.prototype.domToolID = function ( domId ) {

    // generate a tool ID if one was not passed.
    // this uses a 4 digit random number, but should be "smart"

    if ( typeof(domId) === "undefined" ){
        return "ev-" + ( Math.floor ( Math.random( ) * 9000 ) + 1000 ).toString() + "-";
    }
    else{
        return domId;
    }
};

//
//  D E P E N D E N C I E S
//

EVTool.prototype.loadDependencies = function ( dependScripts ) {

    // dependencies
    var dependencies = {
        loadScript : function( scriptName ){

            var script = this.scripts[scriptName];

            if( script && script.loaded === false){

                var s = document.createElement('script');

                s.setAttribute('type', 'text/javascript');
                s.setAttribute('src', script.src);

                document.getElementsByTagName('head')[0].appendChild(s);

                script.loaded = true;
            }

        },
        scriptLoaded : function( script ){

            var s = this.scripts[script];

            if (s.loaded) {
                return true;
            }
            else {
                return false;
            }

        }
    };

    if ( typeof(  dependScripts  ) === "undefined" ){

        dependencies.scripts = {

            jquery:{
                src:'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js',
                loaded:false,
                dependsOn:[]
            },
            helper:{
                src:'helper.js',
                loaded:false,
                dependsOn:[]
            },
            ioos:{
                src:'OOI.EPE.DataSources.js',
                loaded:false,
                dependsOn:['helper','jquery']
            },
            d3:{
                src:'d3.min.js',
                loaded:false,
                dependsOn:[]
            },
            d3chart:{
                src:'d3.csv.min.js',
                loaded:false,
                dependsOn:['d3']
            },
            d3time:{
                src:'d3.csv.min.js',
                loaded:false,
                dependsOn:['d3']
            }

        };

    }
    else{

        dependencies.scripts =  dependScripts;
    }

    for ( script in dependencies.scripts ){

        if( !d.scripts[ script ].loaded ){

            var len = dependencies.scripts[ script ].dependsOn.length;

            // dependencies ?
            if( len > 0 ){
                // load dependencies first
                for ( x=0; x < len; x++ ){

                    var s = dependencies.scripts[ script ].dependsOn[ x ];

                    // is dependency loaded
                    if( !d.scriptLoaded( s ) ){
                        d.loadScript( s );
                    }
                }
                // now load this one
                d.loadScript( script );
            }
            else{
                // no dependencies, load it
                d.loadScript( script );
            }
        }
    }

};

//
//  C O N T R O L   C R E A T I O N
//

EVTool.prototype.uiBootstrap = function ( id, bsType, opts ) {

    "use strict";
    // helper functions for bootstrap nested divs

    // bsType : fluidContainer
    // opts: {

//        rows: [
//            {cols:[6,4,2]},
//            {cols:[2,4,6]},
//        ];

    var template = $("<div></div>");

    switch ( bsType ){

        case "fluidContainer":

            template.addClass("container-fluid");

            for ( var rows = 0; rows < opts.rows.length; rows++ ){

                var row = $("<div></div>").addClass("row-fluid");

                for ( var cols = 0; cols < opts.rows[rows].cols.length; cols++ ){

                    var col = $("<div></div>")
                        .addClass("span"+opts.rows[rows]["cols"][cols]);

                    col.append(  opts.rows[rows]["colControls"][cols]);

                    //attr("id", id + "-template-" + opts.rows[rows]["colRef"][cols])

                    row.append(col);
                }
                template.append(row);
            }

            break;

    }

    return template;

};

EVTool.prototype.toolControl = function (tool, id, control) {

    // standarization of tool controls, including advanced tools ie. datepicker

    // todo: editor,viewer should both reference this function

    var self = this;

    var ctrl, lbl, input;
    switch (control.type) {

        case "textbox":

            lbl = $("<label />")
                .attr({
                    'for': id
                })
                .html(control.description);

            input = $("<input />")
                .attr({
                    'id': id,
                    'type': 'textbox',
                    'value': control.default_value,
                    'title': control.tooltip,
                    'maxlength': typeof (control.maxlength) === "undefined" ? "" : control.maxlength
                })
                //.addClass("span2")
                .on("change", function () {
                    tool.customization_update();
                });

            ctrl = $("<div></div>")
                .addClass("control")
                .append(lbl)
                .append(input);

            break;

        case "textarea":
            lbl = $("<label />")
                .attr({'for':id})
                .html(control.label);

            var textarea = $("<textarea></textarea>")
                .attr({
                    'id':id,
                    'type':'textarea',
                    'value':control.default_value,
                    //'title':control.tooltip,
                    'rows':5
                })
                .change(function(){
                    self.customizationUpdate();
                });

            ctrl = $("<div></div>")
                .addClass("control")
                .append(lbl)
                .append(textarea);

            break;

        case "dropdown":


            lbl = $("<label />")
                .attr({
                    'for': id,
                    'title': control.tooltip
                })
                .html(control.description);

            // create select element and populate it
            var select = $("<select></select>")
                //.addClass("span3")
                .attr({
                    "id": id
                }).change(function () {
                    tool.customization_update();
                });

            console.log("control dropdown: options:",control.options);
            // add drop down names and value pair options from contols "options" object
            $.each(control.options, function (option) {

                opt = control.options[option];

                $(select)
                    .append($('<option></option>')
                    .val(opt.value)
                    .html(opt.name));
            });

            // set the default value based on the controls default value element
            // todo: override with custom config value
            select.val( control.default_value );


            ctrl = $('<div></div>');
            //.addClass("control");

            if (control.nolabel !== "true" ){
                ctrl.append( lbl );
            }

            ctrl.append( select );

            break;

        case "checkbox":

            lbl = $("<label />").attr({
                'for': id,
                'title': control.tooltip
            }).html(control.description);

            input = $("<input />")
                .attr({
                    'id': id,
                    'type': 'checkbox',
                    //'value':control.default_value,
                    'title': control.tooltip,
                    'maxlength': typeof (control.maxlength) === "undefined" ? "" : control.maxlength
                    //'onclick':function(){alert("test");}
                });

            if ( control.selected ) {
                $(input).attr({
                    'checked': 'checked'
                });
            }

            ctrl = $("<div></div>")
                .addClass("control")
                .append(lbl)
                .append(input);

            break;

        case "svg":

            ctrl = $("<svg></svg>");

            break;

        case "datepicker":

            lbl = $("<label />")
                .attr({
                    'for': id + "_dp",
                    'title': control.tooltip
                })
                .html(control.description);

            input = $("<input />")
                .attr({
                    "id": id,
                    "type": "text"
                })
                .addClass("datepicker")
                .val(control.default_value)
                .on("change", function () {
                    tool.customization_update();
                });

            // set jquery datepicker settings
            $( input ).datepicker({
                "dateFormat": "yy-mm-dd",
                changeMonth: true,
                changeYear: true,
                showButtonPanel: true
            })
                .on("changeDate", function () {
                    tool.customization_update();
                });

            ctrl = $("<div></div>")
                .addClass("control ctlhandle")
                .append(lbl)
                .append(input);

            break;


        case "colorpicker":


            // find the textbox in the control and init colorpicker
            lbl = $("<label />")
                .attr({
                    'for': id + "_cp",
                    'title': control.tooltip
                })
                .html(control.description);

            input = $("<input />")
                .attr({
                    "id": id,
                    "type": "text"
                })
                .addClass("readonly span2")
                .val(control.default_value);

            var el_i = $("<i></i>")
                .css("background-color", control.default_value);

            var el_span = $("<span></span>")
                .addClass("add-on")
                .append(el_i);

            var el_div = $("<div></div>")
                .addClass("input-append color")
                .attr({
                    "id": id + "_cp",
                    "data-color": control.default_value,
                    "data-color-format": "hex"
                })
                .append(input).append(el_span);

            $(el_div).colorpicker()
                .on("changeColor", function (cp) {
                    $("#" + id).val(cp.color.toHex());
                    //$("#" + id).val(tool.current_config[id] = cp.color.toHex())
                    //self.updateJSON();
                    tool.customization_update();
                });

            ctrl = $("<div></div>")
                .addClass("control ctlhandle")
                .append(lbl)
                .append(el_div);

            break;


        case "selection":
            console.log("tool control.. SELECTION");

            lbl = $("<label />")
                .attr({
                    'for': id + "-dropdown",
                    'title': control.tooltip
                })
                .html( control.description );

            // add dropdown..

            var el_selectionDropdown = self.toolControl(tool, id+"-dropdown", control );

            var el_button = $("<a></a>")
                .addClass("btn next")
                .html("Add")
                .on("click",function(){ alert("clicked");} );

            var el_selections = $("<ul></ul>")
                .attr("id", id + "observations-selected");

            $.each( control.selectedItems, function(  item, itemObj ){

                    el_selections.append(
                        $("<li></li>").html( itemObj.name )
                    );
                }
            );
            // add button next to dropdown..
            // event handler for click of button.. remove option from dropdown

            $(el_selectionDropdown).val( control.default_value );

            var template = self.uiBootstrap( id, "fluidContainer",
                {
                    rows:[
                        {
                            cols:[12],
                            colControls:[ el_lbl ]
                        },
                        {   cols:[ 10, 2 ],
                            colControls:[ el_selectionDropdown , el_button]

                        },
                        {
                            cols:[12],
                            colControls:[ el_selections ]
                        }
                    ]

                }
            );

            console.log(template);

            ctrl = $(template)
                .addClass("control");
//                .append(lbl)
//                .append(el_selectionDropdown)
//                .append(el_button)
//                .append(
//                    $("<div></div>").append( el_selections )
//                )


            break;


        case "slider":

            //todo: slider control should be moved here from EV3/4

            break;

        default:
            // empty div if nothing is passed
            ctrl = $("<div></div>");
            break;
    }

    if ( control.popover ) {
        // now attach the popover to the div container for the control if set
        $(ctrl).attr({
            'rel': 'popover',
            'title': control.label,
            'data-content': control.tooltip
        }).popover();

    }

    return ctrl;
};

// Other things

EVTool.prototype.linearRegression = function( x, y ){

    var lr = {}, n = y.length, sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0, sum_yy = 0;

    for (var i = 0; i < y.length; i++) {
        sum_x += x[ i ];
        sum_y += y[ i ];
        sum_xy += ( x[ i ] * y[ i ] );
        sum_xx += ( x[ i ] * x[ i ] );
        sum_yy += ( y[ i ] * y[ i ] );
    }

    lr.slope =  (n * sum_xy - sum_x * sum_y ) / ( n * sum_xx - sum_x * sum_x );
    lr.intercept = ( sum_y - lr.slope * sum_x ) / n;
    lr.r2 = Math.pow( ( n * sum_xy - sum_x * sum_y) / Math.sqrt( ( n * sum_xx-sum_x * sum_x ) * ( n * sum_yy-sum_y*sum_y) ), 2);

    return lr;
};

//
//  TOOL LOADER
//
//  EPE Visualization Service - Tool Loader Class
//

// ToolLoader parent object

var ToolLoader = function( config, div_vis ){
    this.config = config; // Either a full URL or numeric ID
    this.div_vis = div_vis; // Target div for the visualization

    this.get_settings();
};

// Get Settings

ToolLoader.prototype.get_settings = function ( ) {
    var self = this;

    if ( typeof(self.config) !== "number" ) {

        self.settings_url = self.config;

    } else {

        self.settings_url = 'http://epe.marine.rutgers.edu/visualization/visualizations/settings/' + self.config;

    }

    //CONSOLE LOG//console.log('Config URL: ' + self.settings_url);

    $.getJSON( self.settings_url, { source : 'loader' }, function ( json ) {

        // set the tool's configuration and metadata

        self.configuration = json.configuration;
        self.metadata = json.metadata;

        // Load the Tool's JavaScript source code
        $.getScript( self.metadata.script_url, function ( ) {

            //CONSOLE LOG//console.log("Tool Source Loaded.");

            // Initalize a new instance of the tool with the instance configuration
            self.vistool = eval(self.metadata.name);
            self.tool_instance = new self.vistool( self.div_vis, self.configuration);
        })
            .fail(function (source_jsonxhr, settings, exception) {
                console.log("Ajax error: ");
                console.log(exception);
                console.log(settings);
            });

        // Load the Tool's CSS
        $(document.createElement('link'))
            .attr({
                href: self.metadata.css_url,
                media: 'screen',
                type: 'text/css',
                rel: 'stylesheet'
            })
            .appendTo('head');

    });
};

//
//  N D B C   I O O S   D A T A
//

var ioosSOS = function () {};

ioosSOS.prototype.getObservationObj = function ( aryObservation ) {

    // get a minimum observations object as required by tool
    // pass an array of observations and get object of observation and all properties

    var observations = {

        "sea_water_temperature" : {
            "name"        : "Seawater Temperature",
            "label"       : "Seawater Temperature (C)",
            "query_param" : "sea_water_temperature",
            "value"       : "sea_water_temperature",
            "column"      : "sea_water_temperature (C)",
            "units"       : "&deg;C",
            "units2"      : "Degrees Celcius",
            "shortName"   : "Water Temp"
        },
        "sea_water_salinity" : {
            "name"        : "Seawater Salinity",
            "label"       : "Seawater Salinity",
            "query_param" : "sea_water_salinity",
            "value"       : "sea_water_salinity",
            "column"      : "sea_water_salinity (psu)",
            "units"       : "",
            "units2"      : "",
            "shortName"   : "Salinity"
        },
        "air_temperature" : {
            "name"        : "Air Temperature",
            "label"       : "Air Temperature (C)",
            "query_param" : "air_temperature",
            "column"      : "air_temperature (C)",
            "units"       : "&deg;C",
            "units2"      : "Degrees Celcius",
            "shortName"   : "Air Temp"
        },
        "air_pressure_at_sea_level":{
            "name"        : "Air Pressure at Sea Level",
            "label"       : "Air Pressure at Sea Level (hPa)",
            "query_param" : "air_pressure_at_sea_level",
            "column"      : "air_pressure_at_sea_level (hPa)",
            "units"       : "(hPa)",
            "units2"      : "-hPa-",
            "shortName"   : "Air Pressure"
        },
        "waves" : {
            "name"        : "Wave Height",
            "label"       : "Wave Height (m)",
            "query_param" : "waves",
            "column"      : "sea_surface_wave_significant_height (m)",
            "units"       : "m",
            "units2"      : "meters",
            "shortName"   : "Wave Height"
        },
        "winds" : {
            "name"        : "Wind Speed",
            "label"       : "Wind Speed (m/s)",
            "query_param" : "winds",
            "column"      : "wind_speed (m/s)",
            "units"       : "m/s",
            "units2"      : "m/s",
            "shortName"   : "Wind Speed"
        }
    };

    var toolObservations = {};

    // add observations for on aryObservation elements
    $.each( aryObservation , function( index, observation ){

        toolObservations[observation] = observations[observation];

    });

    return toolObservations;

};

ioosSOS.prototype.request = function () {};

ioosSOS.prototype.requestUrlTimeseriesDate = function ( ndbcStation, observedProperty, eventTime ){

    /***

     this function will generate a properly formatted IOOS SOS request for a timeseries
     dataset for a specific bouy, observation, and date range

     ndbcStation
     - Acceptable Values: see http://sdf.ndbc.noaa.gov/stations.shtml

     observedProperty
     - air_pressure_at_sea_level
     - air_temperature
     - currents
     - sea_water_salinity
     - sea_water_electrical_conductivity
     - sea_floor_depth_below_sea_surface (water level for tsunami stations)
     - sea_water_temperature
     - waves
     - winds

     eventTime as string
     - hours and minutes are acceptable
     - properly formatted eventTime --> 2010-01-01T00:00Z/2010-01-14T00:00Z

     eventTime as object
     - eventTime.dateStart --> 2010-01-01
     - eventTime.dateEnd   --> 2010-01-14

     todo: we could add checks to ensure the station, property and time are correctly formatted

     **/

    var eventTimeFormatted;

    if( typeof(eventTime) === "object" ){
        //CONSOLE LOG//console.log("eventtime is object",eventTime);
        eventTimeFormatted = eventTime.dateStart +  "T00:00Z/" + eventTime.dateEnd + "T00:00Z";
    }
    else{
        //CONSOLE.LOG//console.log("eventtime is string",eventTime);
        eventTimeFormatted = eventTime;
    }

    return "http://epe.marine.rutgers.edu/visualization/" + "proxy_ndbc.php?" +
        "http://sdf.ndbc.noaa.gov/sos/server.php?" +
        "request=GetObservation" +
        "&" + "version=1.0.0" +
        "&" + "service=SOS" +
        "&" + "offering=urn:ioos:station:wmo:" + ndbcStation +
        "&" + "observedproperty=" + observedProperty +
        "&" + "responseformat=text/csv" +
        "&" + "eventtime=" + eventTimeFormatted;

};

ioosSOS.prototype.stationListLB = function ( stationList, delimiterElement, delimiterProperty ) {

    // generate a station object from a text area delimited by line breaks

    // todo: remove leading and trailing line breaks before splitting.
    //s = s.replace(/(^\s*)|(\s*$)/gi,"");
    //s = s.replace(/[ ]{2,}/gi," ");
    var stationsObj = {}, stationAry, delimEl, delimProp;

    if( typeof( delimiterElement ) === "undefined" ) delimEl = "\n";
    if( typeof( delimiterProperty ) === "undefined" ) delimProp = "|";

    if( typeof(stationList) === "string"){

        stationAry = stationList.split( delimEl );

    }
    else{
        stationAry = stationList;
    }

    console.log("STATION LIST: " , stationList);

    $.each(stationAry, function ( index, station) {

        var parts = station.split( delimProp );

        var stationId = parts[0];
        var stationName = parts[1];

        stationsObj[stationId] = {
            "name": stationId,
            "label": stationName + " (" + stationId + ")"
        };

    });

    return stationsObj;
};

// GENERIC Prototypes
Array.prototype.stdev = function ( key ) {

    // basic standard deviation for an array

    var sum = 0,
        diff_ary = [],
        mean,
        diff_sum = 0,
        stddev,
        len = this.length;

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