var ALL_NOTES_LOADED = false;

function startupNotes() {
	var isScriptLoaded = false;
	var scripts = document.getElementsByTagName('script');
	var links = document.getElementsByTagName('link');
	var head = document.getElementsByTagName('head')[0];
	for (var i = 0; i < scripts.length; i++) {
		if (scripts[i].src == 'http://www.se.rit.edu/~agp2572/Notes/notes.js') {
			isScriptLoaded = true;
		}
	}
	var isStyleLoaded = false;
	for (var i = 0; i < links.length; i++) {
		if (links[i].src == 'http://www.se.rit.edu/~agp2572/Notes/notes.css') {
			isStyleLoaded = true;
		}
	}
		
	if (!isScriptLoaded) {
		var z = document.createElement('script');
		z.src = 'http://www.se.rit.edu/~agp2572/Notes/notes.js';
		head.appendChild(z);		
	}
	if (!isStyleLoaded) {
		var l = document.createElement('link');
		l.rel = 'stylesheet';
		l.type = 'text/css';
		l.media = 'screen';
		l.href = 'http://www.se.rit.edu/~agp2572/Notes/notes.css';
		head.appendChild(l);
	}
}

function dropAllNotes() {
	var notes = document.getElementsByClassName("website-annotation-note");
	for (var i = 0; i < notes.length; i++) {
		document.body.removeChild(notes[i]);
	}
	
}

function showAllNotes() {
	var notes = document.getElementsByClassName("website-annotation-note");
	if (!ALL_NOTES_LOADED && LOAD_ALL) {
		while (notes.length > 0) {
			document.body.removeChild(notes[0]);
		}
		loadAllNotes();
		ALL_NOTES_LOADED = true;
	}
	notes = document.getElementsByClassName("website-annotation-note");
	if (notes.length == 0 && !ALL_NOTES_LOADED) {
		var tmpNote = newNote();
		tmpNote.editField.innerHTML = "You dont have any notes on this site. Here is a new one.";
	}
	for (var i = 0; i < notes.length; i++) {
		notes[i].style.display = "block";
	}
}

startupNotes();
