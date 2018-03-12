// XOR

var yann = require('./../index');
//var synaptic = require('synaptic');


var train_data = require('./xor.json');


var net = new yann.Network([
	new yann.layers.Input(2),
	new yann.layers.FullyConnected(3),
	new yann.layers.FullyConnected(1),
]);


//var net2 = new synaptic.Architect.Perceptron(2, 3, 3, 1);


var trainer = new yann.Trainer(net);
var stat = trainer.train(train_data, {
	iterations: 10000,
	error: .001,
	rate: .1,
	batchSize: 1,
});

console.log(stat);

for ( var row of train_data ) {
	console.log(
		row.input[0] + ' xor ' + row.input[1]
		+ ' = '
		+ net.activate(row.input)[0]
		+ ' (' + row.output[0] + ')'
	);
}




