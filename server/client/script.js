var socket;
// HTML DOM elements
let messageContainerDiv = document.getElementById('msg-container');
let userTypingDiv = document.getElementById('user-typing');
let messageInput = document.getElementById('msg-input');
let sendMessageBtn = document.getElementById('send-msg-btn');
let enterChatBtn = document.getElementById('enter-chat-btn');
let usernameInput = document.getElementById('username-input');
// variables for handling starting and stopping typing
let isTypingTimeout = null;
let isTyping = false;
// users that are typing at a given moment
let usersTyping = [];
// my username
let username = sessionStorage.getItem('username');

// show modal for username input if username isnt stored in session
if (username == null) {
    $('#exampleModal').modal({
        backdrop: 'static',
        keyboard: false
    });
    usernameInput.focus();
} else {
    socket_connect();
}

scrollToBottomOfMessages();


// enter chat only if username is typed in modal
enterChatBtn.onclick = function (event) {
    event.preventDefault();
    // if username exists, dont show the popup
    console.log('enter chat pressed');
    if (username != null)
        return;
    if (usernameInput.value.length > 0 && usernameInput.value.trim().length > 0) {
        username = usernameInput.value.trim();
        $('#exampleModal').modal('hide');
        console.log(username, username.length);
        sessionStorage.setItem('username', username);
        socket_connect();
    } else {
        alert('Unesite nadimak kako biste pristupili chatu!');
    }
}

// socket methods

// connect to socket
function socket_connect() {
    socket = io('localhost:3000/');
    socket_emitUsername();
    socket_initSocketEventHandlers();
}

// refresh username on server if server gets restarted, page gets refreshed or something else causes reconnection

function socket_emitUsername() {
    socket.emit('username declared', {
        username: username
    });
}

function socket_initSocketEventHandlers() {
    socket.on('reconnect', () => {
        socket_emitUsername();
    });

    socket.on('user joined', data => {
        createMessage({
            isRemote: true,
            message: data.username + ' se pridružio kanalu!',
            time: new Date()
        });
    });

    socket.on('user left', data => {
        createMessage({
            isRemote: true,
            message: data.username + ' je napustio kanal!',
            time: new Date()
        });
    })
    ;
    socket.on('message', data => {
        createMessage({
            isRemote: true,
            message: data.message,
            time: new Date(),
            username: data.username
        });
    });

    socket.on('started typing', data => {
        usersTyping.push({
            username: data.username
        });
        console.log(usersTyping);
        refreshUsersTypingDiv();
    });

    socket.on('stopped typing', data => {
        var user = usersTyping.find(user => user.username == data.username);
        var index = usersTyping.indexOf(user);
        if (index > -1) {
            usersTyping.splice(index, 1);
        }
        console.log(usersTyping);
        refreshUsersTypingDiv();
    });
}

// handle click on send message button
sendMessageBtn.onclick = function (event) {
    event.preventDefault();
    let msg = messageInput.value;
    console.log('sending');
    // createMessage if something is written in input field, ignore otherwise
    if (msg.length > 0 && msg.trim().length > 0) {
        // emit stopped typing
        socket.emit('stopped typing', {
            username: username
        });
        clearTimeout(isTypingTimeout);
        isTyping = false;
        //emit message
        socket.emit('message', {
            message: msg,
            username: username
        });
        createMessage({
            isRemote: false,
            message: msg,
            time: new Date()
        });
    }
}

// handle if user is typing or not
messageInput.onkeypress = function (event) {
    // ignore if "ENTER" is pressed
    if (event.keyCode == 13) {
        return;
    }
    // if isTyping is false, user wasnt typing before, so emit 'started typing' event
    if (isTyping != true) {
        isTyping = true;
        // emit started typing
        socket.emit('started typing', {
            username: username
        });
        console.log('started typing');
    }
    // if there was a timeout previously, remove it
    if (isTypingTimeout != null) {
        clearTimeout(isTypingTimeout);
    }
    // add new timeout (4 seconds) for 'stopped typing' event to emit
    isTypingTimeout = setTimeout(() => {
        // emit stopped typing
        socket.emit('stopped typing', {
            username: username
        });
        isTyping = false;
    }, 4000);
}

function refreshUsersTypingDiv() {
    let str = '';
    console.log(usersTyping.length);
    if (usersTyping.length == 1) {
        str = usersTyping[0].username + ' piše...';
    } else if (usersTyping.length > 0) {
        usersTyping.forEach((user, index, arr) => {
            if (arr.length - 2 == index) {
                str += user.username + ' i ';
            } else if (arr.length - 1 == index) {
                str += user.username + ' ';
            } else {
                str += user.username + ', ';
            }
        });
        str += 'pišu...'
    }
    userTypingDiv.innerHTML = str;
    scrollToBottomOfMessages();
}
// create message bubble with props (username, time, message, isRemote)
function createMessage(props) {
    let messageText = props.message;
    let username = props.username;
    let time = props.time;
    let isRemote = props.isRemote;
    // create message bubble
    let messageDiv = document.createElement('div');
    messageDiv.classList.add('talk-bubble');
    messageDiv.classList.add('tri-right');

    // create message text
    let messageTextDiv = document.createElement('div');
    messageTextDiv.classList.add('talktext');

    // if is remote align left, add username
    if (isRemote) {
        messageDiv.classList.add('left-in');

        // if username is null, it isnt a message, but a notification, and it doesnt have a username
        if (username != null) {
            let usernameSpan = document.createElement('span');
            usernameSpan.innerText = username;
            usernameSpan.classList.add('username');
            messageTextDiv.appendChild(usernameSpan);
        }
    } else {
        // if is not remote align right
        messageDiv.classList.add('right-in');
        messageDiv.classList.add('flex-end');
        // scroll to end of messages if message is from self
        scrollToBottomOfMessages();
        // clear input field  
        messageInput.value = '';
    }

    // add message content
    let messageContentParagraph = document.createElement('p');
    messageContentParagraph.innerHTML = messageText;
    messageTextDiv.appendChild(messageContentParagraph);

    // add message time
    let messageTimeSpan = document.createElement('span');
    messageTimeSpan.classList.add('time');
    messageTimeSpan.innerText = time.toLocaleTimeString().charAt(4) == ':' ? time.toLocaleTimeString().substring(0, 4) : time.toLocaleTimeString().substring(0, 5);
    messageTextDiv.appendChild(messageTimeSpan);

    // add message text to message
    messageDiv.appendChild(messageTextDiv);

    // insert message at the end of messages, before user typing div
    userTypingDiv.after(messageDiv)
    //messageContainerDiv.insertBefore(messageDiv, userTypingDiv);
    scrollToBottomOfMessages();
}

// scroll to bottom of messages
function scrollToBottomOfMessages() {
    messageContainerDiv.scrollTop = messageContainerDiv.scrollHeight;
}