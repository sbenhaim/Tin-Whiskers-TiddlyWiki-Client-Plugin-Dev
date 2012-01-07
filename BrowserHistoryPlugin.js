version.extensions.BrowserHistoryPlugin= {major: 2, minor: 9, revision: 7, date: new Date(2010,11,30)};

config.paramifiers.SPM = { onstart: function(v) {
	config.options.chkSinglePageMode=eval(v);
		config.lastURL = window.location.hash;
		if (!config.SPMTimer) config.SPMTimer=window.setInterval(function() {checkLastURL();},1000);
} };
if (config.options.chkSinglePageMode==undefined)
	config.options.chkSinglePageMode=false;
if (config.options.chkSinglePagePermalink==undefined)
	config.options.chkSinglePagePermalink=true;
if (config.options.chkSinglePageKeepFoldedTiddlers==undefined)
	config.options.chkSinglePageKeepFoldedTiddlers=false;
if (config.options.chkSinglePageKeepEditedTiddlers==undefined)
	config.options.chkSinglePageKeepEditedTiddlers=false;
if (config.options.chkTopOfPageMode==undefined)
	config.options.chkTopOfPageMode=false;
if (config.options.chkBottomOfPageMode==undefined)
	config.options.chkBottomOfPageMode=false;
if (config.options.chkSinglePageAutoScroll==undefined)
	config.options.chkSinglePageAutoScroll=false;
config.SPMTimer = 0;
config.lastURL = window.location.hash;

var popped =  false;
window.onpopstate  =  function ( e ) {
	
	if (!config.options.chkSinglePageMode) {
		return;
	}
	
	var tiddler = window.location.hash.substr( 1 );
	// var tiddler = window.location.pathname.split( /\// ).pop( );
	var tids = decodeURIComponent( tiddler ).readBracketedList();

	if (tids.length==1) {
		popped  =  true;
		story.displayTiddler(null,tids[0]);
	}
	else { // restore permaview or default view
		if (!tids.length) tids=store.getTiddlerText("DefaultTiddlers").readBracketedList();
		story.closeAllTiddlers();
		story.displayTiddlers(null,tids);
	}
}

function checkLastURL()
{
	if (!config.options.chkSinglePageMode)
		{ window.clearInterval(config.SPMTimer); config.SPMTimer=0; return; }
	if (config.lastURL == window.location.hash) return; // no change in hash
	var tids=decodeURIComponent(window.location.hash.substr(1)).readBracketedList();
	if (tids.length==1) // permalink (single tiddler in URL)
		story.displayTiddler(null,tids[0]);
	else { // restore permaview or default view
		config.lastURL = window.location.hash;
		if (!tids.length) tids=store.getTiddlerText("DefaultTiddlers").readBracketedList();
		story.closeAllTiddlers();
		story.displayTiddlers(null,tids);
	}
}


if (Story.prototype.SPM_coreDisplayTiddler==undefined)
	Story.prototype.SPM_coreDisplayTiddler=Story.prototype.displayTiddler;
Story.prototype.displayTiddler = function(srcElement,tiddler,template,animate,slowly)
{
	var title=(tiddler instanceof Tiddler)?tiddler.title:tiddler;
	var tiddlerElem=story.getTiddler(title); // ==null unless tiddler is already displayed
	var opt=config.options;
	var single=opt.chkSinglePageMode && !startingUp;
	var top=opt.chkTopOfPageMode && !startingUp;
	var bottom=opt.chkBottomOfPageMode && !startingUp;
	if (single) {
		story.forEachTiddler(function(tid,elem) {
			// skip current tiddler and, optionally, tiddlers that are folded.
			if (	tid==title
				|| (opt.chkSinglePageKeepFoldedTiddlers && elem.getAttribute("folded")=="true"))
				return;
			// if a tiddler is being edited, ask before closing
			if (elem.getAttribute("dirty")=="true") {
				if (opt.chkSinglePageKeepEditedTiddlers) return;
				// if tiddler to be displayed is already shown, then leave active tiddler editor as is
				// (occurs when switching between view and edit modes)
				if (tiddlerElem) return;
				// otherwise, ask for permission
				var msg="'"+tid+"' is currently being edited.\n\n";
				msg+="Press OK to save and close this tiddler\nor press Cancel to leave it opened";
				if (!confirm(msg)) return; else story.saveTiddler(tid);
			}
			story.closeTiddler(tid);
		});
	}
	else if (top)
		arguments[0]=null;
	else if (bottom)
		arguments[0]="bottom";
	if (single && opt.chkSinglePagePermalink) {
		if ( popped ) {
			popped = false;
		}
		else {
			var url = encodeURIComponent(String.encodeTiddlyLink(title));
			var title = wikifyPlain("SiteTitle") + " - " + title;
			document.title = title;
			// console.log( window.location.href + '#' + url );
			history.pushState( {}, title, '#' + url );
		}
	}
	if (tiddlerElem && tiddlerElem.getAttribute("dirty")=="true") { // editing... move tiddler without re-rendering
		var isTopTiddler=(tiddlerElem.previousSibling==null);
		if (!isTopTiddler && (single || top))
			tiddlerElem.parentNode.insertBefore(tiddlerElem,tiddlerElem.parentNode.firstChild);
		else if (bottom)
			tiddlerElem.parentNode.insertBefore(tiddlerElem,null);
		else this.SPM_coreDisplayTiddler.apply(this,arguments); // let CORE render tiddler
	} else
		this.SPM_coreDisplayTiddler.apply(this,arguments); // let CORE render tiddler
	var tiddlerElem=story.getTiddler(title);
	if (tiddlerElem&&opt.chkSinglePageAutoScroll) {
		// scroll to top of page or top of tiddler
		var isTopTiddler=(tiddlerElem.previousSibling==null);
		var yPos=isTopTiddler?0:ensureVisible(tiddlerElem);
		// if animating, defer scroll until after animation completes
		var delay=opt.chkAnimate?config.animDuration+10:0;
		setTimeout("window.scrollTo(0,"+yPos+")",delay); 
	}
}

if (Story.prototype.SPM_coreDisplayTiddlers==undefined)
	Story.prototype.SPM_coreDisplayTiddlers=Story.prototype.displayTiddlers;
Story.prototype.displayTiddlers = function() {
	// suspend single/top/bottom modes when showing multiple tiddlers
	var opt=config.options;
	var saveSPM=opt.chkSinglePageMode; opt.chkSinglePageMode=false;
	var saveTPM=opt.chkTopOfPageMode; opt.chkTopOfPageMode=false;
	var saveBPM=opt.chkBottomOfPageMode; opt.chkBottomOfPageMode=false;
	this.SPM_coreDisplayTiddlers.apply(this,arguments);
	opt.chkBottomOfPageMode=saveBPM;
	opt.chkTopOfPageMode=saveTPM;
	opt.chkSinglePageMode=saveSPM;
}
