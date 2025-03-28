// Utility functions

const Utils = {
    // Calculate distance between two points
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    // Check if two circles are colliding
    circleCollision: function(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },
    
    // Get a random number between min and max
    random: function(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Get a random integer between min and max (inclusive)
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Get a random color
    randomColor: function() {
        const colors = ['#F14E54', '#2DB2EB', '#2ECC71', '#F1C40F', '#9B59B6', '#E67E22'];
        return colors[this.randomInt(0, colors.length - 1)];
    },
    
    // Clamp a value between min and max
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}; 