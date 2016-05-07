function Scene3d(canvasId) {
    this.canvasId = canvasId;
    this.init();
    var self = this;
}

Scene3d.prototype.init = function() {
    var canvas = document.getElementById(this.canvasId);
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width;
    this.h = canvas.height;
    this.count = 5;
    this.sz = 100;
    this.ht = 0.65; // height of person
    this.vis = 200; // needs to be greater than the diagonal of a 100 square
    this.scrDist = 0.3; // = depth of field
    this.scrHalf = 0.1;
    this.initField(100, 5); // # of trees, # of gifts
    this.initImages();

    var self = this;
    canvas.onmousedown = function() { self.mouseDown(); };
    canvas.onmouseup = function() { self.mouseUp(); };
    setInterval(function() {self.onTimer()}, 70);
}

Scene3d.prototype.initImages = function() {
    var files = ['fir1.png', 'fir2.png', 'gift.png', 'stake.png'];
    this.images = [];
    for (var i in files) {
        var img = new Image();
        img.src = window.sceneScriptPath + files[i];
        this.images.push(img);
    }
}

Scene3d.prototype.initField = function(n, k) {
    this.x = this.sz / 2;
    this.y = this.sz / 2;
    this.dir = 0;
    this.field = [];
    for (var i = 0; i < this.sz; i++) {
        this.field.push({type: 3, x: i, y: 0, h: 1.5});
        this.field.push({type: 3, x: i + 1, y: this.sz, h: 1.5});
        this.field.push({type: 3, x: 0, y: i + 1, h: 1.5});
        this.field.push({type: 3, x: this.sz, y: i, h: 1.5});
    }
    for (var j = 0; j < n; j++) {
        var x = Math.random() * this.sz;
        var y = Math.random() * this.sz;
        this.field.push({type: Math.floor(Math.random() * 2), x: x, y: y, h: 2.5});
    }
    var fieldSz = this.field.length;
    for (var j = 0; j < k; j++) {
        var x = Math.random() * this.sz;
        var y = Math.random() * this.sz;
        this.field.push({type: 2, x: x, y: y, h: 2.5, index: fieldSz + j}); // h: ## = size of 'gift.png'
    }
}

Scene3d.prototype.redraw = function() {
    this.ctx.fillStyle = '#80bfff';
    this.ctx.fillRect(0, 0, this.w, this.h / 2);
    this.ctx.fillStyle = '#86592d';
    this.ctx.fillRect(0, this.h / 2, this.w, this.h / 2);
    var objects = this.rotate(this.filterVisible());
    this.sortObjects(objects);
    for (var i in objects) {
        var obj = objects[i];
        if (obj.type < 0) {
            continue;
        }
        if (obj.type == 2) {
            if (Math.sqrt(obj.x*obj.x + obj.y*obj.y) < 1.5) {
                this.field[obj.index].type = -1;
                this.count--;
                continue;
            }
        }
        var da = -Math.atan2(obj.y, obj.x);
        var sx = Math.tan(da) * this.scrDist;
        var k = this.scrDist / obj.x;
        var sh = obj.h * k;
        var sy = -this.ht * k;
        this.drawObject(obj, sx, sy, sh);
    }
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(' Presents to find: ' + this.count, 2, 23);
}

Scene3d.prototype.sortObjects = function(objs) {
    for (var i in objs) {
        var obj = objs[i];
        obj.dist = Math.sqrt(Math.pow(obj.x, 2) + Math.pow(obj.y, 2));
    }
    objs.sort(function(a, b) { return b.dist - a.dist; });
}

Scene3d.prototype.drawObject = function(obj, sx, sy, sh) {
    var scrHalfH = this.scrHalf * this.h / this.w
    var x = Math.round((sx + this.scrHalf) * this.w / (this.scrHalf * 2));
    var y1 = Math.round((-sy + scrHalfH) * this.h / (scrHalfH * 2));
    var y2 = Math.round((-(sh + sy) + scrHalfH) * this.h / (scrHalfH * 2));
    var img = this.images[obj.type];
    var h = y1 - y2;
    var w = Math.round(img.width * h / img.height);
    this.ctx.drawImage(img, Math.round(x - w / 2), y2, w, h);
}

Scene3d.prototype.filterVisible = function() {
    var da = Math.atan(this.scrHalf / this.scrDist);
    var res = [];
    for (var i in this.field) {
        var obj = this.field[i];
        var dist = Math.sqrt(Math.pow(obj.y - this.y, 2) + Math.pow(obj.x - this.x, 2));
        if (dist > this.scrDist && dist < this.vis && Math.abs(this.angleTo(obj.x, obj.y)) < da) {
            res.push(obj);
        }
    }
    return res;
}

Scene3d.prototype.rotate = function(objs) {
    var res = [];
    for (var i in objs) {
        var obj = objs[i];
        var x = obj.x - this.x;
        var y = obj.y - this.y;
        var nx = Math.cos(this.dir) * x + Math.sin(this.dir) * y;
        var ny = Math.cos(this.dir) * y - Math.sin(this.dir) * x;
        var copy = {type: obj.type, h: obj.h, x: nx, y: ny};
        if (copy.type == 2) {
            copy.index = obj.index;
        }
        res.push(copy);
    }
    return res;
}

Scene3d.prototype.angleTo = function(x, y) {
    var dir = Math.atan2(y - this.y, x - this.x);
    dir -= this.dir;
    while (dir >= Math.PI) {
        dir -= 2 * Math.PI;
    }
    while (dir < -Math.PI) {
        dir += 2 * Math.PI;
    }
    return dir;
}

Scene3d.prototype.onTimer = function() {
    if (this.move == 'F') {
        var step = 0.7; // run speed
        this.x += step * Math.cos(this.dir);
        this.y += step * Math.sin(this.dir);
    } else if (this.move == 'L') {
        this.dir += 0.03; // turn left speed
    } else if (this.move == 'R') {
        this.dir -= 0.03; // turn right speed
    }
    this.redraw();
}

Scene3d.prototype.mouseDown = function() {
    var sect = (event.offsetX * 7 / this.w);
    if (sect < 2) {
        this.move = 'L';
    } else if (sect > 5) {
        this.move = 'R';
    } else {
        this.move = 'F';
    }
}

Scene3d.prototype.mouseUp = function() {
    this.move = null;
}

window.sceneScriptPath = (function() {
    var scripts = document.getElementsByTagName('script');
    var src = './';
    for (var i = 0; i < scripts.length; i++) {
        var url = scripts.item(i).getAttribute('src');
        if (url !== null && url.substring(url.length - 10) == 'scene3d.js') {
            src = url;
            break;
        }
    }
    return src.replace(/[^\/]+$/, '');
})();
