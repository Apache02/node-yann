//var MDArray			= require('./MDArray');
var Network			= require('./src/Network');
var Layer			= require('./src/Layer');


module.exports = {
	// basic
	Network,
	Layer,
	
	layers: 	require('./src/layers/index'),
	activation:	require('./src/activation_functions'),
	
	// helper
	Trainer: require('./src/Trainer'),
};
