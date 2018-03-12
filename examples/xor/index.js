// XOR example

var process		= require('process');
var path		= require('path');

var yann		= require('./../../index');
var synaptic	= require('./synaptic.min.js');

var Trainer = yann.Trainer;

class XOR_Model__yann extends yann.Network
{
	constructor ()
	{
		// 2 input
		// 3 hidden layer
		// 1 output
		super([
			new yann.layers.Input(2),
			new yann.layers.FullyConnected(3),
			new yann.layers.FullyConnected(1),
		]);
	}
}

class XOR_Model__synaptic extends synaptic.Architect.Perceptron
{
	constructor ()
	{
		super(2, 3, 1);
	}
}

class XOR_Model
{
	constructor ( type )
	{
		this.verbose = true;
		this.net = null;
		
		switch ( type ) {
			case 'yann':
				this.net = new XOR_Model__yann();
				break;
			case 'syn':
				this.net = new XOR_Model__synaptic();
				break;
			default:
				throw new Error("Unknown model type");
		}
	}
	
	activate ( input )
	{
		if ( this.net.activate ) {
			return this.net.activate(input);
		}
	}
	
	propagate ( rate, output )
	{
		if ( this.net.propagate ) {
			if ( this.net.propagate.length > 1 ) {
				return this.net.propagate(rate, output);
			}
			return this.net.propagate(output);
		} else if ( this.net.backward ) {
			var cost_loss = this.net.backward(output);
		} else {
			return false;
		}
		return true;
	}
	
	updateWeights ( rate )
	{
		if ( this.net.updateWeights ) {
			this.net.updateWeights(rate);
		}
	}
	
	exec ( x1, x2 )
	{
		var result = this.activate([x1, x2]);
		return Math.round(result[0]);
	}
	
	train ()
	{
		if ( !this.net ) {
			return null;
		}
		
		var trainer = new yann.Trainer(this);
		var options = {
			iterations: 10000,	// max iterations
			error: .001,		// required error (avg)
			rate: .5,			// learning rate(speed)
			batchSize: 4,		// how many items need to propagate before update weights
		};
		if ( this.verbose ) {
			options.log = console.log;
			options.logEach = 1000;
		}
		var stat = trainer.train(this.constructor.LEARNING_DATA, options);
		if ( this.verbose ) {
			console.log("Train complete, statistics:", stat);
		}
		// clear?
		trainer.destroy && trainer.destroy();
		return stat;
	}
	
	test ()
	{
		console.log("");
		for ( var row of this.constructor.LEARNING_DATA ) {
			console.log(
				row.input.join(' ^ ')
				+ ' = '
				+ this.exec(row.input[0], row.input[1])
				+ ' (' + row.output[0] + ')'
			);
		}
	}
}

XOR_Model.LEARNING_DATA = require('./xor.json');


function main ( argv )
{
	if ( argv.length != 3 ) {
		console.error("Network type is not defined");
		console.log(`
Usage: node ${path.basename(__filename)} NAME
	NAME - neural netwoork library yann|syn
`);
		process.exit(1);
	}
	var xor = new XOR_Model(argv[2]);
	xor.train();
	xor.test();
}

main(process.argv);


