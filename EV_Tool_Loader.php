<?php
// EV Tool Loader
$tool = $_GET['tool'];
$config = $_GET['config'];
//http://ooi.dev/epe/tools/EV_Tool_Loader.php?tool=EV_Tutorial_HelloEVDeveloper&json={'userMessage':'testing'}

if(strlen($tool) == 0){exit;}

?>
<!DOCTYPE html>
<html lang="en">
<head>
	<title>EV Tool Loader</title>
	<link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.2.2/css/bootstrap-combined.min.css" rel="stylesheet">
	<link href="<?php echo $tool; ?>.css" rel="stylesheet">
	<link href="http://epe.marine.rutgers.edu/visualization/css/colorpicker.css" rel="stylesheet">

</head>

<body>
<h1 class="page-header">Educational Visualization Tool <small><?php echo str_replace('_',' ', $tool); ?></small></h1>
<div class="container-fluid">
	<div class="row-fluid">
		<div class="span12">
			<div id="chart"></div>
		</div>
	</div>
</div>

<script src="http://code.jquery.com/jquery-latest.js"></script>
<script src="//netdna.bootstrapcdn.com/twitter-bootstrap/2.2.2/js/bootstrap.min.js"></script>
<script src="../system/js/bootstrap-colorpicker.js"></script>

<script src="http://d3js.org/d3.v3.min.js"></script>
<script src="ev_tools.js"></script>
<script src="<?php echo $tool; ?>.js"></script>

<script>

	$(function(){
		var tool = new <?php echo $tool; ?>('chart',<?php if($config){echo $config;}else{echo "''";} ?>);
	});

</script>
</body>
</html>