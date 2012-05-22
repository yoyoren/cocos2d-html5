/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Created by JetBrains WebStorm.
 User: wuhao
 Date: 12-3-22

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/


var cc = cc = cc || {};
//this is the element that will be created for all dom nodes
//incase of conflicting with existing css declaration
//you can change it to anything you want, such as "cocos"
//which will produce a tag of <cocos></cocos>, and will fully
//work in all html5 compatible browsers
cc.TAG = "div";

//browser detection, based on mootools
cc.Browser = {};
(function () {
    cc.Browser.ua = navigator.userAgent.toLowerCase();
    cc.Browser.platform = navigator.platform.toLowerCase();
    cc.Browser.UA = cc.Browser.ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, 'unknown', 0];
    cc.Browser.mode = cc.Browser.UA[1] == 'ie' && document.documentMode;
    cc.Browser.type = (cc.Browser.UA[1] == 'version') ? cc.Browser.UA[3] : cc.Browser.UA[1];
})();
cc.CSS3 = {};
(function () {
    var res;
    var translate;
    switch (cc.Browser.type) {
        case "firefox":
            res = "Moz";
            translate = "translate3d(";
            break;
        case "chrome":
        case "safari":
            res = "webkit";
            translate = "translate3d(";
            break;
        case "opera":
            res = "O";
            translate = "translate3d(";
            break;
        case "ie":
            res = "ms";
            translate = "translate(";
    }
    //TODO these works for firefox and webkit, havnt test in other browsers yet
    cc.CSS3.transform = res + "Transform";
    cc.CSS3.origin = res + "TransformOrigin";
    cc.CSS3.userSelect = res + "UserSelect";
})();
//this is the dom node methods, that is exactly the same for ccnode and ccdomnode
//this object will be part of the prototype for ccnode and domnode
cc.domNodeMethods = {
    //update the transform css, including translate, rotation, skew, scale
    _updateTransform:function () {
        //var height = (this.dom.node.getParent()) ? this.dom.node.getParent().getContentSize().height : cc.Director.sharedDirector().getWinSize().height;
        var css = "translate3d(";
        css += this.getPositionX();
        css += "px, ";
        //css += (height - this.getContentSize().height-this.getPositionY());
        css += -this.getPositionY();
        css += "px, 0) rotateZ(";
        css += this.getRotation();
        css += "deg) scale(";
        css += this.getScaleX();
        css += ", ";
        css += this.getScaleY();
        css += ") skew(";
        css += this.getSkewX();
        css += "deg, ";
        css += -this.getSkewY();
        css += "deg)";
        this.dom.style[cc.CSS3.transform] = css;
    },
    setNodeDirty:function () {
        this._setNodeDirtyForCache();
        this._m_bIsTransformDirty = this._m_bIsInverseDirty = true;
        if (cc.NODE_TRANSFORM_USING_AFFINE_MATRIX) {
            this._m_bIsTransformGLDirty = true;
        }
        if(this.dom)
        {
            this._updateTransform();
        }
    },
    //this will update the anchorpoint of the object's dom, when ever something changed that will affect the anchorpoint such as contentsize and anchorpoint itself.
    //as well as when you change a node's relative anchorpoint attribute, you should call this function
    _updateAnchorPoint:function(){
        this.setAnchorPoint(this.getAnchorPoint());
    },
    initDom:function () {
        this.dom = cc.$new(cc.TAG);
        //reset the css as possible
        var css = "position: absolute; font-style:normal; margin: 0; padding: 0; border: none; float: none; display:block; top:0; bottom:auto; right:auto; left:0; height:0; color:#fff";
        if (cc.Browser.type == "chrome" || cc.Browser.type == "safari") css += " -webkit-perspective: 1000;";
        this.dom.style.cssText = css;
        this.dom.node = this;
        this.hide();
    },
    setParentDiv:function(p){
        if(this.dom){//if self doesnt have a dom, then its a CCnode, no point in adding dom to the parent
            if(!p.dom){//if the dom node parent is a ccnode, and it do not have its dom, we make one
                p.initDom();
                var type = " CCNode";
                if(p instanceof cc.Scene)
                {
                    type = " Scene";
                }
                else if(p instanceof cc.Layer)
                {
                    type = " Layer";
                }
                else if (p instanceof cc.Sprite)
                {
                    type = " Sprite";
                }
                else{
                    console.log(p);
                }
                p.dom.id = type + Date.now();
                p.dom.className += type;
            }
            p.dom.appendChild(this.dom);
        }

        //if the parent also have a parent
        if (p.getParent()) {
            //run this function again for the parent
            p.setParentDiv(p.getParent());
        }
        //else, the parent doesnt have anymore parent
        //we dont know if the parent is the top most level, as it could be not run yet.
        //but if a domnode is added after the scene ran, then, getisRunning will return true, and so in this case,
        //if parent have no more parent, but it is running, we add the parent to the domContainer
        else if(p.getIsRunning){
            if(!p.dom){
                p.initDom();
                var type = " CCNode";
                if(p instanceof cc.Scene)
                {
                    type = " Scene";
                }
                else if(p instanceof cc.Layer)
                {
                    type = " Layer";
                }
                else if (p instanceof cc.Sprite)
                {
                    type = " Sprite";
                }
                else{
                    console.log(p);
                }
                p.dom.id = (p instanceof cc.Scene)?"Scene" + Date.now():"CCNode" + Date.now();
                p.dom.className += type;
            }
            cc.domNode.DomContainer().appendChild(p.dom);
            p.show();
        }
        if(p.dom){
            p._updateTransform();
            p._updateAnchorPoint();
        }
    },
    hide:function () {
        this.dom.style.visibility = "hidden";
    },
    show:function () {
        this.dom.style.visibility = "visible";
    }
};
cc.domNode = cc.Class.extend({
    isDom:true,
    dom:null,
    _rotation:0,
    _scaleX:1,
    _scaleY:1,
    _skewX:0,
    _skewY:0,
    _pos:null, //init in ctor cc.Point
    _contentSize:null, //size of the thing
    _AnchorPoint:null,
    _children:null, //array
    _parent:null, //parent obj
    _tag:-1,
    _m_bIsRelativeAnchorPoint:true,
    _m_bIsRunning:false,
    _IsVisible:true,
    ctor:function () {
        this.initDom();
        this._children = [];
        this._pos = {x:0,y:0};
        this._contentSize = {};
        this._AnchorPoint = {x:0.5, y:0.5};
        this.dom.id = "DomNode" + Date.now();
        this.dom.className = " DomNode";
        this.setContentSize(cc.Director.sharedDirector().getWinSize());
        this._updateTransform();
    },
    id:function(id){
        if(id)
        {
            this.dom.id = id;
        }
        else{
            return this.dom.id;
        }
    },
    //Gets
    getZOrder:function () {
        return this.dom.style.zIndex;
    },
    getSkewX:function () {
        return this._skewX;
    },
    getSkewY:function () {
        return this._skewY;
    },
    getScale:function () {
        cc.Assert(this._scaleX == this._scaleY, "cc.Node#scale. ScaleX != ScaleY. Don't know which one to return");
        return this._scaleX;
    },
    getScaleX:function () {
        return this._scaleX;
    },
    getScaleY:function () {
        return this._scaleY;
    },
    getPosition:function () {
        //return cc.PointMake(this._pos.x, this._pos.y);
        if (this._pos.x == 0) {
            //throw "sadasd"
        }
        return new cc.Point(this._pos.x, this._pos.y);
    },
    getPositionX:function () {
        return this._pos.x;
    },
    getPositionY:function () {
        return this._pos.y;
    },
    getRotation:function () {
        return this._rotation;
    },
    getTag:function () {
        return this._tag;
    },
    getAnchorPoint:function () {
        return new cc.Point(this._AnchorPoint.x, this._AnchorPoint.y);
    },
    getContentSize:function () {
        return new cc.Size(this._contentSize.width, this._contentSize.height);
    },
    getIsRunning:function(){
        return this._m_bIsRunning;
    },

    //Sets
    _setZOrder:function (z) {
        this.dom.style.zIndex = z;
    },
    setColor:function (c) {
        this.dom.style.color = "rgb(" + c.r + ", " + c.g + ", " + c.b + ")";
    },
    setSkewX:function (x) {
        this._skewX = -x;
        this._updateTransform();
    },
    setSkewY:function (y) {
        this._skewY = -y;
        this._updateTransform();
    },
    setRotation:function (r) {
        this._rotation = r;
        this._updateTransform();
    },
    setScale:function (s) {
        this._scaleX = s;
        this._scaleY = s;
        this._updateTransform();
    },
    setScaleX:function (x) {
        this._scaleX = x;
        this._updateTransform();
    },
    setScaleY:function (y) {
        this._scaleY = y;
        this._updateTransform();
    },
    setPosition:function (x, y) {
        if (arguments.length == 2) {
            this._pos.x = x;
            this._pos.y = y;
        }
        else {
            this._pos.x = x.x;
            this._pos.y = x.y;
        }
        this._updateTransform();
    },
    setTag:function (t) {
        this._tag = t;
    },
    setContentSize:function (size) {
        this._contentSize.width = size.width;
        this._contentSize.height = size.height;
        this.dom.style.width = size.width+"px";
        this.dom.style.maxHeight = size.height+"px";
        //when an element size is changed, we need to fix its origin, so that say 50% y origin will still be at center
        this.dom.style[cc.CSS3.origin] = (this.getAnchorPoint().x * 100) + "% " + (this.getAnchorPoint().y * size.height)+"px";
        //then we need to tell its child to update its position, because the child position also depend on the parent height
        this._arrayMakeObjectsPerformSelector(this.getChildren(), "_updateTransform");
        this._updateAnchorPoint();
    },
    setAnchorPoint:function (s) {
        this._AnchorPoint = s;
        var size = this.getContentSize();
        if (this._m_bIsRelativeAnchorPoint) {
            this.dom.style.left = "-" + (s.x * size.width) + "px";
            this.dom.style.top = "-" + (s.y * size.height) + "px";
            this.dom.style[cc.CSS3.origin] = (s.x * 100) + "% " + (s.y * -size.height) + "px";
        }
        else {
            this.dom.style[cc.CSS3.origin] = (s.x * 100) + "% " + (s.y * -size.height) + "px";
            this.dom.style.top = 0;
            this.dom.style.left = 0;
        }
        this.dom.style.width = size.width + "px";
        this.dom.style.maxHeight = size.height + "px";
    },

    //parent and children
    getParent:function () {
        return this._parent;
    },
    getChildren:function () {
        return this._children;
    },
    getChildByTag:function (t) {
        cc.Assert(t != -1, "Invalid tag");
        if (this._children != null) {
            for (var i = 0; i < this._children.length; i++) {
                var pNode = this._children[i];
                if (pNode && pNode._tag == t)
                    return pNode;
            }
        }
    },
    addChild:function (child, z, tag) {
        switch (arguments.length) {
            case 1:
                //add child
                z = child.getZOrder();
                tag = child.getTag();
                break;
            case 2:
                //add child with z order no tag
                tag = child.getTag();
        }
        if (z != null)child._setZOrder(z);
        child.setParent(this);
        child.setTag(tag);
        this._children.push(child);
        if (this._m_bIsRunning) {
            child.onEnter();
            child.onEnterTransitionDidFinish();
        }
    },
    setParent:function (p) {
        if(!p)
        {
            //try to remove parent
            if(this._parent.dom){
                this._parent.dom.removeChild(this.dom);
            }
            this._parent = p;
        }
        else{
            this._parent = p;
            this.setParentDiv(p);
        }
        //this._updateAnchorPoint();
    },

    //on enter and exit
    onEnter:function () {
        this._arrayMakeObjectsPerformSelector(this.getChildren(), "onEnter");
        this.resumeSchedulerAndActions();
        this._m_bIsRunning = true;
        this.show();
    },
    onExit:function () {
        this.pauseSchedulerAndActions();
        this._m_bIsRunning = false;
        //this._arrayMakeObjectsPerformSelector(this.getChildren(), "onExit");//dont need to tell children, as if the parent is destroyed the child is gone too?
        this.hide();
        /*var that = cc.$("#" + this.id());
        var cur = this.dom;
        if (cur.parentNode) {
            cur.parentNode.removeChild(cur);
        }
        that = null;*/
    },
    onEnterTransitionDidFinish:function () {
        this._arrayMakeObjectsPerformSelector(this.getChildren(), "onEnter");
    },
    hide:function () {
        this.dom.style.display = "none";
    },
    show:function () {
        this.dom.style.display = "block";
    },
    pauseSchedulerAndActions:function () {
        cc.Scheduler.sharedScheduler().pauseTarget(this);
        cc.ActionManager.sharedManager().pauseTarget(this);
    },
    resumeSchedulerAndActions:function () {
        cc.Scheduler.sharedScheduler().resumeTarget(this);
        cc.ActionManager.sharedManager().resumeTarget(this);
    },
    _arrayMakeObjectsPerformSelector:function (pArray, func) {
        if (pArray && pArray.length > 0) {
            for (var i = 0; i < pArray.length; i++) {
                var pNode = pArray[i];
                if (pNode && (typeof(func) == "string")) {
                    pNode[func]();
                } else if (pNode && (typeof(func) == "function")) {
                    func.call(pNode);
                }
            }
        }
    },

    //CCNODE stuff
    cleanup:function () {
        // actions
        this.stopAllActions();
        this.unscheduleAllSelectors();

        // timers
        this._arrayMakeObjectsPerformSelector(this.getChildren(), "cleanup");
    },
    stopAllActions:function () {
        cc.ActionManager.sharedManager().removeAllActionsFromTarget(this);
    },
    unscheduleAllSelectors:function () {
        cc.Scheduler.sharedScheduler().unscheduleAllSelectorsForTarget(this);
    }
});
cc.domNode.DomContainer = function () {
    if (!cc.domNode._domContainer) {
        var canvas = cc.canvas;
        canvas.style.zIndex = 0;
        cc.domNode._container = cc.$new(cc.TAG);
        cc.domNode._container.id = "Cocos2dGameContainer";
        cc.domNode._container.style.width = canvas.offsetWidth + "px";
        cc.domNode._container.style.height = canvas.offsetHeight + "px";
        cc.domNode._container.style.overflow = "hidden";
        //this._container.style.backgroundColor="RGBA(100,100,200,0.5)";
        cc.domNode._domContainer = cc.$new(cc.TAG);
        cc.domNode._domContainer.id = "DOMContainer";
        cc.domNode._domContainer.style.position="relative";
        cc.domNode._domContainer.style.top = "100%";
        cc.domNode._container.appendChild(cc.domNode._domContainer);
        document.body.insertBefore(cc.domNode._container, canvas);
        cc.domNode._container.appendChild(canvas);
    }
    return cc.domNode._domContainer;
};
cc.domNode.getTextSize = function (pText, pFontSize, fontfamily, pStyle) {
    var lDiv = cc.$new('lDiv');
    document.body.appendChild(lDiv);
    lDiv.style.fontSize = (isNaN(pFontSize)) ? pFontSize : ("" + pFontSize + "px");
    lDiv.style.position = "absolute";
    lDiv.style.left = -1000 + "px";
    lDiv.style.top = -1000 + "px";
    lDiv.style.fontFamily = fontfamily || "default";
    if (pStyle != null) {
        lDiv.style = pStyle;
    }

    lDiv.textContent = pText;

    var lResult = {
        width:lDiv.clientWidth,
        height:lDiv.clientHeight
    };

    document.body.removeChild(lDiv);
    lDiv = null;

    return lResult;
};

cc.domNode.implement(cc.domNodeMethods);
cc.Node.implement(cc.domNodeMethods);
cc.Node.implement({
    setParent:function (p) {
        if(!p)
        {
            //try to remove parent
            if(this._m_pParent.dom && this.dom && this.dom.parentNode == this._m_pParent.dom){
                this._m_pParent.dom.removeChild(this.dom);
            }
            this._m_pParent = p;
        }
        else{
            this._m_pParent = p;
            if(this.dom){
                this.setParentDiv(p);
            }
        }
        //this._updateAnchorPoint();
    },
    onEnter:function(){
        this._arrayMakeObjectsPerformSelector(this._m_pChildren, "onEnter");
        this.resumeSchedulerAndActions();
        this._m_bIsRunning = true;
        //if this node has a dom element attached, and it is the current running scene, we finally attach it to the dom container :)
        if(this.dom && this == cc.Director.sharedDirector().getRunningScene()){
            cc.domNode.DomContainer().appendChild(this.dom);
            this.show();
        }
    },
    setContentSizeInPixels:function (size) {
        if (!cc.Size.CCSizeEqualToSize(size, this._m_tContentSizeInPixels)) {
            //save dirty region when before change
            //this._addDirtyRegionToDirector(this.boundingBoxToWorld());
            this._m_tContentSizeInPixels = size;
            if (cc.CONTENT_SCALE_FACTOR() == 1) {
                this._m_tContentSize = this._m_tContentSizeInPixels;
            } else {
                this._m_tContentSize = cc.SizeMake(size.width / cc.CONTENT_SCALE_FACTOR(), size.height / cc.CONTENT_SCALE_FACTOR());
            }
            this._m_tAnchorPointInPixels = cc.ccp(this._m_tContentSizeInPixels.width * this._m_tAnchorPoint.x,
                this._m_tContentSizeInPixels.height * this._m_tAnchorPoint.y);

            //save dirty region when before change
            //this._addDirtyRegionToDirector(this.boundingBoxToWorld());
            this.setNodeDirty(); // CC_NODE_TRANSFORM_USING_AFFINE_MATRIX
            this._updateAnchorPoint();
        }
        if(this.dom)
        this.dom.style.maxHeight = size.height+"px";
    },
    setContentSize:function (size) {
        if (!cc.Size.CCSizeEqualToSize(size, this._m_tContentSize)) {
            //save dirty region when before change
            //this._addDirtyRegionToDirector(this.boundingBoxToWorld());
            this._m_tContentSize = size;

            if (cc.CONTENT_SCALE_FACTOR() == 1) {
                this._m_tContentSizeInPixels = this._m_tContentSize;
            }
            else {
                this._m_tContentSizeInPixels = cc.SizeMake(size.width * cc.CONTENT_SCALE_FACTOR(), size.height * cc.CONTENT_SCALE_FACTOR());
            }

            this._m_tAnchorPointInPixels = cc.ccp(this._m_tContentSizeInPixels.width * this._m_tAnchorPoint.x,
                this._m_tContentSizeInPixels.height * this._m_tAnchorPoint.y);
            //save dirty region when before change
            //this._addDirtyRegionToDirector(this.boundingBoxToWorld());
            this.setNodeDirty();
            this._updateAnchorPoint();
        }
        if(this.dom)
            this.dom.style.maxHeight = size.height+"px";
    },
    setAnchorPoint:function (point) {

        if (!cc.Point.CCPointEqualToPoint(point, this._m_tAnchorPoint)) {
            //save dirty region when before change
            //this._addDirtyRegionToDirector(this.boundingBoxToWorld());

            this._m_tAnchorPoint = point;
            this._m_tAnchorPointInPixels = cc.ccp(this._m_tContentSizeInPixels.width * this._m_tAnchorPoint.x,
                this._m_tContentSizeInPixels.height * this._m_tAnchorPoint.y);

            //save dirty region when after changed
            //this._addDirtyRegionToDirector(this.boundingBoxToWorld());
            this.setNodeDirty();
        }
        if(this.dom){
            var size = this.getContentSize();
            var s = point;
            if (this._m_bIsRelativeAnchorPoint) {
                this.dom.style.left = "-" + (s.x * size.width) + "px";
                this.dom.style.top = (s.y * size.height) + "px";
                this.dom.style[cc.CSS3.origin] = (s.x * 100) + "% " + (s.y * -size.height) + "px";
            }
            else {
                this.dom.style[cc.CSS3.origin] = (s.x * 100) + "% " + (s.y * -size.height) + "px";
                this.dom.style.top = 0;
                this.dom.style.left = 0;
            }
            this.dom.style.width = size.width + "px";
            this.dom.style.maxHeight = size.height + "px";
        }

    }
});
if (cc.LayerColor != null) {
    cc.LayerColor.implement({
        setOpacity:function(Var){
            this._m_cOpacity = Var;
            this._updateColor();

            //this._addDirtyRegionToDirector(this.boundingBoxToWorld());
            this.setNodeDirty();
            if(this.dom){
                this.dom.style.opacity = Var/255;
            }

        }
    });
}