// EPE Visualization Service - Tool Editor Class
//
// Ocean Observatories Initiative 
// Education & Public Engagement Implementing Organization
//
// Written by Mike Mills and Sage Lichtenwalner, Rutgers University
// Revised 8/27/12

/**
 * ToolInstance Class
 */
var ToolEditor = function( fname, div_vis, configuration, div_control){
  this.fname = fname; // Name of the visualization tool's base class
  this.div_vis = div_vis; // Target div for the visualization
  this.configuration = configuration; // Configuration JSON array
  this.div_control = div_control; // Target div for the configuration control panel

  this.vistool = eval(this.fname);		

  this.initialize();
}

/**
 * Initialize
 */
ToolEditor.prototype.initialize = function(){
	var instance = this;

	// Initalize a new instance of the tool with the instance configuration
	instance.tool_instance = new instance.vistool( instance.div_vis,instance.configuration );

	// Create the configuration control panel
	if( typeof( instance.div_control ) !== "undefined" ){
        console.log('Drawing Control Panel');
        instance.load_controls(instance.div_control);
  }
}

/**
 * Load Controls
 */
ToolEditor.prototype.load_controls = function(div_control){
	var instance = this;
	
  // Override control default setting with the instance configuration
	$.each( instance.configuration,function( index ){
	  if (typeof( instance.tool_instance.controls[index] ) != "undefined" )
  		instance.tool_instance.controls[index]["default_value"] = instance.configuration[index];	
	});

	// Add each control to the specified div
	$.each(instance.tool_instance.controls,function( index, control ){
		$('#'+div_control)
			.append(
				$( instance.draw_control( index, control ) )
                .addClass("ctlhandle")
			);
	});

	// Now draw an update button that will redraw the instance
	var el_btn = $('<button type="button">Update Visualization</button>')
		.addClass("btn pull-right")
		.click(function(){instance.redraw();});

    $('#'+div_control).append(el_btn);

}

/**
 * Redraw
 */
ToolEditor.prototype.redraw = function(){

    var instance = this;

	// remove children of the display window, which will clear all existing charts
	$('#'+instance.div_vis).children().remove();

	// reinitalize the instance of the tool, loading the UPDATED instance configuration
	instance.tool_instance = new instance.vistool(instance.div_vis,instance.tool_instance.tool.configuration.custom);
	return false;
}

/**
 * Reset Tool
 */
ToolEditor.prototype.reset = function(){

    var instance = this;

    $('#'+instance.div_vis).children().remove();
	$('#'+instance.div_control).children().remove();

    instance.configuration = {};
	instance.initialize();

    return false;
}

/**
 * Draw Control
 */
ToolEditor.prototype.draw_control = function( id, control, value ){

    var self = this;
	
	console.log("Drawoing Control: " + id + "  Control Type: " + control.type);

	var ctrl;
	switch(control.type){

        case "textbox":

				var lbl = $("<label />")
				.attr({'for':id})
				.html(control.label);

			var input = $("<input />");

            $(input)
				.attr({
					'id':id,
					'type':'textbox',
					'value':control.default_value,
					'title':control.tooltip,
					'maxlength':typeof(control.maxlength)=="undefined"?"":control.maxlength
				})
				.change(function(){
					self.update_config()
				});

			ctrl = $("<div></div>").addClass("control").append(lbl).append(input);

            break;
		
		case "textarea":
			var lbl = $("<label />")
				.attr({'for':id})
				.html(control.label);
			var textarea = $("<textarea></textarea>");

            $(textarea)
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

        case "textareaDelimited":

            console.log("drawing control for textareaDelimited");

            var lbl = $("<label />")
                .attr({'for':id})
                .html(control.label);

            var textarea = document.createElement("textarea");

            var textareaVal = "";

            for(var x=0; x < control.default_value.length; x++){

                textareaVal += control.default_value[x];

                if(x < control.default_value.length - 1 ){
                    textareaVal += "\n"
                }
            }

            $(textarea)
                .attr({
                    'id':id,
                    'type':'textarea',
                    'value':textareaVal,
                    //'title':control.tooltip,
                    'rows':5
                })
            .change(function(){
                self.update_config()
            });

            ctrl = $("<div></div>")
                .addClass("control")
                .append(lbl)
                .append(textarea);

            break;

		case "dropdown":

			var lbl = $("<label />")
				.attr({'for':id,'title':control.tooltip})
				.html(control.label);

			// create select element and populate it
			var select = $("<select></select>")
				.attr({"id":id})
				.change(function(){
					self.update_config()
				});

			$.each(control.options,function(option){
				opt = control.options[option];	
				$(select)
                    .append($('<option></option>')
                    .val(opt.value)
                    .html(opt.name));
			});

			$(select).val(control.default_value);
			ctrl = $("<div></div>").addClass("control").append(lbl).append(select);
			break;
		
		case "checkbox":
			var lbl = $("<label />")
				.attr({'for':id,'title':control.tooltip})
				.html(control.label);
			var input = document.createElement("input");
			$(input)
				.attr({
					'id':id,
					'type':'checkbox',
					//'value':control.default_value,
					'title':control.tooltip,
					'maxlength':typeof(control.maxlength)=="undefined"?"":control.maxlength
					//'onclick':function(){alert("test");}
				});

			if(control.selected) $(input).attr({'checked':'checked'})

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
                .html(control.label);

            var el_input = $("<input />")
                .attr({
                    "id": id,
                    "type": "text"
                  })
                .addClass("datepicker")
                .val(control.default_value)
                .on("change", function () {
                    self.update_config();
                });

                $(el_input).datepicker({
                    "dateFormat": "yy-mm-dd",
                    changeMonth: true,
                    changeYear: true,
                    showButtonPanel: true
                })
                .on("changeDate", function (dp) {
                    self.update_config();
                });

            ctrl = $("<div></div>")
                .addClass("control ctlhandle")
                .append(el_lbl)
                .append(el_input);

			break;
			
		case "colorpicker":

            var el_lbl = $("<label />")
				.attr({'for':id+"_cp",'title':control.tooltip})
				.html(control.label);

			var el_input = $("<input />")
				.attr({"id":id,"type":"text"})
				.addClass("readonly span2")
				.val(control.default_value)
				.change(function(){
					self.update_config()
				});

            var el_i = $("<i></i>")
                .css("background-color",control.default_value);

            var el_span = $("<span></span>")
                .addClass("add-on")
                .append(el_i);

			var el_div = $("<div></div>")
				.addClass("input-append color")
				.attr({
                    "id":id+"_cp",
                    "data-color":control.default_value,
                    "data-color-format":"hex"
                })
				.append(el_input)
				.append(el_span)

			$(el_div).colorpicker().on("changeColor",function(cp){
				$("#"+id).val(self.tool_instance.tool.configuration.custom[id] = cp.color.toHex())	
				self.update_config();			
			});

			ctrl = $("<div></div>")
					.addClass("control ctlhandle")
					.append(el_lbl)
					.append(el_div);
			break;
		
		default: 
			ctrl = document.createElement("div");
			break;
	}

	// now attach the popover to the div container for the control
	$(ctrl)
		.attr({'rel':'popover','title':control.label,'data-content':control.tooltip})
		.popover();
	
	return ctrl;
	
}

/**
 * update_config
 */
ToolEditor.prototype.update_config = function(){

    var instance = this;

    console.log('Updating Settings');

    $.each(instance.tool_instance.controls,function(control){
        instance.tool_instance.tool.configuration.custom[control] = $('#'+control).val();
	});
}

/**
 * setJSON
 */
ToolEditor.prototype.setJSON = function(div_id){

    var instance = this;

    $('#' + div_id).val(
		$.toJSON(instance.tool_instance.tool.configuration.custom)
	);

	console.log('JSON Updated');

	return false;
}
