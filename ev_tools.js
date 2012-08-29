// EV Tool Library
//
// Ocean Observatories Initiative
// Education & Public Engagement Implementing Organization
//
// Written by Michael Mills and Sage Lichtenwalner, Rutgers University
// Revised 8/27/12


var EVTool = function () {};

EVTool.prototype.staticMonths = function ( ) {

    var months = {
        "January":"01",
        "February":"02",
        "March":"03",
        "April":"04",
        "May":"05",
        "June":"06",
        "July":"07",
        "August":"08",
        "September":"09",
        "October":"10",
        "November":"11",
        "December":"12"
    }
    return months;

};

EVTool.prototype.getFormatDate = function ( dateFormatType ) {

    switch( dateFormatType ){
        case "hours": return d3.time.format("%H:M"); break;
        case "days": return d3.time.format("%d"); break;
        case "months": return d3.time.format("%m/%y"); break;
        case "tooltip": return d3.time.format("%Y-%m-%d %H:%M %Z"); break;
        case "context": return d3.time.format("%m-%d"); break;
        case "data_source": return d3.time.format("%Y-%m-%dT%H:%M:%SZ"); break;
        default: return d3.time.format("%Y-%m-%d %H:%M %Z"); break;
    }
};

EVTool.prototype.getFormatDateTicks = function ( dateTickFormatType) {

    switch( dateTickFormatType ){

        case  "hours": return d3.time.scale().tickFormat("%H:M"); break;
        case  "days": return d3.time.scale().tickFormat("%d"); break;
        case  "months": return d3.time.scale().tickFormat("%m/%y"); break;
        case  "tooltip": return d3.time.scale().tickFormat("%Y-%m-%d %H:%M %Z"); break;
        case  "context": return d3.time.scale().tickFormat("%m-%d"); break;
        default: return d3.time.scale().tickFormat("%Y-%m-%d %H:%M"); break;
    }
}

/**************************************************************************************/
//
//  C O N F I G U R A T I O N   P A R S I N G
//
/**************************************************************************************/

EVTool.prototype.configuration = function () {};

EVTool.prototype.configurationParse = function( configCustom, objConfigOverride ){

    //unified tool configuration parsing.

    //CONSOLE LOG//console.log("objConfigOverride type is: ", typeof(objConfigOverride));

    if(  typeof ( objConfigOverride ) == "undefined" ||  typeof ( objConfigOverride ) == "string" )  {
        console.log("no settings passed, default configuration loaded");
    }
    else{
        //override settings exist, so merge overrides into configuration
        //CONSOLE LOG//console.log("referenced configuration", configCustom)
        $.extend( true, configCustom, objConfigOverride );
    }
};

/**************************************************************************************/
//
//  D A T A   R E Q U E S T   A N D   P A R S I N G
//
/**************************************************************************************/

EVTool.prototype.dataRequest = function () {
    // there are currently multiple data request methods.. these will be combined here.
};
EVTool.prototype.dataParse = function () {
    // data parsing methods will be combined
};

/**************************************************************************************/
//
//  D O M   M A N I P U L A T I O N
//
/**************************************************************************************/

EVTool.prototype.domToolID = function ( domId ) {

    // generate a tool ID if one was not passed.
    // this uses a 4 digit random number, but should be "smart"

    if ( typeof(domId) == "undefined" ){
        return "ev-" + ( Math.floor ( Math.random( ) * 9000 ) + 1000 ).toString() + "-";
    }
    else{
        return domId;
    }
}

/**************************************************************************************/
//
//  D E P E N D E N C I E S
//
/**************************************************************************************/

EVTool.prototype.loadDependencies = function () {
    // tool dependencies should be added here.
};

EVTool.prototype.linearRegression = function( x ,y ){

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

/**************************************************************************************/
//
//  C O N T R O L   C R E A T I O N
//
/**************************************************************************************/

EVTool.prototype.toolControl = function (tool, id, control) {

    // standarization of tool controls, including advanced tools ie. datepicker

    // todo: editor,viewer should both reference this function

    var self = this;

    var ctrl;
    switch (control.type) {

        case "textbox":

            var lbl = $("<label />")
                .attr({
                    'for': id
                })
                .html(control.description);

            var input = $("<input />")
                .attr({
                    'id': id,
                    'type': 'textbox',
                    'value': control.default_value,
                    'title': control.tooltip,
                    'maxlength': typeof (control.maxlength) == "undefined" ? "" : control.maxlength
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
            var lbl = $("<label />")
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
                    self.update_config()
                });

            ctrl = $("<div></div>").addClass("control").append(lbl).append(textarea);

            break;

        case "dropdown":


            var lbl = $("<label />")
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

            //ctrl = $('<div style="display:inline"></div>')

            ctrl = $('<div></div>')
                .addClass("control");

            if (!control.nolabel === "true"){
                ctrl.append(lbl);
            }

            ctrl.append(select);

            break;

        case "checkbox":

            var lbl = $("<label />").attr({
                'for': id,
                'title': control.tooltip
            }).html(control.description);

            var input = $("<input />")
                .attr({
                    'id': id,
                    'type': 'checkbox',
                    //'value':control.default_value,
                    'title': control.tooltip,
                    'maxlength': typeof (control.maxlength) == "undefined" ? "" : control.maxlength
                    //'onclick':function(){alert("test");}
                });

            if ( control.selected ) {
                $(input).attr({
                    'checked': 'checked'
                })
            };

            ctrl = $("<div></div>")
                .addClass("control")
                .append(lbl)
                .append(input);

            break;

        case "svg":

            var ctrl = $("<svg></svg>");

            break;

        case "datepicker":

            var el_lbl = $("<label />")
                .attr({
                    'for': id + "_dp",
                    'title': control.tooltip
                })
                .html(control.description);

            var el_input = $("<input />")
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
            $(el_input).datepicker({
                    "dateFormat": "yy-mm-dd",
                    changeMonth: true,
                    changeYear: true,
                    showButtonPanel: true
                })
                .on("changeDate", function (dp) {
                    tool.customization_update();
                });

            ctrl = $("<div></div>")
                .addClass("control ctlhandle")
                .append(el_lbl)
                .append(el_input);

            break;

        case "colorpicker":


            // find the textbox in the control and init colorpicker
            var el_lbl = $("<label />")
                .attr({
                    'for': id + "_cp",
                    'title': control.tooltip
                })
                .html(control.description);

            var el_input = $("<input />")
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
                .append(el_input).append(el_span)

            $(el_div).colorpicker()
                .on("changeColor", function (cp) {
                    $("#" + id).val(cp.color.toHex())
                    //$("#" + id).val(tool.current_config[id] = cp.color.toHex())
                    //self.updateJSON();
                    tool.customization_update();
                });

            ctrl = $("<div></div>")
                .addClass("control ctlhandle")
                .append(el_lbl)
                .append(el_div);

            break;

        case "slider":

            //todo: slider control should be moved here from EV3/4

            break;

        default:
            // empty div if nothing is passed
            ctrl = $("<div></div>");
            break;
    }

    if (control.popover) {
        // now attach the popover to the div container for the control if set
        $(ctrl).attr({
            'rel': 'popover',
            'title': control.label,
            'data-content': control.tooltip
        }).popover();

    }

    return ctrl;
}


/**************************************************************************************/
//
//  N D B C   I O O S   D A T A
//
/**************************************************************************************/


var ioosSOS = function () {};

ioosSOS.prototype.getObservationObj = function ( aryObservation ) {

    // get a minimum observations object as required by tool
    // pass an array of observations and get object of observation and all properties

    var observations = {

        "sea_water_temperature":{
            "name":"Seawater Temperature",
            "label":"Seawater Temperature (C)",
            "query_param":"sea_water_temperature",
            "column":"sea_water_temperature (C)",
            "units":"&deg;C",
            "units2":"Degrees Celcius"
        },
        "sea_water_salinity":{
            "name":"Seawater Salinity",
            "label":"Seawater Salinity",
            "query_param":"sea_water_salinity",
            "column":"sea_water_salinity (psu)",
            "units":"",
            "units2":""
        },
        "air_temperature": {
            "name": "Air Temperature",
            "label": "Air Temperature (C)",
            "query_param": "air_temperature",
            "column": "air_temperature (C)",
            "units": "&deg;C",
            "units2": "Degrees Celcius"
        },
        "air_pressure_at_sea_level":{
            "name":"Air Pressure at Sea Level",
            "label":"Air Pressure at Sea Level (hPa)",
            "query_param":"air_pressure_at_sea_level",
            "column":"air_pressure_at_sea_level (hPa)",
            "units":"(hPa)",
            "units2":"-hPa-"
        },
        "waves":{
            "name":"Wave Height",
            "label":"Wave Height (m)",
            "query_param":"waves",
            "column":"sea_surface_wave_significant_height (m)",
            "units":"m",
            "units2":"meters"
        },
        "winds":{
            "name":"Wind Speed",
            "label":"Wind Speed (m/s)",
            "query_param":"winds",
            "column":"wind_speed (m/s)",
            "units":"m/s",
            "units2":"m/s"
        }
    };

    var self = this, toolObservations = {};

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

    if( typeof(eventTime) == "object" ){
        //CONSOLE LOG//console.log("eventtime is object",eventTime);
        eventTimeFormatted = eventTime.dateStart +  "T00:00Z/" + eventTime.dateEnd + "T00:00Z";
    }
    else{
        //CONSOLE.LOG//console.log("eventtime is string",eventTime);
        eventTimeFormatted = eventTime;
    }

    var url = "http://epe.marine.rutgers.edu/visualization/" + "proxy_ndbc.php?"
        + "http://sdf.ndbc.noaa.gov/sos/server.php?"
        + "request=GetObservation"
        + "&" + "service=SOS"
        + "&" + "offering=urn:ioos:station:wmo:" + ndbcStation
        + "&" + "observedproperty=" + observedProperty
        + "&" + "responseformat=text/csv"
        + "&" + "eventtime=" + eventTimeFormatted;

    return url;

}

ioosSOS.prototype.stationListLB = function ( stationList ) {

    // generate a station object from a text area delimited by line breaks

    // todo: remove leading and trailing line breaks before splitting.
    //s = s.replace(/(^\s*)|(\s*$)/gi,"");
    //s = s.replace(/[ ]{2,}/gi," ");

    var self = this, stationsObj = {}, stationAry = stationList.split("\n");

    console.log("STATION LIST: " , stationList);

    $.each(stationAry, function ( index, station) {

        //var parts = self.tool.configuration.station_list[station].split("|");
        var parts = station.split("|");

        var stationId = parts[0];
        var stationName = parts[1];

        stationsObj[stationId] = {
            "name": stationId,
            "label": stationName + " (" + stationId + ")"
        };

    });

    return stationsObj;
}


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