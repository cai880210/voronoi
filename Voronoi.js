define(["dojo/_base/declare", "dojo/_base/lang", "dojo/has", "esri/kernel", "util/RBnode", "util/RedBlackSet"], function (declare, lang, has, kernel, RBnode, RedBlackSet) {
    Voronoi = declare(null, {
        declaredClass: "Voronoi",
        _init:function(){
            this.sqrt = Math.sqrt;
            this.abs = Math.abs;
            this.ε =  1e-9;
            this.invε = 1.0 / this.ε;
        },
        equalWithEpsilon : function(a,b){return this.abs(a-b)<1e-9;},
        greaterThanWithEpsilon : function(a,b){return a-b>1e-9;},
        greaterThanOrEqualWithEpsilon : function(a,b){return b-a<1e-9;},
        lessThanWithEpsilon : function(a,b){return b-a>1e-9;},
        lessThanOrEqualWithEpsilon : function(a,b){return a-b<1e-9;},

        constructor: function (compare_func) {
            this.vertices = null;
            this.edges = null;
            this.cells = null;
            this.toRecycle = null;
            this.beachsectionJunkyard = [];
            this.circleEventJunkyard = [];
            this.vertexJunkyard = [];
            this.edgeJunkyard = [];
            this.cellJunkyard = [];
        },
        reset : function() {
            if (!this.beachline) {
                this.beachline = new RedBlackSet();
            }
            // Move leftover beachsections to the beachsection junkyard.
            if (this.beachline.root) {
                var beachsection = this.beachline.getMin();
                while (beachsection) {
                    this.beachsectionJunkyard.push(beachsection); // mark for reuse
                    beachsection = this.beachline.successor(beachsection);
                }
            }
            this.beachline.root = null;
            if (!this.circleEvents) {
                this.circleEvents = new RedBlackSet();
            }
            this.circleEvents.root = this.firstCircleEvent = null;
            this.vertices = [];
            this.edges = [];
            this.cells = [];
        },
        
        createBeachsection : function(site) {
            var beachsection = this.beachsectionJunkyard.pop();
            if (!beachsection) {
                beachsection = new Beachsection();
            }
            beachsection.site = site;
            return beachsection;
        },
        
        createHalfedge : function(edge, lSite, rSite) {
            return new Halfedge(edge, lSite, rSite);
        },
        detachBeachsection : function(beachsection) {
            this.detachCircleEvent(beachsection); // detach potentially attached circle event
            this.beachline.remove(beachsection); // remove from RB-tree
            this.beachsectionJunkyard.push(beachsection); // mark for reuse
        },
        attachCircleEvent : function(arc) {
            var lArc = this.beachline.predecessor(arc),
                rArc = this.beachline.successor(arc);

            if (!lArc || !rArc) {return;} // does that ever happen?
            var lSite = lArc.site,
                cSite = arc.site,
                rSite = rArc.site;

            if (lSite===rSite) {return;}

            var ax = lSite.x - cSite.x,
                ay = lSite.y - cSite.y,
                cx = rSite.x - cSite.x,
                cy = rSite.y - cSite.y,
                dx =  rSite.x - lSite.x,
                dy =  rSite.y - lSite.y,
                d = 2 * (ay * dx - ax * dy),
                ha = ax * ax + ay * ay,
                hd = dx * dx + dy * dy;

            var vertex = this.createVertex((dy * ha + ay * hd) / d + lSite.x, (-ax * hd - dx * ha) / d + lSite.y);

            var d1 = 2*(ax*cy-ay*cx);
            if (d1 >= -2e-12){return;}

            var ha = ax*ax+ay*ay,
                hc = cx*cx+cy*cy,
                x = (cy*ha-ay*hc)/d1,
                y = (ax*hc-cx*ha)/d1,
                ycenter = y + cSite.y;

            // Important: ybottom should always be under or at sweep, so no need
            // to waste CPU cycles by checking

            // recycle circle event object if possible
            var circleEvent = this.circleEventJunkyard.pop();
            if (!circleEvent) {
                circleEvent = new CircleEvent();
            }
            circleEvent.arc = arc;
            circleEvent.site = cSite;
            circleEvent.x = x + cSite.x;
            circleEvent.y = ycenter+this.sqrt(x*x+y*y); // y bottom
            circleEvent.ycenter = ycenter;
            //TODO 
            arc.circleEvent = circleEvent;
            console.log(arc);
            this.circleEvents.insert(circleEvent);

        },

        detachCircleEvent: function (arc) {
            var circleEvent = arc.circleEvent;
            if (circleEvent) {
                var preCircleEvent = this.circleEvents.predecessor(circleEvent);
                if (!preCircleEvent) {
                    this.firstCircleEvent = this.circleEvents.successor(preCircleEvent);
                }
                this.circleEvents.remove(circleEvent); // remove from RB-tree
                this.circleEventJunkyard.push(circleEvent);
                arc.circleEvent = null;
            }
        },

        compute : function(sites, bbox) {
            // to measure execution time
            var startTime = new Date();

            // init internal state
            this.reset();

            // any diagram data available for recycling?
            // I do that here so that this is included in execution time
            if ( this.toRecycle ) {
                this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
                this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
                this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
                this.toRecycle = null;
            }

            // Initialize site event queue
            var siteEvents = sites.slice(0);
            siteEvents.sort(function(a,b){
                var r = b.y - a.y;
                if (r) {return r;}
                return b.x - a.x;
            });

            // process queue
            var site = siteEvents.pop(),
                siteid = 0,
                xsitex, // to avoid duplicate sites
                xsitey,
                cells = this.cells,
                circle;

            // main loop
            for (; ;) {

                circle = this.firstCircleEvent;
                // add beach section
                if (site && (!circle || site.y < circle.y || (site.y === circle.y && site.x < circle.x))) {
                    // only if site is not a duplicate
                    if (site.x !== xsitex || site.y !== xsitey) {
                        // first create cell for new site
                        cells[siteid] = this.createCell(site);
                        site.voronoiId = siteid++;
                        
                        this.handleSiteEvent(site);
                        // remember last site coords to detect duplicate
                        xsitey = site.y;
                        xsitex = site.x;
                    }
                    site = siteEvents.pop();
                }
                else if (circle) {
                    this.hanldeCircleEvent(circle.arc);
                }                    
                else { // all done, quit
                    break;
                }
            }

            this.clipEdges(bbox);

            this.closeCells(bbox);

            // to measure execution time
            var stopTime = new Date();

            // prepare return values
            var diagram = new Diagram();
            diagram.cells = this.cells;
            diagram.edges = this.edges;
            diagram.vertices = this.vertices;
            diagram.execTime = stopTime.getTime()-startTime.getTime();

            // clean up
            this.reset();

            return diagram;
        },

        recycle : function(diagram) {
            if ( diagram ) {
                if ( diagram instanceof Diagram ) {
                    this.toRecycle = diagram;
                }
                else {
                    throw 'Voronoi.recycleDiagram() > Need a Diagram object.';
                }
            }
        },
        setEdgeStartpoint : function(edge, lSite, rSite, vertex) {
            if (!edge.va && !edge.vb) {
                edge.va = vertex;
                edge.lSite = lSite;
                edge.rSite = rSite;
            }
            else if (edge.lSite === rSite) {
                edge.vb = vertex;
            }
            else {
                edge.va = vertex;
            }
        },
        handleSiteEvent: function(site) {
            var x = site.x,
                directrix = site.y;
            var lArc, rArc,subLeftArc;
            var newArc = this.createBeachsection(site);
            this.beachline.insert(newArc);
            this.attachCircleEvent(newArc);
            if (!this.firstCircleEvent) {
                var node = this.beachline.get_(newArc);
                if(node.left){
                    var lArc = this.beachline.predecessor(newArc);
                    this.attachCircleEvent(lArc);
                }else{
                    var rArc = this.beachline.successor(newArc);
                    this.attachCircleEvent(rArc);
                }
            }
            //this.detachCircleEvent(newArc);


            while (node) {
                dxl = this.leftBreakPoint(node,directrix)-x;

                if (dxl > 1e-9) {
                    
                    node = node.rbLeft;
                }
                else {
                    dxr = x-this.rightBreakPoint(node,directrix);
                    
                    if (dxr > 1e-9) {
                        if (!node.rbRight) {
                            lArc = node;
                            break;
                        }
                        node = node.rbRight;
                    }
                    else {
                        
                        if (dxl > -1e-9) {
                            lArc = node.rbPrevious;
                            rArc = node;
                        }
                           
                        else if (dxr > -1e-9) {
                            lArc = node;
                            rArc = node.rbNext;
                        }
                            // falls exactly somewhere in the middle of the beachsection
                        else {
                            lArc = rArc = node;
                        }
                        break;
                    }
                }
            }
            
            // create a new beach section object for the site and add it to RB-tree


            if (!lArc && !rArc) {
                return;
            }

            if (lArc === rArc) {
                // invalidate circle event of split beach section
                this.detachCircleEvent(lArc);

                // split the beach section into two separate beach sections
                rArc = this.createBeachsection(lArc.site);
                this.beachline.rbInsertSuccessor(newArc, rArc);

                newArc.edge = rArc.edge = this.createEdge(lArc.site, newArc.site);

                this.attachCircleEvent(lArc);
                this.attachCircleEvent(rArc);
                return;
            }

            if (lArc && !rArc) {
                newArc.edge = this.createEdge(lArc.site,newArc.site);
                return;
            }

            if (lArc !== rArc) {
                // invalidate circle events of left and right sites
                this.detachCircleEvent(lArc);
                this.detachCircleEvent(rArc);

                var lSite = lArc.site,
                    ax = lSite.x,
                    ay = lSite.y,
                    bx=site.x-ax,
                    by=site.y-ay,
                    rSite = rArc.site,
                    cx=rSite.x-ax,
                    cy=rSite.y-ay,
                    d=2*(bx*cy-by*cx),
                    hb=bx*bx+by*by,
                    hc=cx*cx+cy*cy,
                    vertex = this.createVertex((cy*hb-by*hc)/d+ax, (bx*hc-cx*hb)/d+ay);

                // one transition disappear
                this.setEdgeStartpoint(rArc.edge, lSite, rSite, vertex);

                // two new transitions appear at the new vertex location
                newArc.edge = this.createEdge(lSite, site, undefined, vertex);
                rArc.edge = this.createEdge(site, rSite, undefined, vertex);

                // check whether the left and right beach sections are collapsing
                // and if so create circle events, to handle the point of collapse.
                this.attachCircleEvent(lArc);
                this.attachCircleEvent(rArc);
                return;
            }
        },

        handleCircleEvent: function(beachsection) {
            var circle = beachsection.circleEvent,
                x = circle.x,
                y = circle.ycenter,
                vertex = this.createVertex(x, y),
                previous = this.beachline.predecessor(beachsection),
                next = this.beachline.successor(beachsection),
                disappearingTransitions = [beachsection],
                abs_fn = Math.abs;

            this.detachBeachsection(beachsection);

            // look left
            var lArc = previous;
            while (lArc.circleEvent && abs_fn(x-lArc.circleEvent.x)<1e-9 && abs_fn(y-lArc.circleEvent.ycenter)<1e-9) {
                previous = this.beachline.predecessor(lArc);
                disappearingTransitions.unshift(lArc);
                this.detachBeachsection(lArc); // mark for reuse
                lArc = previous;
            }

            disappearingTransitions.unshift(lArc);
            this.detachCircleEvent(lArc);

            // look right
            var rArc = next;
            while (rArc.circleEvent && abs_fn(x-rArc.circleEvent.x)<1e-9 && abs_fn(y-rArc.circleEvent.ycenter)<1e-9) {
                next = this.beachline.successor(rArc);
                disappearingTransitions.push(rArc);
                this.detachBeachsection(rArc); // mark for reuse
                rArc = next;
            }

            disappearingTransitions.push(rArc);
            this.detachCircleEvent(rArc);

            var nArcs = disappearingTransitions.length,
                iArc;
            for (iArc=1; iArc<nArcs; iArc++) {
                rArc = disappearingTransitions[iArc];
                lArc = disappearingTransitions[iArc-1];
                this.setEdgeStartpoint(rArc.edge, lArc.site, rArc.site, vertex);
            }

            lArc = disappearingTransitions[0];
            rArc = disappearingTransitions[nArcs-1];
            rArc.edge = this.createEdge(lArc.site, rArc.site, undefined, vertex);

            // create circle events if any for beach sections left in the beachline
            // adjacent to collapsed sections
            this.attachCircleEvent(lArc);
            this.attachCircleEvent(rArc);
        }
    });
    lang.setObject("Voronoi", Voronoi, kernel);
    return Voronoi;
})