var db;
 
try {
    if (window.openDatabase) {
        db = openDatabase("MyNotes", "1.0", "Database for storing note for a website", 200000);
        if (!db)
            alert("Failed to open the database on disk.  This is probably because the version was bad or there is not enough storage space left");
    } else
        alert("Your browser does not support HTML5 offline database storage. Please try using Google Chrome or Safari browser for this Web App to work properly");
} catch(err) { }
 
var captured = null;
var highestZ = 9999;
var highestId = 0;
 
function Note() {
    var self = this;
 
    var note = document.createElement('div');
    note.className = 'website-annotation-note';
    note.addEventListener('mousedown', function(e) { 
    	return self.onMouseDown(e) 
    }, false);
    note.addEventListener('click', function() { 
    	return self.onNoteClick() 
    }, false);
    this.note = note;

    document.body.appendChild(note);
 
    var close = document.createElement('div');
    close.className = 'closebutton';
    close.addEventListener('click', function(event) { 
    	return self.close(event) 
    }, false);
    note.appendChild(close);
 
    var edit = document.createElement('div');
    edit.className = 'edit';
    edit.setAttribute('contenteditable', true);
    edit.addEventListener('keyup', function() { 
    	return self.onKeyUp() 
    }, false);
    note.appendChild(edit);
    this.editField = edit;
 
	var footer = document.createElement('div');
	footer.className = "footer";
    var ts = document.createElement('div');
    ts.className = 'time-stamp';
    ts.addEventListener('mousedown', function(e) { 
    	return self.onMouseDown(e) }, 
    false);
    footer.appendChild(ts);
    this.lastModified = ts;
 
    var hide = document.createElement('div');
    hide.innerHTML = "Hide";
    hide.className = 'hide';
    hide.addEventListener('mousedown', function(e) { 
    	self.note.style.display = "none"; return e; 
    }, false);
    footer.appendChild(hide);
    note.appendChild(footer);

/*        
    var resizeImg = document.createElement("img");
    resizeImg.src = "http://www.se.rit.edu/~agp2572/Site/Notes/resize.png";
    resizeImg.className = "resize";
    resizeImg.addEventListener('mousedown', function(e) {
    	return self.onMouseDownForResize(e);
    }, false);
    
	note.appendChild(resizeImg);
*/

    this.hideNode = hide;
    
    return this;
}
 
Note.prototype = {
    get id() {
        if (!("_id" in this))
            this._id = 0;
        return this._id;
    },
 
    set id(x) {
        this._id = x;
    },
 
    get text() {
        return this.editField.innerHTML;
    },
 
    set text(x) {
        this.editField.innerHTML = x;
    },
 
    get timestamp() {
        if (!("_timestamp" in this))
            this._timestamp = 0;
        return this._timestamp;
    },
 
    set timestamp(x) {
        if (this._timestamp == x)
            return;
 
        this._timestamp = x;
        var date = new Date();
        date.setTime(parseFloat(x));
        this.lastModified.textContent = modifiedString(date);
    },
 
    get left() {
        return this.note.style.left;
    },
 
    set left(x) {
        this.note.style.left = x;
    },
 
    get top() {
        return this.note.style.top;
    },
 
    set top(x) {
        this.note.style.top = x;
    },
    
    get width() {
		return this.note.style.minWidth;
    },
    
    set width(x) {
    	this.note.style.minWidth = x;
    },

    get height() {
		return this.note.style.minHeight;
    },
    
    set height(x) {
    	this.note.style.minHeight = x;
    },

 
    get zIndex() {
        return this.note.style.zIndex;
    },
 
    set zIndex(x) {
        this.note.style.zIndex = x;
    },
 
    close: function(event) {
    	try {
	        this.cancelPendingSave();
	 
	        var note = this;
	        db.transaction(function(tx) {
	            tx.executeSql("DELETE FROM StickyNotes WHERE id = ?", [note.id]);
	        });
    	} catch(exception) {
    	}        
        var duration = event.shiftKey ? 2 : .25;
        this.note.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in, opacity ' + duration + 's ease-in';
        this.note.offsetTop; // Force style recalc
        this.note.style.webkitTransformOrigin = "0 0";
        this.note.style.webkitTransform = 'skew(30deg, 0deg) scale(0)';
        this.note.style.opacity = '0';
 
        var self = this;
        setTimeout(function() { document.body.removeChild(self.note) }, duration * 1000);
    },
 
    saveSoon: function() {
        this.cancelPendingSave();
        var self = this;
        this._saveTimer = setTimeout(function() { self.save() }, 200);
    },
 
    cancelPendingSave: function() {
        if (!("_saveTimer" in this))
            return;
        clearTimeout(this._saveTimer);
        delete this._saveTimer;
    },
 
    save: function() {
    	try {
	        this.cancelPendingSave();
	 
	        if ("dirty" in this) {
	            this.timestamp = new Date().getTime();
	            delete this.dirty;
	        }
	 
	        var note = this;
	        db.transaction(function (tx)
	        {
	            tx.executeSql("UPDATE StickyNotes SET note = ?, timestamp = ?, left = ?, top = ?, zindex = ?, width = ?, height = ? WHERE id = ?", [note.text, note.timestamp, note.left, note.top, note.zIndex, note.width, note.height, note.id]);
	        });
    	} catch(exception) {	
    	}
    },
 
    saveAsNew: function() {
    	try {
	        this.timestamp = new Date().getTime();
	        
	        var note = this;
	        db.transaction(function (tx) 
	        {
	            tx.executeSql("INSERT INTO StickyNotes (id, note, timestamp, left, top, zindex, width, height, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [note.id, note.text, note.timestamp, note.left, note.top, note.zIndex, note.width, note.height, window.location.toString()]);
	        });
    	} catch(exception) {
    	}	 
    },

    onMouseDownForResize: function(e) {
        captured = this;
        this.resizeStartX = e.clientX - this.note.offsetWidth + 15;
        this.resizeStartY = e.clientY - this.note.offsetHeight + 15;
        this.zIndex = ++highestZ;
        var self = this;
        if (!this.mouseMoveHandler) {
            this.mouseMoveHandler = function(e) { return self.onMouseMoveForResize(e) }
            this.mouseUpHandler = function(e) { return self.onMouseUp(e) }
        }
        document.addEventListener('mousemove', this.mouseMoveHandler, true);
        document.addEventListener('mouseup', this.mouseUpHandler, true);
 
        return false;
    },
    
    onMouseMoveForResize: function(e) {
        if (this != captured)
            return true; 

		var newHeight = e.clientY - this.resizeStartY;
		var newWidth = e.clientX - this.resizeStartX;
		if (newHeight < 50) {
			newHeight = 50;
		} 
		if (newWidth < 160) {
		    newWidth = 160;
		}
		this.minHeight = newHeight + 'px';
		this.minWidth = newWidth + 'px';
        return false;
    },	
 
    onMouseDown: function(e) {
        captured = this;
        this.startX = e.clientX - this.note.offsetLeft;
        this.startY = e.clientY - this.note.offsetTop;
        this.zIndex = ++highestZ;
 
        var self = this;
        if (!this.mouseMoveHandler) {
            this.mouseMoveHandler = function(e) { return self.onMouseMove(e) }
            this.mouseUpHandler = function(e) { return self.onMouseUp(e) }
        }
 
        document.addEventListener('mousemove', this.mouseMoveHandler, true);
        document.addEventListener('mouseup', this.mouseUpHandler, true);
 
        return false;
    },
 
    onMouseMove: function(e) {
        if (this != captured)
            return true;
            
        this.left = e.clientX - this.startX + 'px';
        this.top = e.clientY - this.startY + 'px';
        return false;
    },
 
    onMouseUp: function(e) {
        document.removeEventListener('mousemove', this.mouseMoveHandler, true);
        document.removeEventListener('mouseup', this.mouseUpHandler, true);
        this.mouseMoveHandler = null;
        this.save();
        return false;
    },
 
    onNoteClick: function(e) {
        this.editField.focus();
        getSelection().collapseToEnd();
    },
 
    onKeyUp: function() {
        this.dirty = true;
        this.saveSoon();
    },
}
 
function loaded() {
	try {
	    db.transaction(function(tx) {
	        tx.executeSql("SELECT COUNT(*) FROM StickyNotes", [], function(result) {
				if (!window.LOAD_ALL) {
					loadNotes(); 				
				} else {
					loadAllNotes();
				}
	        }, function(tx, error) {
	            tx.executeSql("CREATE TABLE StickyNotes (id REAL UNIQUE, note TEXT, timestamp REAL, left TEXT, top TEXT, zindex REAL, width TEXT, height TEXT, location TEXT)", [], function(result) { 
					loadNotes(); 
	            });
	        });
	    });
	} catch(exception) {
	}
}

function loadAllNotes() {
    loadNotes("SELECT id, note, timestamp, left, top, zindex, width, height FROM StickyNotes");
}
 
function loadNotes(sqlQuery) {
	try {
	    var loadAllQuery = true;
	
	    if (!sqlQuery) {
	        sqlQuery = "SELECT id, note, timestamp, left, top, zindex, width, height FROM StickyNotes WHERE location = ?";
			loadAllQuery = false;
	    }
	    
	    db.transaction(function(tx) {
	        tx.executeSql("SELECT id FROM StickyNotes", [], function(tx, result) {
	            for (var i = 0; i < result.rows.length; ++i) {
	            	var row = result.rows.item(i);
	                if (row['id'] > highestId) {
	                    highestId = row['id'];
	                }
	            }
	        }, function(tx, error) {
	            alert('Failed to retrieve notes from database - ' + error.message);
	            return;
	        });
	    });
	
		
	    db.transaction(function(tx) {
		if (loadAllQuery) {
			tx.executeSql(sqlQuery, [], function(tx, result) {
					for (var i = 0; i < result.rows.length; ++i) {
						var row = result.rows.item(i);
						var note = new Note();
						note.id = row['id'];
						note.text = row['note'];
						note.timestamp = row['timestamp'];
						note.left = row['left'];
						note.top = row['top'];
						note.zIndex = row['zindex'];
						note.height = row['height'];
						note.width = row['width'];
						if (row['zindex'] > highestZ) {
							highestZ = row['zindex'];
						}
					}
					if (!result.rows.length) {
						var tmpNote = newNote();
						tmpNote.editField.innerHTML = "You dont have any notes on this site. So here is your first note. Edit Me!";
					}
				}, function(tx, error) {
					alert('Failed to retrieve notes from database - ' + error.message);
					return;
				});
		} else {
			tx.executeSql(sqlQuery, [window.location.toString()], function(tx, result) {
					for (var i = 0; i < result.rows.length; ++i) {
						var row = result.rows.item(i);
						var note = new Note();
						note.id = row['id'];
						note.text = row['note'];
						note.timestamp = row['timestamp'];
						note.left = row['left'];
						note.top = row['top'];
						note.zIndex = row['zindex'];
						note.height = row['height'];
						note.width = row['width'];
						if (row['zindex'] > highestZ) {
							highestZ = row['zindex'];
						}
					}
					
					if (!result.rows.length) {
						var tmpNote = newNote();
						tmpNote.editField.innerHTML = "You dont have any notes on<br/> this site.<br/>So here is your first note.<br/>Edit Me!";
						window.CREATE_NEW_NOTE = false;
					}
					if (window.CREATE_NEW_NOTE) {
						newNote();	
					}
				}, function(tx, error) {
					alert('Failed to retrieve notes from database - ' + error.message);
					return;
				});
			}
	    });
	} catch(exception) {
		console.log(exception);
	}
}
 
function modifiedString(date) {
	var now = new Date();
	var dateString = 'Last Modified: ';
	if (now.getFullYear() != date.getFullYear()) {
		dateString += date.getFullYear() + '-';
	}
	if (now.getMonth() != date.getMonth()) {
		dateString += (date.getMonth() + 1) + '-';
	}
	if (now.getDate() != date.getDate()) {
		dateString += date.getDate() + ' ';
	} else {
		dateString += 'Today at ';
	}
	if (date.getHours() > 12) {
		dateString += (date.getHours() % 12) + ':' + date.getMinutes() + 'pm';
	} else {
		dateString += date.getHours() + ':' + date.getMinutes() + 'am';
	}
	return dateString;
}
 
function newNote() {
    var note = new Note();
    note.id = ++highestId;
    note.timestamp = new Date().getTime();
    note.left = Math.round(Math.random() * 650) + 'px';
    note.top = Math.round(Math.random() * 270) + 'px';
    note.width = 200 + 'px';
    note.height = 200 + 'px';
    note.zIndex = ++highestZ;
	note.saveAsNew();
    return note;
}

loaded();
