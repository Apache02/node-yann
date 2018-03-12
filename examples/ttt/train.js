var process		= require('process');

var { Env, Player, Game }	= require('./lib_ttt');
var Model_Net	= require('./Model_Net');

// random + win
class Model_Random extends Player
{
	estimate ( env, move )
	{
		var winner = env.winner();
		return Math.random() + (winner * .5);
	}
}

// Base priority + random + win
class Model_Prio_Random extends Player
{
	estimate ( env, move )
	{
		var winner = env.winner();
		return [
			.1,  0, .1,
			 0, .2,  0,
			.1,  0, .1,
		][move] + Math.random()*.1 + (winner * .2);
	}
}

class Model_Random_Sequence extends Player
{
	constructor ()
	{
		super();
		this._sequence = new Array(9);
		this.random();
	}
	random ()
	{
		for ( var i=0; i<9; i++ ) {
			this._sequence[i] = Math.random();
		}
	}
	estimate ( env, move )
	{
		return this._sequence[move];
	}
	
	resultLose ( env )
	{
		this.random();
	}
	resultTie ( env )
	{
		this.random();
	}
}


class Trainer
{
	constructor ( model )
	{
		this.model = model;
	}
	
	train ( opponent = null, options = null )
	{
		if ( typeof opponent == 'object' && !(opponent instanceof Player) ) {
			options = opponent;
			opponent = null;
		}
		
		options = Object.assign({}, this.constructor.DEFAULT_OPTIONS, options);
		
		let players = [opponent || new Model_Prio_Random, this.model];
		let game = new Game(players);
		game.mode = 'reset';
		
		let iteration = 0;
		for ( ; iteration < options.iterations; iteration ++ ) {
			var stat = {
				iteration,
				count: 0,
				 '1': 0,
				'-1': 0,
				 '0': 0,
			};
			
			for ( var i=0; i<options.rowCount; i++ ) {
				let winner = game.play();
				stat[winner] ++;
				stat.count ++;
			}
			
			(options.log) && (typeof options.log == 'function') && (options.log(stat));
			this.model.updateWeights(options.rate);
			
		}
	}
}

Trainer.DEFAULT_OPTIONS = {
	iterations: 1000,
	rowCount: 100,
	log: null,
	rate: .05,
};



function main ( argv ) {
	
	var filename = argv[2] || 'model.json';
	
	var playerNet = Model_Net.loadFromFile(filename);
	if ( playerNet ) {
		console.log(`Net loaded from file [${filename}]`);
	} else {
		playerNet = new Model_Net();
		console.log(`Created net`);
	}
	// empty string
	console.log();
	
	var trainer = new Trainer(playerNet);
	
	trainer.train(new Model_Random, {
		log: ( stat ) => {
			console.log([
				stat.iteration,
				(stat[ 1]/stat.count).toFixed(2),
				(stat[ 0]/stat.count).toFixed(2),
				(stat[-1]/stat.count).toFixed(2),
			].join("\t"));
		},
		rate: .1,
	});
	
	// empty string
	console.log();
	if ( playerNet.saveToFile(filename) ) {
		console.log(`Net saved to file [${filename}]`);
	} else {
		console.log(`Can't save net to file [${filename}]`);
	}
	
}


main(process.argv);