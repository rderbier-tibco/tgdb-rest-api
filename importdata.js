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

var fs     = require('fs'),
    conFactory     = require('./lib/connection/TGConnectionFactory'),
	TGQueryOption  = require('./lib/query/TGQueryOption').TGQueryOption,
	PrintUtility   = require('./lib/utils/PrintUtility'),
    TGLogManager   = require('./lib/log/TGLogManager'),
    TGLogLevel     = require('./lib/log/TGLogger').TGLogLevel;

var logger = TGLogManager.getLogger();
var gof=null;
var conn=null;
var graphMetadata=null;
var count=0;

function createEdge(source, target, attributes, callback) {

var fetchprops = {
      "fetchsize": 10000,
      "traversaldepth" : 1,
      "edgelimit":30
    };
  var result = {};
  // need to get the graph Meta data -> verify we need to do that each time !
  var nodeSourceMetadata = graphMetadata.getNodeType(source.type);
  if (nodeSourceMetadata==undefined)
      throw("Node source type "+source.type+" does not exist.");
  var nodeTargetMetadata = graphMetadata.getNodeType(target.type);
  if (nodeTargetMetadata==undefined)
      throw("Node target type "+target.type+" does not exist.");
     /* Step 1 - retrieve node source
     */

    var ckeySource = gof.createCompositeKey(source.type);
    var ckeyTarget = gof.createCompositeKey(target.type);
    for (var k in nodeSourceMetadata._pKeys) {
                var key=nodeSourceMetadata._pKeys[k];
                ckeySource.setAttribute(key,source[key]);
                logger.logInfo("Source Primary key  "+key+" "+source[key]);
            }
    for (var k in nodeTargetMetadata._pKeys) {
        var key=nodeSourceMetadata._pKeys[k];
        ckeyTarget.setAttribute(key,target[key]);
        logger.logInfo("Target Primary key  "+key+" "+target[key]);
    }
  
    
 
          
    conn.getEntity(ckeySource, fetchprops, function (nodeFrom){
      logger.logInfo("get source node ");
      conn.getEntity(ckeyTarget, fetchprops, function (nodeTo){
        logger.logInfo("get target node ");
            var edge = gof.createUndirectedEdge(nodeFrom, nodeTo);
       
            for (var k in attributes) {
                edge.setAttribute(k,attributes[k]);
                logger.logInfo("Setting edge attribute "+k);
            }
             
            logger.logInfo("Create edge : ");
            conn.insertEntity(edge);
            conn.commit(function(){
              logger.logInfo(
                  "Transaction completed for Edge");
              callback();
            });
      });

    });
  
}
function createNode(nodeTypeName, props,callback) {
	
    // need to get the graph Meta data -> verify we need to do that each time !
    var nodeMetadata = graphMetadata.getNodeType(nodeTypeName);
  if (nodeMetadata==undefined)
      throw("Node type "+type+" does not exist.");
    
        var nodeType = gof.createNode(nodeMetadata);

       // var nodeMetadataAttributes= nodeMetadata.getAttributeDescriptors();
   // logger.logInfo("node attribute "+JSON.stringify(nodeMetadataAttributes));
        // should we have the class of each fields ?
        for (var k in props) {
        //  if (nodeMetadataAttributes[k] != undefined ) {
                nodeType.setAttribute(k,props[k]);
                //console.log("Using attribute "+k);
        //  } else {
        //      logger.logInfo("Attribute "+k+" not in metadata.");
        //  }
        }
        conn.insertEntity(nodeType);
        conn.commit(function(result,exception){
                if (exception!=undefined) {
                    console.log("Exception  : "+exception.message +" : "+ props[0]);
                }
                callback();
            }); // Write data to database
    
}



function insertOrg( alldata) {
	
	if (alldata.length > 0) {
        var csvline= alldata.shift();
    var data=csvline.split("\t");
    var orgname=data[0].trim();
    var orgid=data[1].trim()+"."+data[0].trim();
    console.log("creating org for [" +orgid+"]");
	nodeInfo={
        "orgId":orgid,
        "orgName":orgname
    }
    
    var node1 = createNode("orgType", nodeInfo,function(){
        insertOrg(alldata);
    });
    }
}
function insertUser( alldata,callback) {
    if (alldata.length > 0) {
        csvline=alldata.shift();
        console.log("creating user for " +csvline);
        var data=csvline.split("\t");
        var username=data[0].trim();
        var orgid=data[2].trim()+"."+data[1].trim();
        nodeInfo={
            "userId":username,
            "userName":username,
            "dummy":"user"
        }
        
        var node1 = createNode("userType", nodeInfo,function(){
            console.log(" line "+count);
            count-=1;
            insertUser(alldata);
        });
    }
    
}
function insertRelation( alldata,callback) {
    if (alldata.length > 0) {
        csvline=alldata.shift();
        console.log("creating data for " +csvline);
        var data=csvline.split("\t");
        var userid=data[0].trim();
        var orgid=data[2].trim()+"."+data[1].trim();
        var source= {
            type: "userType",
            "userId": userid
        }
        var target= {
            type: "orgType",
            "orgId": orgid
        }
        var info={
            "relType":"member"
        }
        
        createEdge(source, target,info,function(){
            insertRelation(alldata);
        });
    }
    
}

function test() {
	var logger = TGLogManager.getLogger();
	logger.setLevel(TGLogLevel.Info);

    var connectionFactory = conFactory.getFactory();
    var linkURL = 'tcp://localhost:8222';
    conn = connectionFactory.createConnection(linkURL, 'admin', 'admin', null);
    gof = conn.getGraphObjectFactory();
	//var filename = "./dataorg.csv";
	var filename = "./import/users.txt";
    
    var data = fs.readFileSync(filename,'UTF-8').toString().split('\n');
    count=data.length;
    console.log("File has "+count+" lines.") 

    //data.forEach(function(l) {console.log(l)})
    
    conn.on('exception', function(exception){
    	logger.logError( "Exception Happens test, message : " + exception.message);
    	//conn.disconnect();
    	//throw exception;
    }).connect(function(connectionStatus) {
        if (connectionStatus) {
        	logger.logInfo('Connection to server successful');
            conn.getGraphMetadata(true, function(gmd) {
              graphMetadata=gmd;
	          logger.logInfo('get metadata');
              //insertRelation(data);
              insertUser(data);
             //insertOrg(data);
			  });
    		
        }
    });	
    
}
 
 test();
function wait () {
    console.log("*** wait");
        setTimeout(wait, 1000);
    };
wait();


