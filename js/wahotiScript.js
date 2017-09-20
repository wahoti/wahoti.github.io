function test_import() {
	console.log('import success! \t document.baseURI: ' + document.baseURI);
}

function imported() {
	console.log('Hi I am function from wahotiScript');
}

function insertAfter( referenceNode, newNode )
{
    referenceNode.parentNode.insertBefore( newNode, referenceNode.nextSibling );
}

function makeABox() {
	
	var newBox = document.createElement("div");
	newBox.setAttribute("class", "box");
	var boxer = document.getElementById("boxer");
	insertAfter(boxer, newBox);
}

function startDarkSquares(){
	var update_interval = setInterval(
		function()
		{
			for(var f in acts){ f(); }
			for(var x in objects){ objects[x].step(); }
			
		}
	, 16);

	var draw_interval = setInterval( function() {	
		console.log('draw');
	} , 16);
}