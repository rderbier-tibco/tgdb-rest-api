/**
 * 
 * 
 */


 var app = angular.module('graphexplorer',[]);

/**
 * Configure the Routes
 */


/**
 * homecontrol
 */
 app.controller('mainCtrl',  function mainCtrl(graphVizService,$rootScope, $scope, $location, $http,$element,$window) {
 	console.log("mainCtrl started");
     
    
    // get the DOM svg element used for the graph

    var svgElement = $element.find("svg")[0];
    $scope.firstnode={
    	type: 'houseMemberType',
    	keyvalue: 'Carlo Bonaparte',

    }
      // graphconf.node : define form each node type the name of the key and the color of circle
    var graphconf={}
    
    
    
    
    
 
  
    var graph={
    	nodes: [],
    	links: []
    };
    var nodeMap={}
    var linkMap={}


    $scope.resetGraph = function (request) {
    	console.log("reset requested");
    	
    	getNode(request.type,request.keyvalue, true);
    }
    // get the graph metadata ( list of node types)
    // set the primary keyname for each node type


    // declare getNode function to be visible by the service too.

    getNode = function(type,keyvalue,reset=true, x=0,y=0) {
      // when landing on the page, get all todos and show them
      var keyname=graphconf.node[type].keyname;
      $scope.firstnode.keyvalue=keyvalue;
      $scope.firstnode.type=type;
      var newgraph={};
      newgraph.nodes=[];
      newgraph.links=[];
      if (reset==true) {
      	nodeMap={};
      	linkMap={};
      }


      $http.get('/api/node/'+type+'/'+keyvalue)
      .success(function(data) {
          var update=false;
      	data.nodes.forEach(function (n) {

      		if (nodeMap[n.id]==undefined) {
      			nodeMap[n.id]=n.id;
      			update=true;
            n.x=x;
            n.y=y;
      			newgraph.nodes.push(n);
      		}
      	});
      	data.links.forEach(function (l) {

      		if (linkMap[l.id]==undefined) {
      			linkMap[l.id]=l.id;
      			update=true;
      			newgraph.links.push(l);
      		}
      	});

        if (update) {
        	$scope.graph=newgraph;
        	if (reset==true) {
        	  graphVizService.init("#graphviz",graphconf) 
            }
        	graphVizService.drawGraph(newgraph);
        }	

      })
      .error(function(data) {

      	$location.path("/");
      	console.log('Error: ' + data);
      });
  }
  init = function() {
    // Force an intial node
   // getNode('houseMemberType','Carlo Bonaparte',true);
		}


$window.d3.json("graphviz.json", function(error, conf) {
        if (error) {
          alert(error);
        } else {

            graphconf=conf;
            
            $http.get('/api/metadata')
            .success(function(data) {
              for (nt in data.nodeTypes) {
                var n=data.nodeTypes[nt];
                console.log("type "+n._name+" pkey "+n._pKeys[0]);
                if (graphconf.node[n._name] == undefined) {
                  graphconf.node[n._name] = {}
                }
                graphconf.node[n._name].keyname=n._pKeys[0];
              }
              $scope.metadata=data;
              init();
              });
          }
    });


//svg = svg.call(d3.zoom().on("zoom", zoomed)).append("g");







});

