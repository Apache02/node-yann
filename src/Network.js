var Layer			= require('./Layer');
var layers_list		= require('./layers/index');

class Network
{
	constructor ( layers )
	{
		if ( !(layers instanceof Array) ) {
			throw new Error('Argument error: layers must be an array');
		}
		this.layers = layers;
		
		this._validate();
		
		var prevLayer = null;
		for ( var i=0; i<layers.length; i++ ) {
			layers[i].init(prevLayer);
			prevLayer = layers[i];
		}
	}
	
	_validate ()
	{
		for ( var layer of this.layers ) {
			if ( !(layer instanceof Layer) ) {
				throw new Error('Not an instance of Layer');
			}
		}
	}
	
	activate ( input )
	{
		for ( var layer of this.layers ) {
			input = layer.activate(input);
		}
		
		return layer.output;
	}
	
	propagate ( target, layerIndex = -1 )
	{
		let tmp = target;
		for ( var i=this.layers.length + layerIndex; i>0; i-- ) {
			this.layers[i].propagate(tmp);
			tmp = null;
			if ( this.layers[i].target != undefined ) {
				tmp = this.layers[i].target;
			}
		}
	}
	
	updateWeights ( learningRate )
	{
		for ( var layer of this.layers ) {
			layer.updateWeights && layer.updateWeights(learningRate);
		}
	}
	
	/*
	mutate ( rate )
	{
		for ( let i=0; i<this.layers.length; i++ ) {
			let layer = this.layers[i];
			layer.mutate && layer.mutate(rate);
		}
	}
	*/
	
	toJSON ()
	{
		var json = {
			layers: [],
		};
		for ( let layer of this.layers ) {
			json.layers.push(layer.toJSON());
		}
		return json;
	}
	
	static fromJSON ( json )
	{
		var layers = new Array();
		for ( var layer of json.layers ) {
			let layer_class = Object.values(layers_list).find(l => {
				return l.id == layer.id;
			});
			if ( layer_class ) {
				layer = new layer_class(... layer.create);
				layers.push(layer);
			} else {
				throw new Error('Layer "' + layer.id + '" is not found');
			}
		}
		var net = new Network(layers);
		// fill memory
		for ( var i=0; i<layers.length; i++ ) {
			if ( json.layers[i].weights ) {
				net.layers[i].weights.fill(json.layers[i].weights);
			}
		}
		return net;
	}
	
}


Network.loss = {
	MSE: function ( target, output, derivate = false ) {
		var error = 0;
		for ( var i = 0; i < output.length; i++ ) {
			error += Math.pow(target[i] - output[i], 2);
		}
		return error / output.length; 
	},
	
};




module.exports = Network;