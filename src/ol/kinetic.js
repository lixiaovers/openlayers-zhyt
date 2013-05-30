
goog.provide('ol.Kinetic');

goog.require('ol.Coordinate');
goog.require('ol.PreRenderFunction');
goog.require('ol.animation');



/**
 * @constructor
 * @param {number} decay Rate of decay (must be negative).
 * @param {number} minVelocity Minimum velocity (pixels/millisecond).
 * @param {number} delay Delay to consider to calculate the kinetic
 *     initial values (milliseconds).
 */
ol.Kinetic = function(decay, minVelocity, delay) {

  /**
   * @private
   * @type {number}
   */
  this.decay_ = decay;

  /**
   * @private
   * @type {number}
   */
  this.minVelocity_ = minVelocity;

  /**
   * @private
   * @type {number}
   */
  this.delay_ = delay;

  /**
   * @private
   * @type {Array.<number>}
   */
  this.points_ = [];

  /**
   * @private
   * @type {number}
   */
  this.angle_ = 0;

  /**
   * @private
   * @type {number}
   */
  this.initialVelocity_ = 0;
};


/**
 * FIXME empty description for jsdoc
 */
ol.Kinetic.prototype.begin = function() {
  this.points_.length = 0;
  this.angle_ = 0;
  this.initialVelocity_ = 0;
};


/**
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.Kinetic.prototype.update = function(x, y) {
  this.points_.push(x, y, goog.now());
};


/**
 * @return {boolean} Whether we should do kinetic animation.
 */
ol.Kinetic.prototype.end = function() {
  var delay = goog.now() - this.delay_;
  var lastIndex = this.points_.length - 3;
  if (this.points_[lastIndex + 2] < delay) {
    // the user stopped panning before releasing the map
    return false;
  }
  var firstIndex = lastIndex - 3;
  while (firstIndex >= 0 && this.points_[firstIndex + 2] > delay) {
    firstIndex -= 3;
  }
  if (firstIndex >= 0) {
    var duration = this.points_[lastIndex + 2] - this.points_[firstIndex + 2];
    var dx = this.points_[lastIndex] - this.points_[firstIndex];
    var dy = this.points_[lastIndex + 1] - this.points_[firstIndex + 1];
    this.angle_ = Math.atan2(dy, dx);
    this.initialVelocity_ = Math.sqrt(dx * dx + dy * dy) / duration;
    return this.initialVelocity_ > this.minVelocity_;
  }
  return false;
};


/**
 * @param {ol.Coordinate} source Source coordinate for the animation.
 * @return {ol.PreRenderFunction} Pre-render function for kinetic animation.
 */
ol.Kinetic.prototype.pan = function(source) {
  var decay = this.decay_;
  var initialVelocity = this.initialVelocity_;
  var minVelocity = this.minVelocity_;
  var duration = this.getDuration_();
  var easingFunction = function(t) {
    return initialVelocity * (Math.exp((decay * t) * duration) - 1) /
        (minVelocity - initialVelocity);
  };
  return ol.animation.pan({
    source: source,
    duration: duration,
    easing: easingFunction
  });
};


/**
 * @private
 * @return {number} Duration of animation (milliseconds).
 */
ol.Kinetic.prototype.getDuration_ = function() {
  return Math.log(this.minVelocity_ / this.initialVelocity_) / this.decay_;
};


/**
 * @return {number} Total distance travelled (pixels).
 */
ol.Kinetic.prototype.getDistance = function() {
  return (this.minVelocity_ - this.initialVelocity_) / this.decay_;
};


/**
 * @return {number} Angle of the kinetic panning animation (radians).
 */
ol.Kinetic.prototype.getAngle = function() {
  return this.angle_;
};
