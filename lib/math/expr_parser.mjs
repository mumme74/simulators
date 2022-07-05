"use strict";

import { ParseInfo } from "../parser/parser.mjs";

// Order of precedence
/*
1. Parenthesization,
2. Factorial, (currently unsupported)
3. Exponentiation,
4. Multiplication and division,
5. Addition and subtraction.
*/

// grammar for a eqation or a algebra
export const mathExprGrm =
`start      = inequality | equation | expression;
 inequality = (equation | expression) , {ineqoper, (equation | expression)};
 equation   = expression, {'=', expression};
 expression = term;

 group       = '(', { expression }, ')';

 term        = factor, [{('+'|'-'), factor}];
 factor      = base, [{(mul|div), base}];
 base        = root | exponent | molecule;
 root        = [(float | integer)],'√', (exponent | molecule);
 exponent    = molecule, '^', (root | molecule);

 molecule = signed | unsigned;
 signed   = ('-'|'+') , (implmul | float | integer | variable | group);
 unsigned = implmul | float | integer | variable | group;
 implmul  = (float | integer), ({group} | {variable})
          | variable, ({group}| {variable} | float | integer)
          | group, {group | variable};
 integer  = {digit};
 float    = wholenum, decpoint, fracnum;
 wholenum = {digit};
 fracnum  = {digit};
 decpoint = ','|'.';

 ineqoper = notequal | '<' | '>' | lteq | gteq;
 mul      = "*"|"•";
 div      = "/"|"÷";
 notequal = "!="|"≠";
 lteq     = "<="|"≤";
 gteq     = ">="|"≥";
 variable = "a"|"b"|"c"|"d"|"e"|"f"|"g"|"h"|"i"|"j"|"k"|"l"|"m"|"n"
          | "o"|"p"|"q"|"r"|"s"|"t"|"u"|"v"|"w"|"x"|"y"|"z"
          | "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L"|"M"|"N"
          | "O"|"P"|"Q"|"R"|"S"|"T"|"U"|"V"|"W"|"X"|"Y"|"Z";
 digit    = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9";
`;
