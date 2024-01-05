const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 375;
canvas.height = 667;

let animationFrameId;
let gameIsOver = false;

let gameMode = "AI"; // Default game mode

let gameStarted = false;
var rounds = [5,5, 3, 3, 2];
var colors = ['#1abc9c', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6'];
var currentRound = 0;
var playerScore = 0;
var aiScore = 0;

function Paddle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.score = 0;
}

// Assuming the paddles are now thinner and a bit shorter
const paddleWidth = 15; // Narrower paddle width
const paddleHeight = 50; // Slightly shorter paddle height

const playerPaddle = new Paddle(canvas.width / 2 - paddleHeight / 2, 10, paddleHeight, paddleWidth);
const playerTwoPaddle = new Paddle(canvas.width / 2 - paddleHeight / 2, canvas.height - 20, paddleHeight, paddleWidth);
const aiPaddle = new Paddle(canvas.width / 2 - paddleHeight / 2, canvas.height - 20, paddleHeight, paddleWidth);



const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 7,
    speedX: 5,
    speedY: 5,
    reset: function(lastPointByAI) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speedX = 5 * (Math.random() > 0.5 ? 1 : -1); // Initial horizontal speed
        this.speedY = 5 * (lastPointByAI ? 1 : -1); // Initial vertical speed, direction based on last point
    }
};


document.getElementById('playWithAIButton').addEventListener('click', () => {
    gameMode = "AI";
    startGame();
});

document.getElementById('playWithPlayerButton').addEventListener('click', () => {
    gameMode = "Player";
    startGame();
});


function drawPaddle(paddle) {
    ctx.fillStyle = 'white';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

function drawScore() {
    ctx.font = '30px Arial';
    ctx.fillText(playerPaddle.score, 30, canvas.height / 4);
    ctx.fillText(aiPaddle.score, 30, 3 * canvas.height / 4);
}

function drawDottedLine() {
    ctx.beginPath();
    ctx.setLineDash([5, 15]); // Set the pattern of dashes and gaps
    ctx.moveTo(0, canvas.height / 2); // Start at the middle left of the canvas
    ctx.lineTo(canvas.width, canvas.height / 2); // Draw to the middle right of the canvas
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
}



let leftPressed = false;
let rightPressed = false;

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') leftPressed = true;
    if (event.key === 'ArrowRight') rightPressed = true;
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') leftPressed = false;
    if (event.key === 'ArrowRight') rightPressed = false;
});

function movePaddle() {
    if (leftPressed) {
        playerPaddle.x -= 3; // Adjust speed as necessary
        if (playerPaddle.x < 0) playerPaddle.x = 0; // Prevent the paddle from going out of bounds
    }
    if (rightPressed) {
        playerPaddle.x += 3; // Adjust speed as necessary
        if (playerPaddle.x + playerPaddle.width > canvas.width) playerPaddle.x = canvas.width - playerPaddle.width; // Prevent the paddle from going out of bounds
    }
}

function handleTouchMove(event) {
    event.preventDefault(); // Prevent default touch action
    const touchX = event.touches[0].clientX - canvas.getBoundingClientRect().left;

    if (gameMode === "Player") {
        // Determine if the touch is on the top or bottom half of the screen
        if (event.touches[0].clientY < window.innerHeight / 2) {
            // Move player 1's paddle
            playerPaddle.x = touchX - playerPaddle.width / 2;
            constrainPaddleHorizontal(playerPaddle);
        } else {
            // Move player 2's paddle
            playerTwoPaddle.x = touchX - playerTwoPaddle.width / 2;
            constrainPaddleHorizontal(playerTwoPaddle);
        }
    } else {
        // In AI mode, only player 1's paddle moves
        playerPaddle.x = touchX - playerPaddle.width / 2;
        constrainPaddleHorizontal(playerPaddle);
    }
}

canvas.addEventListener('touchmove', handleTouchMove);

function constrainPaddleHorizontal(paddle) {
    paddle.x = Math.max(paddle.x, 0);
    paddle.x = Math.min(paddle.x, canvas.width - paddle.width);
}




function moveAiPaddle() {
    const deltaX = ball.x - (aiPaddle.x + aiPaddle.width / 2);
    if (deltaX > 0) {
        aiPaddle.x += Math.min(deltaX, 4); // Adjust speed as necessary
    } else {
        aiPaddle.x += Math.max(deltaX, -4); // Adjust speed as necessary
    }

    // Prevent AI paddle from going out of bounds
    if (aiPaddle.x < 0) aiPaddle.x = 0;
    if (aiPaddle.x + aiPaddle.width > canvas.width) aiPaddle.x = canvas.width - aiPaddle.width;
}


function isCollisionWithPaddle(ball, paddle) {
    return ball.x + ball.radius > paddle.x &&
           ball.x - ball.radius < paddle.x + paddle.width &&
           ball.y + ball.radius > paddle.y &&
           ball.y - ball.radius < paddle.y + paddle.height;
}



function moveBall() {
    // Collision with top and bottom walls
    // if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    //     ball.speedY = -ball.speedY;
    // }

    // Collision with left and right walls
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
        ball.speedX = -ball.speedX;
    }

    // Collision with paddles
    // Add your collision detection logic here

    // if player vs player
    if(gameMode === "Player") {
        if (isCollisionWithPaddle(ball, playerPaddle) || isCollisionWithPaddle(ball, playerTwoPaddle)) {
            ball.speedY = -ball.speedY;
        }
    } else {
        if (isCollisionWithPaddle(ball, playerPaddle) || isCollisionWithPaddle(ball, aiPaddle)) {
            ball.speedY = -ball.speedY;
        }
    }
}

function nextRound() {
    currentRound++;

    // Check if it's the last round and the player wins
    if (currentRound >= rounds.length) {
        endGame("win"); // Player wins the game
        return;
    }

    // Reset scores for the new round
    playerPaddle.score = 0;
    aiPaddle.score = 0;

    // Change canvas background color
    canvas.style.backgroundColor = colors[currentRound];

    ball.reset(false); // Start new round with the ball moving towards AI
}



function updateScore() {
    if (gameIsOver) {
        return; // Stop updating the score if the game is over
    }
    if (ball.y < 0) {
        aiPaddle.score++;
        if (aiPaddle.score >= rounds[currentRound]) {
            endGame("lose"); // Player loses the game
            return;
        }
        ball.reset(false);
    } else if (ball.y > canvas.height) {
        playerPaddle.score++;
        if (playerPaddle.score >= rounds[currentRound]) {
            nextRound();
        } else {
            ball.reset(true);
        }
    }
}

function endGame(result) {
    // Stop the game loop
    gameIsOver = true;
    cancelAnimationFrame(animationFrameId);

    // Display win or lose message
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    if (result === "win") {
        ctx.fillText("You Win!", canvas.width / 2 - 100, canvas.height / 2);
    } else {
        ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2);
    }

    // Show the restart button
    // const restartButton = document.getElementById('playWithAIButton').style.display = 'block';
    // const restartWithPlayer = document.getElementById('playWithPlayerButton').style.display = 'block';

    location.reload();


    // Handle click on restart button
    restartButton.onclick = function() {
        console.log("restart");
        restartGame();
    };

    restartWithPlayer.onclick = function() {
        console.log("restart2");
        startGame();
    }
}

function restartGame() {
    gameIsOver = false;
    gameStarted = false; // Reset gameStarted flag

    // Reset game state for a new start
    document.getElementById('playWithAIButton').style.display = 'none';
    document.getElementById('playWithPlayerButton').style.display = 'none';

    playerPaddle.score = 0;
    aiPaddle.score = 0;
    currentRound = 0;
    canvas.style.backgroundColor = colors[currentRound];

    ball.reset(false); // Reset ball with initial speed

    startGame(); // Restart the game loop
}


function updateGame() {
    // Update positions and check for collisions

    // Update the ball position
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Ball and paddle collision logic goes here

    movePaddle(); // Move player paddle based on input
    moveBall(); // Move the ball
    updateScore(); // Update the score
    
    // Redraw the game
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameMode === "AI") {
        drawPaddle(aiPaddle);
        moveAiPaddle(); // AI moves the second paddle
    } else {
        drawPaddle(playerTwoPaddle);
    }
    drawPaddle(playerPaddle);
    drawBall();
    drawScore();
    drawDottedLine(); // Draw the dotted line

    animationFrameId = requestAnimationFrame(updateGame);
}

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('playWithPlayerButton');
    startButton.addEventListener('click', startGame);
});



function startGame() {
    if (gameStarted) return;
    gameStarted = true;

    cancelAnimationFrame(animationFrameId); // Cancel any previous game loop

    // Reset game state for a new start
    document.getElementById('playWithAIButton').style.display = 'none';
    document.getElementById('playWithPlayerButton').style.display = 'none';
    playerPaddle.score = 0;
    aiPaddle.score = 0;
    currentRound = 0;
    canvas.style.backgroundColor = colors[currentRound];

    ball.reset(false); // Start with the ball moving towards the player
    updateGame(); // Start the game loop
}
