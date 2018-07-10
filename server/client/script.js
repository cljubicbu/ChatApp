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
console.log(username);
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

// refresh username on server if server gets restarted or something else causes reconnection

// enter chat only if username is typed in modal
enterChatBtn.onclick = function (event) {
    event.preventDefault();
    // if username exists, dont show the popup
    if (username != null)
        return;
    if (usernameInput.value.length > 0 && usernameInput.value.trim().length > 0) {
        username = usernameInput.value.trim();
        $('#exampleModal').modal('hide');
        console.log(username, username.length);
        sessionStorage.setItem('username', username);
    } else {
        alert('Unesite nadimak kako biste pristupili chatu!');
    }
    socket_connect();
}

function socket_connect() {
    socket = io('http://localhost:3000/');
    socket_emitUsername();
}
// socket methods
socket.on('reconnect', () => {
    socket_emitUsername();
})

function socket_emitUsername() {
    socket.emit('username declared', {
        username: username
    });
}
socket.on('started typing', data => {
    usersTyping.push({
        username: data.username
    });
    console.log(usersTyping);
    refreshUsersTypingDiv();
})
socket.on('stopped typing', data => {
    var user = usersTyping.find(user => user.username == data.username);
    var index = usersTyping.indexOf(user);
    if (index > -1) {
        usersTyping.splice(index, 1);
    }
    console.log(usersTyping);
    refreshUsersTypingDiv();
})
// handle click on send message button
sendMessageBtn.onclick = function (event) {
    event.preventDefault();
    let msg = messageInput.value;
    // createMessage if something is written in input field, ignore otherwise
    if (msg.length > 0 && msg.trim().length > 0) {
        // emit stopped typing
        socket.emit('stopped typing', {
            username: username
        });
        clearTimeout(isTypingTimeout);
        isTyping = false;
        //emit message
        createMessage({
            isRemote: false,
            message: msg,
            time: new Date(),
            username: 'Pero'
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
    if(usersTyping.length == 1) {
        str = usersTyping[0].username + ' piše...';
    } else if(usersTyping.length > 0) {
        usersTyping.forEach(user => {
            str += user.username + ' ';
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

        let usernameSpan = document.createElement('span');
        usernameSpan.innerText = username;
        usernameSpan.classList.add('username');
        messageTextDiv.appendChild(usernameSpan);
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
    messageTimeSpan.innerText = time.toLocaleTimeString().substring(0, 5);
    messageTextDiv.appendChild(messageTimeSpan);

    // add message text to message
    messageDiv.appendChild(messageTextDiv);

    // insert message at the end of messages, before user typing div
    messageContainerDiv.insertBefore(messageDiv, userTypingDiv);
    scrollToBottomOfMessages();
}

// scroll to bottom of messages
function scrollToBottomOfMessages() {
    messageContainerDiv.scrollTop = messageContainerDiv.scrollHeight;
}