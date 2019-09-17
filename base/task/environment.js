/**
 * @param t - температура цельсия °С
 * @param p - атмосферное давление гПа
 * @param fi - относительнся влажность %
 */
function rho(t, p, fi){
	var T = t+ 273.15;
	var p_sat = 6.1078 * Math.pow(10, (7.5 * T - 2048.625)/(T - 35.85) + 2);
	var p_v = fi/100 * p_sat;
	var p_d = p*100 - p_v;
	var R_d = 287.058, R_v = 461.495;
	
	return (p_d/R_d + p_v/R_v)/T;
}


function Pa(mm){
	return mm/760*101325
}

function k(rho, g){
	return Math.sqrt(2*g/rho);
}

console.log(3.7576*5.6777,  4.3365*6.3172)