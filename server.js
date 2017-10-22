let express = require('express');
let path = require('path');
let app = express();


app.get('/', function (req, res) {
    res.sendFile(path.resolve('index.html'));
});

//为什么不能用app.lestin:因为我们要用到server这个实例：既需要express发消息，也需要socket.io发消息，所以会用到server的实例
let server = require('http').createServer(app);
// socket.io是依赖http服务器的
let io = require('socket.io')(server);
//声明一个对象，保存所有的客户端用户名和他们的socket对应关系
let clients = {};
//监听客户端的连接，当连接到来的时候执行此回调函数
io.on('connection', function (socket) {
    //在函数内部声明一个变量，叫username
    let username;
    //socket代表客户端
    //监听 客户端发过来的消息，当消息发过来的时候执行回调函数
    socket.on('message', function (data) {
        if (username) {
            //判断是公聊还是私聊
            let reg = /@([^ ])+ (.+)/;
            let result = data.match(reg);
            if (result) {//如果result有值，则匹配上了
                //此处是私聊
                let toUser = result[1];
                let content = result[2];
                console.log('1');
                clients[toUser] && clients[toUser].send({
                    username,
                    content,
                    createAt: new Date().toLocaleString(),
                })
            } else {//没匹配上
                //正常发言向所有客户端进行广播
                console.log('2');
                io.emit('message', {
                    username,
                    content: data,
                    createAt: new Date().toLocaleString(),
                });
            }
        } else {
            username = data;//把这个消息当成用户名
            //把username和socket关联起来，方便私聊使用其他的socked
            clients[username] = socket;
            //向所有的客户端广播说有新的用户加入聊天室
            io.emit('message', {
                username: '系统',
                content: `欢迎 ${username} 加入聊天室`,
                createAt: new Date().toLocaleString(),
            });
            //事件的名字可以自定义（后台使用这个事件，前台也要监听这个事件）
            io.emit('user-added', username);
        }
    });

    //监听客户端发过来的请求，把用户数组返回
    socket.on('users',function () {
        let userList=Object.keys(clients);
        socket.emit('userList',userList);
    })
});
server.listen(80);

/*
* 1.实现匿名聊天
*   1.在客户端里连接上服务器
*   2.给发送按钮绑定点击事件，当点击此按钮的时候先获取文本框的内容，把文本框的内容发送到后台
*   3.后台服务器把此消息广播给所有的客户端
*   4.所有的客户端收到消息后把此消息在ul列表里显示出来
*
* 2. 实现具名聊天
*   1.当此用户第一次向服务器发消息的时候
*   2.服务器会判断此客户端的用户名是否设置过，如果没有设置的话，就把这个消息当做用户名，以后再发消息的话都会以这个作为用户名，如果设置过了，就是正常发言
*
* 3. 实现私聊
*   1.点击某个在线用户，点击后会在输入框中出现@xxx yyy，回车发给服务器
*   2. 服务受到私聊的请求后会找到xxx对应的客户端向他单个发消息
* */


