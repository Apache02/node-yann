var fs			= require('fs');
var path		= require('path');

var { Env, Player }	= require('./lib_ttt');

var yann		= require('./../../index');


// helper
class _Array extends Array
{
	multiply ( m )
	{
		for ( let i=0; i<this.length; i++ ) {
			this[i] *= m;
		}
		return this;
	}
}


class Model_Net extends Player
{
	constructor ( net = null )
	{
		super();
		
		this.net = net || new yann.Network([
			new yann.layers.Input(9),
			new yann.layers.FullyConnected(32),
			new yann.layers.FullyConnected(1),
		]);
		
		this.random = .001;
	}
	
	activate ( env )
	{
		return this.net.activate(env)[0];
	}
	
	updateWeights ( rate )
	{
		rate && this.net.updateWeights(rate);
	}
	
	estimate ( env, move )
	{
		return this.activate(env) + (this.random * Math.random());
	}
	
	
	reward ( env, price )
	{
		if ( !price ) {
			return;
		}
		var activation = this.activate(env);
		var target = price > 0 ? 1 : 0;
		var loss = Math.pow(target - activation, 2)/2;
		
		this.net.propagate([activation + loss*Math.sign(price)]);
	}
	
	resultWin ( env )
	{
		this.reward(_Array.from(env).multiply(env.winner()), 1);
	}
	
	resultLose ( env )
	{
		let winner = env.winner();
		this.reward(_Array.from(env).multiply(winner), 1);
		
		var tmp = env.history.state('max');
		// it was our move
		tmp.prev();
		this.reward(_Array.from(tmp).multiply(winner * -1), -1);
		
		if ( tmp.prev() && tmp.prev() ) {
			this.reward(_Array.from(tmp).multiply(winner * -1), -1);
		}
	}
	
	saveToFile ( filename )
	{
		try {
			fs.writeFileSync(filename, JSON.stringify(this.net.toJSON()));
			return true;
		} catch ( e ) {
			console.error(e);
			return false;
		}
	}
	
	static loadFromFile ( filename )
	{
		try {
			let json = fs.readFileSync(filename);
			var net = yann.Network.fromJSON(JSON.parse(json));
			return new this.prototype.constructor(net);
		} catch ( e ) {
			return false;
		}
		return null;
	}
	
}



module.exports = Model_Net;