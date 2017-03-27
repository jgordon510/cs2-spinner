var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameDiv');
var game_state = {};

// Creates a new 'main' state that wil contain the game
game_state.main = function() {};
game_state.main.prototype = {
  preload: function() {
    //adjust these settings to change the properties of the wheel
    game.bulbCount = 7; // how many bulbs?
    game.stopSpeed = 0.03; // how slow to stop the wheel?
    game.labelDistance = 0.35; //0.5 would be the edge
    game.bulbDistance = 0.4; //0.5 would be the edge
    game.momentum = 0.99; // retain how much speed per cycle
    game.dimTime = 300; // how long should a bulb remain lit?
    game.spinnerSpeed = Math.random() * 8 + 7; //7-15 degress per second
    /*This stuff goes on the wheel.  You could generate it 
    if you wanted to and that would be cool.*/
    game.labelList = [25, 50, 75, 100, 200, 500,  1000];
    //You could, Trump smells, replace this with a mouse event if you
    //you were so inclined.
    game.spaceBar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    //the wheel texture
    var graphics = game.add.graphics(0, 0);
    graphics.beginFill(0xFF0000);
    graphics.drawCircle(0, 0, game.height * .75); //proportional
    game.wheelTexture = graphics.generateTexture();
    graphics.destroy();

    //the unlit bulb texture
    graphics = game.add.graphics(0, 0);
    graphics.beginFill(0xFFFFFF, 0.5);
    graphics.drawCircle(0, 0, game.height * .02); //proportional
    game.bulbTexture = graphics.generateTexture();
    graphics.destroy();

    //the lighting overlay
    graphics = game.add.graphics(0, 0);
    graphics.beginFill(0xffff00, 0.5);
    graphics.drawCircle(0, 0, game.height * .03); //larger than the bulb
    game.litBulbTexture = graphics.generateTexture();
    graphics.destroy();

    //the spinner - a long rectangle
    graphics = game.add.graphics(0, 0);
    graphics.beginFill(0xFF700B, 1); //solid orange
    graphics.drawRect(0, 0, 10, game.height * 0.35); //proportional
    graphics.endFill();
    game.spinnerTexture = graphics.generateTexture();
    graphics.destroy();

    //a blank texture for the center of the sprites
    //we'll add a sprite to it as a child, like a lolipop
    graphics = game.add.graphics(0, 0);
    game.blankTexture = graphics.generateTexture();
    graphics.destroy();
  },
  create: function() {
    //gray
    game.stage.backgroundColor = "#333333";

    game.wheel = game.add.sprite(game.width / 2, game.height / 2, game.wheelTexture);
    game.wheel.anchor.setTo(0.5, 0.5);
    game.labels = game.add.group();
    game.bulbs = game.add.group();

    game.Label = function(label) {
      /* Labels are like lolipops on an invisible stick.  The
      label itself, is a child of the centerSprite, which is 
      blank.  By rotating the centerSprite, we move the attached
      labelSprite also. 
      Setting the height to negative, rotates the sprite to the bottom
      and allows us to add 180 to our angle in order to avoid a negative
      angle amount.  This allows us to use it to calculate the correct
      array index with a positive number.
      */
      var centerSprite = game.add.sprite(game.width / 2, game.height / 2, game.blankTexture);
      var labelSprite = game.add.text(0, -game.height * game.labelDistance, label.toString());
      labelSprite.anchor.setTo(0.5, 0.5)
      centerSprite.addChild(labelSprite);
      centerSprite.label = labelSprite;
      return centerSprite;
    };
    
    game.Bulb = function() {
      /*Bulbs are like lolipops on an invisible stick.  The
      bulb itself, is a child of the centerSprite, which is 
      blank.  By rotating the centerSprite, we move the attached
      bulbSprite also.
      The bulbSprite has a litBulb attached to it as a child.  
      The lit bulb is normally transparent (alpha = 0).  
      When the bulb is lit, this alpha is set to 1, and tweened
      back to 0.*/
      var centerSprite = game.add.sprite(game.width / 2, game.height / 2, game.blankTexture);
      var bulbSprite = game.add.sprite(0, game.height * game.bulbDistance, game.bulbTexture);
      var litBulb = game.add.sprite(0, 0, game.litBulbTexture);
      litBulb.alpha = 0;
      litBulb.anchor.setTo(0.5, 0.5);
      bulbSprite.addChild(litBulb);
      centerSprite.litBulb = litBulb;
      bulbSprite.anchor.setTo(0.5, 0.5);
      centerSprite.addChild(bulbSprite);
      return centerSprite;
    };

    /* The labels are rotated an additional 180 degrees to match the 
    bulbs.  
    */
    game.labelList.forEach(function(label, index) {
      var newLabel = new game.Label(label);
      newLabel.angle += (360 / game.labelList.length) * index + 180;
      game.labels.add(newLabel);
    });

    //each bulb angle is set 0-360
    for (var i = 0; i < 360; i += 360 / game.bulbCount) {
      var newBulb = new game.Bulb();
      newBulb.angle = i;
      game.bulbs.add(newBulb);
    }
    //add the spinner to the center of the screen
    game.spinner = game.add.sprite(game.width / 2, game.height / 2, game.spinnerTexture);
    //anchor the spinner to one end
    game.spinner.anchor.setTo(0.5, 1);
    //this property on the game object represents the last bulb to be lit
    game.lastLit = 0;
  },
  update: function() {
    if (game.spinner.speed > game.stopSpeed) {
      //adjust the spinner angle by the speed
      game.spinner.angle += game.spinner.speed;
      //change the speed by the momentum
      game.spinner.speed *= game.momentum;
      //bulbIndex is the bulb that the spinner is currently on
      var bulbIndex = Math.floor((game.spinner.angle + 180) / (360 / game.bulbCount));
      //the actual bulb
      var bulb = game.bulbs.children[bulbIndex];
      //the bulb's lit sprite
      var litBulb = bulb.litBulb;
      //light it
      litBulb.alpha = 1;
      //track the lastLit
      game.lastLit = bulbIndex;
      //tween the litBulb back to transparent
      var tween = game.add.tween(litBulb).to({
        alpha: 0
      }, game.dimTime, "Linear", true);
      
      //check to see if the spinner has stopped
      tween.onComplete.add(function() {
        if (game.spinner.speed <= game.stopSpeed) {
          //relight the final bulb
          litBulb.alpha = 1;
          if(game.spinning)  //this keeps it to one time
          {
            /* We can get the labelIndex from the bulbIndex:
            We make a fraction out of the bulbIndex and the number of bulbs.
            Then we multiply that by the number of labels.
            Then we take the floor of that to get a proper index.
            */
            var labelIndex = Math.floor((bulbIndex / game.bulbCount) * game.labels.children.length);
            game.spinning = false; //only do it once
            // This is a hook for whatever you're doing later
            alert(game.labels.children[labelIndex].label.text);
          }
        }
      });
    }
    else {
      //this starts the wheel spinning
      if (game.spaceBar.isDown) {
        game.spinning = true;
        //clear the last lit bulb
        game.bulbs.children[game.lastLit].litBulb.alpha = 0;
        game.spinner.speed = game.spinnerSpeed;
      }
    }
  }
};

// Add and start the 'main' state to start the game
game.state.add('main', game_state.main);
game.state.start('main');