# tgdb-rest-api
Generic REST API for TIBCO Graph DB

The server connects to one graph DB
At the moment the REST API is anonymous and server side connects to graph DB with system user/password.

#Install

clone this repo

edit api.conf 
`
> npm install

> node api.js
`

# REST API 
**baseurl  : http://host:port/tgdb**


### Get metadata
GET /metadata

### Create a node 

POST /node/<<nodeType>>

Body
'
{ "a": "value",

…}
'

###Create an edge 
POST /edge

Body 
{
	"source": {
		"type": "houseMemberType",
		"memberame": "Raphael"
	},
	"target": {
		"type": "houseMemberType",
		"memberName": "Raphael2"
	},
	"properties" : {
		"relType": "know",
		"since": "now"
	}
    
}

###Get a NODE 
GET /node/<<type>>/<<keyValue>>/<<keyValue>>/...
With the assumption that key values are given in the order of primary keys defined for this type.
Ex:
http://127.0.0.1:84/tgdb/node/houseMemberType/Joseph%20Bonaparte
### Update a  NODE 
UPDATE /node/<<type>>/<<keyValue>>/<<keyValue>>/…
Body : json with properties and value

Assumption that key values are given in the order of primary keys defined for this type.
Ex:
http://127.0.0.1:84/tgdb/node/houseMemberType/Joseph%20Bonaparte


###Search Nodes
POST /search/
Body contains the query string : 
Sample body :
{
	"query":"@nodetype = 'houseMemberType' and yearBorn > 0;"
}

## TEST 
A Postman export is provided for tests on the "House" sample DB.

# Graph Browser Application
just access baseurl from a browser supporting svg.

Features:
* get the metadata of the graph
* select a known node type and enter primary key value ( UI supports only one primary key )
* UI displays node and all links from that node.
* hoover a node to see all attributes
* double-click a node to expand to all realtions of this node.
* drag and drop a node to fix its position.
* configure node size, colors and such in graphconf.json file.




 

