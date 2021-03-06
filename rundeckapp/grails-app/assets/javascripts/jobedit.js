/*
 * Copyright 2010 DTO Labs, Inc. (http://dtolabs.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function showError(message) {
    appendHtml($("editerror"),message);
    $("editerror").show();
}
function showRowSelected(elem, tbl, classname) {
    var i;
    var elems = document.getElementsByClassName(classname, tbl);
    for (i = 0 ; i < elems.length ; i++) {
        var e = elems[i];
        $(e).removeClassName('selected');
    }
    if (elem && $(elem)) {
        $(elem).addClassName('selected');
    }
}


function _editFormSelectProject(value){

}

function prepJobType(data) {
    if (data.authorized) {
        $('scriptAuthWarn').hide();
    } else {
        $('scriptAuthWarn').show();
    }
}

/** Nodeset matching */
var mnodetimer = null;
function _formUpdateMatchedNodes() {
    var i;
    var params = {view:'embed',declarenone:true,defaultLocalNode:true,fullresults:true,formInput:true,requireRunAuth:true};

    params['filter']=$F('schedJobNodeFilter');
    if ($('nodeExcludePrecedenceTrue').checked) {
        params.nodeExcludePrecedence = "true";
    } else {
        params.nodeExcludePrecedence = "false";
    }
    if(typeof(_beforeMatchNodes)=='function'){
        _beforeMatchNodes();
    }
    jQuery('#matchednodes').load(_genUrl(appLinks.frameworkNodesFragment,params),function(resp,status,jqxhr) {
        if (typeof(_afterMatchNodes) == 'function') {
            _afterMatchNodes();
        }
    });
}
function _matchNodes() {
    if (mnodetimer) {
        clearTimeout(mnodetimer);
    }
    mnodetimer = setTimeout(_formUpdateMatchedNodes, 500);
}
function _matchNodesKeyPress(e) {
    if (!noenter(e)) {
        return false;
    }
    _matchNodes();
    return true;
}

/** end Nodeset matching */

function addFilter(name, isinclude, label) {
    var prefix = (isinclude ? 'Include' : 'Exclude');
    if ($('nodeFilter' + prefix + name)) {
        $('nodeFilter' + prefix + name).show();
        if ($('filterAdd' + prefix + name)) {
            $('filterAdd' + prefix + name).hide();
        }
        return;
    }
}

function setFilter(name, isinclude, value) {
    var prefix = (isinclude ? 'Include' : 'Exclude');
    if ($('schedJobNode' + prefix + name)) {
        $('schedJobNode' + prefix + name).setValue(value);
        _matchNodes();
    }
}
function removeFilter(name, isinclude) {
    var prefix = (isinclude ? 'Include' : 'Exclude');
    if ($('nodeFilter' + prefix + name)) {
        $('nodeFilter' + prefix + name).hide();
        if ($('schedJobNode' + prefix + name)) {
            $('schedJobNode' + prefix + name).setValue('');
            if ($('filterAdd' + prefix + name)) {
                $('filterAdd' + prefix + name).show();
            }
            _matchNodes();
        }
    }
}

/** begin wf edit code */


function _wfiedit(key,num,isErrorHandler) {
    var params = {num:num, isErrorHandler:isErrorHandler?true:false,key:key};
    if (getCurSEID()) {
        params.scheduledExecutionId = getCurSEID();
    }
    jQuery('#wfli_' + key).load(_genUrl(appLinks.workflowEdit, params),function(resp,status,jqxhr){
        _hideWFItemControls();
        var liitem = jQuery('#wfli_' + key);
        liitem.find('input').each(function (ndx,elem) {
            if (elem.type === 'text') {
                elem.observe('keypress', noenter);
            }
        });
        liitem.find('textarea.apply_ace').each(function(ndx,elem){_addAceTextarea(elem)});
        initTooltipForElements('#wfli_' + key + ' .obs_tooltip');
    });
}

function _wfiview(key,num,isErrorHandler) {
    var params = {num:num,edit:true,key:key, isErrorHandler:isErrorHandler?true:false};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    jQuery('#wfli_' + key).load(_genUrl(appLinks.workflowRender,params),_showWFItemControls);
}
function _wfisave(key,num, formelem,iseh) {
    var data= jQuery("#"+formelem+" :input").serialize();
    jQuery.ajax({
        type: 'POST',
        url: _genUrl(appLinks.workflowSave),
        data: data,
        beforeSend: _ajaxSendTokens.curry('job_edit_tokens'),
        success: function (resp, status, jqxhr) {
            var litem = jQuery('#wfli_' + key);
            litem.html(resp);
            if (litem.find('div.wfitemEditForm').size()<1) {
                _showWFItemControls();
                if (iseh) {
                    _hideWFItemControlsAddEH(num);
                }
            }
            initTooltipForElements('#wfli_' + key + ' .obs_tooltip')
        }
    }).success(_ajaxReceiveTokens.curry('job_edit_tokens'));
}
var newitemElem;
function _wfiaddnew(type,nodestep) {
    var params = {newitemtype:type,newitemnodestep:nodestep?true:false};
    if (getCurSEID()) {
        params.scheduledExecutionId = getCurSEID();
    }
    clearHtml('wfnewitem');
    $('wfnewtypes').hide();
    _hideWFItemControls();
    var olist = $('workflowContent').down('ol');
    var litems = $$('#workflowContent ol > li');
    var num = litems.length;
    params['key']=num;
    var parentli = new Element('li');
    if (num % 2 == 1) {
        parentli.addClassName('alternate');
    }
    parentli.setAttribute('data-wfitemnum', num);
    newitemElem = new Element('span');
    newitemElem.setAttribute('id', 'wfli_' + num);
    parentli.appendChild(newitemElem);
    var createElement = new Element('div');
    createElement.setAttribute('id','wfivis_' + num);
    parentli.appendChild(createElement);

    var ehUlElement = new Element('ul');
    ehUlElement.addClassName('wfhandleritem');
    ehUlElement.style.display='none';
    ehUlElement.setAttribute('data-wfitemnum',num);
    var ehLiElement = new Element('li');
    ehLiElement.setAttribute('id','wfli_eh_'+num);
    ehUlElement.appendChild(ehLiElement);
    parentli.appendChild(ehUlElement);
    olist.appendChild(parentli);
    jQuery(newitemElem).load(_genUrl(appLinks.workflowEdit,params),function(){
        $(newitemElem).select('input').each(function (elem) {
            if (elem.type == 'text') {
                elem.observe('keypress', noenter);
            }
        });
        $(newitemElem).down('input[type=text]').focus();
        initTooltipForElements('#wfli_' + num + ' .obs_tooltip');
        $(newitemElem).select('textarea.apply_ace').each(_addAceTextarea);

    });
}

function _addAceTextarea(textarea){
    if (_isIe(8)||_isIe(7)||_isIe(6)) {
        return;
    }
    textarea.hide();
    var _shadow = new Element('div');
    _shadow.setStyle({
        width: "100%",
        height: "560px"
    });
    _shadow.addClassName('ace_text');
    setText(_shadow,$F(textarea));
    textarea.insert({ after: _shadow });
    var editor = ace.edit(_shadow.identify());
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/sh");
    editor.getSession().on('change', function (e) {
        textarea.setValue(editor.getValue());
    });
    editor.focus();

    //add controls
    var _ctrls = new Element('div');
    _ctrls.addClassName('ace_text_controls');

    var _soft = new Element('input');
    _soft.setAttribute('type', 'checkbox');
    _soft.observe('change', function (e) {
        editor.getSession().setUseWrapMode(_soft.checked);
    });
    var _soft_label = new Element('label');
    _soft_label.appendChild(_soft);
    _soft_label.appendChild(document.createTextNode('Soft Wrap'));

    _ctrls.appendChild(_soft_label);

    textarea.insert({before:_ctrls});
}
function _wfisavenew(formelem) {
    var data = jQuery("#" + formelem + " :input").serialize();
    jQuery.ajax({
        type:'POST',
        url:_genUrl(appLinks.workflowSave),
        data:data,
        beforeSend:_ajaxSendTokens.curry('job_edit_tokens'),
        success:function(resp,status,jqxhr){
            jQuery(newitemElem).html(resp);
            var litem = $(newitemElem.parentNode);
            $(litem).highlight();
            $('wfnewbutton').show();
            _showWFItemControls();
            $('workflowDropfinal').setAttribute('data-wfitemnum', parseInt(litem.getAttribute('data-wfitemnum')) + 1);
            newitemElem = null;
        }
    }).success(_ajaxReceiveTokens.curry('job_edit_tokens'));
}
function _wficancelnew() {
    var olist = $('workflowContent').down('ol');
    $(olist).removeChild($(newitemElem.parentNode));
    newitemElem = null;
    $('wfnewbutton').show();
    _showWFItemControls();
}
function _findParentAttr(e,attr){
    var value = e.getAttribute(attr);
    while (e && !value && !e.hasAttribute(attr)) {
        value = e.parentNode.getAttribute(attr);
        e = e.parentNode;
    }
    return value;
}
//events handlers for add/cancel new step
function _evtNewStepChooseType(evt) {
    var e = evt.element();
    var type = _findParentAttr(e,'data-step-type');
    _wfiaddnew(type,false);
}
function _evtNewNodeStepChooseType(evt) {
    var e = evt.element();
    var type = _findParentAttr(e, 'data-node-step-type');
    _wfiaddnew(type,true);
}
function _evtNewStepCancel(evt){
    $('wfnewtypes').hide();
    $('wfnewbutton').show();
}

function _hideWFItemControls() {
    $$('#workflowContent span.wfitemcontrols').each(Element.hide);
    $('wfundoredo').hide();
    $('wfnewbutton').hide();
}
function _updateEmptyMessage() {
    var x = $('workflowContent').down('ol li');
    if (x) {
        $('wfempty').hide();
    } else {
        $('wfempty').show();
    }
}
function _showWFItemControls() {
    $$('#workflowContent span.wfitemcontrols').each(Element.show);
    $('wfundoredo').show();
    $('wfnewbutton').show();
    _updateWFUndoRedo();
    _enableDragdrop();
    _updateEmptyMessage();
}
function _hideWFItemControlsAddEH(num){
    var lielem=$('wfli_'+num);
    lielem.select('.wfitem_add_errorhandler').each(Element.hide);
}

function _evtNewEHChooseType(evt){
    var e = evt.element();
    var type = _findParentAttr(e, 'data-step-type');
    _wfiaddNewErrorHandler(e, type, null, false);
}
function _evtNewEHNodeStepType(evt){
    var e = evt.element();
    var type = _findParentAttr(e, 'data-node-step-type');
    _wfiaddNewErrorHandler(e, type,null, true);
}
function _hideAddNewEHLinks() {
    $$('span.wfitem_add_errorhandler').each(Element.hide);
}
function _showAddNewEHLinks() {
    $$('span.wfitem_add_errorhandler').each(Element.show);
}
function _evtNewEHCancel(evt){
    var d = $(evt.element()).up('ul.wfhandleritem', 0);
    d.hide();
    _hideAddNewEH();

    _showWFItemControls();
}
function _wficancelnewEH(elem){
    var ul = $(elem).up('ul.wfhandleritem', 0);
    ul.hide();
    var d = $(elem).up('ul.wfhandleritem li', 0);
    clearHtml(d);

    _showWFItemControls();
}
function _hideAddNewEH(){
    var wfstepnew = $('wfnewtypes');
    var newehdiv = $('wfnew_eh_types');
    newehdiv.hide();
    newehdiv.parentNode.removeChild(newehdiv);
    $(wfstepnew).insert({after:newehdiv});
}
function _wfishownewErrorHandler(key,num,nodeStep){
    var newehdiv=$('wfnew_eh_types');
    var wfiehli=$('wfli_eh_'+key);
    clearHtml(wfiehli);
    newehdiv.parentNode.removeChild(newehdiv);
    wfiehli.appendChild(newehdiv);

    var nodeFirstWfStrat = $('wf_strat_node_first').checked;
    var allowedWfStepEh=!(nodeStep && nodeFirstWfStrat);
    //WF step error handler not allowed if strategy is "node-first" and the step is a node step
    $(newehdiv).select('.step_section').each(allowedWfStepEh ? Element.show : Element.hide);

    newehdiv.show();
    $(wfiehli.parentNode).show();
    _hideWFItemControls();
}

function _wfiaddNewErrorHandler(elem,type,num,nodestep){
    if(null==num){
        //find num by looking for enclosing ul and getting wfitemNum attribute
        var d=$(elem).up('ul.wfhandleritem',0);
        if(d){
            num= d.getAttribute('data-wfitemnum');
        }
    }
    var key='eh_'+num;

    //add new error handler for the item num
    var params = {newitemtype:type,key:key,num:num,isErrorHandler:true, newitemnodestep:nodestep?true:false};
    if (getCurSEID()) {
        params.scheduledExecutionId = getCurSEID();
    }
    var wfiehli = jQuery('#wfli_' + key);
    _hideAddNewEH();

    wfiehli.load(_genUrl(appLinks.workflowEdit,params),function(){
        wfiehli.find('input').each(function (ndx,elem) {
            if (elem.type == 'text') {
                elem.observe('keypress', noenter);
            }
        });
        wfiehli.find('textarea.apply_ace').each(function (){_addAceTextarea(this);});
        initTooltipForElements('#wfli_' + key + ' .obs_tooltip');
    });
}

function _doMoveItem(from, to) {
    _ajaxWFAction(appLinks.workflowReorder,{fromnum:from,tonum:to,edit:true});
}
function _doRemoveItem(key,num,isErrorHandler) {
    var params = {delnum:num,edit:true,key:key,isErrorHandler:isErrorHandler};
    Effect.Fade($('wfivis_' + key), {duration:0.2,afterFinish:
        function(f) {
            _ajaxWFAction(appLinks.workflowRemove,params);
        }
    });
}
function _doUndoWFAction() {
    _ajaxWFAction(appLinks.workflowUndo, {edit: true});
}
function _doRedoWFAction() {
    _ajaxWFAction(appLinks.workflowRedo, {edit: true});
}
function _doResetWFAction() {
    _ajaxWFAction(appLinks.workflowRevert, {edit: true});
}
function _ajaxWFAction(url, params){
    var tokendataid = 'reqtoken_undo_workflow';
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    jQuery.ajax({
        type: 'POST',
        url: _genUrl(url),
        data: params,
        beforeSend: _ajaxSendTokens.curry(tokendataid),
        success: function (data, status, jqxhr) {
            jQuery('#workflowContent').find('ol').html(data);
            newitemElem = null;
            $('wfnewbutton').show();
            _showWFItemControls();
        }
    });
}
function _updateWFUndoRedo() {
    var params = {};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    jQuery('#wfundoredo').load(_genUrl( appLinks.workflowRenderUndo,params));
}


///Drag drop
function moveDragItem(dragged, droparea) {
    var num = $(dragged).getAttribute('data-wfitemnum');
    var to = $(droparea).getAttribute('data-wfitemnum');

    if (to > num) {
        to = to - 1;
    }

    _doMoveItem(num, to);
}
function _enableDragdrop() {
    $$('#workflowContent ol>li').each(function(item) {
        new Draggable(
            item,
        {
            revert: 'failure',
            ghosting: false,
            constraint:'vertical',
            handle:'dragHandle',
            scroll: window,
            onStart:function(d) {
                $('workflowDropfinal').show();
            },
            onEnd:function(d) {
                $('workflowDropfinal').hide();
            }
        }
            );
    });

    $$('#workflowContent ol>li').each(function(item) {
        Droppables.add(item, {
            hoverclass: 'hoverActive',
            onDrop: moveDragItem
        }
            );
        $(item).addClassName("ready");
    });
    $$('#workflowDropfinal').each(function(item) {
        Droppables.add(item, {
            hoverclass: 'hoverActive',
            onDrop: moveDragItem
        }
            );
        $(item).addClassName("ready");
    });
}
/** end wf edit code */

/** common Undo/Redo code */
function _doRevertAction(key) {
    if ('workflow' == key) {
        return _doResetWFAction();
    } else if ('opts' == key) {
        return _doRevertOptsAction();
    }
    return null;
}
function _doRedoAction(key) {
    if ('workflow' == key) {
        return _doRedoWFAction();
    } else if ('opts' == key) {
        return _doRedoOptsAction();
    }
    return null;
}
function _doUndoAction(key) {
    if ('workflow' == key) {
        return _doUndoWFAction();
    } else if ('opts' == key) {
        return _doUndoOptsAction();
    }
    return null;
}

/** end Common Undo/Redo code*/


/** begin Option edit code */


var newoptli;
function _showOptControls() {
    $$('#optionsContent .opteditcontrols').each(Element.show);
    $('optnewbutton').show();
    _updateOptsUndoRedo();
    _showOptEmptyMessage();
    clearHtml('optsload');
}
function _showOptEmptyMessage() {
    var x = $('optionsContent').down('ul li');
    if (x) {
        $('optempty').hide();
        $('optheader').show();
    } else {
        $('optempty').show();
        $('optheader').hide();
    }
}
function _hideOptControls() {
    $$('#optionsContent .opteditcontrols').each(Element.hide);
    $('optnewbutton').hide();
    clearHtml('optsload');
}
function _updateOptsUndoRedo() {
    var params = {};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }

    jQuery('#optundoredo')
        .load(_genUrl(appLinks.editOptsRenderUndo, params));
}

function _configureInputRestrictions(target) {
    $(target).select('input').each(function(elem) {
        if (elem.type == 'text') {
            elem.observe('keypress', noenter);
        }
    });
    $(target).select('input.restrictOptName').each(function(elem) {
        if (elem.type == 'text') {
            elem.observe('keypress', function(e){
                return controlkeycode(e) || onlychars('[a-zA-Z_0-9.\\t-]',e);
            });
        }
    });
}

function _optedit(name, elem) {
    var params = {name:name};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    $('optsload').loading();
    jQuery.ajax({
        type:'GET',
        url:_genUrl(appLinks.editOptsEdit, params),
        success:function(data,status,jqxhr){
            jQuery(elem).html(data);
            _hideOptControls();
            _configureInputRestrictions(elem);
        },
        failure:function(data,status,jqxhr){
            alert("error: " + status);
        }
    });
}

function _optview(name, target) {
    var params = {name:name,edit:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    jQuery(target).load(_genUrl(appLinks.editOptsRender,params), _showOptControls);
}
function _optsave(formelem, tokendataid, target) {
    $('optsload').loading();
    jQuery.ajax({
        type: "POST",
        url:_genUrl(appLinks.editOptsSave),
        data: jQuery('#'+formelem+" :input").serialize(),
        beforeSend: _ajaxSendTokens.curry(tokendataid),
        success:function(data,status,xhr){
            jQuery(target).html(data);
            if (!$(target).down('div.optEditForm')) {
                _showOptControls();
                $(target).highlight();
            } else {
                _configureInputRestrictions(target);
                _hideOptControls();
            }
        }
    });
}
function _optaddnewIfNone() {
    //if no options in the list, load new edit form:
    var litems = $$('#optionsContent ul li');
    if (!litems || 0 == litems.length) {
        _optaddnew();
    }
}
function _optaddnew() {
    var params = {newoption:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    _hideOptControls();
    var olist = $('optionsContent').down('ul');
    var litems = $$('#optionsContent ul li');
    var num = litems.length;
    newoptli = new Element('li');
    if (num % 2 == 1) {
        newoptli.addClassName('alternate');
    }
    newoptli.addClassName('optEntry');
    var createElement = new Element('div');
    createElement.setAttribute('id','optvis_' + num);
    newoptli.appendChild(createElement);
    olist.appendChild(newoptli);
    $('optsload').loading();
    jQuery(createElement).load(_genUrl(appLinks.editOptsEdit,params),null,function(resp,status,jqxhr){
        if (status=='success') {
            _configureInputRestrictions(createElement);
            _hideOptControls();
        }
        clearHtml('optsload');
    });
}

function _optcancelnew() {
    var olist = $('optionsContent').down('ul');
    $(olist).removeChild(newoptli);
    newoptli = null;
    _showOptControls();
}

function _reloadOpts() {
    var params = {newoption:true,edit:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    var optslist = $('optionsContent').down('ul.options');
    $('optsload').loading();
    jQuery('#optionsContent').find('ul.options').load(_genUrl(appLinks.editOptsRenderAll, params),function(data,status,jqxhr){
        _showOptControls();
    });
}


function _summarizeOpts() {
    var params = {newoption:true,edit:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    var optssummary = $('optssummary');
    $('optsload').loading();
    jQuery('#optssummary').load(_genUrl(appLinks.editOptsRenderSummary, params), _showOptControls);
}

function _optsavenew(formelem,tokendataid) {
    var params = jQuery('#'+formelem+' :input').serialize();
    $('optsload').loading();
    jQuery.ajax({
        type: "POST",
        url: _genUrl(appLinks.editOptsSave),
        data: params,
        beforeSend: _ajaxSendTokens.curry(tokendataid),
        success: function (data, status, xhr) {
            jQuery(newoptli).html(data);
            if (!newoptli.down('div.optEditForm')) {
                $(newoptli).highlight();
                newoptli = null;
                _showOptControls();
                _reloadOpts();
            } else if (newoptli.down('div.optEditForm')) {
                _configureInputRestrictions(newoptli);
                _hideOptControls();
            }
        }
    });

}

function _doRemoveOption(name, elem,tokendataid) {
    var params = {name:name,edit:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    $('optsload').loading();
    Effect.Fade($(elem), {duration:0.2,afterFinish:
        function(f) {
            jQuery.ajax({
                type:'POST',
                url:_genUrl(appLinks.editOptsRemove),
                data:params,
                beforeSend:_ajaxSendTokens.curry(tokendataid),
                success:function(data,status,jqxhr){
                    jQuery('#optionsContent').find('ul').html(data);
                    _showOptControls();
                }
            });
        }
    });
}

function _doUndoOptsAction() {
    var params = {edit:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    var tokendataid='reqtoken_undo_opts';
    jQuery.ajax({
        type:'POST',
        url:_genUrl(appLinks.editOptsUndo),
        data:params,
        beforeSend:_ajaxSendTokens.curry(tokendataid),
        success:function(data,status,jqxhr){
            jQuery('#optionsContent').find('ul').html(data);
            _showOptControls();
        }
    });
}
function _doRedoOptsAction() {
    var params = {edit:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    var tokendataid = 'reqtoken_undo_opts';
    jQuery.ajax({
        type: 'POST',
        url: _genUrl(appLinks.editOptsRedo),
        data: params,
        beforeSend: _ajaxSendTokens.curry(tokendataid),
        success: function (data, status, jqxhr) {
            jQuery('#optionsContent').find('ul').html(data);
            _showOptControls();
        }
    });
}
function _doRevertOptsAction() {
    var params = {edit:true};
    if (getCurSEID()) {
        params['scheduledExecutionId'] = getCurSEID();
    }
    var tokendataid = 'reqtoken_undo_opts';
    jQuery.ajax({
        type: 'POST',
        url: _genUrl(appLinks.editOptsRevert),
        data: params,
        beforeSend: _ajaxSendTokens.curry(tokendataid),
        success: function (data, status, jqxhr) {
            jQuery('#optionsContent').find('ul').html(data);
            _showOptControls();
        }
    });
}

