var v = function(req,input,err,onComplete,next){
	try {   
		if((input.minMax > 5)) throw "Value must be greater than 5";
		if((input.minMax < 100)) throw "Value must be less than 100";

		if((input.array.indexOf(["red","blue","green"])!=-1)) throw "Valid values are: red, blue, green";

		if((input.object.indexOf(["R","B","G"])!=-1)) throw "Valid values are: R, B, G";


	} catch(e){ return onComplete(e); } 
	next(); 
}
