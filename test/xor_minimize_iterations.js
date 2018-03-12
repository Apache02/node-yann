var process		= require('process');

var yann		= require('./../index');


class XOR_Model extends yann.Network
{
	constructor ( l2_rate )
	{
		super([
			new yann.layers.Input(2),
			new yann.layers.FullyConnected(3, { l2_rate, random_weights:false, activation:'tanh' }),
			new yann.layers.FullyConnected(1, { l2_rate, random_weights:false }),
		]);
		
		this.learningRate = .5;
	}
	
	train ()
	{
		var trainer = new yann.Trainer(this);
		var dataset = this.constructor.TRAIN_DATASET;
		return trainer.train(dataset, {
			iterations: 10000,
			error: .001,
			rate: this.learningRate,
			batchSize: dataset.length,
		});
	}
}

XOR_Model.TRAIN_DATASET = require('./xor.json');


// Main process

function main ( argv )
{
	var stat = {
		iterations: 0,
		count: 0,
	};
	var count = parseInt(argv[2]) || 10;
	var i = 0;
	
	// header
	console.log([
		"#",
		"iter-s",
		"l-rate",
		"error",
		"l2",
		"avg",
	].join("\t"));
	
	var l2_rate = 0;//.0001;
	for ( ; i<count; i++, l2_rate *= .5 ) {
		var model = new XOR_Model(l2_rate);
		
		var stat_one = model.train();
		stat.iterations += stat_one.iterations;
		stat.count ++;
		stat.avg = Math.round(stat.iterations / stat.count);
		
		// row
		console.log([
			i,
			stat_one.iterations,
			model.learningRate,
			stat_one.error.toFixed(5),
			l2_rate,
			stat.avg,
		].join("\t"));
		
	}
	console.log("\n Avg: ", stat.avg);
}


main(process.argv);
