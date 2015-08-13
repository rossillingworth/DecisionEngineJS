
/**
 * A rule is composed of a set of conditions (& boolean logic)
 * If the conditions for the rule evaluate as true, the Rule passes (returns true)
 *
 * ie: when all the condition are correct, the rule evaluates to TRUE
 */

// parse rules
// if THEN, run it and return response
// else return TRUE/FALSE

// rules are made of multiple patterns
// state controlled by WHEN / THEN / OR / indent

/**
 /^(.*) exists$/.exec("asssdesw exists") >>> Array [ "asssdesw exists", "asssdesw" ]
 "\t\tsomething".split(/[^\t]/)[0].length;
 */


var decisionEngine = function(){

    var conditions = {
        "exists":{
            name:"exists",
            regex:/^(\w*)( not)? exists$/,
            func:function(data,name,not){
                var bool = !(data[name] == undefined);
                bool = not?!bool:bool;
                return bool;
            }
        }
    };

    var rules = [{}];

    function registerCondition(name,regex,func){
        conditions[name] = {
            name:name,
            regex:regex,
            func:func
        };
    }

    function registerRule(name,queueName,func){
        var compiledFuncString = compileRuleSetFunction(func);

        rules.push({
            name:name,
            regex:queueName,
            func:func,
            compiledFunc:null
        });
    }

    function compileRuleSetFunction(func){
        var output = ["function(data){"];
        var lines = func.split("\n");
        var currentIndent = 0;
        var endLoop = false;
        var thenUsed = false;

        debugger;

        lines.forEach(function(line){

            debugger;

            if(endLoop)return;

            // handle brackets open/close first
            var indent = numberOfChar(line," ");
            if(indent != currentIndent){
                while(indent > currentIndent){
                    currentIndent++;
                    output.push("(");
                }
                while(indent < currentIndent){
                    currentIndent--;
                    if(output[output.length-1] == "&&")output.pop();
                    output.push(")");
                    output.push("&&");
                }
            }

            // now handle contents

            line = line.trim();
            switch (line){
                case "WHEN":
                    output.push("if(")
                    break;
                case "AND":
                    output.push("&&")
                    break;
                case "OR":
                    if(output[output.length-1] == "&&")output.pop();
                    output.push("||")
                    break;
                case "THEN":
                    if(output[output.length-1] == "&&")output.pop();
                    output.push("){ return")
                    thenUsed = true;
                    break;
                case "END":
                    if(output[output.length-1] == "&&")output.pop();
                    output.push("){return true;}");
                    endLoop = true;
                    break;
                case "":
                    break
                default:
                    if(line.charAt(0)!="#"){
                        // get ruleName && params
                        var ruleName = identifyRuleName(line);
                        var params = extractParameters(conditions[ruleName],line);
                        var s = "conditions['"+ruleName+"'].call(null,data,"+ paramsToStrings(params).toString()+")";
                        output.push(s)
                        output.push("&&");
                    }

            }

        });

        if(output[output.length-1] == "&&")output.pop();

        // add } to finish then
        if(thenUsed)output.push("}");
        // close function
        output.push("}");

        console.log(output);
        console.log(output.join("\n"));

        return output.join(" ");

    }

    function paramsToStrings(params){
        return params.map(function(param){
            return "'" + param + "'";
        });
    }

    function validate(ruleSet,data){
        var lines = ruleSet.split("\n");

        //console.log("RULE Lines",lines);
        //console.log("DATA",data);

        return parse(lines,data);
    }

    function parse(lines,data,currentIndent){
        var result = 1;
        var processed = 0;
        currentIndent = currentIndent || 0;

        debugger;

        while(lines.length > 0){
            var indent = numberOfChar(lines[0]," ");

            // indent increased, so recurse to group results
            if(indent > currentIndent){
                result = parse(lines,data,indent) && processed && result;
            }

            // indent reduced: return current state
            if(indent < currentIndent){
                return processed && result;
            }

            if(indent == currentIndent){
                var line = lines.shift();
                line = line.trim();

                switch (line){
                    case "WHEN":
                        result = parse(lines,data,indent + 1);
                        processed = 1;
                        break;
                    case "AND":
                        break;
                    case "OR":
                        if(processed && result) return (processed && result);
                        result = 1;
                        processed = 0;
                        break;
                    case "THEN":
                        // this allows us to override result
                        return result && parse(lines, data, currentIndent + 1);
                        break;
                    case "END":
                        return processed && result;
                        break;
                    case "":
                        break
                    default:
                        if(line.charAt(0)!="#"){
                            var r = processLine(line,data);
                            processed = 1;
                            result = result && r;
                        }
                }
            }

        }
        return processed && result;
    }

    function processLine(input,data){
        var ruleName = identifyRuleName(input);
        var rule = conditions[ruleName];
        var params = extractParameters(rule, input);
        console.log("Calling:",ruleName,"with:",params);
        var result = rule.func.apply(null,[data].concat(params));
        console.log("Result:",result);
        return result;
    }

    function identifyRuleName(input){
        for(propName in conditions){
            if(conditions.hasOwnProperty(propName)){
                if(conditions[propName].regex != undefined && conditions[propName].func != undefined){
                    if(conditions[propName].regex.test(input)){
                        console.log("Rule Match:", input, conditions[propName]);
                        return propName;
                    }
                }
            }
        }
    }


    function extractParameters(rule, input){
        var params = rule.regex.exec(input);
        params.splice(0,1);
        return params;
    }


    function numberOfChar(text,char) {
        var count = 0;
        var index = 0;
        while (text.charAt(index++) == char) {
            count++;
        }
        return count;
    }

    function runRule(name,data){

    }

    return {
        registerRuleFunction:registerCondition,
        registerRuleSet:registerRule,
        validate:validate,
        runRule:runRule,
        runRules:runRules
    }
}();

//
// WHEN
//      myField exists
//      myField > 100

// start
// register patterns

// parsing
// turn text file into an array
//
// read first line
// if WHEN, clear state
// LOOP: get next line
// count indents, compare to current
// if more, recurse
// if less, return state
//
// foreach rule: match pattern against LINE
// if one matches: extract params, run function with params
// capture result
// result && new result


//function(data){
//    if(
//        (
//            rules['exists'].call(null,data,'myField','undefined')
//            &&
//            rules['exists'].call(null,data,'myField3',' not')
//            &&
//            rules['greaterThan'].call(null,data,'myField','30')
//            ||
//            rules['lessThan'].call(null,data,'myField','100')
//            &&
//            (
//                rules['equals'].call(null,data,'myField','20')
//                ||
//                rules['equals'].call(null,data,'myField','21')
//            )
//            &&
//            rules['equals'].call(null,data,'myField2','foo')
//        )
//    ){ return
//        (
//            rules['sayHello'].call(null,data,)
//        )
//    }
//}