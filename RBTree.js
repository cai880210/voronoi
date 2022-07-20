define(["dojo/_base/declare", "dojo/_base/lang", "dojo/has", "esri/kernel", "util/RBnode", "util/RedBlackSet"], function (declare, lang, has, kernel, RBnode, RedBlackSet) {
    RBTree = declare([RedBlackSet], {
        declaredClass: "RBTree",
        default_compare: function (a, b) {
            if (a < b) return -1;
            else if (b < a) return 1;
            else return 0;
        },
        constructor: function (compare_func) {
            this.RED = true;
            this.BLACK = false;
            this.size = 0;
            this.sentinel = new RBnode(this);
            this.sentinel.color = this.BLACK;
            this.root = this.sentinel;
            console.log(this.root);// when the tree is empty, root = sentinel
            this.root.parent = this.sentinel;
            /**
             * @type {Function}
             * @private
             */
            this.compare = compare_func || this.default_compare;
        }


    });
    lang.setObject("RBTree", RBTree, kernel);
    return RBTree;
})