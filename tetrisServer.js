// block array
var block_pieces = [[[0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0]],
   [[0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0]],
   [[0, 0, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 0]],
   [[0, 0, 0, 0],
    [0, 0, 1, 1],
    [0, 1, 1, 0],
    [0, 0, 0, 0]],
   [[0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 1],
    [0, 0, 0, 0]],
   [[0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0]],
   [[0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0]]];

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var global = require('./global.js');

// load static files
app.use(express.static('public'));

var Player = function () {
    this.id = 0;
    this.client = 0;
    this.gameOver = false;
    this.crushed = false;
    this.x = 3;
    this.y = 0;
    this.currentBlock = this.randomBlock();
    this.board = [];
    // game board initialize
    for (var i = 0; i < global.NUM_ROW; i++) {
        this.board[i] = [];
        for (var j = 0; j < global.NUM_COL; j++) {
            this.board[i][j] = 0;
        }
    }
};

var clients = 0;
var users = {};

io.on('connection', function (socket) {
    console.log('a new player connected' + socket.id);
    users[socket.id] = new Player();
    users[socket.id].id = socket.id;
    users[socket.id].client = clients;

    if (clients < global.MAX_PLAYER) {
        socket.emit('newPlayer', {
            user: users
        });
        // show/send newplayer data to all clients
        socket.broadcast.emit('newPlayer', {
            user: users
        });
        clients++;
    } else {
        socket.emit('full');
    }

    // game main logic start
    socket.on('isCrushed', function (data) {
        if (data.id in users) {
            users[data.id].crushed = false;
            if (users[data.id].isCrushed()) {
                users[data.id].crushed = true;
                users[data.id].saveBlockinBoard();
                users[data.id].x = 3;
                users[data.id].y = 0;
                users[data.id].currentBlock = users[data.id].randomBlock();
                if (users[data.id].isGameOver()) {
                    users[data.id].gameOver = true;
                    console.log(data.id + ' game over...');
                }
                socket.emit('playerData', {
                    user: users[data.id]
                });
            } else {
                users[data.id].y += 1;
                socket.emit('playerData', {
                    user: users[data.id]
                });
            }
        }
    });
    // game main logic end

    /* KeyBoard handler socket start */
    socket.on('moveLeft', function () {
        if (!users[socket.id].isCrushed() && users[socket.id].crushed === false) {
            users[socket.id].x -= 1;
        } else {
            socket.emit('moveBlock', {
                user: users[socket.id]
            });
        }
    });

    socket.on('moveRight', function () {
        if (!users[socket.id].isCrushed() && users[socket.id].crushed === false) {
            users[socket.id].x += 1;
        } else {
            socket.emit('moveBlock', {
                user: users[socket.id]
            });
        }
    });

    socket.on('moveDown', function () {
        if (!users[socket.id].isCrushed() && users[socket.id].crushed === false)
            users[socket.id].y += 1;
        else {
            socket.emit('moveBlock', {
                user: users[socket.id]
            });
        }
    });
    /* KeyBoard handler socket end */

    socket.on('disconnect', function () {
        delete users[socket.id];
        console.log('a user disconnected' + socket.id);
        clients--;
        for (var val in users) {
            if (users[val].client == 2) users[val].client = 1;
        }
        socket.emit('disconnected', {
            user : users,
        });
        socket.broadcast.emit('disconnected', {
            user : users,
        });

    });
});


http.listen(3002, function () {
    console.log('listening on port 3002');
});

// *******************************************************************
var init = function (socket) {

    users[socket.id] = new Player();
    clients++;
    //socket.emit('keySetting', {data : socket});
    socket.emit('newPlayer', {
        id: socket.id
    });
};

//socket.emit('newPlayer', {id : socket.id, user : users[socket.id]});
//* save and remove block start
Player.prototype.saveBlockinBoard = function () {
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            if (this.currentBlock[i][j])
                this.board[i + this.y][j + this.x] = 1;
        }
    }
    this.removeFullLines();
};

Player.prototype.removeFullLines = function () {
    for (var i = global.NUM_ROW - 1; i >= 1; i--) {
        for (var j = 0; j < global.NUM_COL; j++) {
            if (this.board[i][j] == 0) {
                break;
            }
        }

        // if a line is fulll
        if (j === global.NUM_COL) {
            for (var temp_y = i; temp_y >= 1; temp_y--) {
                for (var k = 0; k < global.NUM_COL; k++) {
                    this.board[temp_y][k] = this.board[temp_y - 1][k];
                }
            }
            i++; // check the same line again
        }
    }
};
//* save and remove block end

Player.prototype.isCrushed = function () {
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            if (this.currentBlock[i][j]) {
                if ((i + this.y) >= global.NUM_ROW - 1 || this.board[i + this.y + 1][j + this.x]) {
                    return true;
                } else if ((j + this.x) > global.NUM_COL - 1) {
                    this.x -= 1;
                    return false;
                } else if ((j + this.x) < 0) {
                    this.x += 1;
                    return false;
                }
            }
        }
    }
    return false;
};

Player.prototype.isGameOver = function () {
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            if (this.currentBlock[i][j] && this.board[this.y + i + 1][this.x + j]) {
                return true;
            }
        }
    }
    return false;
};

Player.prototype.randomBlock = function () {
    return block_pieces[Math.floor(Math.random() * block_pieces.length)];
};
// *******************************************************************
