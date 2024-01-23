(function(){

const Exp = {};
let MakeTreeFromXml;

const platformIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const platformIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');

if (platformIsNode && !platformIsBrowser) {
	MakeTreeFromXml = (xml) => new require('jsdom').JSDOM(xml);
}

if (platformIsBrowser) {
	MakeTreeFromXml = (xml) => new DOMParser().parseFromString(xml, 'text/xml');
}

Exp.Trasformapi = (transformerXml, initOptions={}) => {
	var transformerTree = MakeTreeFromXml(transformerXml);
	return {
		TransformForInput: (entityName, upstreamName, dataIn, transformOptions) => _TransformForInput(transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions),
		TransformForOutput: (entityName, upstreamName, dataIn, transformOptions) => _TransformForOutput(transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions),
	};
}

function _TransformForInput (transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions={}) {
	// TODO: restructure prototype
	// TODO: make the propDataType inside this function, for both main and secondary
	function temp1 (upstreamName, propName, propType, propDataType, propContent, dataIn, dataOut, propNameSecondary, propTypeSecondary, propDataTypeSecondary) {
		// const propDataType = 
		// const propDataTypeSecondary = 
		const dataKey = propContent.getAttribute('key');
		//console.log(propName, propType, propDataType, propContent, dataIn, dataOut, propNameSecondary, propTypeSecondary, propDataTypeSecondary)
		// TODO: inside here somehow happens the array error with prop > content > prop nestings, probably we need to handle secondary and primary types separately
		const dataAttr = propContent.getAttribute('attr');
		let dataInContent;
		if (dataIn instanceof Node) {
			// TODO: 'document' won't work on nodejs, must change it
			//const dataNode = document.evaluate(dataKey, dataIn, ((ns) => ns), XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			//dataInContent = (dataAttr ? dataNode?.getAttribute(dataAttr) : dataNode?.textContent);
			// TODO: finish this to actually handle arrays properly (even below)
			const dataNodes = getElementsByXPath(dataKey, dataIn);
			if (!Array.isArray(propDataTypeSecondary || propDataType) && dataNodes.length > 0) {
				dataInContent = (dataAttr ? dataNodes[0].getAttribute(dataAttr) : dataNodes[0].textContent);
			} else {
				dataInContent = [];
				for (const dataNode of dataNodes) {
					// ... TODO push every item //dataInContent = (dataAttr ? dataNode?.getAttribute(dataAttr) : dataNode?.textContent);
					dataInContent.push(dataAttr ? dataNodes[0].getAttribute(dataAttr) : dataNodes[0].textContent);
				}
			}
		} else {
			dataInContent = (dataKey ? _.get(dataIn, dataKey) : dataIn);
		}
		//const dataInContent = (dataIn instanceof Node
		//	? (document.evaluate(dataKey, dataIn, (ns) => ns, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || {}
		//		)['getAttribute' || 'textContent'](dataAttr)
		//	: (dataKey ? _.get(dataIn, dataKey) : dataIn));
		// TODO: make this readable lmao
		// TODO: make no type mean any/object type and remove the distinction maybe
		// TODO: readd type casting
		const result = (["any", "object", "string", "number", "int", "float"].includes(propTypeSecondary || propType)
			? SetOrPush(dataInContent, (propDataTypeSecondary || propDataType))
		//	? SetOrPush((["any", "object"].includes(propType)
		//		? dataInContent
		//		: { int: parseInt, float: parseFloat, string: String, number: Number }[propType](dataInContent)
		//	), propDataType)
			: SetOrPush(MakeApiEntityObject((propTypeSecondary || propType), upstreamName, dataInContent), (propDataTypeSecondary || propDataType)));
		!propNameSecondary ? (dataOut[propName] = result) : (dataOut[propName][propNameSecondary] = result);
	}
	function MakeApiEntityObject (entityName, upstreamName, dataIn) {
		let dataOut = {};
		const entitySchema = transformerTree.querySelector(`:scope > entity[name="${entityName}"]`);
		for (const propSchema of entitySchema.querySelectorAll(':scope > prop')) {
			const propName = propSchema.getAttribute('name');
			const propType = propSchema.getAttribute('type').split('[]')[0];
			const propDataType = (propSchema.getAttribute('type').endsWith('[]') ? [] : {});
			const propContent = propSchema.querySelector(`:scope > content[upstream="${upstreamName}"]`);
			if (!propContent) {
				// property is not implemented for the current upstream, skip it
				continue;
			}
			const propContentChildren = propContent.querySelectorAll(`:scope > prop`); // TODO
			if (propContentChildren.length === 0) {
				//const dataKey = propContent.getAttribute('key');
				//const dataAttr = propContent.getAttribute('attr');
				//const dataInContent = (dataIn instanceof Node
				//	// TODO: 'document' won't work on nodejs, must change it
				//	? (document.evaluate(dataKey, dataIn, (ns) => ns, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue || {}
				//	)[dataAttr || 'textContent']
				//	: (dataKey ? _.get(dataIn, dataKey) : dataIn));
				//dataOut[propName] = (["string", "number", "int", "float"].includes(propType)
				//	? SetOrPush(dataInContent, propDataType)
				//	: SetOrPush(MakeApiEntityObject(propType, upstreamName, dataInContent), propDataType));
				temp1(upstreamName, propName, propType, propDataType, propContent, dataIn, dataOut);
			} else {
				dataOut[propName] = {}; // should this be an array in some cases or not?
				// TODO: wrap this and the above in a function, to allow for code reuse, right now the else condition does less things than what it should because of the duplication
				for (const propChildSchema of propContentChildren) {
					const entityChildSchema = transformerTree.querySelector(`:scope > entity[name="${propType}"]`);
					const propChildName = propChildSchema.getAttribute('name');
					const propChildProp = entityChildSchema.querySelector(`:scope > prop[name="${propChildName}"]`);
					const propChildType = propChildProp.getAttribute('type').split('[]')[0];
					const propChildDataType = (propChildProp.getAttribute('type').endsWith('[]') ? [] : {}); 
					//const childDataKey = propChildSchema.getAttribute('key');
					//const childDataInContent = childDataKey ? _.get(dataIn, childDataKey) : dataIn;
					//dataOut[propName][propChildName] = (["string", "number", "int", "float"].includes(propChildType)
					//	? SetOrPush(childDataInContent, propDataType)
					//	: null); // TODO other recursions? //SetOrPush(MakeApiEntityObject(propType, upstreamName, childDataInContent), childDataInContent));
					temp1(upstreamName, propName, propType, propDataType, propChildSchema, dataIn, dataOut, propChildName, propChildType, propChildDataType);
				}
			}
		}
		//console.log(dataOut);
		return dataOut;
	}
	return MakeApiEntityObject (entityName, upstreamName, dataIn);
}

function _TransformForOutput (transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions={}) {
	// TODO
}

// <https://stackoverflow.com/questions/36303869/how-to-use-document-evaluate-and-xpath-to-get-a-list-of-elements/42600459#42600459>
// TODO: 'document' won't work on nodejs, must change it
function getElementsByXPath (xpath, parent) {
	let results = [];
	let query = document.evaluate(xpath, parent || document, ((ns) => ns), XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (let i=0, length=query.snapshotLength; i<length; ++i) {
		results.push(query.snapshotItem(i));
	}
	return results;
}

const SetOrPush = (item, dest) => Array.isArray(dest) ? [...dest, item] : item;

if (platformIsNode) module.exports = Exp;
if (platformIsBrowser) window.Trasformapi = Exp.Trasformapi;

})();
