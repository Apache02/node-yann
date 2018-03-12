var process			= require('process');
var path			= require('path');
var events			= require('events');

var { Env, Player, Game }	= require('./lib_ttt');
var Model_Net	= require('./Model_Net');





class Keyboard extends events.EventEmitter
{
	constructor ()
	{
		super();
		process.stdin.setRawMode(true);
		this._ondata = this.ondata.bind(this);
		process.stdin.addListener('data', this._ondata);
	}
	
	init ()
	{
		this.emit('ready');
	}
	
	destroy ()
	{
		process.stdin.removeListener('data', this._ondata);
		process.stdin.setRawMode(false);
		super.destroy && super.destroy();
	}
	
	ondata ( data )
	{
		var input = data.toString();
		var re = /(\x03$|\x0D$|\x1b\[[ABCD]|\x1b$|[qQrRaA ])/g;
		var m;
		while ( m = re.exec(input) ) {
			switch ( m[1] ) {
				case '\x1b[A':
					this.emit('control', Keyboard.UP);
					break;
				case '\x1b[B':
					this.emit('control', Keyboard.DOWN);
					break;
				case '\x1b[C':
					this.emit('control', Keyboard.RIGHT);
					break;
				case '\x1b[D':
					this.emit('control', Keyboard.LEFT);
					break;
				case '\x0D':
					this.emit('control', Keyboard.RETURN);
					break;
				case ' ':
					this.emit('control', Keyboard.SPACE);
					break;
				case '\x1b': // Esc
				case '\x03': // Ctrl-C
				case 'q':
				case 'Q':
					this.emit('quit');
					break;
				case 'r':
				case 'R':
					this.emit('reset');
					break;
				case 'a':
				case 'A':
					this.emit('ai');
					break;
			}
		}
	}
	
}

Keyboard.UP		= 0;
Keyboard.DOWN	= 1;
Keyboard.RIGHT	= 2;
Keyboard.LEFT	= 3;
Keyboard.RETURN	= 4;
Keyboard.SPACE	= 5;


const CONSOLE_STYLE_WIN		= "\x1b[32m";
//const CONSOLE_STYLE_CURSOR	= "\x1b[46m\x1b[1m";
const CONSOLE_STYLE_CURSOR	= "\x1b[46m\x1b[1m";
const CONSOLE_STYLE_RESET	= "\x1b[0m";


class Application extends events.EventEmitter
{
	constructor ( playerNet )
	{
		super();
		
		this.bot = playerNet;
		this.env = new Env();
		
		this.cursor = 4; //  center
		this.aiThinking = false;
		
		this.kbd = new Keyboard();
		
		this.kbd.init();
		this.kbd.on('quit', () => { this.quit() });
		this.kbd.on('reset', () => {
			this.reset();
			this.update();
		});
		this.kbd.on('ai', () => {
			if ( this.env.history.size == 0 ) {
				// only first move
				this.aimove();
				this.update();
			}
		});
		this.kbd.on('control', this.keypress.bind(this));
	}
	
	keypress ( key )
	{
		if ( !this.env.canMove() ) {
			return;
		}
		switch ( key ) {
			case Keyboard.UP:
				this.cursor -= 3;
				break;
			case Keyboard.DOWN:
				this.cursor += 3;
				break;
			case Keyboard.LEFT:
				this.cursor -= 1;
				break;
			case Keyboard.RIGHT:
				this.cursor += 1;
				break;
			case Keyboard.RETURN:
			case Keyboard.SPACE:
				this.move(this.cursor);
				break;
		}
		if ( this.cursor < 0 ) {
			this.cursor += 9;
		}
		if ( this.cursor >= 9 ) {
			this.cursor %= 9;
		}
		
		this.update();
	}
	
	reset ()
	{
		this.env.reset();
	}
	
	start ()
	{
		this.reset();
		this.update();
	}
	
	destroy ()
	{
		this.kbd.destroy();
	}
	
	quit ()
	{
		this.emit('quit');
		this.destroy();
	}
	
	aimove ()
	{
		setTimeout(() => {
			var move = this.bot.move(Env.from(this.env).multiply(-1));
			this.env.move(move, -1);
			this.aiThinking = false;
			this.update();
		}, 100);
		
		this.aiThinking = true;
	}
	
	move ( index )
	{
		if (
			this.cursor >= 0 && this.cursor < 9
			&& this.env[this.cursor] == 0
			&& this.env.canMove()
		) {
			this.env.move(this.cursor, 1);
			
			// next move AI
			if ( this.env.canMove() ) {
				this.aimove();
			}
		}
		
	}
	
	printInfo ()
	{
		console.log([
			"[R] = Reset",
			"[Q] = Quit",
			"[A] = AI Move",
//			"[ARROWS] = Navigation",
//			"[Enter] = Cross here",
		].join(' / '));
		console.log();
	}
	
	update ()
	{
		console.clear();
		
		this.printInfo();
		
		var winner = this.env.winner();
		var winLine = null;
		if ( winner ) {
			for ( var line of Env.LINES ) {
				if ( this.env.sum(line) == winner * 3 ) {
					winLine = line;
					break;
				}
			}
		}
		var display = [
			"[ %0 %1 %2 ]",
			"[ %3 %4 %5 ]",
			"[ %6 %7 %8 ]",
		].join("\n");
		
		display = display.replace(/\%(\d)/g, ( text, i ) => {
			var t = Env.MARKS[this.env[i]];
			var reset = false;
			if ( winLine && winLine.includes(parseInt(i)) ) {
				// fggreen
				t = CONSOLE_STYLE_WIN + t;
				reset = true;
			}
			if ( i == this.cursor ) {
				// bgcyan
				t = CONSOLE_STYLE_CURSOR + t;
				reset = true;
			}
			if ( reset ) {
				t += CONSOLE_STYLE_RESET;
			}
			return t;
		});
		
		console.log(display);
		console.log();
		
		
		if ( this.aiThinking ) {
			console.log("AI thinking...");
		} else {
			console.log(this.bot._moves);
		}
		
		if ( !this.env.canMove() ) {
			if ( winner ) {
				console.log("Winner:", Env.MARKS[winner]);
			} else if ( this.env.isDraw ) {
				console.log("Tie!");
			}
			console.log();
			console.log(this.env.history);
		}
	}
}


function main ( argv ) {
	var filename = argv[2] || 'model.json';
	
	var playerNet = Model_Net.loadFromFile(filename);
	if ( !playerNet ) {
		console.error(`Cant load net from file [${filename}]`);
		process.exit(1);
	}
	
	var app = new Application(playerNet);
	app.start();
	app.on('quit', () => {
		process.exit(0);
	});
	
}

main(process.argv);