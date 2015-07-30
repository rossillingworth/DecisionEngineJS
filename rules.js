

// parse rules
// if THEN, run it and return response
// else return TRUE/FALSE

// rules are made of multiple patterns
// state controlled by WHEN / THEN / OR / indent

/**
 /^(.*) exists$/.exec("asssdesw exists") >>> Array [ "asssdesw exists", "asssdesw" ]
 "\t\tsomething".split(/[^\t]/)[0].length;
 */


var ruleEngine = function(){

    var patterns = [{
        name:"exists",
        regexPattern:/^(.*) exists$/,
        func:function(data,name){
            var bool = !(data[name] == undefined);
            return bool;
        }
    },{
        name:"greater than",
        regexPattern:/^(.*) > (.*)$/,
        func:function(data,x,y){
            var bool = data[x] > y;
            return bool;
        }
    }];

    function registerPattern(name,regexPattern,func){
        patterns.push({
            name:name,
            regexPattern:regexPattern,
            func:func
        });
    }

    function runRule(rule,dataString){
        var lines = rule.split("\n");
        var data = JSON.parse(dataString);
        console.log("RULE Lines",lines);
        console.log("DATA",data);
        runLines(lines,data);
    }

    function runLines(lines,data,currentIndent){
        var result = 1;
        var processed = 0;
        currentIndent = currentIndent || 0;

        while(lines.length > 0){
            var line = lines.shift();
            var indent = numberOfTabs(line);
            if(indent == currentIndent){
                line = line.trim();

                switch (line){
                    case "WHEN":
                        //result = 0;
                        break;
                    case "OR":
                        //result = 0;
                        break;
                    case "THEN":
                        console.log("THEN",result);
                        //result = 0;
                        break;
                    case "":
                        break
                    default:
                        processed = 1;
                        var r = processLine(line,data);
                        result = result && r;
                }
            }
            if(indent > currentIndent){
                lines.unshift(line);
                console.log(">>>>>>>");
                result = result && runLines(lines,data,indent);
                console.log("<<<<<<<");
            }
            if(indent < currentIndent){
                lines.unshift(line);
                return result && processed;
            }
        }
    }

    function processLine(lineString,data){
        var tuple = findFuncForDSL(lineString);
        var params = tuple.regexPattern.exec(lineString);
        params.shift();
        params.unshift(data);
        var result = tuple.func.apply(null,params);
        console.log("INFO",tuple,params,result);
        return result;
    }

    function findFuncForDSL(dslString){
        var pattern = patterns.filter(function(p){
            return p.regexPattern.test(dslString);
        });
        console.log("String",dslString);
        console.log("Pattern",pattern[0]);

        return pattern[0];
    }

    function numberOfTabs(text) {
        var count = 0;
        var index = 0;
        while (text.charAt(index++) === "\t") {
            count++;
        }
        return count;
    }

    return {
        registerPattern:registerPattern,
        run:runRule
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