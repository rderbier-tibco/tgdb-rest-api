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
    
      // when landing on the page, get all todos and show them
    $http.get('/api/node/houseMemberType/memberName/Carlo%20Bonaparte')
        .success(function(data) {

            $scope.graph = data;
            drawGraph();
            
        })
        .error(function(data) {
            
            $location.path("/");
            console.log('Error: ' + data);
        });

    var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");




var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));


drawGraph = function() {
	var graph = $scope.graph;


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
      .attr("r", 4)
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
   label = svg.selectAll(".mytext")
						.data(graph.nodes)
						.enter()
						.append("text")
					    .text(function (d) { return d.memberName; })
					    .style("text-anchor", "middle")
					    .style("fill", "#555")
					    .style("font-family", "Arial")
					    .style("font-size", 12);
  node.append("title")
      .text(function(d) { return ""+d.yearBorn+" ... "+d.yearDied; });

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);
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

