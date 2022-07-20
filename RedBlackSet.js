define(["dojo/_base/declare", "dojo/_base/lang", "dojo/has", "esri/kernel", "util/RBnode"], function (declare, lang, has, kernel, RBnode) {
    RedBlackSet = declare(null, {
        declaredClass: "RedBlackSet",
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
        },

        /**
		 * Returns true if the current size of the tree is zero
		 * @return {Boolean} 
		 * @public
		 */

        isEmpty: function () {
            return this.size == 0;
        },

        /**
		 * Returns true if the key is associated with a value in this tree
		 * @param {*} key
		 * @return {Boolean} 
		 * @public
		 */
        contains: function (key) {
            return this.get_(key).key != null;
        },

        /**
        * @param {*} key
        * @return {RBnode} the node with the given key
        * @private
        */
        get_: function (key) {
            var x = this.root;
            while (x != this.sentinel && this.compare(x.key, key) != 0) {
                if (this.compare(key, x.key) < 0) x = x.left;
                else x = x.right;
            }
            return x;
        },

        /**
	     * @return {*} the value associated with the minimum key in this tree 
	     * @public
	     */
        getMin: function () {
            return this.min(this.root).key;
        },

        /**
	     * @return {*} the value associated with the maximum key in this tree 
	     * @public
	     */
        getMax: function () {
            return this.max(this.root).key;
        },

        /** todo this.successor_(z)
        *	Deletes a node in the tree
        * @param {RBnode} z the node to delete
        * @private
        */
        delete_: function (z) {
            var y;
            var x;
            if (z.left == this.sentinel || z.right == this.sentinel) {
                y = z;
            }
            else {
                y = this.successor_(z);
            }

            if (y.left != this.sentinel) {
                x = y.left;
            }
            else {
                x = y.right;
            }
            x.parent = y.parent;
            if (y.parent == this.sentinel) {
                this.root = x;
            }
            else if (y == y.parent.left) {
                y.parent.left = x;
            }
            else {
                y.parent.right = x;
            }

            if (y != z) {
                z.key = y.key;
            }
            if (y.color == this.BLACK) {
                this.deleteFixup(x);
            }
            this.size--;
            //return y;

        },

        /* todo  this.contains(key) ； this.compare(z.key, x.key) ；this.insertFixup(z);this.get_(key);
        * 
        */

        insert: function (key) {
            if (!this.contains(key)) {
                var z = new RBnode(this);
                z.key = key;
                console.log(z);
                var y = this.sentinel;
                var x = this.root;
                while (x != this.sentinel) {
                    y = x;
                    //if (z.key < x.key) x = x.left;
                    if (this.compare(z.key, x.key) < 0) x = x.left;
                    else x = x.right;
                }
                z.parent = y;
                if (y == this.sentinel) {
                    this.root = z;
                }
                    //else if(z.key < y.key){
                else if (this.compare(z.key, y.key) < 0) {
                    y.left = z;
                }
                else {
                    y.right = z;
                }
                z.left = this.sentinel;
                z.right = this.sentinel;
                z.color = this.RED;
                this.insertFixup(z);
                this.size++;
            }
            else {
                var node = this.get_(key);
                node.key = key;
            }
        },

        /* todo  this.get_(key);this.delete_(x);
        *
        */
        remove: function (key) {
            var x = this.get_(key);
            if (x != this.sentinel) {
                var retval = x.key
                this.delete_(x);
                return retval;
            }
            else return null;
        },
        /**
		 * Removes all elements from this set
		 * 
		 */
        clear: function () {
            this.size = 0;
            this.sentinel = new RBnode(this);
            this.sentinel.color = this.BLACK;
            this.root = this.sentinel; // when the tree is empty, root = sentinel 
            this.root.parent = this.sentinel;
        },

        /**
        * @private
        */
        min: function (x) {
            while (x.left != this.sentinel) {
                x = x.left;
            }
            return x;
        },
        max: function (x) {
            while (x.right != this.sentinel) {
                x = x.right;
            }
            return x;
        },
        /**
		 * Finds and returns the value associated with the succeeding key to that passed to the function
		 * @param {js_cols.RBnode} x 
		 * @return {js_cols.RBnode} the node with the succeeding key
		 * @private
		 */
        successor_: function (x) {
            if (x.right != this.sentinel) return this.min(x.right);
            var y = x.parent;
            while (y != this.sentinel && x == y.right) {
                x = y;
                y = y.parent;
            }
            return y;
        },
        /**
	     * Finds and returns the value associated with the succeeding key to that passed to the function
	     * @param {*} key
	     * @return {*} the value associated with the succeeding key, or null if the supplied key was not in the set
	     * @public
	     */
        successor: function (key) {

            if (this.size > 0) {
                var x = this.get_(key);
                if (x == this.sentinel) return null;
                if (x.right != this.sentinel) return this.min(x.right).key;
                var y = x.parent;
                while (y != this.sentinel && x == y.right) {
                    x = y;
                    y = y.parent;
                }
                if (y != this.sentinel) return y.key;
                else return null;
            }
            else {
                return null;
            }
        },
        /**
         * Finds and returns the value associated with the preceeding key to that passed to the function
         * @param {*} key
         * @return {*} the value associated with the preceeding key, or null if the supplied key was not in the set
         * @public
         */
        predecessor: function (key) {

            if (this.size > 0) {
                var x = this.get_(key);
                if (x == this.sentinel) return null;
                if (x.left != this.sentinel) return this.max(x.left).key;
                var y = x.parent;
                while (y != this.sentinel && x == y.left) {
                    x = y;
                    y = y.parent;
                }
                if (y != this.sentinel) return y.key;
                else return null;
            }
            else {
                return null;
            }
        },

        /**
        * A helper function, used for tree balancing
        * @private
        */

        leftRotate: function (x) {

            var y = x.right;
            x.right = y.left;
            if (y.left != this.sentinel) y.left.parent = x;
            y.parent = x.parent;
            if (x.parent == this.sentinel) {
                this.root = y;
            }
            else if (x == x.parent.left) {
                x.parent.left = y;
            }
            else {
                x.parent.right = y;
            }
            y.left = x;
            x.parent = y;
        },

        rightRotate: function (x) {

            var y = x.left;
            x.left = y.right;
            if (y.right != this.sentinel) y.right.parent = x;
            y.parent = x.parent;
            if (x.parent == this.sentinel) {
                this.root = y;
            }
            else if (x == x.parent.right) {
                x.parent.right = y;
            }
            else {
                x.parent.left = y;
            }
            y.right = x;
            x.parent = y;

        },
        /* 
        *  reestablish the tree invariants after insertion or deletion
        */
        insertFixup: function (z) {
            while (z != this.sentinel && z != this.root && z.parent.color == this.RED) {
                if (z.parent == z.parent.parent.left) {
                    var y = z.parent.parent.right;
                    if (y.color == this.RED) {
                        z.parent.color = this.BLACK;
                        y.color = this.BLACK;
                        z.parent.parent.color = this.RED;
                        z = z.parent.parent;
                    }
                    else {
                        if (z == z.parent.right) {
                            z = z.parent;
                            this.leftRotate(z);
                        }
                        z.parent.color = this.BLACK;
                        z.parent.parent.color = this.RED;
                        if (z.parent.parent != this.sentinel) this.rightRotate(z.parent.parent);
                    }
                } else {
                    var y = z.parent.parent.left;
                    if (y.color == this.RED) {
                        z.parent.color = this.BLACK;
                        y.color = this.BLACK;
                        z.parent.parent.color = this.RED;
                        z = z.parent.parent;
                    } else {
                        if (z == z.parent.left) {
                            z = z.parent;
                            this.rightRotate(z);
                        }
                        z.parent.color = this.BLACK;
                        z.parent.parent.color = this.RED;
                        if (z.parent.parent != this.sentinel) this.leftRotate(z.parent.parent);
                    }
                }
            }
            this.root.color = this.BLACK;
        },
        deleteFixup: function (x) {
            while (x != this.root && x.color == this.BLACK) {
                if (x == x.parent.left) {
                    var w = x.parent.right;

                    if (w.color == this.RED) {
                        w.color = this.BLACK;
                        x.parent.color = this.RED;
                        this.leftRotate(x.parent);
                        w = x.parent.right;
                    }

                    if (w.left.color == this.BLACK &&
                        w.right.color == this.BLACK) {
                        w.color = this.RED;
                        x = x.parent;
                    } else {
                        if (w.right.color == this.BLACK) {
                            w.left.color = this.BLACK;
                            w.color = this.RED;
                            this.rightRotate(w);
                            w = x.parent.right;
                        }
                        w.color = x.parent.color;
                        x.parent.color = this.BLACK;
                        w.right.color = this.BLACK;
                        this.leftRotate(x.parent);
                        x = this.root;
                    }
                } else {
                    var w = x.parent.left;

                    if (w.color == this.RED) {
                        w.color = this.BLACK;
                        x.parent.color = this.RED;
                        this.rightRotate(x.parent);
                        w = x.parent.left;
                    }

                    if (w.right.color == this.BLACK &&
                       w.left.color == this.BLACK) {
                        w.color = this.RED;
                        x = x.parent;
                    } else {
                        if (w.left.color == this.BLACK) {
                            w.right.color = this.BLACK;
                            w.color = this.RED;
                            this.leftRotate(w);
                            w = x.parent.left;
                        }
                        w.color = x.parent.color;
                        x.parent.color = this.BLACK;
                        w.left.color = this.BLACK;
                        this.rightRotate(x.parent);
                        x = this.root;
                    }
                }
            }
            x.color = this.BLACK;
        },

        /**
		 * Performs an in-order traversal of the tree and calls {@code f} with each
		 * traversed node. The traversal ends after traversing the tree's
		 * maximum node or when {@code f} returns a value that evaluates to true.
		 *
		 * @param {Function} f The function to call for each item. The function takes
		 *     two arguments: the key, and the RedBlackSet.
		 * @param {Object=} opt_obj The object context to use as "this" for the
		 *     function.
		 * @public
		 */
        traverse: function (f, opt_obj) {
            if (this.isEmpty()) return;
            var node = this.min(this.root);
            while (node != this.sentinel) {

                if (f.call(opt_obj, node.key, this)) return;
                node = this.successor_(node);
            }
        },
        /**
		 * Calls a function on each item in the RedBlackSet.
		 *
		 * @param {Function} f The function to call for each item. The function takes
		 *     two arguments: the key, and the RedBlackSet.
		 * @param {Object=} opt_obj The object context to use as "this" for the
		 *     function.
		 */
        forEach: function (f, opt_obj) {
            if (this.isEmpty()) return;
            for (var n = this.min(this.root) ; n != this.sentinel; n = this.successor_(n)) {

                f.call(opt_obj, n.key, n.key, this);
            }
        },

        /**
		 * Clones a set and returns a new set.
		 * @return {!RedBlackSet} A new map with the same key-value pairs.
		 */
        clone: function () {
            var rv = new RedBlackSet(this.compare);
            rv.insertAll(this);
            return rv;

        },

        /**
        * Inserts a collection of values into the tree
        * @param {*} element the value
        * @public
        */
        insertAll: function (col) {
            if (this.typeOf(col) == "array") {
                for (var i = 0; i < col.length; i++) {
                    this.insert(col[i]);
                };
            }
            else if (this.typeOf(col.forEach) == "function") {
                col.forEach(this.insert, this);
            }
            else if (this.typeOf(col.getValues) == "function") {
                var arr = col.getValues();
                for (var i = 0; i < arr.length; i++) {
                    this.insert(arr[i]);
                };
            }
            else if (this.typeOf(col) == "object") {
                for (var key in col) {
                    this.insert(col[key]);
                }
            }
        },
        typeOf: function (a) {
            var b = typeof a;
            if (b == "object")
                if (a) {
                    if (a instanceof Array || !(a instanceof Object) && Object.prototype.toString.call(a) == "[object Array]" || typeof a.length == "number" && typeof a.splice != "undefined" && typeof a.propertyIsEnumerable != "undefined" && !a.propertyIsEnumerable("splice"))
                        return "array";
                    if (!(a instanceof Object) && (Object.prototype.toString.call(a) == "[object Function]" || typeof a.call != "undefined" && typeof a.propertyIsEnumerable != "undefined" && !a.propertyIsEnumerable("call")))
                        return "function"
                } else
                    return "null";
            else if (b == "function" && typeof a.call == "undefined")
                return "object";
            return b
        }
    });
    lang.setObject("RedBlackSet", RedBlackSet, kernel);
    return RedBlackSet;
})