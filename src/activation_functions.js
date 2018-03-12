
// input = input vector
function softmax ( input, derivate = false )
{
	var sum = input.map(Math.exp).reduce((a, b) => a + b);
	return input.map((x) => {
		var ex = Math.exp(x);
		if ( derivate ) {
			return ((sum - ex)*ex) / (sum*sum);
		}
		return ex / sum;
	});
}


// helper function generator
function from_one ( func )
{
	var f = function ( input, derivate = false ) {
		return input.map((x) => f.one(x, derivate));
	};
	f.one = func;
	Object.defineProperty(f, 'name', {
		value: func.name,
	})
	return f;
}

// sigmoid
var logistic = from_one(function logistic ( x, derivate = false ) {
	var fx = 1 / (1 + Math.exp(-x));
	if ( derivate ) {
		return fx * (1 - fx);
	}
	return fx;
});

// Relu
var relu = from_one(function relu ( x, derivate = false ) {
	if ( derivate ) {
		return x > 0 ? 1 : 0;
	}
	return Math.max(x, 0);
});

// Linear
var linear = from_one(function linear ( x, derivate = false ) {
	return derivate ? Math.sign(x) : x;
});

// hyperbolic tangent
var tanh = from_one(function tanh ( x, derivate = false ) {
	if (derivate) {
		return 1 - Math.pow(Math.tanh(x), 2);
	}
	return Math.tanh(x);
});


module.exports = {
	softmax,
	logistic,
	tanh,
	relu,
	linear,
};