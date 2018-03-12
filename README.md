# node-yann
Yet another neural network

This is my experiments in ML. Self made library and examples of usage.


## Usage

```javascript
var yann = require('path-to-lib/index');

// 3 inputs
// 10 neurons in hidden layer
// 3 neuron in output layer with [Softmax activation function](https://en.wikipedia.org/wiki/Softmax_function)
var net = new yann.Network([
	new yann.layers.Input(3), // Input layer
	new yann.layers.FullyConnected(10), // Fully connected layer
	new yann.layers.FullyConnected(3, { activation: 'softmax' }),
]);

// feed forward and get result
var result = net.activate([0,0,0]);
// result is MDArray
// Can be used as Float32Array or just converted to Array class by Array.from
console.log(Array.from(result)); // [ 0.0729035884141922, 0.42961910367012024, 0.49747729301452637 ]

// back propagate error
// network will calculate gradient
net.propagate([0,0,1]);

// update weights according to early calculated gradient
var learningRate = 0.1;
net.updateWeights(learningRate);

// propagate() will not affect without updateWeights(...)
```
