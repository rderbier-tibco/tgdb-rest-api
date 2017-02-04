/**
 * Copyright 2017 TIBCO Software Inc. All rights reserved.
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

var fs          = require('fs');
var http        = require('http');
var express     = require('express');


var bodyParser = require('body-parser');
var conFactory = require('./lib/connection/TGConnectionFactory');
var TGQueryOption = require('./lib/query/TGQueryOption').TGQueryOption;
var TGLogManager  = require('./lib/log/TGLogManager');
var TGLogLevel    = require('./lib/log/TGLogger').TGLogLevel;
var conf = JSON.parse(fs.readFileSync('./conf/server.json'));

var logger = TGLogManager.getLogger();
logger.setLevel(TGLogLevel.Debug);

var app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
                                    // log every request to the console
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    

app.get('/', function(req, res){
  res.redirect('/index.htm');
});

var port = 84;

function isApiAuthenticated (req,res,next) {
	// to be implemented
	// at the moment we don't have authorization
	next();
}
// entities returned by the graph DB services are not JSON friendly
// return a simplified object from an entity 
function entityToJS(ent) {
  var info={};
  info["id"]=ent.getId().getHexString();
  var attrArray=ent.getAttributes();
    	attrArray.forEach(function(attr) {
        
    		  info[attr.getName()]=attr.getValue();
        
    	});
   return info;
}

 function getMetadata(req, res) {
	logger.logInfo(" retrieving metadata" );
   // conn.getGraphMetadata(true, function(graphMetadata) {
   // 	logger.logInfo(" retrieving metadata for "+graphMetadata);
    	var data={};
    	data["nodeTypes"]=graphMetadata.getNodeTypes();
    	data["edgeTypes"]=graphMetadata.getEdgeTypes();
    	res.send(data);
    //})
};
/*
*
*/
function createNode(req, res) {

	var nodeTypeName=req.params.node_type;
	var props = req.body;
	var result = {};
	// need to get the graph Meta data -> verify we need to do that each time !
	var nodeMetadata = graphMetadata.getNodeType(nodeTypeName);
  if (nodeMetadata==undefined)
      throw("Node type "+type+" does not exist.");
	
		var nodeType = gof.createNode(nodeMetadata);

		var nodeMetadataAttributes= nodeMetadata.getAttributeDescriptors();
   // logger.logInfo("node attribute "+JSON.stringify(nodeMetadataAttributes));
		// should we have the class of each fields ?
		for (var k in props) {
		//	if (nodeMetadataAttributes[k] != undefined ) {
				nodeType.setAttribute(k,props[k]);
				logger.logInfo("Using attribute "+k);
		//	} else {
		//		logger.logInfo("Attribute "+k+" not in metadata.");
		//	}
		}
			conn.insertEntity(nodeType);
    	conn.on("exception",function(exception){
          logger.logError( "Exception Happens, message : " + exception.message);
          //conn.disconnect();
          res.send(exception.message);
      }).commit(function(){
				logger.logInfo(
						"Transaction completed for Node : " + props[0]);
				result=entityToJS(nodeType);	
        res.send(result);	
			}); // Write data to database
       
  
    
}

function getNode(req, res) {

	var type=req.params.node_type;
    var pkey=req.params.key;
    var value=req.params.value;
	logger.logInfo(" retrieving entities "+type+" "+pkey+" "+value );
	//conn.getGraphMetadata(true,function() {
    var nodeMetadata = graphMetadata.getNodeType(type);
    if (nodeMetadata==undefined)
      throw("Node type "+type+" does not exist.");

    try {
  	var ckey = gof.createCompositeKey(type);
  	
    ckey.setAttribute(pkey, value);
  	var props = {
  		"fetchsize": 10000,
  		"traversaldepth" : 2,
  		"edgelimit":30
  	};
	      	
    conn.getEntity(ckey, props, function (ent){

        var result={};
        
        var edgeArray=[];
        var nodeArray=[];
        var nodeList={};
        var nodeid=ent.getId().getHexString();
        if (ent!=undefined) {
	    	logger.logInfo(" got entity "+ent.getEntityKind().name);
	    	var info=entityToJS(ent);
	    	nodeList[nodeid]=info;
	    	var curEdges = ent.getEdges();
        logger.logInfo(" has edges : "+curEdges.length);
	    	curEdges.forEach(function(edge) {
          var edgeinfo = {};
	    		edgeinfo=entityToJS(edge);
	    		var from=edge.getVertices()[0];
          var to=edge.getVertices()[1];
          // add from and to nodes to the node map if necessary
          if (from.getId().getHexString()!=nodeid) {
              nodeList[from.getId().getHexString()]=entityToJS(from);
              
          }
           if (to.getId().getHexString()!=nodeid) {
              nodeList[to.getId().getHexString()]=entityToJS(to);    
          } 
          edgeinfo.source=from.getId().getHexString();
          
          edgeinfo.target=to.getId().getHexString();
	    		

	    		edgeArray.push(edgeinfo);
	    	});
        for (n in nodeList) {
          nodeArray.push(nodeList[n]);
        }
        result["nodes"]=nodeArray;
	    	result["links"]=edgeArray;
	    	logger.logInfo(" got entity with attributes "+info);
        }
    	res.send(result);
    })
  } catch (err) {
    res.status(404).send(err.message);
  }
//})
};

function searchGraph(req, res) {
    var queryString = req.body.query;
	logger.logInfo(" searching for  "+queryString );
  conn.getGraphMetadata(true,function() {
	 conn.executeQuery(queryString, 
    		              TGQueryOption.DEFAULT_QUERY_OPTION,
    		              function(resultSet) {     	
    
   
    	logger.logInfo("get result set ");
    	// let's build and array for the result
    	var result=[];
    	while (resultSet.hasNext()) {
    	        var node = resultSet.next();
    	        result.push(entityToJS(node));
    	        
    	      //  PrintUtility.printEntitiesBreadth(node, 5);
    	    }
    	//var attrArray=ent.getAttributes();
    	//attrArray.forEach(function(attr) {
    	//	info[attr.getName()]=attr.getValue();
    	//});

    	//logger.logInfo(" got entity with attributes "+info);
    	res.send(result);
    })
	})
};

/*
* create global objects
*/
	var factory01 = conFactory.getFactory();
	logger.logInfo('factory01, my id is = ' + factory01.getId());
	
	
	var linkURL = 'tcp://127.0.0.1:8222';
	var properties = { 
//		ConnectionImpl : './tcp/TCPConnection',
//		ConnectionPoolSize : 5
	};
   var conn = factory01.createConnection(linkURL, 'admin', 'admin', properties);
   //
   // create gof and graphMetaData global objects
   //
   var graphMetadata = null;
   var gof = null;

    // sample application
    app.use(express.static(__dirname + '/public'));
    // protect /api with the isApiAuthenticated 
    app.all('/api/*',isApiAuthenticated);
    app.route('/api/node/:node_type')
      .post(createNode);
    app.get('/api/metadata', getMetadata);
    app.get('/api/node/:node_type/:key/:value', getNode);
    app.post('/api/search', searchGraph);

   gof = conn.getGraphObjectFactory();
   conn.connect( function() {
   	      logger.logInfo("Connected ");
   	      conn.getGraphMetadata(true,function(gmd) {
   	          graphMetadata=gmd;
   	          logger.logInfo("Get metadata ");
   	              app.listen(port, function() {
        				console.log('Our app is running on http://localhost:' + port);
    			  });
   	      });
   });

