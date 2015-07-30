

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

    var rules = [{
        name:"exists",
        regex:/^(.*) exists$/,
        func:function(data,name){
            var bool = !(data[name] == undefined);
            return bool;
        }
    }];

    function register(name,regex,func){
        rules.push({
            name:name,
            regex:regex,
            func:func
        });
    }

    function validate(rules,data){
        var lines = rules.split("\n");

        //console.log("RULE Lines",lines);
        //console.log("DATA",data);

        return parse(lines,data);
    }

    function parse(lines,data,currentIndent){
        var result = 1;
        var processed = 0;
        currentIndent = currentIndent || 0;

        while(lines.length > 0){
            var indent = numberOfChar(lines[0]," ");

            // indent increased, so recurse to group results
            if(indent > currentIndent){
                result = processed && result && parse(lines,data,indent);
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
        var rule = identifyRule(input);
        var params = makeParameters(rule, input, data);
        var result = rule.func.apply(null,params);
        console.log("Running:",params,result);
        return result;
    }

    function identifyRule(input){
        var results = rules.filter(function(rule){
            return rule.regex.test(input);
        });
        console.log("Rule Match:", input, results[0]);
        // error if more that 1 match ?
        return results[0];
    }


    function makeParameters(rule, input, data){
        var params = rule.regex.exec(input);
        params.splice(0,1,data);
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

    return {
        registerRuleFunction:register,
        validate:validate
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