var app = angular.module('graphexplorer');

/*
*  code copied mainly from 
*   https://github.com/eisman/neo4jd3
*   use line to draw edges
*/


app.service('graphVizService', function ($window) {
	
		console.log(" graphViz Service starting : ");
    var edgetypefield;
		var vm=this;
      var width = 800,
         height = 600;
		var svgRelationships,svgNodes,simulation,relationshipText,relationshipLine;
      var nodes=[];
      var links=[];
		var node,relationship;


		
		vm.d3 = $window.d3;
		var graphconf={node:{}, link:{}};
		
		vm.test= function(msg){
			console.log(" Message : "+msg);
		}
		
   function merge(target, source) {
        Object.keys(source).forEach(function(property) {
            target[property] = source[property];
        });
    }
   function initSimulation() {
        var simulation = d3.forceSimulation()
//                           .velocityDecay(0.8)
//                           .force('x', d3.force().strength(0.002))
//                           .force('y', d3.force().strength(0.002))
                           .force('collide', d3.forceCollide().radius(function(d) {
                               return 40;
                           }).iterations(2))
                           .force('charge', d3.forceManyBody())
                           .force('link', d3.forceLink().id(function(d) {
                               return d.id;
                           }))
                           .force('center', d3.forceCenter(width / 2, height / 2))
                           .on('tick', function() {
                               ticked();
                           })
                           .on('end', function() {
                              // if (options.zoomFit && !justLoaded) {
                              //     justLoaded = true;
                              //     zoomFit(2);
                              // }
                           });

        return simulation;
    }
    // init the selector and copy conf
    // init svgRelationships and svgNodes
vm.init = function (selector,_graphconf) {
    graphconf=_graphconf;
    edgetypefield = graphconf.default.edgetypefield ||  "relType";
    container = d3.select(selector);

    container.attr('class', 'neo4jd3')
                 .html('');
    svg = container.append('svg')
                       .attr('width', width)
                       .attr('height', height)
                       .attr('class', 'neo4jd3-graph');
                       
    svg.append("svg:defs").append("svg:marker")    // This section adds in the arrows
    .attr("id", "Arrow")
    .attr("class","arrow")
    .attr("viewBox", "-2 -2 5 5")
    .attr("refX", 0)
    .attr("refY", 0)
    .attr("markerWidth", 5)
    .attr("markerHeight", 5)
    .attr("markerUnits","strokeWidth")
    .attr("orient", "auto")
    .append("polygon").attr("points","-2,1.5 0,0 -2,-1.5");

     svg=svg.append('g')
                       .attr('width', '100%')
                       .attr('height', '100%');
    

      nodes=[];
      links=[];   
         svg.selectAll("*").remove();
   svgRelationships = svg.append('g')
                              .attr('class', 'relationships');

   svgNodes = svg.append('g')
                      .attr('class', 'nodes');
   
    simulation = initSimulation();
   }
   function toString(d) {
      var title="";
      for (a in d) {
         title+=a+" : "+d[a]+"\x0A";
      }
      return title; 
   }
   function updateNodes(n) {
        Array.prototype.push.apply(nodes, n);

        var svgNodeData = svgNodes.selectAll('.node')
                       .data(nodes, function(d) { return d.id; });

       node = svgNodeData.enter()
                   .append('g')
                   .attr('class', 'node')
                    .on("dblclick",function(d){
                        var type=d["@name"];
                        console.log("more on ", d[graphconf.node[type].keyname]);
                        getNode(type,d[graphconf.node[type].keyname],false,d.x,d.y);
                     })
                   .on('click', function(d) {})
                   .on('mouseenter', function(d) {})
                   .on('mouseleave', function(d) {})
                   .call(d3.drag()
                     .on("start", dragstarted)
                     .on("drag", dragged)
                     .on("end", dragended));


       node.append('circle')
                   .attr('class', 'ring')
                   .attr('r', function(d){
                     var cr=0;
                     if (d["@name"] != undefined) {

                        cr= (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
                     } else {
                        cr= (graphconf.default.r)
                     }
                        return 1.16*cr;
                     })
                   .append('title').text(function(d) {
                       return toString(d);
                   });
      node.append('circle')
                   .attr('class', 'outline')
                   .attr('r', function(d){
                     if (d["@name"] != undefined) {

                        return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
                     } else {
                        return (graphconf.default.r)
                     }

                     })
                  .style("fill",function(d){
                     if (d["@name"] != undefined) {

                        return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].fill || graphconf.default.fill : graphconf.default.fill)
                     } else {
                        return (graphconf.default.fill)
                     }

                  } )
                  .style("stroke",function(d){
                     if (d["@name"] != undefined) {

                        return (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].stroke || graphconf.default.stroke : graphconf.default.stroke)
                     } else {
                        return (graphconf.default.stroke)
                     }

                  } )
                   .append('title').text(function(d) {
                       return toString(d);
                   });
        node.append("text")
        .attr('class', 'text') 
        .attr("dx", 0)
        .attr("dy", function(d){
                     var cr=0;
                     if (d["@name"] != undefined) {

                        cr= (graphconf.node[d["@name"]] ? graphconf.node[d["@name"]].r || graphconf.default.r : graphconf.default.r)
                     } else {
                        cr= (graphconf.default.r)
                     }
                        return cr+10;  // add size of font to radius to position text
                     }
               )
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
         .style("text-anchor", "middle")
         .style("font-size", "10px")
              

         node = node.merge(svgNodeData);
         }

            
    function updateRelationships(r) {

      Array.prototype.push.apply(links, r);

      svgRelationshipsData = svgRelationships.selectAll('.relationship')
                                       .data(links, function(d) { return d.id; });
      relationship = svgRelationshipsData.enter()
                           .append('g')
                           .attr('class', 'relationship');

     // add patch 
    
   var line=relationship.append('path')
                .attr('class', 'line')
                .attr("stroke-dasharray",function(d){
                     if (d[edgetypefield] != undefined) {

                        return (graphconf.link[d[edgetypefield]] ? graphconf.link[d[edgetypefield]].strokedash || graphconf.default.linkstrokedash : graphconf.default.linkstrokedash)
                     } else {
                        return (graphconf.default.linkstrokedash)
                     }


                  } )
               .attr("stroke-width",function(d){
                  if (d[edgetypefield] != undefined) {

                     return (graphconf.link[d[edgetypefield]] ? graphconf.link[d[edgetypefield]].strokewidth || graphconf.default.strokewidth : graphconf.default.strokewidth)
                  } else {
                     return (graphconf.default.strokewidth)
                  }
               })
               .attr("marker-end", function(d) {
                  var directed = graphconf.link[d[edgetypefield]] ? graphconf.link[d[edgetypefield]].directed || false : false;
                  if (directed) {
                      return "url(#Arrow)"
                  } 
                  return ("")
              });
    var text=relationship.append('text')
                .attr('class', 'text')
                .attr('fill', '#000000')
                .attr('font-size', '10px')
                .attr('pointer-events', 'none')
                .attr('text-anchor', 'middle')
                .text(function(d) {
                    return d[edgetypefield];
                });
                  //  .attr('dominant-baseline='middle')

   var outline=relationship.append('path')
                .attr('class', 'outline')
                .attr('fill', '#a5abb6')
                .attr('stroke', 'none');
  

   relationship = relationship.merge(svgRelationshipsData);
        relationshipLine = svg.selectAll('.relationship .line');
        relationshipLine = line.merge(relationshipLine);
        
        relationshipOutline = svg.selectAll('.relationship .outline');
        relationshipOutline = outline.merge(relationshipOutline);

      

        relationshipText = svg.selectAll('.relationship .text');
        relationshipText = text.merge(relationshipText);
   }
   /*
   .attr("stroke-dasharray",function(d){
      if (d[edgetypefield] != undefined) {

         return (graphconf.link[d[edgetypefield]] ? graphconf.link[d[edgetypefield]].strokedash || graphconf.default.linkstrokedash : graphconf.default.linkstrokedash)
      } else {
         return (graphconf.default.linkstrokedash)
      }


   } )
   .attr("stroke-width",function(d){
      if (d[edgetypefield] != undefined) {

         return (graphconf.link[d[edgetypefield]] ? graphconf.link[d[edgetypefield]].strokewidth || graphconf.default.strokewidth : graphconf.default.strokewidth)
      } else {
         return (graphconf.default.strokewidth)
      }


   } )
   */
   

vm.drawGraph = function (graph, dx=0, dy=0) {
   //vm.graph=graph;
   
   //var rawSvg = $element.find("svg")[0];
   
	console.log("Draw graph") 
	//setup(); 
        updateRelationships(graph.links);
        updateNodes(graph.nodes);

        simulation.nodes(nodes);
        simulation.force('link').links(links); 
	
}
    function rotate(cx, cy, x, y, angle) {
        var radians = (Math.PI / 180) * angle,
            cos = Math.cos(radians),
            sin = Math.sin(radians),
            nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
            ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;

        return { x: nx, y: ny };
    }
    function rotation(source, target) {
        return Math.atan2(target.y - source.y, target.x - source.x) * 180 / Math.PI;
    }
   function rotatePoint(c, p, angle) {
        return rotate(c.x, c.y, p.x, p.y, angle);
    }
 
function zoomed() {
	svg.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")" + " scale(" + d3.event.transform.k + ")");
}
function ticked() {
	console.log("Ticked ")
	        if (node) {
            node.attr('transform', function(d) {
                return 'translate(' + d.x + ', ' + d.y + ')';
            });
        }
	        if (relationship) {
          //  relationship.attr('transform', function(d) {
          //      var angle = rotation(d.source, d.target);
          //      return 'translate(' + d.source.x + ', ' + d.source.y + ') rotate(' + angle + ')';
          //  });
         }
         relationshipLine.attr("d", function(d) { 
             var targetType=d.target["@name"];
             if (targetType != undefined) {
                var r = (graphconf.node[targetType] ? graphconf.node[targetType].r || graphconf.default.r : graphconf.default.r)
             } else {
                var r =  (graphconf.default.r)
             }

                     
            var x1=d.source.x,y1=d.source.y,x2=d.target.x,y2=d.target.y;

            var dx=x2-x1,dy=y2-y1,L=Math.sqrt(dx*dx+dy*dy);
            var dl=1.5*r;
            var xt=x1+(L-dl)*(x2-x1)/L;
            var yt=y1+(L-dl)*(y2-y1)/L;
            var path="M "+x1+" "+y1+" L "+xt+" "+yt;

                        return path; });
                        
   
         relationshipText.attr('transform', function(d) {
            var angle = rotation(d.source, d.target);
            if (angle >90 ) angle -=180;
            if (angle < -90) angle+=180;

            var point = { x: (d.target.x + d.source.x) * 0.5 , y: (d.target.y + d.source.y) * 0.5 };

            return 'translate(' + point.x + ', ' + point.y + ') rotate(' + angle + ')';
        });

	   
//	vm.text.attr("transform", function(d) { 
//		return "translate(" + d.x + "," + d.y + ")"; })
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
		// keep d.fx and d.fy to stick the node else set back to null 
		//
		//d.fx = null;
		//d.fy = null;
	} 
		/*
		*/
		//setup();

}
   
     );