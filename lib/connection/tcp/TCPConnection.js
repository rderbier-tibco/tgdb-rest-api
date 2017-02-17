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

var util                      = require('util'),
    TGConnection              = require('../TGConnection'),
    TGException               = require('../../exception/TGException').TGException,
    TGEntityId                = require('../../model/TGEntityId'),
    TGEdge                    = require('../../model/TGEdge').TGEdge,
    TGEdgeDirectionType       = require('../../model/TGEdgeDirectionType').TGEdgeDirectionType,
    TGAbstractEntity          = require('../../model/TGAbstractEntity').TGAbstractEntity,
    TGEntityKind              = require('../../model/TGEntityKind').TGEntityKind,
    VerbId                    = require('../../pdu/impl/VerbId').VerbId,
	CommitTransactionRequest  = require('../../pdu/impl/CommitTransactionRequest').CommitTransactionRequest,
    ProtocolMessageFactory    = require('../../pdu/impl/ProtocolMessageFactory').ProtocolMessageFactory,
    MetadataResponse          = require('../../pdu/impl/MetadataResponse').MetadataResponse,
    GetEntityResponse         = require('../../pdu/impl/GetEntityResponse').GetEntityResponse,
    CommitTransactionResponse = require('../../pdu/impl/CommitTransactionResponse').CommitTransactionResponse,
    QueryResponse             = require('../../pdu/impl/QueryResponse').QueryResponse,
    TGResultSet               = require('../../query/TGResultSet'),
    TGQuery                   = require('../../query/TGQuery').TGQuery,
    PrintUtility              = require('../../utils/PrintUtility'),
    TGLogManager              = require('../../log/TGLogManager'),
    TGLogLevel                = require('../../log/TGLogger').TGLogLevel;

var logger = TGLogManager.getLogger();

function TCPConnection(connectionPool, channel, properties) {
	TCPConnection.super_.call(this, connectionPool, channel, properties);
    
    this.handleResponse = function (response) {
    	if (response instanceof MetadataResponse) {
        	logger.logDebugWire( 
        	'[TCPConnection.prototype.onResponse] for MetadataResponse ......... set response : %s, %s', 
        	response.getRequestId(), response);
            this.handleGetGraphMetadataResponse(response);	
        } else if (response instanceof GetEntityResponse) {
        	logger.logDebugWire( 
        		'[TCPConnection.prototype.onResponse] for GetEntityResponse, set response : %s, %s, command = %d', 
        		response.getRequestId(), response, response.getRequest().getCommand());
        	switch(response.getRequest().getCommand()){
    		    case 0:
    			    this.handleGetEntity(response);
    			    break;
    		    case 2:
    			    this.handleGetEnties(response);
    			    break;
    	    }
        } else if (response instanceof CommitTransactionResponse) {
        	logger.logDebugWire( 
        		'[TCPConnection.prototype.onResponse] for CommitTransactionResponse, set response : %s, %s', 
        		response.getRequestId(), response);
            	this.handleCommitResponse(response);
        } else if (response instanceof QueryResponse) {
        	logger.logDebugWire( 
        		'[TCPConnection.prototype.onResponse] for QueryResponse, set response : %s, %s, command = %d', 
        		response.getRequestId(), response, response.getRequest().getCommand());
        	switch (response.getRequest().getCommand()) {
    		    case 1 :
    			    this.handleCreateQueryResult(response);
    			    break;
    		    case 2 :
    		  	    this.handleExecuteQueryResult(response);
    			    break;
    		    case 3 :
    			    this.handleCreateQueryWithIdResult(response);
    			    break;
    		    case 4 :
    			    this.handleCloseQueryResult(response);
    			    break;
    		    default :
    			    this.throwException(new TGException('Unknow response for query.'));
    	    }
        } else {
        	this.throwException(new TGException('Unknow response from server'));
        }
    };
}

util.inherits(TCPConnection, TGConnection);

TCPConnection.command = {
	CREATE : 1,
	EXECUTE : 2,
	EXECUTEID : 3,
	CLOSE : 4
};

/*
 *   Get API
 */

TCPConnection.prototype.getEntity = function (tgKey, properties, callback) {
	logger.logDebugWire( 
			"Entering TCPConnection.prototype.getEntity : tgKey = %s, properties = %s", 
			tgKey._typeName, properties);
	var channel = this.getChannel();
    var request = ProtocolMessageFactory.createMessageFromVerbId(
    	VerbId.GET_ENTITY_REQUEST, 
    	channel.getAuthToken(), 
    	channel.getSessionId(),
    	callback
    );
    configureGetRequest(request, properties);
	request.setCommand(0);
    request.setKey(tgKey);
    channel.send(request);
};
    	
TCPConnection.prototype.handleGetEntity = function (response) {
	var gof = this.getGraphObjectFactory();
	var entityFound = null;
	//Need to check status
	if (response.hasResult()) {
		var entityStream = response.getEntityStream();
		var fetchedEntities = null;
    	var count = entityStream.readInt();
    	if (count > 0) {
     		fetchedEntities = {};
            entityStream.setReferenceMap(fetchedEntities);
    	}

    	for (var i=0; i<count; i++) {
    		var kind = TGEntityKind.fromValue(entityStream.readByte());
      		if (kind !== TGEntityKind.INVALIDKIND) {
      			var idBytes = entityStream.readLongAsBytes();
       			var id = TGEntityId.bytesToString(idBytes);
       			var entity = fetchedEntities[id];
       			if (kind === TGEntityKind.NODE) {
       				//Need to put shell object into hashmap to be deserialized later
       				var node = entity;
       				if (!node) {
      					node = gof.createNode();
      					node.getId().setBytes(idBytes);	
       					entity = node;
       					fetchedEntities[id] = node;
       					if (!entityFound) {
       						entityFound = node;
       					}
       				}
       				node.readExternal(entityStream, gof);
       			} else if (kind === TGEntityKind.EDGE) {
        				var edge = entity;
       				if (!edge) {
       					edge = gof.createEdge(null, null, TGEdgeDirectionType.BiDirectional);
       					edge.getId().setBytes(idBytes);	
       					entity = edge;
       					fetchedEntities[id] = edge;
       					if (!entityFound) {
       						entityFound = edge;
       					}
       				}
       				edge.readExternal(entityStream, gof);
       			}
       		} else {
                //FIXME: Throw exception and cleanup
       			this.throwException(new TGException("Received invalid entity kind " + kind));
       		}
    	}
	}
	(response.getRequest().getCallback())(entityFound);
};

TCPConnection.prototype.getEntities = function (tgKey, properties, callback) {
	logger.logDebugWire( "Entering TCPConnection.prototype.executeQueryWithId .......... ");
	var channel = this.getChannel();
    var request = ProtocolMessageFactory.createMessageFromVerbId(
    	VerbId.GET_ENTITY_REQUEST, 
    	channel.getAuthToken(), 
    	channel.getSessionId()
    );
    configureGetRequest(request, properties);
    request.setCommand(2);
    request.setKey(tgKey);
    channel.send(request);
};

TCPConnection.prototype.handleGetEnties = function (response) {
	var gof = this.getGraphObjectFactory();
	var entitiesFound = null;
	
	//Need to check status
	if (response.hasResult()) {
		var entityStream = response.getEntityStream();
		var fetchedEntities = null;
    	var totalCount = entityStream.readInt();
    	
    	if (totalCount > 0) {
     		fetchedEntities = {};
            entityStream.setReferenceMap(fetchedEntities);
    	}
        entitiesFound = new TGResultSet(this, response.getResultId());
        //Number of entities matches the search.  Exclude the related entities
    	var resultCount = entityStream.readInt();
        var currentResultCount = 0;
    	for (var i=0; i<totalCount; i++) {
            var isResult = entityStream.readBoolean();
    		var kind = TGEntityKind.fromValue(entityStream.readByte());
      		if (kind !== TGEntityKind.INVALIDKIND) {
       			var id = TGEntityId.bytesToString(entityStream.readLongAsBytes());
       			var entity = fetchedEntities[id];
       			if (kind === TGEntityKind.NODE) {
       				//Need to put shell object into hashmap to be deserialized later
       				var node = entity;
       				if (!node) {
       					node = gof.createNode();
       					entity = node;
       					fetchedEntities[node.getEntityId().getHexString()] = node;
       				}
       				node.readExternal(entityStream, gof);
                    if (isResult) {
                    	entitiesFound.addEntityToResultSet(entity);
                        currentResultCount++;
                    }
       			} else if (kind === TGEntityKind.EDGE) {
       				var edge = entity;
       				if (!edge) {
       					edge = gof.createEdge(null, null, TGEdge.DirectionType.BiDirectional);
       					entity = edge;
       					fetchedEntities[edge.getEntityId().getHexString()] = edge;
       				}
       				edge.readExternal(entityStream, gof);
                    if (isResult) {
                    	entitiesFound.addEntityToResultSet(entity);
                        currentResultCount++;
                    }
       			}
       		} else {
                //FIXME: Throw exception and cleanup
       			this.throwException(new TGException("Received invalid entity kind " + kind));
       		}
    	}
	}
	(response.getRequest().getCallback())(entitiesFound);
};

/**
 * request metadata from Graph DB server.
 * 
 * @param callback -
 *            Consuming metadata from server.
 */
TCPConnection.prototype.getGraphMetadata = function (refresh, callback) {
	if(refresh) {
		try {
			var request = ProtocolMessageFactory.createMessageFromVerbId(VerbId.METADATA_REQUEST, null, null, callback);
			this.getChannel().send(request);
		} catch (exception) {
			this.throwException(exception);
		}
	} else {
		callback(this.getCachedGraphMetaData());
	}
};

TCPConnection.prototype.handleGetGraphMetadataResponse = function(response) {		
	var nodeTypeList = response.getNodeTypeList();
	var edgeTypeList = response.getEdgeTypeList();
	var attrDescList = response.getAttrDescList();
		
	(response.getRequest().getCallback())(this._entities.updateGraphMetaData(attrDescList, nodeTypeList, edgeTypeList));
};

/**
 * Commit transaction to Graph DB server.
 * 
 * @param callback -
 *            Convey status of commit operation.
 */
TCPConnection.prototype.commit = function(callback) {	
    // Call parent class (TGEntityManager) to prepare for commit.
	this._entities.updateChangedListForNewEdge();
	this._entities.updateChangedListForUpdatedEdge();
	this._entities.updateRemovedListForRemovesEdge();
    
	var addedEntities   = this._entities.addedEntities();
	if(logger.isDebug()) {
	    PrintUtility.printEntityMap(addedEntities, 'addedEntities');      // Printing		
	}
	var updatedEntities = this._entities.updatedEntities();
	if(logger.isDebug()) {
	    PrintUtility.printEntityMap(updatedEntities, 'updatedEntities');  // Printing		
	}
    
	var removedEntities = this._entities.removedEntities();
	if(logger.isDebug()) {
	    PrintUtility.printEntityMap(removedEntities, 'removedEntities');  // Printing		
	}
	
    var attrDescSet = this._entities.newAttrDecsSet(); 
    
    // Prepare request for commit transaction
    var commitTransRequest = new CommitTransactionRequest(
    	addedEntities, updatedEntities, removedEntities, attrDescSet, callback
    );
    
    var channel = this.getChannel();
    //commitTransRequest.setRequestId(channel.getRequestId());
    commitTransRequest.setAuthToken(channel.getAuthToken());
    commitTransRequest.setSessionId(channel.getSessionId());

    channel.send(commitTransRequest);
};

TCPConnection.prototype.handleCommitResponse = function(response) {
	var exception = response.getException();
	if(!exception) {
		// Call parent class to fix temp Ids 
		var changeList = this._entities.updateEntityIds(response);
		(response.getRequest().getCallback())(changeList);
	} else {
		//this.throwException(exception);
    this._entities.clear();
    (response.getRequest().getCallback())(null,exception);
	}
};

/**
 * Rollback transaction to Graph DB server.
 */
TCPConnection.prototype.rollback = function() {
	this.clear();
};

/****************************
 *                          *
 *        Query API         *
 *                          *
 ****************************/

TCPConnection.prototype.createQuery = function (expr, callback) {
    //var timeout = Long.parseLong(properties.getProperty(CONFIG_NAMES.CONNECTION_OPERATION_TIMEOUT, "-1"));
    //var requestId  = globleRequestIds++;
	
	var request = ProtocolMessageFactory.createMessageFromVerbId(VerbId.QUERY_REQUEST, null, null, callback);
	request.setCommand(TCPConnection.command.CREATE);
//	request.setConnectionId(connId);
	request.setQuery(expr);
	this.getChannel().send(request);
	logger.logDebugWire( 'Send create query completed');
};

TCPConnection.prototype.handleCreateQueryResult = function (response) {
    var result = response.getResult();
    var queryHashId = response.getQueryHashId();
    var queryObj = null;
	if(result === 0 && queryHashId > 0) {
		queryObj = new TGQuery(this, queryHashId);
		logger.logDebugWire( 'Query back from server : %s', queryHashId);
	}
	(response.getRequest().getCallback())(queryObj);
};

TCPConnection.prototype.executeQuery = function (queryExpr, queryOption, callback) {
	logger.logDebugWire( 'Entering TCPConnection.prototype.executeQuery .......... ');
	
    //var timeout = Long.parseLong(properties.getProperty(CONFIG_NAMES.CONNECTION_OPERATION_TIMEOUT, "-1"));
	//var requestId  = QueryRequest.getThenIncrementQueryId();

	var request = ProtocolMessageFactory.createMessageFromVerbId(VerbId.QUERY_REQUEST, null, null, callback);
	configureQueryRequest(request, queryOption);
	
	request.setCommand(TCPConnection.command.EXECUTE);
//	request.setConnectionId(this._connId);
	request.setQuery(queryExpr);
	this.getChannel().send(request);
	logger.logDebug( "Send execute query completed");
};

TCPConnection.prototype.handleExecuteQueryResult = function (response) {
	logger.logDebugWire( "Entering TCPConnection.prototype.handleExecuteQueryResult .......... ");
    var resultSet = null;
	//Need to check status
	if (response.hasResult()) {
		var resultCount = response.getResultCount();
		var currResultCount = 0;
		var entityStream = response.getEntityStream();
		var fetchedEntities = null;
		if (resultCount > 0) {
			fetchedEntities = {};
			entityStream.setReferenceMap(fetchedEntities);
			resultSet = new TGResultSet(this, 0);
		}
		
		var gof = this._entities.getGraphObjectFactory();
		var totalCount = response.getTotalCount();
		for (var i=0; i<totalCount; i++) {
			var kind = TGEntityKind.fromValue(entityStream.readByte());
			if (kind !== TGEntityKind.INVALIDKIND) {
				var idBytes = entityStream.readLongAsBytes();
				var id = TGEntityId.bytesToString(idBytes);
				var entity = fetchedEntities[id];
				if (kind === TGEntityKind.NODE) {
					//Need to put shell object into hashmap to be deserialized later
					var node = entity;
					if (!node) {
						node = gof.createNode();
						node.getId().setBytes(idBytes);							
						entity = node;
						fetchedEntities[id] = node;
						if (currResultCount < resultCount) {
							resultSet.addEntityToResultSet(node);
						}
					}
					node.readExternal(entityStream, gof);
				} else if (kind === TGEntityKind.EDGE) {
					var edge = entity;
					if (!edge) {
	       				edge = gof.createEdge(null, null, TGEdgeDirectionType.BiDirectional);
	       				edge.getId().setBytes(idBytes);	
	       				entity = edge;
						fetchedEntities[id] = edge;
					}
					edge.readExternal(entityStream, gof);
				}
			} else {
				logger.logWarning( "Received invalid entity kind %d", kind);
			}
		}
	}
    (response.getRequest().getCallback())(resultSet);
};

TCPConnection.prototype.executeQueryWithId = function (queryHashId, queryOption, callback) {
	logger.logDebugWire( "Entering TCPConnection.prototype.executeQueryWithId .......... ");

    //long timeout = Long.parseLong(properties.getProperty(ConfigName.ConnectionOperationTimeout, "-1"));
    //long requestId  = requestIds.getAndIncrement();
    
    try {
    	var request = ProtocolMessageFactory.createMessageFromVerbId(VerbId.QUERY_REQUEST, null, null, callback);
        request.setCommand(TCPConnection.command.EXECUTEID);
//        request.setConnectionId(connId);
        request.setQueryHashId(queryHashId);
        this.getChannel().send(request);
        logger.logDebugWire( 'Send execute query with id completed');
    }
    catch (exception) {
        this.throwException(exception);
    }
};

TCPConnection.prototype.handleCreateQueryWithIdResult = function (response) {
	var resultSet = null;
	(response.getRequest().Callback())(resultSet);
};

TCPConnection.prototype.closeQuery = function (queryHashId, callback) {
    //var timeout = Long.parseLong(properties.getProperty(CONFIG_NAMES.CONNECTION_OPERATION_TIMEOUT, "-1"));
    //var requestId  = requestIds.getAndIncrement();

	var request = ProtocolMessageFactory.createMessageFromVerbId(VerbId.QUERY_REQUEST, null, null, callback);
	request.setCommand(TCPConnection.command.CLOSE);
//	request.setConnectionId(connId);
	request.setQueryHashId(queryHashId);
	this.getChannel().send(request);
	logger.logDebug( "Send close query completed");
};

TCPConnection.prototype.handleCloseQueryResult = function (request, response) {
	(request.getCallback())(true);
};

function configureGetRequest(getEntityRequest, properties) {
	if (!getEntityRequest || !properties) {
		return;
	}
	
	var fetchSize = properties.fetchsize;
	if(fetchSize) {
		getEntityRequest.setFetchSize(fetchSize);		
	}

	var batchSize = properties.batchsize;
	if(batchSize) {
		getEntityRequest.setBatchSize(batchSize);
	}

	var traversaldepth = properties.traversaldepth;
	if(traversaldepth) {
		getEntityRequest.setTraversalDepth(traversaldepth);
	}
	
	var tdepth = properties.edgelimit;
	if(tdepth) {
		getEntityRequest.setEdgeFetchSize(tdepth);
	}
}

function configureQueryRequest(queryRequest, properties) {
	if (!queryRequest || !properties) {
		return;
	}
	
	var fetchSize = properties.fetchsize;
	if(fetchSize) {
		queryRequest.setFetchSize(fetchSize);		
	}

	var batchSize = properties.batchsize;
	if(batchSize) {
		queryRequest.setBatchSize(batchSize);
	}

	var traversaldepth = properties.traversaldepth;
	if(traversaldepth) {
		queryRequest.setTraversalDepth(traversaldepth);
	}
	
	var tdepth = properties.edgelimit;
	if(tdepth) {
		queryRequest.setEdgeFetchSize(tdepth);
	}
}

module.exports = TCPConnection;
