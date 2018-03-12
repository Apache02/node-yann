var MDArray		= require('./../MDArray');
var Layer		= require('./../Layer');


class InputLayer extends Layer
{
	constructor ( ...sizes )
	{
		super(...sizes);
	}
	
	activate ( input )
	{
		if ( input.length != this.output.length ) {
			throw new Error('Input size error');
		}
		this.output.fill(input);
		return this.output;
	}
}



module.exports = InputLayer;
module.exports.id = 'input';