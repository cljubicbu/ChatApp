let messageContainerDiv = document.getElementById('msg-container');
let userTypingDiv = document.getElementById('user-typing');
messageContainerDiv.scrollTop = messageContainerDiv.scrollHeight;
console.log(messageContainerDiv);
// messageContainer.innerHTML = '';

function createMessage(props) {
    // let messageText = props.message;
    // let username = props.username;
    // let time = props.time;
    let isRemote = true;
    let messageDiv = document.createElement('div');
    messageDiv.classList.add('talk-bubble');
    messageDiv.classList.add('tri-right');

    if(isRemote) {
        messageDiv.classList.add('left-in');
    } else {
        messageDiv.classList.add('right-in');
        messageDiv.classList.add('flex-end');
    }

    let messageTextDiv = document.createElement('div');
    messageTextDiv.innerHTML = 'dafdafwd'; 
    messageTextDiv.classList.add('talktext');
    messageDiv.appendChild(messageTextDiv);

    messageContainerDiv.insertBefore(messageDiv, userTypingDiv);
    scrollToBottom();
}
createMessage();

function scrollToBottom() {
    messageContainerDiv.scrollTop = messageContainerDiv.scrollHeight;
}