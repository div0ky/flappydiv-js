import Phaser from 'phaser';

class MainScene extends Phaser.Scene {

    constructor() {
        super({ key: 'MainScene' }); // You can give your scene a key for referencing later
        this.spaceKeyIsPressed = false;
    }

    preload() {
        this.load.image('bird', 'assets/bird.jpg');
    }

    create() {
        this.gameStarted = false;
        this.score = 0;
        this.cameras.main.setBackgroundColor('#FFFFFF');
        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' })
        this.scoreText.setDepth(10);

        this.bird = new Bird(this);
        this.bird.sprite.setY(this.sys.game.config.height / 2);
        this.pipes = this.physics.add.group();
        this.physics.add.overlap(this.bird.sprite, this.pipes, this.handleCollision, null, this)

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        // Game over scene
        this.gameOverScene = this.add.container(0, 0);
        this.gameOverScene.setVisible(false);

        // GAME OVER TEXT
        const centerX = this.cameras.main.centerX; // Get the center X coordinate of the canvas
        const centerY = this.cameras.main.centerY; // Get the center Y coordinate of the canvas
        const gameOverText = this.add.text(centerX, centerY, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            align: 'center'
        })
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(3);

        // Add both texts to the game over scene container
        this.gameOverScene.add([gameOverText]);

        // Handle game over conditions
        this.isGameOver = false; // Add a game over flag
        this.physics.add.collider(this.bird.sprite, this.pipes, () => {
            this.gameOver();
        });

        this.physics.world.setBoundsCollision(true, true, false, false);
        this.physics.world.on('worldbounds', () => {
            this.gameOver();
        });

    }

    update(time, delta) {

        if (this.enterKey.isDown && this.isGameOver) {
            console.log('enter pressed')
            this.resetGame();
        }

        if (!this.gameStarted) {
            this.bird.sprite.body.allowGravity = false;
        }

        if (this.gameStarted) {
            if (this.spaceKey.isDown && !this.spaceKeyIsPressed) {
                this.bird.flap();
                this.spaceKeyIsPressed = true;
            } else if (this.spaceKey.isUp) {
                this.spaceKeyIsPressed = false;
            }

            if (!this.isGameOver) {
                this.bird.update();
                this.incrementScore();
            }

        }

        if (!this.gameStarted && this.spaceKey.isDown) {
            this.gameStarted = true;
            this.bird.sprite.body.allowGravity = true;

            this.pipeGenerationTimer = this.time.addEvent({
                delay: 1800,
                callback: this.generatePipes,
                callbackScope: this,
                loop: true
            })

            this.bird.flap();
        }

    }

    incrementScore() {
        this.score += 1;

        // Step 4: Refresh Score Display
        this.scoreText.setText('Score: ' + this.score);
    }

    gameOver() {
        this.isGameOver = true;
        this.pipes.clear(true, true);
        // Stop the game loop and disable user input
        this.physics.pause();
        this.pipeGenerationTimer.remove(false);

        // Display the game over scene
        this.gameOverScene.setVisible(true);
    }

    resetGame() {
       window.location.reload();
    }

    generatePipes() {
        const gapSize = 125; // Size of the gap between the pipes
        const gapPosition = Math.floor(Math.random() * (this.game.config.height - gapSize)); // Randomly calculate the position of the gap

        const topPipeHeight = gapPosition;
        const bottomPipeHeight = this.game.config.height - gapPosition - gapSize;

        const topPipe = this.add.rectangle(this.game.config.width, topPipeHeight / 2, 50, topPipeHeight, 0x00FF00);
        const bottomPipe = this.add.rectangle(this.game.config.width, this.game.config.height - bottomPipeHeight / 2, 50, bottomPipeHeight, 0x00FF00);

        if (!this.gameStarted) {
            const initialPipePosition = this.game.config.width * (2/3);
            topPipe.setX(initialPipePosition);
            bottomPipe.setX(initialPipePosition);
        }

        this.physics.add.existing(topPipe);
        this.physics.add.existing(bottomPipe);

        this.pipes.add(topPipe);
        this.pipes.add(bottomPipe);

        topPipe.body.allowGravity = false;
        bottomPipe.body.allowGravity = false;


        // Set velocity so pipes move to the left
        topPipe.body.setVelocityX(-200);
        bottomPipe.body.setVelocityX(-200);

        // Make sure pipes are destroyed when they go off-screen
        topPipe.checkWorldBounds = true;
        bottomPipe.checkWorldBounds = true;
        topPipe.outOfBoundsKill = true;
        bottomPipe.outOfBoundsKill = true;

    }

    handleCollision(bird, pipe) {
        console.log('Bird hit a pipe!');
    }
}

class Bird {
    constructor(scene) {
        this.scene = scene;
        this.lastFlapTime = this.scene.time.now;
        this.sprite = this.scene.physics.add.image(75, 300, 'bird');
        this.sprite.setDisplaySize(30, 30);
        this.sprite.setCollideWorldBounds(true);
    }

    flap() {
        const currentTime = this.scene.time.now;
        const timeSinceLastFlap = currentTime - this.lastFlapTime;

        console.log(`Time Since Last Flap`, timeSinceLastFlap);

        const acceleration = 50;
        const maxVelocityY = -500; // The maximum velocity cap
        const minVelocityY = -225; // The minimum velocity cap

        // Calculate the new velocity
        let velocityY = this.sprite.body.velocity.y - acceleration;

        // Check if the time between flaps is less than a threshold
        if (timeSinceLastFlap < 300) {
            // Accumulate velocity with a maximum cap of -500
            velocityY -= acceleration;
            velocityY = Math.max(velocityY, maxVelocityY);
        } else {
            // Set the velocity to the default flap strength if enough time has passed
            velocityY = minVelocityY;
        }

        this.sprite.setVelocityY(velocityY);

        console.info('Velocity is', this.sprite.body.velocity.y);

        this.lastFlapTime = currentTime;
    }


    update() {
        if (this.sprite.body.velocity.y < 0) {
            this.sprite.setAngle(-30);
        } else if (this.sprite.body.velocity.y > 0) {
            this.sprite.setAngle(30);
        } else {
            this.sprite.setAngle(0);
        }
    }
}


const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 800,
    parent: 'game',
    scene: MainScene,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 400  },
            debug: false
        }
    }
};

console.log('Starting game...')

if (!window.gameInstance) {
    window.gameInstance = new Phaser.Game(config);
}
