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
 app.controller('mainCtrl',  function mainCtrl($rootScope, $scope, $location, $http,$window) {
 	console.log("mainCtrl started");
    // let form be empty or prepopulate with data 
    $scope.firstnode={
    	type: 'houseMemberType',
    	keyvalue: 'Carlo Bonaparte',

    }
    var d3=$window.d3;
    // nodeconf : define form each node type the name of the key and the color of circle
    var defaultconf={
    	fill: 'rgb(165, 171, 182)',
    	stroke: 'rgb(154, 161, 172)',
    	"stroke-width": '2px',
    	r: '15',
    	linkstrokedash: 'none',
    	strokewidth: '2px'
    }
    var nodeconf={
    	"houseMemberType": {  
    		fill: 'rgb(255, 216, 110)',
    		stroke: 'rgb(237, 186, 57)',
    		r: '5',
    		label: "memberName"
    	},
    	"sometype" :{
    		fill: 'rgb(255, 216, 110)',
    		stroke: 'rgb(237, 186, 57)'
    	}
    }
    var linkconf={
    	"spouse": {  
    		strokedash: '5,5',
    		strokewidth: '4px'
    	}
    }
    $scope.graph={
    	nodes: [],
    	links: []
    };
    var nodeMap={}
    var linkMap={}
    var node=null;
    var link=null;
    var text=null;
    var svg=null;

    $scope.resetGraph = function (request) {
    	console.log("reset requested");
    	$scope.graph={ nodes: [], links: [] };
    	var nodeMap={}
        var linkMap={}
    	getNode(request.type,request.keyvalue);
    }
    // get the graph metadata ( list of node types)
    // set the primary keyname for each node type

    $http.get('/api/metadata')
    .success(function(data) {
    	for (nt in data.nodeTypes) {
    		var n=data.nodeTypes[nt];
    		console.log("type "+n._name+" pkey "+n._pKeys[0]);
    		if (nodeconf[n._name] == undefined) {
    			nodeconf[n._name] = {}
    		}
    		nodeconf[n._name].keyname=n._pKeys[0];
    	}
    	$scope.metadata=data;
    });


    getNode = function (type,keyvalue) {
      // when landing on the page, get all todos and show them
      var keyname=nodeconf[type].keyname;
      $scope.firstnode.keyvalue=keyvalue;
      $scope.firstnode.type=type;
      $http.get('/api/node/'+type+'/'+keyname+'/'+keyvalue)
      .success(function(data) {

      	data.nodes.forEach(function (n) {

      		if (nodeMap[n.id]==undefined) {
      			nodeMap[n.id]=n.id;
      			$scope.graph.nodes.push(n);
      		}
      	});
      	data.links.forEach(function (l) {

      		if (linkMap[l.id]==undefined) {
      			linkMap[l.id]=l.id;
      			$scope.graph.links.push(l);
      		}
      	});

      	drawGraph();

      })
      .error(function(data) {

      	$location.path("/");
      	console.log('Error: ' + data);
      });
  }
    // Force an intial node
    //getNode('houseMemberType','Carlo Bonaparte');

    var width = 800,
    height = 600;




//svg = svg.call(d3.zoom().on("zoom", zoomed)).append("g");



var simulation = d3.forceSimulation()
.force("charge", d3.forceManyBody())
.force("center", d3.forceCenter(width / 2, height / 2))
.force("collisionForce",d3.forceCollide(40).strength(1).iterations(100))
.force("link", d3.forceLink().id(function(d) { return d.id; }).distance(100).strength(4))

drawGraph = function() {
	var graph = $scope.graph;
	if (node!=null) {node.remove();}
	if (link!=null) {link.remove();}
	if (text!=null) {text.remove();}
	if (svg!=null) {svg.remove();}
	svg = d3.select('body').append('svg')
	.attr('width', width)
	.attr('height', height);

	link = svg.append("g")
	.attr("class", "links")
	.selectAll("line")
	.data(graph.links)
	.enter().append("line")
	.attr("stroke-dasharray",function(d){
		if (d["relType"] != undefined) {

			return (linkconf[d["relType"]] ? linkconf[d["relType"]].strokedash || defaultconf.linkstrokedash : defaultconf.linkstrokedash)
		} else {
			return (defaultconf.linkstrokedash)
		}
		

	} )
	.attr("stroke-width",function(d){
		if (d["relType"] != undefined) {

			return (linkconf[d["relType"]] ? linkconf[d["relType"]].strokewidth || defaultconf.strokewidth : defaultconf.strokewidth)
		} else {
			return (defaultconf.strokewidth)
		}
		

	} )
	;

	node = svg.append("g")
	.attr("class", "nodes")
	.selectAll("circle")
	.data(graph.nodes)
	.enter().append("circle")
	.attr("r", function(d){
		if (d["@name"] != undefined) {

			return (nodeconf[d["@name"]] ? nodeconf[d["@name"]].r || defaultconf.r : defaultconf.r)
		} else {
			return (defaultconf.r)
		}

	} )
	.attr("fill",function(d){
		if (d["@name"] != undefined) {

			return (nodeconf[d["@name"]] ? nodeconf[d["@name"]].fill || defaultconf.fill : defaultconf.fill)
		} else {
			return (defaultconf.fill)
		}

	} )
	.attr("stroke",function(d){
		if (d["@name"] != undefined) {

			return (nodeconf[d["@name"]] ? nodeconf[d["@name"]].stroke || defaultconf.stroke : defaultconf.stroke)
		} else {
			return (defaultconf.stroke)
		}

	} )
	.call(d3.drag()
		.on("start", dragstarted)
		.on("drag", dragged)
		.on("end", dragended));
	node.on("dblclick",function(d){
		var type=d["@name"];
		console.log("more on ", d[nodeconf[type].keyname]);
		getNode(type,d[nodeconf[type].keyname]);
	});
	text = svg.append("g")
	.attr("class", "labels")
	.selectAll("g")
	.data(graph.nodes)
	.enter().append("g").append("text")
	.attr("dx", 12)
	.attr("dy", "1em")
	.text(function(d) { // return the value of the property name specified by label or "?"
		if (d["@name"] != undefined) {
			if (nodeconf[d["@name"]]!=undefined) {
                return (nodeconf[d["@name"]].label ?  d[nodeconf[d["@name"]].label] || "?" : "?")
			} else {
				return ("?")
			}
			
		} else {
			return ("?")
		} })
	.style("text-anchor", "end");




/*
   node.append("text")
      .attr("dx", 12)
      .attr("dy", "1em")
      .text(function(d) { return d.memberName }).style("text-anchor", "end")
      .style("font-size", 12);

      */
      node.append("title")
      .text(function(d) { return ""+d.yearBorn+" ... "+d.yearDied; });
 // Now we create a force layout object and define its properties.
// Those include the dimensions of the visualization and the arrays
// of nodes and links.



simulation.nodes(graph.nodes).on("tick", ticked);

simulation.force("link").links(graph.links);

}
function zoomed() {
	svg.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
}
function ticked() {
	link
	.attr("x1", function(d) { return d.source.x; })
	.attr("y1", function(d) { return d.source.y; })
	.attr("x2", function(d) { return d.target.x; })
	.attr("y2", function(d) { return d.target.y; });

	node
	.attr("cx", function(d) { return d.x; })
	.attr("cy", function(d) { return d.y; });
	text
	.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
}

function nodeClicked(a,b) {
	console.log(" Node clicked "+b);
}
function dragstarted(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function dragended(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

});

