/*  PICO Search App
    jknight@ebsco.com
    revisions: 
    4may17 -- added data-label value to customize link label (default: PICO Search)
    24may17 -- changed search pattern to AND all terms and make Comparison a Recommended field
    22aug17 v1.1a -- add ability to choose position of link label; refactored the data- parms
    14sep17 v1.2a -- add ability to modify header text; 1.2b adds default value
    v1.3a-dev -- *** todo ***
        detect searchmode == boolean/phrase and warn user this will not work
*/

var picoVersion = '1.3a-dev';

var trackPicoCall = setInterval(function() {
    console.log('running trackPicoCall');
    if (window.jQuery) {
        clearInterval(trackPicoCall);
        picoEditor();
    }
}, 10);

// Add Customisations here. Break out to functions where possible.
function picoEditor() {
    if (QueryString('sdb') == 'edspub') return; // stop custom application if this is ftf
    // used to ensure the code is run only once.
    if (jQuery('body').data('picoEditor') == 1) {
        console.log(jQuery('body').data('picoEditor'));
        return;
    } else { jQuery('body').attr('data-picoEditor', '1'); }


    // Execute code only in the basic search or results page 
    // if ( (document.location.pathname == "/eds/results") || (document.location.pathname == "/eds/search/basic") || (document.location.pathname == "/eds/search/advanced") || (document.location.pathname == "/eds/resultsadvanced") ) {

    console.log('Running PICO Editor ', picoVersion);

    var pops = jQuery('#pe2script').data();
    var afterWhat = { "options": "optionsItem", "basic": "basicItem", "history": "historyItem", "advanced": "advancedItem" };
    pops.label = pops.label || 'PICO Search',
    	pops.header = pops.header || 'PICO Search for EDS',
        pops.after = afterWhat[pops.after] || afterWhat['advanced'],
        pops.css = pops.css || '//widgets.ebscohost.com/prod/simplekey/picoEditor/css/picoEditor.css';


    jQuery('#outerContainer').after(jQuery('<div />', { id: "picoModal" }));

    // create and assemble the picoBox
    var thePicoBox = jQuery('<div />', { class: 'picobox', id: 'picoBox', style: 'display:none;' })
        .append(jQuery('<div />', { id: 'close-picobox' })
            .append(jQuery('<span />', { title: 'click to close the query editor textarea' })))
        .append(jQuery('<div />', { id: 'picoForm' })
            .append(jQuery('<h2 />').text(pops.header)))
        .append(jQuery('<div />', { id: 'picoMessage' }))
        .append(jQuery('<div />', { id: 'picoErrors' }));

    var theInputs = getTheInputs();
    jQuery(thePicoBox).find('#picoForm').append(jQuery(theInputs));

    var $fieldsetOffsetTop = jQuery('.find-field-controls').offset().top;
    var $fieldsetOffsetleft = jQuery('.find-field-controls').offset().left;
    jQuery('#aspnetForm').after(jQuery(thePicoBox).css({ top: $fieldsetOffsetTop, left: $fieldsetOffsetleft }));

    // place the picobox search link inline w/ other search options; place picoBox after the SearchTerm1 box
    jQuery('#' + pops.after).after('<li id="picoBoxItem" class="find-field-link"><a href="#" id="picoBoxAnchor" alt="Do a PICO search in EDS" title="Opens a separate form for entering a PICO expression">'+pops.label+'</a></li>');
    jQuery('#picoBoxItem').css('cursor', 'pointer');
    // jQuery('.find-field-inputs-row').before(jQuery('#picoBox'));

    jQuery('#picoBoxAnchor').on('click', function(e) {
        e.preventDefault();
        jQuery('#picoBox').show();
        jQuery('#picoModal').show();
        // picoValidate();
    })

    // jQuery(window).on('click', function() {
    //     jQuery('#picoBox').hide();
    //     jQuery('#picoModal').hide();
    //     jQuery('#SearchTerm1, #Searchbox1').css({ background: '#fff' });
    // });

    jQuery('#close-picobox').on('click', function(e) {
        e.preventDefault();
        jQuery('#picoBox').hide();
        jQuery('#picoModal').hide();
        jQuery('#SearchTerm1, #Searchbox1').css({ background: '#fff' });
    });

    // }

    // Add CSS
    jQuery('head').append('<link rel="stylesheet" type="text/css" href="'+pops.css+'">');

    // handle picobox onfocus events
    jQuery('[type=text]').on('focus', function() {
        jQuery('#picoMessage').html(getHelpText(jQuery(this).attr('topic')));
    });

    // on submit events
    jQuery('#picoSubmit').on('click', function(e) {
        // trap required fields
        if ((jQuery('#picoPopulation').val() == '') || (jQuery('#picoIntervention').val() == '')) {
            jQuery('#picoMessage').html('<p style="color: #f44;">Population and Intervention fields are required</p>');
        } else {
            // proceed w/ the search
            var edsSearchTerms = {},
                topics;
            var picoInputs = jQuery('#picoPopulation, #picoIntervention, #picoComparison, #picoOutcome');
            jQuery.each(picoInputs, function(x, y) {
                jQuery(this).attr('value', jQuery(this).val()); // make values persistent
                edsSearchTerms[jQuery(this).attr('topic')] = (jQuery(this).val());
            });
            edsSearchExpression = makeEdsSearchExp(edsSearchTerms);
            jQuery('#SearchTerm1, #Searchbox1').val(edsSearchExpression);
            jQuery('#picoBox').hide();
            jQuery('#picoModal').hide();
            jQuery('#SearchButton').click();
        }
    });

    // on reset event
    jQuery('#picoReset').on('click', function() {
        jQuery('#picoPopulation, #picoIntervention, #picoComparison, #picoOutcome').val('')
    });

    jQuery('#picoHelp').on('click', function() {
        openPopup('PICO Help', 'help.html')
    });

    // watch for autostart query in #SearchTerm1 and fire the Pico box
    console.log('#SearchTerm1: ', jQuery('#SearchTerm1'));
    if(jQuery('#SearchTerm1').val() == '//autostart:pico'){
        jQuery('#SearchTerm1').val(''); 
        jQuery('span.std-warning-text').hide();
        // var geebr = setInterval(function() {
        //     if(document.getElementById('picoBoxAnchor')) {
        //         clearInterval(geebr);
        //         jQuery('#picoBoxAnchor').click();
        //     }
        // }, 50);
        setTimeout(function(){
            jQuery('#picoBoxAnchor').trigger('click');;
        }, 1500)
    }

}

function makeEdsSearchExp(termsObj) {

    /* updated to change construction of search expression
     * was "problem" AND "intervention" OR "comparison" "outcome"
     * is now (problem) AND (intervention OR comparison) AND (outcome)
    */
    var searchExp = '(' + termsObj.population + ')';    // (Population)
    searchExp += ' AND ';
    
    if(termsObj.comparison != '') {
        searchExp += '(' + termsObj.intervention + ' OR ' + termsObj.comparison + ')';  // (Population) AND (Intervention OR Comparison)
    } else {
        searchExp += '(' + termsObj.intervention + ')'; // (Population) AND (Intervention)
    }

    if (termsObj.outcome != '') {
        searchExp += ' AND ' + '(' + termsObj.outcome + ')'; // ... AND (Outcome)
    }

    return searchExp;

}

function getTheInputs() {
    return '<div class="picoSearch">' +
        '<fieldset react="PicoFieldSet">' +
        '<div class="picoField">' +
        '<label for="picoPopulation">P</label>' +
        '<input id="picoPopulation" placeholder="Problem/Population" name="picoPopulation" topic="population" type="text" required>' +
        '</div>' +
        '<div class="picoField">' +
        '<label for="picoIntervention">I</label>' +
        '<input id="picoIntervention" placeholder="Intervention" name="picoIntervention" topic="intervention" type="text" required>' +
        '</div>' +
        '<div class="picoField">' +
        '<label for="picoComparison">C</label>' +
        '<input id="picoComparison" placeholder="Comparison" name="picoComparison" topic="comparison" type="text">' +
        '</div>' +
        '<div class="picoField">' +
        '<label for="picoOutcome">O</label>' +
        '<input id="picoOutcome" placeholder="Outcome" name="picoOutcome" topic="outcome" type="text">' +
        '</div>' +
        '</fieldset>' +
        '<fieldset>' +
        '<input type="button" id="picoSubmit" value="Submit">' +
        '<input type="button" id="picoReset" value="Reset">' +
        '<input type="button" id="picoHelp" value="Help">' +
        '</fieldset>' +
        '</div>';
}

function getHelpText(topic) {
    switch (topic) {
        case "population":
            // 
            return '<h5>Patient problem or Population</h5>' +
                '<p>REQUIRED : Identify the <em>patient problem or population</em>. Describe either the patient&apos;s chief complaint or generalize the patient&apos;s comparison to a larger population.</p>';

            break;

        case "intervention":
            // 
            return '<h5>Intervention</h5>' +
                '<p>REQUIRED : Include the use of a specific diagnostic test, treatment, adjunctive therapy, medication or recommendation to the patient to use a product or procedure.</p>';

            break;

        case "comparison":
            // 
            return '<h5>Comparison</h5>' +
                '<p>RECOMMENDED : The <em>main alternative you are considering</em>. It should be specific and limited to one alternative choice.</p>';

            break;

        case "outcome":
            // 
            return '<h5>Outcome</h5>' +
                '<p>[OPTIONAL] : Specify the result(s) of what you plan to accomplish, improve or affect and should be measurable. Specific outcomes will yield better search results and allow you to find the studies that focus on the outcomes you are searching for.</p>';

            break;

        default:
            return '<p>Welcome to the PICO searchbox for EDS. Enter P and I (C and O optional) terms, and click Submit</p>'
    }
}



// Used to control the display of content in specific pages.
function DisplayMe(blocks, id) {
    if (QueryString('sdb') == 'edspub') return; // stop custom application if this is ftf
    //basic,advanced,detail,results,resultsadvanced
    var displayBlocks = blocks.split(",")
    for (i = 0; i < displayBlocks.length; i++) {
        if (document.URL.indexOf("/" + displayBlocks[i] + "?") > -1) {
            document.getElementById(id).style.display = "block";
        }
    }
}

function QueryString(key) {
    var re = new RegExp('(?:\\?|&)' + key + '=(.*?)(?=&|$)', 'gi');
    var r = [],
        m;
    while ((m = re.exec(document.location.search)) != null) r.push(m[1]);
    return r;
}

function openPopup(name, filename, qdata) {
    // qdata might be undefined
    var qData = (qdata !== undefined) ? qData = "?" + qdata : '';
    var theName = name;
    var theSource = "//gss.ebscohost.com/jknight/picoEditor/docs/" + filename + qData;
    thePopup = window.open(theSource, theName, 'height=680,width=580,top=100,left=100,resizable=yes,scrollbars=yes');
    if (window.focus) {
        thePopup.focus()
    }
    return false;
}
