var MDArray		= require('./MDArray');

class Neuron
{
	constructor ( prevLayer )
	{
		this.prevLayer = prevLayer;
		this.output = null;
		this.errors = null;
		this.error = 0;
		
		this.weights = new Array(prevLayer.output.length);
		this.bias = 0;
		
		this.randomWeights();
	}
	
	randomWeights ()
	{
		for ( var i=0; i<this.weights.length; i++ ) {
			this.weights[i] = Math.random() - .5;
//			this.weights[i] = (Math.random() * .2 - .1);
		}
		this.bias = (Math.random() * .2 - .1);
	}
	
	activate ( input )
	{
//		console.log('Neuron activate:', input)
		if ( input.length != this.weights.length ) {
			throw new Error('Input size error');
		}
		var sum = this.bias;
		for ( var i=0; i<this.weights.length; i++ ) {
			var val = (input instanceof MDArray) ?
				input.data[i] : input[i];
//			console.log('val = ', val);
			sum += this.weights[i] * val;
		}
		this.output = sum;
		
//		console.log('Neuron output:', this.output)
		return this.output;
	}
	
	propagate ( error )
	{
//		console.log('propagate', 'Neuron', error);
		this.error = error;
		
		var size = this.weights.length;
		var output = this.output;
		var errors = new Array(size);
		
		for ( var i=0; i<size; i++ ) {
			errors[i] = error * this.weights[i];
		}
//		console.log('Neuron errors', errors);
		this.errors = errors;
	}
	
	updateWeights ( learningRate )
	{
		let input = this.prevLayer.output.data;
		for ( var i=0; i<this.weights.length; i++ ) {
			this.weights[i] += learningRate * this.error * input[i];
		}
		this.bias += learningRate * this.error;
	}
	
	mutate ( rate )
	{
		for ( var i=0; i<this.weights.length; i++ ) {
			this.weights[i] += (Math.random()-.5)*2.5 * this.weights[i];
		}
		this.bias += (Math.random()-.5)*2.5 * this.bias;
	}
}


module.exports = Neuron;