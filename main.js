window.requestAnimationFrame = window.requestAnimationFrame ||
                               window.webkitRequestAnimationFrame ||
                               window.mozRequestAnimationFrame ||
                               window.oRequestAnimationFrame ||
                               window.msRequestAnimationFrame;
//setting up the cell object
var Cell = function(x, y, grid){
   var self = this;
   self.x = x;
   self.y = y;
   self.grid = grid;
   self.isAlive = false;  // any cell is dead by default
   self.getNeighbors = function(){
      return [self.grid.getCell(x-1, y-1), 
                   self.grid.getCell(x-1, y), 
                   self.grid.getCell(x-1, y+1), 
                   self.grid.getCell(x, y-1), 
                   self.grid.getCell(x, y+1), 
                   self.grid.getCell(x+1, y-1), 
                   self.grid.getCell(x+1, y), 
                   self.grid.getCell(x+1, y+1)];
   }
   self.shouldDie = function(){
      var livingNeighbors = self.getNeighbors().filter(function(c){
         return c.isAlive;
      });
      if(livingNeighbors.length < 2 || livingNeighbors.length > 3){
         return true;
      }
      return false;
   }
   self.shouldBeBorn = function(){
      var livingNeighbors = self.getNeighbors().filter(function(c){
        return c.isAlive;
      });
      if(livingNeighbors.length === 3){
         return true;
      }
      return false;
   }
   return self;
}
// setting up the grid 800px wide and 600px height
var Grid = function(x, y, rows, cols, width, height){
   var self = this;
   self.x = x;
   self.y = y;
   self.rows = rows;
   self.cols = cols;
   self.width = width;
   self.height = height;
   self.currentTime = 0;
   self.speed = 75;
   self.simulationOn = false;
   self.background = 'white';
   self.foreground = 'black';
   self.cellColor = 'red';
   self.cells = [];
   var initialize = function(){
      for(var i = 0; i < (rows*cols); i++){
         (function(){
            var x = i % cols;
            var y = Math.floor(i / cols);
            self.cells.push(new Cell(x, y, self));
         })();
      }   
   }   
   self.getCell = function(x, y) {
      // torus grid implementation
      x = (cols + x)%cols;
      y = (rows + y)%rows;
      return self.cells[x+y*cols];
   }
   self.update = function(engine, delta){
      if(!self.simulationOn) return;
      // find the cells that need to die
      self.currentTime += delta;
      if(self.currentTime < self.speed) return;
      var cellsToDie = self.cells.filter(function(c){
         return c.shouldDie();
      });
      // find the cells that should be born
      var cellsToBeBorn = self.cells.filter(function(c){
         return c.shouldBeBorn();
      })
      cellsToDie.forEach(function(c){
         c.isAlive = false;
      });
      cellsToBeBorn.forEach(function(c){
         c.isAlive = true;
      });
      self.currentTime = 0;
   }
   self.draw = function(ctx, delta){
      ctx.save();
      ctx.translate(x, y);
      // Drawing grid shape
      ctx.fillStyle = self.background;
      ctx.fillRect(0, 0, cols*width, rows*height);
      ctx.fillStyle = self.foreground;
      var currX = 0;
      for(var i = 0; i < cols; i++){
         ctx.beginPath()
         ctx.moveTo(currX, 0);
         ctx.lineTo(currX, rows*height);
         ctx.closePath();
         ctx.stroke();
         currX += width;
      }
      var currY = 0;
      for(var j = 0; j < rows; j++){
         ctx.beginPath()
         ctx.moveTo(0, currY);
         ctx.lineTo(cols*width, currY);
         ctx.closePath();
         ctx.stroke();
         currY += height;
      }
      // Draw cells in the grid
      ctx.fillStyle = self.cellColor;
      var livingCells = self.cells.filter(function(c){
         return c.isAlive;
      }).forEach(function(c){   
         ctx.fillRect(c.x*width, c.y*height, width, height);
      });

      var cellnumbers = self.cells.filter(function (c) { return c.isAlive; }).length / (30 * 40);

      // progress bar showing the % of living cells with an upper bound of 40%
      document.getElementById("bar").setAttribute("value", cellnumbers);

      ctx.restore();
   }
   initialize();
   return self;
}

var Game = function(canvasId){
   var self = this;
   var canvas = document.getElementById(canvasId);
   var ctx = canvas.getContext('2d');

   self.canvas = canvas;
   self.background = 'black';
   self.running = false;
   self.actors = [];
   self.clear = function(){
      ctx.fillStyle = self.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
   }
   self.update = function(delta){
      self.actors.forEach(function(a){
         a.update(self, delta);
      });
   }
   self.draw = function(delta){
      self.actors.forEach(function(a){
         a.draw(ctx, delta);
      });
   }
   self.start = function(){
      self.running = true;
      var lastTime = Date.now();
      (function mainloop(){
         if(!self.running) return;
         window.requestAnimationFrame(mainloop);
         // current time in milliseconds
         var current = Date.now();
         // time elapsed in milliseconds since the last frame
         var elapsed = current - lastTime;
         // update/draw
         self.clear();
         self.update(elapsed);
         self.draw(elapsed);
         lastTime = current;
      })();
   }
   return self;
}
var game = new Game("game");
var grid = new Grid(0, 0, Math.floor(600/20), Math.floor(800/20), 20, 20);
game.canvas.addEventListener('click', function(evt){
   var gridx = Math.floor(evt.offsetX / grid.width);
   var gridy = Math.floor(evt.offsetY / grid.height);
   console.log(evt);
   grid.getCell(gridx, gridy).isAlive = true;
});
window.addEventListener('keydown', function(evt){
   if (evt.keyCode === 32) {
      grid.simulationOn = !grid.simulationOn;  
   }
});

game.actors.push(grid);

game.start();
/**
*Thanks to Erik Onarheim @eonarheim for his tutorial on youtube
**/