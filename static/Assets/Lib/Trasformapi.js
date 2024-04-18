(function(){

// NOTE: using defiant.js gives us '[undefined]' arrays instead of '[]' ones sometimes, should be fixed

const Exp = {};
let MakeTreeFromXml;

const platformIsNode = (typeof module === 'object' && typeof module.exports === 'object');
const platformIsBrowser = (typeof window !== 'undefined' && typeof window.document !== 'undefined');

if (platformIsNode && !platformIsBrowser) {
	MakeTreeFromXml = (xml) => new require('jsdom').JSDOM(xml);
	// TODO load all other dependencies
}

if (platformIsBrowser) {
	MakeTreeFromXml = (xml) => new DOMParser().parseFromString(xml, 'text/xml');
}

Exp.Trasformapi = (transformerXml, initOptions={}) => {
	var transformerTree = MakeTreeFromXml(transformerXml);
	initOptions.sets ||= {};
	for (const attr of transformerTree.querySelector(':scope > set')?.attributes) {
		initOptions.sets[attr.name] = attr.value;
	}
	return {
		TransformForInput: (entityName, upstreamName, dataIn, transformOptions) => _TransformForInput(transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions),
		TransformForOutput: (entityName, upstreamName, dataIn, transformOptions) => _TransformForOutput(transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions),
	};
}

function _TransformForInput (transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions={}) {
	const globalSets = { ...initOptions.sets, ...transformOptions.sets };
	// due to 2 bugs in defiant, we need to rename json keys
	// <https://stackoverflow.com/questions/68903102/renaming-object-keys-which-are-nested/68903897#68903897>
	function JsonObjectKeysFix (obj) {
		// TODO avoid collisions? (even if they're unlikely with what we're doing)
		return (obj !== undefined && obj !== null ? Object.fromEntries(Object.entries(obj).map( ([key,value]) => {
			key = key.replaceAll(':', '_'); // avoid "XML Parsing Error: prefix not bound to a namespace" on Firefox
			if (key.startsWith('@')) {
				// prefix any key starting with '@' with a character
				key = `_${key}`
			};
			return typeof value == "object"
				? [key, JsonObjectKeysFix(value)]
				: [key, value]
		})) : obj);
	}
	function MakeApiEntityObject (entityName, upstreamName, dataIn) {
		if (!dataIn) {
			// nothing to do
			return;
		};
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
			const propContentChildren = propContent.querySelectorAll(`:scope > prop`);
			if (propContentChildren.length === 0) {
				const dataKey = SubstituteStringSets(propContent.getAttribute('query'), globalSets);
				const dataInContent = (dataIn instanceof Node
					? GetElementsByXPath(dataKey, dataIn)[0]?.textContent
					: (dataKey ? /*_.get*/defiant.search(dataIn, dataKey)[0] : dataIn)
				);
				// I don't know if this is fully correct
				if (Array.isArray(propDataType) && Array.isArray(dataInContent)) {
					for (const itemContent of dataInContent) {
						dataOut[propName] = (["string", "number", "int", "float"].includes(propType)
							? SetOrPush(itemContent, propDataType)
							: SetOrPush(MakeApiEntityObject(propType, upstreamName, itemContent), propDataType)
						);
					}
				} else {
					dataOut[propName] = (["string", "number", "int", "float"].includes(propType)
						? SetOrPush(dataInContent, propDataType)
						: SetOrPush(MakeApiEntityObject(propType, upstreamName, dataInContent), propDataType)
					);
				}
			} else {
				dataOut[propName] = {}; // NOTE: in some cases, this should be an array, I guess, or maybe not?
				for (const propChildSchema of propContentChildren) {
					const entityChildSchema = transformerTree.querySelector(`:scope > entity[name="${propType}"]`);
					const propChildName = propChildSchema.getAttribute('name');
					const propChildProp = entityChildSchema.querySelector(`:scope > prop[name="${propChildName}"]`);
					const propChildType = propChildProp.getAttribute('type').split('[]')[0];
					const propChildDataType = (propChildProp.getAttribute('type').endsWith('[]') ? [] : {}); 
					const childDataKey = SubstituteStringSets(propChildSchema.getAttribute('query'), globalSets);
					let childDataInContent = [];
					if (dataIn instanceof Node) {
						const nodes = GetElementsByXPath(childDataKey, dataIn);
						if (nodes.length === 1) {
							childDataInContent = nodes[0]?.textContent
						} else {
							for (const node of nodes) {
								childDataInContent.push(node?.textContent);
							}
						}
					} else {
						childDataInContent = (childDataKey ? /*_.get*/defiant.search(dataIn, childDataKey)[0] : dataIn);
					}
					const childResult = (["string", "number", "int", "float"].includes(propChildType)
						? childDataInContent
						: MakeApiEntityObject(propChildType, upstreamName, childDataInContent)
					);
					if (Array.isArray(propDataType)) {
						if (!Array.isArray(dataOut[propName])) {
							dataOut[propName] = [];
						}
						const childItems = SureArray(childResult);
						for (const childItemIndex in childItems) {
							const childItem = childItems[childItemIndex];
							if (!dataOut[propName][childItemIndex]) {
								dataOut[propName][childItemIndex] = {};
							}
							dataOut[propName][childItemIndex][propChildName] = childItem;
						}
					} else {
						dataOut[propName][propChildName] = childResult;
					}
				}
			}
		}
		return dataOut;
	}
	return MakeApiEntityObject (entityName, upstreamName, (dataIn instanceof Node ? dataIn : JsonObjectKeysFix(dataIn)));
}

function _TransformForOutput (transformerTree, initOptions, entityName, upstreamName, dataIn, transformOptions={}) {
	// TODO
}

// <https://stackoverflow.com/questions/36303869/how-to-use-document-evaluate-and-xpath-to-get-a-list-of-elements/42600459#42600459>
// TODO: 'document' won't work on nodejs, must change it
function GetElementsByXPath (xpath, parent) {
	let results = [];
	let query = (parent?.getRootNode() || document).evaluate(xpath, (parent || document), ((ns) => ns), XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (let i=0, length=query.snapshotLength; i<length; ++i) {
		results.push(query.snapshotItem(i));
	}
	return results;
}

const SetOrPush = (item, dest) => (Array.isArray(dest) ? [...dest, item] : item);

const SureArray = (item) => (Array.isArray(item) ? item : [item]);

const SubstituteStringSets = (string, sets) => {
	for (const set in sets) {
		string = string?.replaceAll(`{${set}}`, sets[set]);
	}
	return string;
}

if (platformIsNode) module.exports = Exp;
if (platformIsBrowser) window.Trasformapi = Exp.Trasformapi;

})();
