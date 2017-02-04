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
    var d3=$window.d3;
    // nodeconf : define form each node type the name of the key and the color of circle
    var nodeconf={
    	"houseMemberType": { keyname: 'memberName', color: 'red'}
    }
    $scope.graph={
    	nodes: [],
    	links: []
    };
    var nodeMap={};
    var linkMap={}
    var node=null;
    var link=null;
    var text=null;
    var svg=null;

    
    getNode = function (type,keyvalue) {
      // when landing on the page, get all todos and show them
    var keyname=nodeconf[type].keyname;
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
    // get an initial node
    // TODO : replace harcoded value with data from a form ?
    getNode('houseMemberType','Carlo Bonaparte');

var width = 640,
    height = 480;




//svg = svg.call(d3.zoom().on("zoom", zoomed)).append("g");



var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(100).strength(4))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));


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
    .enter().append("line");

  node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
      .attr("r", 15)
      .attr("fill", "red")
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
      .text(function(d) { return d.memberName }).style("text-anchor", "middle");
      
      

  
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



  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);
      
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

