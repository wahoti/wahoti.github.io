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