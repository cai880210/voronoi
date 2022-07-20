define("esri/Util/RBnode", ["dojo/_base/declare", "dojo/_base/lang", "dojo/has", "esri/kernel"], function (declare, lang, has, kernel) {
    var a = declare( null, {
        declaredClass: "esri.Util.RBnode",
        tree: {
            sentinel: {}
        },
        constructor: function (tree) {
            this.tree = lang.mixin(this.tree, tree);
            this.right = this.tree.sentinel;
            this.left = this.tree.sentinel;            
        },
        rbInsertSuccessor : function(node, successor) {
            var parent;
            if (node) {
                // >>> rhill 2011-05-27: Performance: cache previous/next nodes
                successor.rbPrevious = node;
                successor.rbNext = node.rbNext;
                if (node.rbNext) {
                    node.rbNext.rbPrevious = successor;
                }
                node.rbNext = successor;
                // <<<
                if (node.rbRight) {
                    // in-place expansion of node.rbRight.getFirst();
                    node = node.rbRight;
                    while (node.rbLeft) {node = node.rbLeft;}
                    node.rbLeft = successor;
                }
                else {
                    node.rbRight = successor;
                }
                parent = node;
            }
                // rhill 2011-06-07: if node is null, successor must be inserted
                // to the left-most part of the tree
            else if (this.root) {
                node = this.getFirst(this.root);
                // >>> Performance: cache previous/next nodes
                successor.rbPrevious = null;
                successor.rbNext = node;
                node.rbPrevious = successor;
                // <<<
                node.rbLeft = successor;
                parent = node;
            }
            else {
                // >>> Performance: cache previous/next nodes
                successor.rbPrevious = successor.rbNext = null;
                // <<<
                this.root = successor;
                parent = null;
            }
            successor.rbLeft = successor.rbRight = null;
            successor.rbParent = parent;
            successor.rbRed = true;
            // Fixup the modified tree by recoloring nodes and performing
            // rotations (2 at most) hence the red-black tree properties are
            // preserved.
            var grandpa, uncle;
            node = successor;
            while (parent && parent.rbRed) {
                grandpa = parent.rbParent;
                if (parent === grandpa.rbLeft) {
                    uncle = grandpa.rbRight;
                    if (uncle && uncle.rbRed) {
                        parent.rbRed = uncle.rbRed = false;
                        grandpa.rbRed = true;
                        node = grandpa;
                    }
                    else {
                        if (node === parent.rbRight) {
                            this.rbRotateLeft(parent);
                            node = parent;
                            parent = node.rbParent;
                        }
                        parent.rbRed = false;
                        grandpa.rbRed = true;
                        this.rbRotateRight(grandpa);
                    }
                }
                else {
                    uncle = grandpa.rbLeft;
                    if (uncle && uncle.rbRed) {
                        parent.rbRed = uncle.rbRed = false;
                        grandpa.rbRed = true;
                        node = grandpa;
                    }
                    else {
                        if (node === parent.rbLeft) {
                            this.rbRotateRight(parent);
                            node = parent;
                            parent = node.rbParent;
                        }
                        parent.rbRed = false;
                        grandpa.rbRed = true;
                        this.rbRotateLeft(grandpa);
                    }
                }
                parent = node.rbParent;
            }
            this.root.rbRed = false;
        },
    });
    has("extend-esri") && lang.setObject("esri.Util", a, kernel);
    return a;
})