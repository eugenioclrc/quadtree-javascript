/*
 * QuadTree Implementation in JavaScript
 * @author: silflow <https://github.com/silflow>
 *
 * Usage:
 * To create a new empty Quadtree, do this:
 * var tree = QUAD.init(args)
 *
 * args = {
 *    // mandatory fields
 *    x : x coordinate
 *    y : y coordinate
 *    w : width
 *    h : height
 *
 *    // optional fields
 *    maxChildren : max children per node
 *    maxDepth : max depth of the tree
 *}
 *
 * API:
 * tree.insert() accepts arrays or single items
 * every item must have a .x, .y, .w, and .h property. if they don't, the tree will break.
 *
 * tree.retrieve(selector, callback) calls the callback for all objects that are in
 * the same region or overlapping.
 *
 * tree.clear() removes all items from the quadtree.
 */

const TOP_LEFT = 0;
const TOP_RIGHT = 1;
const BOTTOM_LEFT = 2;
const BOTTOM_RIGHT = 3;
const PARENT = 4;

/**
 * Node creator. You should never create a node manually. the algorithm takes
 * care of that for you.
 */
class Node {
  constructor(x, y, w, h, depth, maxChildren, maxDepth) {
    this.items = [];
    this.nodes = [];
    this.maxChildren = maxChildren;
    this.maxDepth = maxDepth;
    this.x = x;
     // top left point
    this.y = y;
     // top right point
    this.w = w;
     // width
    this.h = h;
     // height
    this.depth = depth;
     // depth level of the node
    /**
     * iterates all items that match the selector and invokes the supplied callback on them.
     */
  }
  retrieve(item, callback, instance) {
    this.items.forEach(el => {
      if (instance) {
        callback.call(instance, el);
      } else {
        callback(el);
      }
    });
    // check if node has subnodes
    if (this.nodes.length) {
      // call retrieve on all matching subnodes
      this.findOverlappingNodes(item, (dir) => {
        this.nodes[dir].retrieve(item, callback, instance);
      });
    }
  }

  /**
   * Adds a new Item to the node.
   *
   * If the node already has subnodes, the item gets pushed down one level.
   * If the item does not fit into the subnodes, it gets saved in the
   * "children"-array.
   *
   * If the maxChildren limit is exceeded after inserting the item,
   * the node gets divided and all items inside the "children"-array get
   * pushed down to the new subnodes.
   */
  insert(item) {
    if (this.nodes.length) {
      // get the node in which the item fits best
      const i = this.findInsertNode(item);
      if (i === PARENT) {
        // if the item does not fit, push it into the
        // children array
        this.items.push(item);
      } else {
        this.nodes[i].insert(item);
      }
    } else {
      this.items.push(item);
      // divide the node if maxChildren is exceeded and maxDepth is not reached
      if (this.items.length > this.maxChildren && this.depth < this.maxDepth) {
        this.divide();
      }
    }
  }

  /**
   * Find a node the item should be inserted in.
   */
  findInsertNode(item) {
    // left
    if (item.x + item.w < this.x + (this.w / 2)) {
      if (item.y + item.h < this.y + (this.h / 2)) {
        return TOP_LEFT;
      }
      if (item.y >= this.y + (this.h / 2)) {
        return BOTTOM_LEFT;
      }
      return PARENT;
    }

    // right
    if (item.x >= this.x + (this.w / 2)) {
      if (item.y + item.h < this.y + (this.h / 2)) {
        return TOP_RIGHT;
      }
      if (item.y >= this.y + (this.h / 2)) {
        return BOTTOM_RIGHT;
      }
      return PARENT;
    }

    return PARENT;
  }

  /**
   * Finds the regions the item overlaps with. See constants defined
   * above. The callback is called for every region the item overlaps.
   */
  findOverlappingNodes(item, callback) {
    // left
    if (item.x < this.x + (this.w / 2)) {
      if (item.y < this.y + (this.h / 2)) {
        callback(TOP_LEFT);
      }
      if (item.y + item.h >= this.y + this.h / 2) {
        callback(BOTTOM_LEFT);
      }
    }
    // right
    if (item.x + item.w >= this.x + (this.w / 2)) {
      if (item.y < this.y + (this.h / 2)) {
        callback(TOP_RIGHT);
      }
      if (item.y + item.h >= this.y + this.h / 2) {
        callback(BOTTOM_RIGHT);
      }
    }
  }

  /**
   * Divides the current node into four subnodes and adds them
   * to the nodes array of the current node. Then reinserts all
   * children.
   */
  divide() {
    const childrenDepth = this.depth + 1;
    // set dimensions of the new nodes
    const width = (this.w / 2);
    const height = (this.h / 2);
    // create top left node
    this.nodes.push(new Node(this.x, this.y, width, height, childrenDepth,
      this.maxChildren, this.maxDepth));
    // create top right node
    this.nodes.push(new Node(this.x + width, this.y, width, height, childrenDepth,
      this.maxChildren, this.maxDepth));
    // create bottom left node
    this.nodes.push(new Node(this.x, this.y + height, width, height, childrenDepth,
      this.maxChildren, this.maxDepth));
    // create bottom right node
    this.nodes.push(new Node(this.x + width, this.y + height, width, height, childrenDepth,
      this.maxChildren, this.maxDepth));

    const oldChildren = this.items;
    this.items = [];
    oldChildren.forEach(el => this.insert(el));
  }

  /**
   * Clears the node and all its subnodes.
   */
  clear() {
    this.nodes.forEach(node => node.clear());
    this.items.length = 0;
    this.nodes.length = 0;
  }

  /*
   * convenience method: is not used in the core algorithm.
   * ---------------------------------------------------------
   * returns this nodes subnodes. this is usful if we want to do stuff
   * with the nodes, i.e. accessing the bounds of the nodes to draw them
   * on a canvas for debugging etc...
   */
  getNodes() {
    return this.nodes.length ? this.nodes : false;
  }
}

class QUAD {
  constructor(_args) {
    const args = _args;
    // assign default values
    args.maxChildren = args.maxChildren || 2;
    args.maxDepth = args.maxDepth || 4;

    this.root = new Node(args.x, args.y, args.w, args.h, 0, args.maxChildren, args.maxDepth);
  }
  insert(item) {
    if (item instanceof Array) {
      const len = item.length;
      for (let i = 0; i < len; i++) {
        this.root.insert(item[i]);
      }
    } else {
      this.root.insert(item);
    }
  }

  retrieve(selector, callback, instance) {
    return this.root.retrieve(selector, callback, instance);
  }

  clear() {
    this.root.clear();
  }
}

function quad(args){
  return new QUAD(args);
}
