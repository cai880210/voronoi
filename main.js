

multiDiagram = new Thiessen();

function bufferCallBack(evt) {
    var lsymbol = new esri.symbol.SimpleLineSymbol("solid", new esri.Color([2, 104, 80]), 2);
    var lsymbol2 = new esri.symbol.SimpleLineSymbol("solid", new esri.Color([223, 104, 80]), 2);
    var polygonSymbol = new esri.symbol.SimpleFillSymbol(
            "solid",
            new esri.symbol.SimpleLineSymbol("solid", new esri.Color([232, 104, 80]), 2),
            new esri.Color([232, 104, 80, 0.25])
                  );

    var plist = [];
    var baseSite = [];
    plist.push(newPolyline);
    var g = 0;
    // geometryService.intersect(plist, evt, function (geoRes) { console.log("aaaaaaaaaaaaaaa"); console.log(geoRes); }, function (err) { console.log(err) });
    dojo.forEach(evt, function (geometry, index) {
        geometryService.intersect(plist, geometry, function (res) {
            for (var i = 0; i < res.length; i++) {
                var pathPoi = [];
                var pathAb = [];
                var pahtGraphic = [];
                var pathp = [];
                for (var j = 0; j < res[i].paths.length; j++) {
                    var imgUrl = "";
                    var attr = {
                    };
                    switch (index) {
                        case 0:
                            attr.rowID = "A" + j;
                            attr.imgUrl = "/Areas/AMap/Content/images/ico/ico_2/∂¬øÿ»¶1.png";
                            //imgUrl = "/Areas/AMap/Content/images/sel1.png";
                            break;
                        case 1:
                            attr.rowID = "B" + j;
                            attr.imgUrl = "/Areas/AMap/Content/images/ico/ico_2/∂¬øÿ»¶2.png";
                            //imgUrl = "/Areas/AMap/Content/images/sel2.png";
                            break;
                        case 2:
                            attr.rowID = "C" + j;
                            //imgUrl = "/Areas/AMap/Content/images/sel3.png";
                            attr.imgUrl = "/Areas/AMap/Content/images/ico/ico_2/∂¬øÿ»¶3.png";
                            break;
                    }
                    var font = new esri.symbol.Font().setFamily("Arial").setSize("8pt");

                    var symbol = new esri.symbol.ShieldLabelSymbol(attr.imgUrl, new esri.Color("#FFFFFF"), 24, 24, font);
                    //symbol.setOffset(-30, -30);
                    var markerSymbol = new esri.symbol.SimpleMarkerSymbol({
                        "color": [232 - 40 * index, 114 + 50 * index, 80],
                        "size": 12,
                        "angle": -30,
                        "xoffset": 0,
                        "yoffset": 0,
                        "type": "esriSMS",
                        "style": "esriSMSCircle"
                    });
                    symbol.setText(attr.rowID);
                    attr.classi = index;
                    attr.order = j;
                    attr.num = 0;
                    var pt = new esri.geometry.Point(res[i].getPoint(j, 0).x, res[i].getPoint(j, 0).y, map.spatialReference);
                    attr.x = pt.x;
                    attr.y = pt.y;
                    attr.color = (232 - 40 * index) + ","+ (114 + 50 * index)+","+ 80;
                    var pGraphic = new esri.Graphic(pt, null, attr, null);
                    pGraphic.setSymbol(symbol);
                    pathAb.push(attr);
                    pathPoi.push(pt);
                    pathp.push([]);
                    pahtGraphic.push(pGraphic);
                    DKDGraphicsLayer.add(pGraphic);
                    var gSite =  toWebMercator(pt);
                    baseSite.push({ x: gSite.x, y: gSite.y ,attributes:attr});
                }
                ctrAb[index] = pathAb;
                ctrContain[index] = pathp;
                ctrPois[index] = pathPoi
                ctrGraphics[index] = pahtGraphic
            }
            var diag = multiDiagram.compute(baseSite, boxExtent);
            var cells = diag.cells;
            thiessenLayer.clear();
            for (var i = 0; i < cells.length; i++) {
                var ring = [];
                if (cells[i].halfedges.length > 2) {
                    var halfedges = cells[i].halfedges,nHalfedges = halfedges.length;
                    var startPoi = halfedges[0].getStartpoint();
                    var gPoi = Mercator2lonlat(startPoi.x, startPoi.y);
                    ring.push([gPoi.x, gPoi.y]);
                    for (var j = 0; j < nHalfedges;j++){
                        var endPoi = halfedges[j].getEndpoint();
                        var ePoi = Mercator2lonlat(endPoi.x, endPoi.y);
                        ring.push([ePoi.x, ePoi.y]);
                    }
                    var polygon = new esri.geometry.Polygon();
                    polygon.addRing(ring);
                    var attr = cells[i].site.attributes;
                    var colorStr = attr.color.split(",");
                    colorStr.push(0);
                    attr.ThiessenId = cells[i].site.ThiessenId;
                    var diagSymbol = new esri.symbol.SimpleFillSymbol("solid",new esri.symbol.SimpleLineSymbol("solid", new esri.Color([255, 255, 255,0.3]), 1),new esri.Color(colorStr));
                    var g = new esri.Graphic(polygon, diagSymbol, attr);
                    thiessenLayer.add(g);
                }
            }
            DKDGraphicsLayer.show();
            thiessenLayer.on("click", function (evt) {
                console.log(evt);
            });
            //layerOpen();
            //CtrlPoiBuffer(pathPoi,index);
        }, showError);
    });
//    ControlPoint();
    DKDGraphicsLayer.on("visibility-change", function (res) {
        if(res.visible == true){
            ControlPoint();
        }
    });
    
    //var times = 0;

    //var isOK = setInterval(function () {
    //    times++;
    //    if (ctrPois.length >= 3) {
            
    //        clearInterval(isOK);
    //    }

    //    if (times > 100) {
    //        layer.msg("Õ¯¬Á“Ï≥££¨…‘∫Û‘Ÿ ‘");
    //        clearInterval(isOK);
    //    }
    //}, 100);

}
