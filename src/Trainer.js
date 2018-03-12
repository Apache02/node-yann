

class Trainer
{
	constructor ( net )
	{
//		if ( !(net instanceof dl.Network) ) {
//			throw new Error('Arguments error: network required');
//		}
		this.net = net;
		
//		this.progressGain = .9;
//		this.errorAvgRate = 7;
		
		this.defaults = {
			rate: 0.1,
			iterations: 20000,
			error: 0.005,
			logEach: 100,
			log: null,
			batchSize: 1,
		};
	}
	
	// MSE
	loss ( target, result )
	{
		var error = 0,
			i = 0;
		for ( ; i<target.length; i++ ) {
			error += Math.pow(target[i] - result[i], 2);
		}
		return error / i;
	}
	
	activate ( input )
	{
		return this.net.activate(input);
	}
	
	propagate ( output, rate )
	{
		if ( this.net.propagate.length > 1 ) {
			return this.net.propagate(rate, output);
		}
		return this.net.propagate(output);
	}
	
	updateWeights ( learnRate )
	{
		learnRate && this.net.updateWeights && this.net.updateWeights(learnRate);
	}
	
	train ( data, options )
	{
		options = Object.assign({}, this.defaults, options);
		
		var stat = {
			iterations: 0,
			count: 0,
			error: 0,
		};
		let start = new Date();
		let batchCount = 0;
		let learnRate = options.rate;
		
		for ( ; stat.iterations<options.iterations; ) {
			
			let error = 0,
				i = 0;
			
			for ( ; i<data.length; i++ ) {
				let dataRow = data[i];
				let result = this.activate(dataRow.input);
				error += this.loss(dataRow.output, result);
				this.propagate(dataRow.output, options.rate);
				
				batchCount ++;
				
				if ( learnRate && batchCount >= options.batchSize ) {
					stat.count += batchCount;
					batchCount = 0;
					this.updateWeights(learnRate);
				}
			}
			
			
			stat.error = error/i;
			
			
			if ( !learnRate ) {
				// training is finished
				break;
			}
			
			stat.iterations ++;
			
			// logger
			options.log 
				&& !(stat.iterations % options.logEach)
				&& typeof options.log == 'function'
				&& options.log(stat);
			
			
			if ( stat.error < options.error ) {
				learnRate = 0;
				// process one more iteration with no weights update
				// update error and return result
				continue;
			}
		}
		
		stat.timeStart = start;
		stat.timeEnd = new Date();
		stat.elapsed = stat.timeEnd - stat.timeStart;
		
		return stat;
	}
}


module.exports = Trainer;