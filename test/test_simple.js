// XOR

var yann = require('./../index');
//var synaptic = require('./../`');


var train_data = [
	{ input: [0, 0], output: [0] },
	{ input: [0, 1], output: [0] },
	{ input: [1, 0], output: [0] },
	{ input: [1, 1], output: [1] },
];


var net = new yann.Network([
	new yann.layers.Input(2),
	new yann.layers.FullyConnected(1),
]);

/*
var inputLayer = new synaptic.Layer(2);
var outputLayer = new synaptic.Layer(1);
inputLayer.project(outputLayer, synaptic.Layer.connectionType.ALL_TO_ALL); 
var net2 = new synaptic.Network({
	input: inputLayer,
	output: outputLayer,
});
net.optimized = false;
*/


function log_state () {
//	console.log(Array.from(net.layers[1].weights), Array.from(net.layers[1].biases));
//	net.layers[1].gradient && console.log('gradient', Array.from(net.layers[1].gradient));
//	console.log();
}

log_state();

var trainer = new yann.Trainer(net);
var stat = trainer.train(train_data, {
	iterations: 10,
	batchSize: 1,
	error: .1,
	rate: .5,
	log: function () {
		console.log(...arguments);
		log_state();
	},
	logEach: 1,
});

// console.log(stat);


/*
console.log(
	train_data[0].input,
	train_data[0].output,
	net.activate(train_data[0].input)
);
*/




