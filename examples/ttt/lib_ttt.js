// Tic tac toe helpers


const ENV_SIZE		= 9;
const ENV_LINES		= [
	// horizontal
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	// vertical
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	// diagonal
	[0, 4, 8],
	[2, 4, 6],
];
const ENV_MARKS		= {
	"-1": 'O',
	 "1": 'X',
	 "0": ' ',
};

class History extends Array
{
	constructor ()
	{
		super();
	}
	
	get size ()
	{
		return this.length / 2;
	}
	
	add ( move, sign )
	{
		this.push(move, sign);
	}
	
	clear ()
	{
		this.length = 0;
	}
	
	getMove ( index )
	{
		if ( index >= this.size || index < 0 ) {
			return null;
		}
		return [this[index*2], this[index*2 + 1]];
	}
	
	state ( index )
	{
		if ( index == 'max' ) {
			index = this.size;
		}
		let max = index << 1;
		
		var env = new Env(this);
		for ( let i=0; i<max && i<this.length; i+=2 ) {
			env[this[i]] = this[i+1];
			env.history_index = i/2;
		}
		env.winner();
		return env;
	}
}

class Env extends Int8Array
{
	constructor ( history )
	{
		super(9);
		
		this.history = history || new History
		this.history_index = 0;
		this._winner = 0;
	}
	
	reset ()
	{
		this._winner = 0;
		this.fill(0);
		this.history.clear();
		this.history_index = 0;
	}
	
	multiply ( val )
	{
		for ( var i=0; i<ENV_SIZE; i++ ) {
			this[i] *= val;
		}
		return this;
	}
	
	sum ( list )
	{
		let sum = 0;
		for ( let i=0; i<ENV_SIZE; i++ ) {
			if ( list === undefined || list.includes(i) ) {
				sum += this[i];
			}
		}
		return sum;
	}
	
	move ( pos, sign )
	{
		if ( this[pos] === 0 ) {
			this[pos] = sign;
			this.history.add(pos, sign);
			this.history_index ++;
			// update winner cache
			this.winner();
			return true;
		}
		return false;
	}
	
	winner ()
	{
		if ( this._winner ) {
			return this._winner;
		}
		for ( var line of this.constructor.LINES ) {
			var sum = this.sum(line);
			if ( Math.abs(sum) == 3 ) {
				this._winner = Math.sign(sum);
				return this._winner;
			}
		}
		return 0;
	}
	
	canMove ()
	{
		if ( this.winner() ) {
			return false;
		}
		for ( var i=0; i<ENV_SIZE; i++ ) {
			if ( this[i] == 0 ) {
				return true;
			}
		}
		return false;
	}
	
	next ()
	{
		let move = this.history.getMove(this.history_index);
		if ( !move ) {
			return false;
		}
		this[move[0]] = move[1];
		this.history_index ++;
		return true;
	}
	
	prev ()
	{
		let move = this.history.getMove(this.history_index);
		if ( !move ) {
			return false;
		}
		this[move[0]] = 0;
		this.history_index --;
		return true;
	}
	
	toConsole ()
	{
		return [
			"[ %0 %1 %2 ]",
			"[ %3 %4 %5 ]",
			"[ %6 %7 %8 ]",
		].join("\n").replace(/\%(\d)/g, ( substr, i ) => {
			i = parseInt(i);
			return this.constructor.MARKS[this[i]];
		});
	}
	
}

Env.LINES = ENV_LINES;
Env.MARKS = ENV_MARKS;




class Player
{
	constructor ()
	{
		this._moves = new Array(9);
	}
	
	resultWin ( env )
	{
	}
	resultLose ( env )
	{
	}
	resultTie ( env )
	{
	}
	
	estimate ( env, move )
	{
		throw new Error("call to virtual function [estimate]");
	}
	
	move ( env )
	{
		var move = -1;
		var move_rate = -Infinity;
		
		this._moves.fill(0);
		
		for ( var i=0; i<ENV_SIZE; i++ ) {
			if ( env[i] == 0 ) {
				var tmp = Env.from(env);
				tmp[i] = 1;
				
				if ( ( this._moves[i] = this.estimate(tmp, i) ) > move_rate ) {
					move = i;
					move_rate = this._moves[i];
				}
			}
		}
		
		return move;
	}
}

class Game
{
	constructor ( players )
	{
		this.players = players;
		this.env = new Env();
		this.next_player = 0;
		this.mode = 'continue';
		this.winner = 0;
	}
	
	reset ()
	{
		this.env.reset();
		this.winner = 0;
		if ( this.mode == 'reset' ) {
			this.next_player = 0;
		}
	}
	
	nextPlayer ()
	{
		var player = {
			model: this.players[this.next_player],
			sign: this.next_player == 0 ? 1 : -1,
			index: this.next_player,
		};
		this.next_player = (this.next_player + 1) & 1;
		return player;
	}
	
	play ()
	{
		this.reset();
		
		while ( this.env.canMove() ) {
			var { model, sign } = this.nextPlayer();
			var moveIndex = model.move(this.env.map(v => v*sign));
			if ( !this.env.move(moveIndex, sign) ) {
				throw new Error("Not allowed move to " + moveIndex);
			}
			this.winner = this.env.winner();
		}
		
		//
		if ( this.winner ) {
			var i = ((this.winner - 1) * -1)/2;
			this.players[i      ].resultWin(this.env);
			this.players[(i+1)&1].resultLose(this.env);
		} else {
			this.players[0].resultTie(this.env);
			this.players[1].resultTie(this.env);
		}
		
		return this.winner;
	}
}



module.exports = {
	Env,
	Player,
	Game,
};