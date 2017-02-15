var app = angular.module('graphexplorer');



app.directive('graphViz', ['$window',function ($window) {
	var controller=function ($element) {
		console.log(" graphViz controller starting : ");
		var vm=this;
		vm.graph={nodes:[],links:[]};
		vm.node=null;
		vm.link=null;
		vm.text=null;
		vm.d3 = $window.d3;
		var rawSvg = $element.find("svg")[0];
		vm.svg = d3.select(rawSvg);
		
		vm.test= function(msg){
			console.log(" Message : "+msg);
		}
		var setup = function() {
			var width = 800,
			height = 600;

			if (vm.node!=null) {vm.node.remove();}
			if (vm.link!=null) {vm.link.remove();}
			if (vm.text!=null) {vm.text.remove();}
			vm.svg.selectAll("*").remove();

// create a copy of the graph 
// need as D3 will change nodes and links with a lot of information.
var graphconf = vm.conf;   
var graph=vm.graph;
    /*
var graph ={nodes:[], links:[]};
   vm.graph.nodes.forEach(function(n) {
   	  var nn={};
   	    for (var attr in n) {
            if (n.hasOwnProperty(attr)) nn[attr] = n[attr];
        }
      graph.nodes.push(nn);
   });
   vm.graph.links.forEach(function(l) {
   	   	  var nl={}; // new link
   	    for (var attr in l) {
            if (l.hasOwnProperty(attr)) nl[attr] = l[attr];
        }
      graph.links.push(nl);
   });
   */

   vm.link = vm.svg.append("g")
   .attr("class", "links")
   .selectAll(".line")
   .data(graph.links)
   .enter().append("line")
   .attr("class","line")
   .attr("stroke-dasharray",function(d){
   	if (d["relType"] != undefined) {

   		return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokedash || graphconf.default.linkstrokedash : graphconf.default.linkstrokedash)
   	} else {
   		return (graphconf.default.linkstrokedash)
   	}


   } )
   .attr("stroke-width",function(d){
   	if (d["relType"] != undefined) {

   		return (graphconf.link[d["relType"]] ? graphconf.link[d["relType"]].strokewidth || graphconf.default.strokewidth : graphconf.default.strokewidth)
   	} else {
   		return (graphconf.default.strokewidth)
   	}


   } )
   ;

   vm.node = vm.svg.append("g")
   .attr("class", "nodes")
   .selectAll("circle")
   .data(graph.nodes)
   .enter().append("circle")
   .attr("r", function(d){
   	if (d["@name"] != undefined) {

   		return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
   	} else {
   		return (graphconf.default.r)
   	}

   } )
   .attr("fill",function(d){
   	if (d["@name"] != undefined) {

   		return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].fill || graphconf.default.fill : graphconf.default.fill)
   	} else {
   		return (graphconf.default.fill)
   	}

   } )
   .attr("stroke",function(d){
   	if (d["@name"] != undefined) {

   		return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].stroke || graphconf.default.stroke : graphconf.default.stroke)
   	} else {
   		return (graphconf.default.stroke)
   	}

   } )
   .call(d3.drag()
   	.on("start", dragstarted)
   	.on("drag", dragged)
   	.on("end", dragended));
   vm.node.on("dblclick",function(d){
   	var type=d["@name"];
   	console.log("more on ", d[graphconf.node[type].keyname]);
   	getNode(type,d[graphconf.node[type].keyname]);
   });
   vm.text = vm.svg.append("g")
   .attr("class", "labels")
   .selectAll("g")
   .data(graph.nodes)
   .enter().append("g").append("text")
   .attr("dx", 12)
   .attr("dy", "1em")
	.text(function(d) { // return the value of the property name specified by label or "?"
		if (d["@name"] != undefined) {
			if (graphconf.node[d["@name"]]!=undefined) {
				return (graphconf.node[d["@name"]].label ?  d[graphconf.node[d["@name"]].label] || "?" : "?")
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
      vm.node.append("title")
      .text(function(d) { return ""+d.yearBorn+" ... "+d.yearDied; });
 // Now we create a force layout object and define its properties.
// Those include the dimensions of the visualization and the arrays
// of nodes and links.

vm.simulation = d3.forceSimulation()
.force("charge", d3.forceManyBody().strength(-200))
.force("x", d3.forceX(width / 2))
.force("y", d3.forceY(height / 2))

.force("collisionForce",d3.forceCollide(40).strength(1).iterations(100))
.force("link", d3.forceLink().id(function(d,i) {
	return d.id; }))
.on("tick", ticked); 
// force link ... .distance(100)
 //.force("center", d3.forceCenter(width / 2, height / 2))
}
vm.drawGraph = function () {
	console.log("Draw graph") 
	setup();  
	vm.simulation.nodes(vm.graph.nodes);
	vm.simulation.force("link").links(vm.graph.links);
	vm.simulation.alpha(1).restart();
}
function zoomed() {
	svg.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
}
function ticked() {
	console.log("Ticked ")
	vm.link
	.attr("x1", function(d) { 
		console.log("d "+d.source.x); 
		return d.source.x; })
	.attr("y1", function(d) { return d.source.y; })
	.attr("x2", function(d) { return d.target.x; })
	.attr("y2", function(d) { return d.target.y; });
	

	vm.node
	.attr("cx", function(d) { return d.x; })
	.attr("cy", function(d) { return d.y; });
	vm.text.attr("transform", function(d) { 
		return "translate(" + d.x + "," + d.y + ")"; })
}
a
function nodeClicked(a,b) {
	console.log(" Node clicked "+b);
}
function dragstarted(d) {
	if (!d3.event.active) vm.simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

	function dragged(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragended(d) {
		
		if (!d3.event.active) vm.simulation.alphaTarget(0);
		// keep d.fx and d.fy to stick the node else set back to null 
		//
		//d.fx = null;
		//d.fy = null;
	} 
		/*
		*/
		//setup();

}
     //explicitly creating a directive definition variable
     //this may look verbose but is good for clarification purposes
     //in real life you'd want to simply return the object {...}
     var directiveDefinitionObject = {
         //We restrict its use to an element or attribute
         // so <graphViz or <div graphViz

         restrict: 'EA',
         scope: {
         },
         controller: controller,
         controllerAs: 'vm',

         bindToController:  {
         	graph: '=',
         	conf: '='
         },
         template: "<svg width='850' height='600'></svg>",

         link: function (scope, element) {
         	scope.$watch('vm.graph', function(newVal, oldVal){
         		console.log("****************** Watch graph  "+newVal);
         		if (scope.vm.graph!=undefined) {
         			if (scope.vm.graph.nodes!=undefined) {
         				console.log("****************** graph has nodes: " +scope.vm.graph.nodes.length);
         				if (scope.vm.graph.nodes.length>0) {
         					scope.vm.drawGraph();
         				}
         			}
         		}



         	}, true);
         	scope.$watch('vm.conf', function(newVal, oldVal){
         		console.log("****************** Watch  graphconf ");

         	},true);

         }
     }
     return directiveDefinitionObject;
 }]);