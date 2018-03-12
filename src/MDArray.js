

class MDCoords extends Array
{
	constructor ()
	{
		super(...arguments);
		this._sizes = [];
	}
	set sizes ( val )
	{
		this._sizes = val;
	}
	get sizes ()
	{
		return this._sizes;
	}
	
	get index ()
	{
		var index = 0;
		var index_accumulate = 1;
		for ( var dim_index=0; dim_index < this.length; dim_index++ ) {
			index += index_accumulate * this[dim_index];
			index_accumulate *= this._sizes[dim_index];
		}
		return index;
	}
	set index ( val )
	{
		this.fill(0);
		var index_accumulate = 1;
		for ( var i=0; i<this._sizes.length-1; i++ ) {
			index_accumulate *= this._sizes[i];
		}
		for ( var i=this._sizes.length-1; i>=0; i-- ) {
			this[i] = parseInt(val/index_accumulate);
			val %= index_accumulate;
			if ( !i ) {
				break;
			}
			index_accumulate /= this._sizes[i-1];
		}
	}
	
	next ()
	{
		var overflow = false;
		this[0] ++;
		for ( var i=0; i<this._sizes.length; i++ ) {
			if ( this[i] >= this.sizes[i] ) {
				this[i] %= this.sizes[i];
				if ( i == this.sizes.length-1 ) {
					overflow = true;
				} else {
					this[i + 1] ++;
				}
			}
		}
		return !overflow;
	}
	
	static from ( arr )
	{
		var coords = null;
		if ( arr instanceof MDArray ) {
			coords = new MDCoords(arr.sizes.length);
			coords.sizes = arr.sizes;
			if ( (arguments[1] instanceof Array) && arguments[1].length == coords.length ) {
				[...coords] = [...arguments[1]];
			} else {
				coords.fill(0);
			}
		} else if ( arr instanceof Array ) {
			coords = new MDCoords(arr.length);
			for ( var i=0; i<arr.length; i++ ) {
				coords[i] = arr[i];
			}
			if ( arr instanceof MDCoords ) {
				coords.sizes = arr.sizes;
			}
		}
		if ( !coords ) {
			throw new Error('Arguments error: unsupported argument type');
		}
		return coords;
	}
	
	inspect ()
	{
		return Array.from(this);
	}
}


class MDArray extends Float32Array
{
	constructor ()
	{
		super(...arguments);
		this._sizes = [this.length];
	}
	
	set sizes ( val )
	{
		this._sizes = val;
	}
	
	get sizes ()
	{
		return this._sizes;
	}
	
	
	static create ( ...sizes )
	{
		if ( sizes.length == 0 ) {
			throw new Error('Arguments error: dimensions not defined [' + sizes + ']');
		}
		var l = sizes.reduce(( l, dim_size ) => {
			if ( typeof dim_size != 'number' || dim_size%1 || dim_size < 1 ) {
				throw new Error('Arguments error: size must be an array of numbers > 0');
			}
			return l * dim_size;
		}, 1);
		
		var result = new MDArray(l);
		result.sizes = sizes;
		return result;
	}
	
	coordsToIndex ( coords )
	{
		let index = 0,
			dim_count = coords.length,
			dim_sizes = this.sizes,
			dim_multi = 1;
			
		for ( var i=0; i<dim_count; i++ ) {
			index += coords[i] * dim_multi;
			dim_multi *= dim_sizes[i];
		}
		return index;
	}
	
	indexToCoords ( index )
	{
		var c = MDCoords.from(this);
		c.index = index;
		return c;
	}
	
	at ( ...coords )
	{
		if ( coords.length != this.sizes.length ) {
			throw new Error('Arguments error: dimensions counts not equals');
		}
		return this[this.coordsToIndex(coords)];
	}
	
	fill ( val )
	{
		if ( typeof val == 'number' ) {
			return Array.prototype.fill.call(this, val);
		}
		
		let type = 0;
		if (
			val instanceof Array
			|| val instanceof Float32Array
			|| val instanceof Float64Array
			|| val instanceof Int32Array
			|| val instanceof Int16Array
			|| val instanceof Int8Array
		) {
			type = 1;
		} else if ( typeof val == 'function' ) {
			type = 2;
		} else {
			console.log(val);
			throw new Error('Arguments error: val must be a numebr, function or array');
		}
		
		// compare arrays length
		if ( type == 1 ) {
			if ( val.length != this.length ) {
				throw new Error('Wrong array length');
			}
		}
		
		var i = 0,
			coords = this.indexToCoords(i);
		for ( var i=0; i<this.length; i++ ) {
			var realValue = val;
			switch ( type ) {
				case 1:
					realValue = val[i];
					break;
				case 2:
					realValue = val(coords);
					coords.next();
					break;
			}
			if ( realValue.value ) {
				realValue = realValue.value;
			}
			
			if ( typeof realValue != 'number' ) {
				throw new Error('Value error: must be a number');
			}
			
			this[i] = realValue;
		}
		
		return this;
	}
	
	fetch ( ...coords )
	{
		var sizes = Array.from(this.sizes).map((val, i) => {
			return coords[i] == null ? val : 1;
		})
		var arr = MDArray.create(...sizes);
		for ( var i=0; i<arr.length; i++ ) {
			var coords2 = arr.indexToCoords(i);
			// fix coords
			for ( var j=0; j<coords2.length; j++ ) {
				if ( coords[j] != null ) {
					coords2[j] = coords[j];
				}
				arr[i] = this.at(...coords2);
			}
		}
		return arr;
	}
	
	pack ()
	{
		// modify sizes, find all dimensions with length 1 and delete them
		this.sizes = this.sizes.filter(size => size > 1);
		if ( !this.sizes[0] ) {
			this.sizes[0] = 1;
		}
		return this;
	}
	
	sum ( start = 0 )
	{
		return start + this.reduce((a, b) => a + b);
	}
	
	multiply ( arr )
	{
		let l = this.length,
			i = 0;
		if ( (arr instanceof Float32Array) || (arr instanceof Array) ) {
			if ( arr.length != l ) {
				throw new Error('Sizes error');
			}
			for ( i=0; i<l; i++ ) {
				this[i] *= arr[i];
			}
		} else if ( typeof arr == 'number' ) {
			for ( i=0; i<l; i++ ) {
				this[i] *= arr;
			}
		} else {
			throw new Error("Arguments type error: array or number required (" + (typeof arr) + ")");
		}
			
		return this;
	}
	
	add ( arr )
	{
		let l = this.length,
			i = 0;
		if ( (arr instanceof Float32Array) || (arr instanceof Array) ) {
			if ( arr.length != l ) {
				throw new Error('Sizes error');
			}
			for ( i=0; i<l; i++ ) {
				this[i] += arr[i];
			}
		} else if ( typeof arr == 'number' ) {
			for ( i=0; i<l; i++ ) {
				this[i] += arr;
			}
		} else if ( typeof arr == 'function' ) {
			this[i] += arr(this[i]);
		} else {
			throw new Error("Arguments type error: array or number required (" + (typeof arr) + ")");
		}
		return this;
	}
	
	map ( func )
	{
		var tmp = this.constructor.create(...this.sizes);
		for ( let i=0; i<this.length; i++ ) {
			tmp[i] = func(this[i], i, this);
		}
		return tmp;
	}
	
}





MDArray.Coords = MDCoords;

module.exports = MDArray;