// Core/NPM Modules
const esprima = require("esprima");
const faker = require("faker");
const fs = require('fs');
const Random = require('random-js');
const _ = require('lodash');
const randexp = require('randexp');



// Set options
faker.locale = "en";
const options = { tokens: true, tolerant: true, loc: true, range: true };



// Create random generator engine
const engine = Random.engines.mt19937().autoSeed();


/**
 * Constraint class. Represents constraints on function call parameters.
 *
 * @property {String}                                                          ident      Identity of the parameter mapped to the constraint.
 * @property {String}                                                          expression Full expression string for a constraint.
 * @property {String}                                                          operator   Operator used in constraint.
 * @property {String|Number}                                                   value      Main constraint value.
 * @property {String|Number}                                                   altvalue   Constraint alternative value.
 * @property {String}                                                          funcName   Name of the function being constrained.
 * @property {'fileWithContent'|'fileExists'|'integer'|'string'|'phoneNumber'} kind       Type of the constraint.
 */
class Constraint {
    constructor(properties) {
        this.ident = properties.ident;
        this.expression = properties.expression;
        this.operator = properties.operator;
        this.value = properties.value;
        this.altvalue = properties.altvalue;
        this.funcName = properties.funcName;
        this.kind = properties.kind;
    }
}


/**
 * Generate function parameter constraints for an input file
 * and save them to the global functionConstraints object.
 *
 * @param   {String} filePath Path of the file to generate tests for.
 * @returns {Object}          Function constraints object.
 */
function constraints(filePath) {

    // Initialize function constraints directory
    let functionConstraints = {};

    // Read input file and parse it with esprima.
    let buf = fs.readFileSync(filePath, "utf8");
    let result = esprima.parse(buf, options);

    // Start traversing the root node
    traverse(result, function(node) {

        // If some node is a function declaration, parse it for potential constraints.
        if (node.type === 'FunctionDeclaration') {

            // Get function name and arguments
            let funcName = functionName(node);
            let params = node.params.map(function(p) { return p.name });

            // Initialize function constraints
            functionConstraints[funcName] = {
                constraints: _.zipObject(params, _.map(params, () => [])),
                params: params
            };

            // Traverse function node.
            traverse(node, function(child) {
                if (_.get(child, 'type') === 'BinaryExpression' && _.includes(['>=', '>', '<=', '<'], _.get(child, 'operator'))) {
                    if (_.get(child, 'left.type') === 'Identifier') {

                        // Get identifier
                        let ident = child.left.name;

                        // Get expression from original source code:
                        let expression = buf.substring(child.range[0], child.range[1]);
                        let rightHand = buf.substring(child.right.range[0], child.right.range[1]);

                        // Test to see if right hand is a string
                        let match = rightHand.match(/^['"](.*)['"]$/);

                        if (_.includes(params, _.get(child, 'left.name'))) {

                            // Push a new constraints
                            let constraints = functionConstraints[funcName].constraints[ident];
                            constraints.push(new Constraint({
                                ident: child.left.name,
                                value: parseInt(rightHand) + 1,
                                funcName: funcName,
                                kind: "integer",
                                operator: child.operator,
                                expression: expression
                            }));
                            constraints.push(new Constraint({
                                ident: child.left.name,
                                value: parseInt(rightHand) - 1,
                                funcName: funcName,
                                kind: "integer",
                                operator: child.operator,
                                expression: expression
                            }));
                        }
                    }
                }

                // Handle equivalence expression
                if (_.get(child, 'type') === 'BinaryExpression' && _.includes(['!=', '!==', '==', '==='], _.get(child, 'operator'))) {
                    if (_.get(child, 'left.type') === 'CallExpression') {

                        if (child.left.callee && child.left.callee.property.name == "indexOf") {
                            // Get identifier
                            let ident = child.left.callee.object.name;
                            let expression = buf.substring(child.range[0], child.range[1]);
                            // Push a new constraints
                            let constraints = functionConstraints[funcName].constraints[ident];
                            constraints.push(new Constraint({
                                ident: child.left.callee.object.name,
                                value: child.left.arguments[0].raw,
                                funcName: funcName,
                                kind: "string",
                                operator: child.operator,
                                expression: expression
                            }));
                            constraints.push(new Constraint({
                                ident: child.left.callee.object.name,
                                value: "NEQ-" + child.left.arguments[0].raw,
                                funcName: funcName,
                                kind: "string",
                                operator: child.operator,
                                expression: expression
                            }));
                        }





                    }
                }

                if (_.get(child, 'type') === 'BinaryExpression' && _.includes(['!=', '!==', '==', '==='], _.get(child, 'operator'))) {
                    if (_.get(child, 'left.type') === 'Identifier') {

                        // Get identifier
                        let ident = child.left.name;

                        // Get expression from original source code:
                        let expression = buf.substring(child.range[0], child.range[1]);
                        let rightHand = buf.substring(child.right.range[0], child.right.range[1]);

                        // Test to see if right hand is a string
                        let match = rightHand.match(/^['"](.*)['"]$/);

                        if (_.includes(params, _.get(child, 'left.name'))) {

                            // Push a new constraints
                            let constraints = functionConstraints[funcName].constraints[ident];
                            constraints.push(new Constraint({
                                ident: child.left.name,
                                value: rightHand,
                                funcName: funcName,
                                kind: "string",
                                operator: child.operator,
                                expression: expression
                            }));
                            constraints.push(new Constraint({
                                ident: child.left.name,
                                value: match ? `'NEQ - ${match[1]}'` : NaN,
                                funcName: funcName,
                                kind: "string",
                                operator: child.operator,
                                expression: expression
                            }));
                        }
                    }
                }

                // Handle fs.readFileSync
                if (child.type === "CallExpression" && child.callee.property && child.callee.property.name === "readFileSync") {

                    // Get expression from original source code:
                    let expression = buf.substring(child.range[0], child.range[1]);

                    for (let p in params) {
                        if (child.arguments[0].name === params[p]) {

                            // Get identifier
                            let ident = params[p];

                            // Push a new constraint
                            functionConstraints[funcName].constraints[ident].push(new Constraint({
                                ident: params[p],
                                value: "'pathContent/file1'",
                                funcName: funcName,
                                kind: "fileWithContent",
                                operator: child.operator,
                                expression: expression
                            }));
                            functionConstraints[funcName].constraints[ident].push(new Constraint({
                                ident: params[p],
                                value: "'pathContent/file2'",
                                funcName: funcName,
                                kind: "fileWithContent",
                                operator: child.operator,
                                expression: expression
                            }));
                        }
                    }
                }



                if (child.type == "CallExpression" &&
                    child.callee.property &&
                    child.callee.property.name == "existsSync") {
                    let expression = buf.substring(child.range[0], child.range[1]);
                    for (var p = 0; p < params.length; p++) {
                        let ident = params[p];
                        if (child.arguments[0].name == params[p]) {
                            functionConstraints[funcName].constraints[ident].push(
                                new Constraint({
                                    ident: params[p],
                                    value: "'emptyDir'",
                                    funcName: funcName,
                                    kind: "fileExists",
                                    operator: child.operator,
                                    expression: expression
                                }));
                            functionConstraints[funcName].constraints[ident].push(
                                new Constraint({
                                    ident: params[p],
                                    value: "'nonEmptyDir'",
                                    funcName: funcName,
                                    kind: "fileExists",
                                    operator: child.operator,
                                    expression: expression
                                }));
                        }
                    }
                }
                if (child.type == "UnaryExpression" && child.argument && child.argument.property && child.argument.property.type == "Identifier") {
                    let expression = buf.substring(child.range[0], child.range[1]);
                    let propertyName = child.argument.property.name;
                    let temp = {}
                    temp[propertyName] = 1
                        // let nullOptions = {};
                        // let trueOptions = {};
                        // trueOptions[propertyName] = true;
                        // let falseOptions = {};
                        // falseOptions[propertyName] = false;

                    let ident = child.argument.object.name;

                    functionConstraints[funcName].constraints[ident].push(
                        new Constraint({
                            ident: child.argument.object.name,
                            value: JSON.stringify(temp),
                            funcName: funcName,
                            kind: "Identifier",
                            operator: child.operator,
                            expression: expression
                        }));
                    functionConstraints[funcName].constraints[ident].push(
                        new Constraint({
                            ident: child.argument.object.name,
                            value: JSON.stringify({ propertyName: true }),
                            funcName: funcName,
                            kind: "Identifier",
                            operator: child.operator,
                            expression: expression
                        }));
                    functionConstraints[funcName].constraints[ident].push(
                        new Constraint({
                            ident: child.argument.object.name,
                            value: JSON.stringify({ propertyName: false }),
                            funcName: funcName,
                            kind: "Identifier",
                            operator: child.operator,
                            expression: expression
                        }));
                    functionConstraints[funcName].constraints[ident].push(
                        new Constraint({
                            ident: child.argument.object.name,
                            value: JSON.stringify({}),
                            funcName: funcName,
                            kind: "Identifier",
                            operator: child.operator,
                            expression: expression
                        }));
                }

                if (child.left && child.left.type && child.left.type == 'Identifier' && params.indexOf("phoneNumber") > -1) {
                    var expression = buf.substring(child.range[0], child.range[1]);
                    var rightHand = buf.substring(child.right.range[0], child.right.range[1]);

                    if (child.operator == "==" || child.operator == "!=") {
                        var rand = '-123-1234';
                        var rightNum = rightHand.substring(1, 4)
                        var phoneNum1 = rightNum + rand;


                        var phoneNum2 = (parseInt(rightNum) + 1).toString() + rand;



                        // To add phone number constraint
                        functionConstraints[funcName].constraints["phoneNumber"].push(
                            new Constraint({
                                ident: "phoneNumber",
                                value: "'" + phoneNum1 + "'",
                                funcName: funcName,
                                kind: 'phoneNumber',
                                operator: child.operator,
                                expression: expression
                            }));

                        functionConstraints[funcName].constraints["phoneNumber"].push(
                            new Constraint({
                                ident: "phoneNumber",
                                value: "'" + phoneNum2 + "'",
                                funcName: funcName,
                                kind: 'phoneNumber',
                                operator: child.operator,
                                expression: expression
                            }));



                    }

                }




            });

            // console.log( functionConstraints[funcName]);

        }
    });

    return functionConstraints;
}

/**
 * Traverse an object tree, calling the visitor at each
 * visited node.
 *
 * @param {Object}   object  Esprima node object.
 * @param {Function} visitor Visitor called at each node.
 */
function traverse(object, visitor) {

    // Call the visitor on the object
    visitor(object);

    // Traverse all children of object
    for (let key in object) {
        if (object.hasOwnProperty(key)) {
            let child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}


/**
 * Return the name of a function node.
 */
function functionName(node) {
    return node.id ? node.id.name : '';
}


/**
 * Generates an integer value based on some constraint.
 *
 * @param   {Number}  constraintValue Constraint integer.
 * @param   {Boolean} greaterThan     Whether or not the concrete integer is greater than the constraint.
 * @returns {Number}                  Integer satisfying constraints.
 */
function createConcreteIntegerValue(constraintValue, greaterThan) {
    if (greaterThan) return Random.integer(constraintValue + 1, constraintValue + 10)(engine);
    else return Random.integer(constraintValue - 10, constraintValue - 1)(engine);
}


// Export
module.exports = constraints;