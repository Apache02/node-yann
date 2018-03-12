var MDArray			= require('./MDArray');
var Network			= require('./Network');

var next_id = 0;

class Layer
{
	constructor ( ...sizes )
	{
		this.id = ++ next_id;
		this.prevLayer = null;
		this.nextLayer = null;
		this.output = sizes.length ?
			new MDArray(... sizes) : null;
		this.errors = null;
	}
	
	toJSON ()
	{
		return {
			id: this.constructor.id,
			create: [...this.output.sizes],
		};
	}
	
	init ( prevLayer )
	{
//		console.log('Layer::init', prevLayer);
		this.prevLayer = prevLayer;
		if ( prevLayer ) {
			prevLayer.nextLayer = this;
		}
	}
	
	// virtual
	activate ( input )
	{
		throw new Error('Virtual function: activate function must be redefined');
		
		// return this.output;
	}
	
	propagate ( target )
	{
//		console.log('propagate', this.constructor.name, target, this.errors);
		
		if ( target && this.output.length != target.length ) {
			throw new Error('Target size error');
		}
	}
	
	updateWeights ( learningRate )
	{
	}
}

Layer.id = 'dummy';

class ActLayer extends Layer
{
	constructor ()
	{
		super();
	}
	
	init ( prevLayer )
	{
//		console.log('ActLayer::init', prevLayer.output.sizes);
		Layer.prototype.init.call(this, prevLayer);
		
		var sizes = prevLayer.output.sizes;
		this.output = new MDArray(...sizes);
//		console.log('ActLayer::init this.output', this.output);
	}
	
	activate ( input )
	{
//		console.log('ActLayer::activate', input);
		if ( input.length != this.output.length ) {
			throw new Error('Input size error');
		}
		
		for ( var i=0; i<input.length; i++ ) {
			var val = input[i];
			this.output[i] = this.activationFunction(val, false);
		}
		
		return this.output;
	}
	
	activationFunction ( x, derivate = false )
	{
		throw new Error('Virtual function: activationFunction must be redefined');
	}
	
	propagate ( target )
	{
		Layer.prototype.propagate.call(this, target);
		
		let input = this.prevLayer.output;
		let output = this.output;
		
		var errors = new Array(output.length);
		if ( target ) {
			for ( var i=0; i<errors.length; i++ ) {
				errors[i] = this.activationFunction(input[i], true) * (target[i] - output[i]) * 2;
				/*
				errors[i] = this.activationFunction(input[i], true) * (
					-1 * (target[i] * (1/output[i]) + (1-target[i])*(1/(1-output[i])) )
				);
				*/
				/*
				errors[i] = this.activationFunction(input[i], true) * (
					-1 * (target[i] * Math.log(output[i]))
				);
				*/
			}
		} else {
			for ( var i=0; i<errors.length; i++ ) {
				errors[i] = this.errors[i] * this.activationFunction(input[i], true);
			}
		}
//		console.log('errors:', errors);
		this.prevLayer.errors = errors;
	}
	
}

Layer.Act = ActLayer;


module.exports = Layer;