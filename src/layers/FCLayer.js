// Fully Connected layer

var Layer		= require('./../Layer');
var MDArray		= require('./../MDArray');
var activations	= require('./../activation_functions');


var default_options = {
	activation: 'logistic',
	random_weights: true,
	l2_rate: 0,
};

function * weight_generator_random ( n, max = 2 )
{
	for ( var i=0; i<n; i++ ) {
		yield Math.random() * max * 2 - max;
	}
}

function * weight_generator_fixed ( n, max = 2 )
{
	for ( let i=0; i<n; i++ ) {
		yield ((max/n) * (i+1)) * (((i&1)*2)-1);
	}
}


class FCLayer extends Layer
{
	constructor ( size, options = null )
	{
		super(size);
		
		this.weights = null;		// Array(N x M+1)
									// including biases
		this.activation = null;		// function
		this.sums = null;			// Array(N) // SUM(w*x)
		this.errors = null;			// Array(N) // derivates of cost function or propagatet errors
		this.gradient = null;		// Array(N x M)
		this.gradient_count = 0;
		
		options = Object.assign({}, default_options, options);
		if ( typeof activations[options.activation] != 'function' ) {
			throw new Error('Unknown activation function');
		}
		this.activation = activations[options.activation];
		if ( options.l2_rate && typeof options.l2_rate == 'number' ) {
			this.l2_reg_rate = options.l2_rate;
		}
		if ( options.random_weights === false ) {
			this.weights_generator = weight_generator_fixed;
		}
	}
	
	toJSON ()
	{
		var data = Layer.prototype.toJSON.call(this);
		data.create = [this.output.length, {
			activation: this.activation.name,
		}];
		data.weights = Array.from(this.weights);
		return data;
	}
	
	init ( prevLayer )
	{
//		console.log('FCLayer::init', prevLayer);
		Layer.prototype.init.call(this, prevLayer);
		
		// neurons count
		let size = this.output.length,
			// inputs of each neuron
			input_size = prevLayer.output.length;
		
		this.weights	= MDArray.create(size, input_size+1); // row = neuron
		this.sums		= MDArray.create(size);
		
		// init random weights
//		var i=0;
//		let init = () => {
//			return Math.random() * 4 - 2;
			
			// 1 = 4257
			// 2 = 4041
			// 3 = 4726
			// 1.5 = 4131
			// 1.75 = 4086
			// 1.875 = 4061
			// 1.9375 = 4037
			// 1.96875 = 4046
//			return ((1.96875/(this.weights.length)) * i++) * (i&1 ? 1 : -1);
//			return ((2/this.weights.length) * i++) * (i&1 ? 1 : -1);
//		};
		var gen = (this.weights_generator || weight_generator_random);
		this.weights.fill([... gen(this.weights.length)]);
		
		this.errors = new Float32Array(size);
	}
	
	activate ( input )
	{
//		console.log('FCLayer::activate', input);
		if ( input.length != this.prevLayer.output.length ) {
			throw new Error('Input size error');
		}
		// neurons count
		let size	= this.output.length;
		let weights	= this.weights;
		
		for ( let i=0; i<size; i++ ) {
			// i = neuron index
			let sum = 0,
				j = 0;
			for ( ; j<input.length; j++ ) {
				sum += weights[i + j*size] * input[j];
			}
			// bias
			sum += weights[i + j*size];
			this.sums[i] = sum;
			/*
			this.sums[i] = this.weights.fetch(i)
				.pack()
				.multiply(input)
				.sum(bias);
			*/
		}
		this.output = this.activation(this.sums);
		return this.output;
	}
	
	
	propagate ( target )
	{
//		console.time('propagate_' + this.id);
		
		// errors check
		Layer.prototype.propagate.call(this, target);
		
//		console.log('layer#'+this.id, target, this.errors);
		
		let output = this.output,
			// neurons count
			size = output.length,
			// inputs
			inputs = this.prevLayer.output;
		
		// this is output layer
		if ( target ) {
			/*
			this.errors = output.map((val, i) => {
				// derivate of loss function
				return (target[i] - val);
			});
			*/
			for ( var i=0; i<size; i++ ) {
				this.errors[i] = (target[i] - output[i]);
			}
		}
		
		let derivates = this.activation(this.sums, true);
		
		// calc gradient
		if ( !this.gradient ) {
			this.gradient = MDArray.create(size, inputs.length + 1);
			this.gradient.fill(0);
			this.gradient_count = 0;
		}
		this.gradient//.multiply(.9)
			.add(MDArray.create(size, inputs.length + 1).fill(([iN, iW]) => {
				let input = (iW>=inputs.length)?1:inputs[iW];
				// Для градиента нужно умножать на производную функции активации
				// но это увеличивает время тренировки
				// на задаче XOR 47 => 50 итераций | 6 => 12 (разные параметры обучающего агента)
				return input * this.errors[iN] * derivates[iN];
			}));
		this.gradient_count ++;
		
		// calc errors for prev layer
		if ( this.prevLayer instanceof this.constructor ) {
			derivates = MDArray.create(inputs.length).fill(1);
			if ( this.prevLayer.activation && this.prevLayer.sums ) {
				derivates = this.prevLayer.activation(this.prevLayer.sums, true);
			}
			var errors = this.prevLayer.errors;
			for ( var i=0; i<inputs.length; i++ ) {
				errors[i] = this.weights.fetch(null, i)
					.pack()
					.multiply(this.errors)
					.sum() * derivates[i];
			}
		}
		
//		console.timeEnd('propagate_' + this.id);
	}
	
	updateWeights ( learningRate )
	{
//		console.time('updateWeights_' + this.id);
		if ( !this.gradient ) {
			return false;
		}
		
//		console.log(this.gradient);
		
		// neurons count
		let size = this.output.length,
			// inputs
			inputs = this.prevLayer.output;
		
		// Avg
//		this.gradient_count && this.gradient.multiply(1/this.gradient_count);

		// L2 regularization
		if ( this.l2_reg_rate ) {
			this.weights.add(( weight ) => {
				return -1 * this.l2_reg_rate * weight;
			});
		}
		this.weights.add(this.gradient.multiply(learningRate));
		/*
		this.weights.add(MDArray.create(size, inputs.length+1).fill(([iN, iW]) => {
			var g = this.gradient.at(iN, iW);
			return learningRate * g - .1*Math.abs(g)*g;
		}));
		*/
		
		// reset gradient
		this.gradient.fill(0);
		this.gradient_count = 0;
		
//		console.timeEnd('updateWeights_' + this.id);
		return true;
	}
	
	mutate ( rate )
	{
//		for ( let neuron of this.neurons ) {
//			if ( Math.random() < rate ) {
//				neuron.mutate(rate);
//			}
//		}
	}
	
}



module.exports = FCLayer;
module.exports.id = 'fc';