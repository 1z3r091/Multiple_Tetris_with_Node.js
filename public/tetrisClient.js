var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;
var NUM_ROW = 17;
var NUM_COL = 10;
var BLOCK_LENGTH = 30;
var BLOCK_HEIGHT = 30;

var users = {};
var socket = io();

////* Keyboard input handling start
var keyHandler = function (kev) {
    if (kev.keyCode === KEY_LEFT) {
        socket.emit('moveLeft');
    } else if (kev.keyCode === KEY_RIGHT) {
        socket.emit('moveRight');
    } else if (kev.keyCode === KEY_DOWN) {
        socket.emit('moveDown');
    } else {}
};
//* Keyboard input handling end


socket.on('newPlayer', function (data) {
    users = data.user;
});

socket.on('disconnected', function (data) {
    users = data.user;
    for (var key in users) {
        redrawBoard(users[key]);
    }
});

socket.on('full', function () {
    socket.disconnect();
});

socket.on('moveBlock', function (data) {
    users[data.user.id] = data.user;
});

//* main start
function main() {
    for (var key in users) {
        drawBoard(users[key]);
        socket.emit('isCrushed', {
            id: key
        });
        socket.on('playerData', function (data) {
            users[data.user.id] = data.user;
            if (users[data.user.id].gameOver) {
                delete users[data.user.id];
                // socket.disconnect();
            }
        });

        drawBlock(users[key]);
    }
}
//* main end

//* draw functions start
var drawBlock = function (player) {
    var mainDiv = document.getElementById('main');
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            var blockElement = document.createElement('div');
            if (player.currentBlock[i][j]) {
                blockElement.classList.add('blockFilled');
            }
            blockElement.style.top = (i * BLOCK_HEIGHT + player.y * BLOCK_HEIGHT) + 'px';
            blockElement.style.left = (j * BLOCK_LENGTH + player.x * BLOCK_LENGTH + (player.client * 450 + 50)) + 'px';
            mainDiv.appendChild(blockElement);
        }
    }

};

var drawBoard = function (player) {
    var mainDiv = document.getElementById('main');
    for (var i = 0; i < NUM_ROW; i++) {
        for (var j = 0; j < NUM_COL; j++) {
            var blockElement = document.createElement('div');
            if (player.board[i][j])
                blockElement.classList.add('blockFilled');
            else
                blockElement.classList.add('blockEmpty');
            blockElement.style.top = (i * BLOCK_HEIGHT) + 'px';
            blockElement.style.left = (j * BLOCK_LENGTH + (player.client * 450 + 50)) + 'px';
            mainDiv.appendChild(blockElement);

        }
    }
    return mainDiv;
};

var redrawBoard = function (player) {
    var gameDiv = drawBoard(player);
    gameDiv.innerHTML = '';
    gameDiv.appendChild(gameDiv);
}
//* draw functions end

//* infinite loop start
var gameInterval = function () {
    window.addEventListener('keydown', keyHandler);
    setInterval(main, 1000 / 2);
}
//* infinite loop end

window.onload = gameInterval; // load gameInterval function after loading html body
