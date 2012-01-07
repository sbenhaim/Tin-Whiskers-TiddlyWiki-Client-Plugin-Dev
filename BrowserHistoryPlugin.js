version.extensions.BrowserHistoryPlugin= {major: 0, minor: 1, revision: 1, date: new Date(2012, 1, 7)};

config.paramifiers.BHP = { onstart: function(v) {
	config.options.chkBrowserHistoryMode=eval(v);
} };

if (config.options.chkBrowserHistoryMode == undefined)
	config.options.chkBrowserHistoryMode = false;

if (config.options.chkBrowserHistoryKeepFoldedTiddlers == undefined)
	config.options.chkBrowserHistoryKeepFoldedTiddlers = false;

if (config.options.chkBrowserHistoryKeepEditedTiddlers == undefined)
	config.options.chkBrowserHistoryKeepEditedTiddlers = false;

var popped =  false;
window.onpopstate  =  function ( e ) {
	
	if (!config.options.chkBrowserHistoryMode) {
		return;
	}
	
	var tiddler = window.location.hash.substr( 1 );
	// var tiddler = window.location.pathname.split( /\// ).pop( );
	var tids = decodeURIComponent( tiddler ).readBracketedList();

	if (tids.length==1) {
		popped  =  true;
		story.displayTiddler(null, tids[0]);
	}
	else {
		if (!tids.length) tids=store.getTiddlerText("DefaultTiddlers").readBracketedList();
		story.closeAllTiddlers();
		story.displayTiddlers(null, tids);
	}
}

if ( Story.prototype.BHP_coreDisplayTiddler==undefined ) {
	Story.prototype.BHP_coreDisplayTiddler=Story.prototype.displayTiddler;
}

Story.prototype.displayTiddler = function( srcElement, tiddler, template, animate, slowly )
{
	var title = ( tiddler instanceof Tiddler )?tiddler.title:tiddler;
	var tiddlerElem = story.getTiddler( title ); //  =  = null unless tiddler is already displayed
	var opt = config.options;
	var single = opt.chkBrowserHistoryMode && !startingUp;
	
	if ( single ) {
		story.forEachTiddler( function( tid, elem ) {
			// skip current tiddler and, optionally, tiddlers that are folded.
			if ( 	tid==title
				|| ( opt.chkBrowserHistoryKeepFoldedTiddlers && elem.getAttribute( "folded" )=="true" ) )
				return;
			// if a tiddler is being edited, ask before closing
			if ( elem.getAttribute( "dirty" )=="true" ) {
				if ( opt.chkBrowserHistoryKeepEditedTiddlers ) return;
				// if tiddler to be displayed is already shown, then leave active tiddler editor as is
				// ( occurs when switching between view and edit modes )
				if ( tiddlerElem ) return;
				// otherwise, ask for permission
				var msg="'"+tid+"' is currently being edited.\n\n";
				msg+="Press OK to save and close this tiddler\nor press Cancel to leave it opened";
				if ( !confirm( msg ) ) return; else story.saveTiddler( tid );
			}
			story.closeTiddler( tid );
		} );
		
		if (  popped  ) {
			popped = false;
		}
		else {
			var url = encodeURIComponent( String.encodeTiddlyLink( title ) );
			var title = wikifyPlain( "SiteTitle" ) + " - " + title;
			document.title = title;
			history.pushState(  {}, title, '#' + url  );
		}
	}
	
	if ( tiddlerElem && tiddlerElem.getAttribute( "dirty" )=="true" ) { // editing... move tiddler without re-rendering
		var isTopTiddler=( tiddlerElem.previousSibling==null );
		if ( !isTopTiddler && ( single || top ) )
			tiddlerElem.parentNode.insertBefore( tiddlerElem, tiddlerElem.parentNode.firstChild );
		else if ( bottom )
			tiddlerElem.parentNode.insertBefore( tiddlerElem, null );
		else this.BHP_coreDisplayTiddler.apply( this, arguments ); // let CORE render tiddler
	} else {
		this.BHP_coreDisplayTiddler.apply( this, arguments ); // let CORE render tiddler
	}
	
	var tiddlerElem=story.getTiddler( title );
	
	if ( tiddlerElem&&opt.chkBrowserHistoryAutoScroll ) {
		// scroll to top of page or top of tiddler
		var isTopTiddler=( tiddlerElem.previousSibling==null );
		var yPos=isTopTiddler?0:ensureVisible( tiddlerElem );
		// if animating, defer scroll until after animation completes
		var delay=opt.chkAnimate?config.animDuration+10:0;
		setTimeout( "window.scrollTo( 0, "+ yPos +" )", delay ); 
	}
}

if ( Story.prototype.BHP_coreDisplayTiddlers==undefined )
	Story.prototype.BHP_coreDisplayTiddlers=Story.prototype.displayTiddlers;

Story.prototype.displayTiddlers = function(  ) {
	
	var opt     = config.options;
	var saveBHP = opt.chkBrowserHistoryMode; opt.chkBrowserHistoryMode = false;
	
	this.BHP_coreDisplayTiddlers.apply( this, arguments );
	
	opt.chkBrowserHistoryMode = saveBHP;
}
