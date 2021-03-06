/**
 * Copyright 2016 TIBCO Software Inc. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); You may not use this file except 
 * in compliance with the License.
 * A copy of the License is included in the distribution package with this file.
 * You also may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var TGEntityType     = require('./TGEntityType'),
    TGSystemObject = require('./TGSystemObject').TGSystemObject,
    util             = require('util');

function TGNodeType(graphMetadata, name, parentNodeType) {
	TGNodeType.super_.call(this);
	this._pKeys = [];
}

util.inherits(TGNodeType, TGEntityType);

TGNodeType.prototype.getSystemType = function() {
    return TGSystemObject.TGSystemType.NodeType;
};


TGNodeType.prototype.readExternal = function(inputStream) {
	this.readAttributeDescriptors(inputStream);
	
	var attrCount = inputStream.readShort();
	for(var i=0; i<attrCount; i++) {
		this._pKeys.push(inputStream.readUTF());
	}
	

	var idxCount = inputStream.readShort();
	for (var i=0; i<idxCount; i++) {
        //FIXME: Get meta data needs to return index definitions
		inputStream.readInt();
	}
};

module.exports = TGNodeType;