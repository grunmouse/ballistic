var latex = require('latex-parser');
var fsp = require('@rakov/fs-promise');
var Stack = require('@rakov/stack');
var {Iterator, getOfIterable} = require('@rakov/iterable-iterator');

/*fsp.readFile('../../base/practic/sample.tex')
	.then((data)=>latex.latexParser.parse(data.toString()))
	.then((code)=>console.log(JSON.stringify(code,'',2)))
	.catch((e)=>(console.log(e.stack)));*/
	
var texToken = /(\\[A-Za-z]+|\\[^A-Za-z]|[_\^])|({)|(})|([^\\_\^])/g;

function parseTeXName(name){
	var stack = new Stack();
	stack.push([]);
	name.replace(texToken, (str, func, open, close, symbol)=>{
		if(func){
			stack.top.push({name:func, type:'function'});
		}
		else if(symbol){
			stack.top.push(symbol);
		}
		else if(open){
			stack.push([]);
		}
		else if(close){
			let arg = stack.pop();
			stack.top.push(arg);
		}
	});
	return stack.pop();
}

var texFunctionArgs = {
	"_":[1,0,1],
	"^":[1,0,1],
	"\\feta":[1],
	"\\dd":[2],
	"\\ch":[1]
};
function groupArguments(source){
	function handleFunction(name){
		let funspec = texFunctionArgs[name];
		let count = funspec ? funspec[0] : 0;
		let args = [];
		while(count){
			args.push(getArgument());
			--count;
		}
		return args;
	}
	function getArgument(){
		let pair = source.next();
		if(pair.done){
			throw new Error('Invalid arguments count!');
		}
		let arg = pair.value;
		if(arg.type == 'function'){
			arg.args = handleFunction(arg.name);
		}
		else if(arg instanceof Array){
			arg = groupCode(arg);
		}
		return arg;
	}
	
	return new Iterator(function(){
		var pair = source.next();
		if(!pair.done){
			let value = pair.value;
			if(value.type == 'function'){
				value.args = handleFunction(value.name);
			}
		}
		return pair;
	});
}
function groupContext(source){
	
	function isUseContext(value){
		return value && value.type=='function' && (texFunctionArgs[value.name]||[])[2] == 1;
	}
	return new Iterator(function(){
		let prevPair = source.next();
		if(prevPair.done){
			return prevPair;
		}
		let context = prevPair.value;
		let funcs = source.dowhile(isUseContext);
		for(let fn of funcs){
			fn.context = context;
			context = fn;
		}
		
		return {value:context};
	});
}

function groupCode(code){
	if(!(code instanceof Array)) return code;
	var itr = getOfIterable(code);
	var list = itr.pipe(groupArguments).pipe(groupContext);
	return list.toArray();
}



var toTeX = {
	__default:(item)=>(item.name),
	'_':(item, ev)=>(ev(item.context)+'_{'+ev(item.args[0])+'}'),
	'^':(item, ev)=>(ev(item.context)+'^{'+ev(item.args[0])+'}'),
};
var toVarName = {
	__default:(item)=>('$' + item.name.slice(1)),
	
}
let funToTex = (item, ev)=>(item.name+item.args.map((val)=>('{'+ev(val)+'}')).join(''));
for(let name in texFunctionArgs){
	if(!toTeX[name]){
		if(texFunctionArgs[name][1]>0){
			toTeX[name] = funToTex;
		}
	}
}

function stringify(code, funcs){
	let ev = (code)=>(stringify(code, funcs));
	if(!code.map) code = [code];
	return code.map((item)=>{
		if(item.name){
			let func = funcs[item.name] || funcs.__default;
			return func(item, ev, funcs);
		}
		else if(item.map){
			return ev(map);
		}
		else if(typeof item !== 'string'){
			return item.toString();
		}
		else{
			return item;
		}
	}).join('');
}

var varnames =[
	"N_{a,b,c}",
	"f_{\\eta\\nu}",
	"U_{x,0}",
	"V_0",
	"V_\\downarrow",
	"\\feta{0}",
	"\\ch{\\eta_{max}}",
	"a_{trg}^{-1}",
	"\\dd{\\nu_0}{V_\\downarrow}",
	"\\dd{\\nu_0}{V_\\downarrow} = a_{trg}^{-1} + \\feta{0}\\ch{\\eta_{max}}"
];

let token = parseTeXName(varnames[9]);
//console.log(JSON.stringify(token));
let fns = groupCode(token);console.log(JSON.stringify(fns,'',2));