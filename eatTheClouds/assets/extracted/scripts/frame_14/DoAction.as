function moveStuff()
{
   arrowDepth = 50;
   arrowX = 550;
   arrowY = 350;
   if(Key.isDown(37))
   {
      this._x -= this.speed;
      face_mc._rotation = 0;
   }
   if(Key.isDown(39))
   {
      this._x += this.speed;
      face_mc._rotation = 270;
   }
   if(Key.isDown(38))
   {
      this._y -= this.speed;
      face_mc._rotation = 0;
   }
   if(Key.isDown(40))
   {
      this._y += this.speed;
      face_mc._rotation = -180;
   }
   if(this._x > StageWidth + this._width / 2)
   {
      this._x = - this._width / 2;
   }
   if(this._x < - this._width / 2)
   {
      this._x = StageWidth + this._width / 2;
   }
   if(this._y > StageHeight + this._height / 2)
   {
      this._y = - this._height / 2;
   }
   if(this._y < - this._height / 2)
   {
      this._y = StageHeight + this._height / 2;
   }
}
function EatCloud()
{
   if(this.hitTest(face_mc._x,face_mc._y))
   {
      trace("hit");
      this.gotoAndStop("eaten");
      score += 1;
      scoreBox_txt.text = score * 10;
   }
}
function Collide()
{
   if(this.hitTest(face_mc._x,face_mc._y))
   {
      trace("CRAP!!");
      _root.gotoAndStop("gameover");
      stopAllSounds();
   }
}
function Obstacles()
{
   currentTime = game_length - (getTimer() - startingTime);
   airplaneEnter = 4000;
   parachuteEnter = 6000;
   ufoEnter = 8000;
   timer_txt.text = Math.round((game_length - (getTimer() - startingTime)) / 1000) + " sec.";
   if(currentTime < airplaneEnter)
   {
      airplane_mc.play();
   }
   if(currentTime < parachuteEnter)
   {
      parachute.play();
   }
   if(currentTime < ufoEnter)
   {
      ufo_mc.play();
   }
}
function gameOver()
{
   clearInterval(gameID);
   gotoAndStop("gameover");
   stopAllSounds();
   timeout_txt2.text = "Dood only ate " + score + " clouds!";
}
stop();
var score = 0;
var game_length = 10000;
var StageWidth = 600;
var StageHeight = 400;
var count = 12;
Mouse.addListener(watchMouse);
watchKeyBoard = new Object();
Key.addListener(watchKeyBoard);
face_mc.speed = 15;
face_mc.onEnterFrame = moveStuff;
cloud1_mc.onEnterFrame = EatCloud;
cloud2_mc.onEnterFrame = EatCloud;
cloud3_mc.onEnterFrame = EatCloud;
cloud4_mc.onEnterFrame = EatCloud;
cloud5_mc.onEnterFrame = EatCloud;
cloud6_mc.onEnterFrame = EatCloud;
cloud7_mc.onEnterFrame = EatCloud;
cloud8_mc.onEnterFrame = EatCloud;
cloud9_mc.onEnterFrame = EatCloud;
cloud10_mc.onEnterFrame = EatCloud;
airplane_mc.onEnterFrame = Collide;
sun.onEnterFrame = Collide;
leaf.onEnterFrame = Collide;
bird1.onEnterFrame = Collide;
bird2.onEnterFrame = Collide;
bird3.onEnterFrame = Collide;
ob7.onEnterFrame = Collide;
ob8.onEnterFrame = Collide;
ob9.onEnterFrame = Collide;
ob10.onEnterFrame = Collide;
airplane_mc.onEnterFrame = Collide;
parachute.onEnterFrame = Collide;
ufo_mc.onEnterFrame = Collide;
this.onEnterFrame = function()
{
   if(_root._currentframe == 14)
   {
      this.Obstacles();
   }
   if(score == 10)
   {
      _root.gotoAndStop("winner");
      stopAllSounds();
      textbox_txt.text = "Dood got to eat 10 clouds!";
   }
};
var gameID = setInterval(gameOver,game_length);
