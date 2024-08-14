
chatio = {
    messages: [],
    outerContainer: null,
    container: null,
    messageContainer: null,
    chatForm: null,
    socket: null,
    user: null,
    init: function (container, io) {
        this.socket = io;
        // fetch user from endpoint
        this.user = fetch('/drawmap/user/me')
            // if no user, send to login
            .then((res) => {
                if (res.status === 401) {
                    window.location.href = '/login';
                
            }
            return res.json();
        })
            .then((user) => {
                this.user = user;
                console.log(user);
            // bot message to welcome user
            this.addMessageToChatHistory({content: `Welcome, ${this.user.username}!`, username: 'Bot', isBot: true}); 
            }
        );

            

        this.outerContainer = container;
        // container is #chat-window child of outer container

        this.container = document.getElementById('chat-window');
        console.log('container', this.container);
        // error if container is not found
        if (!this.container) {
            console.error("Container not found");
            return;
        }        
        // add message container to container
        this.messageContainer = this.htmlComponents.messageContainer();
        this.container.appendChild(this.messageContainer);
        
        // add chat form to container
        this.chatForm = this.htmlComponents.chatForm();
        this.container.appendChild(this.chatForm);
        
        // create the chat messages
        this.messages.forEach((msg) => {
            const message = this.htmlComponents.message(msg);
            this.messageContainer.appendChild(message);
        });
        
        // add event listener to the socket
        
        this.socket.on('chat message', (msg) => {
            this.addMessageToChatHistory(msg);
        }
        );
        


        
    },

    sendMessage: function(msg) {
        // add username to message

        // emit to server, then add to chat history
        this.socket.emit('chat message', msg);
        this.addMessageToChatHistory(msg);
        
    },

    addMessageToChatHistory: function(msg) {
        this.messages.push(msg);
        console.log('addMessageToChatHistory', msg);
        let message;
        if(msg.isBot) {
            message = this.htmlComponents.botMessage(msg);
        } else {
        message = this.htmlComponents.message(msg);
        console.log('message created no bot', message);
        }
        console.log('message to add', message);
        this.messageContainer.appendChild(message);

        // scroll chat-message-display to bottom
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        

        // add to the chat


    },

    htmlComponents: {

        // create an individual message div
        message: function(msg) {
            const messageBox = document.createElement('div');
            messageBox.classList.add('messageBox');
            // div for message text
            message = document.createElement('div');
            message.appendChild(document.createTextNode(msg.content));
            messageBox.appendChild(message);
            // div for username
            const username = document.createElement('div');
            username.appendChild(document.createTextNode(msg.username));
            username.classList.add('message-username-display');
            // if is me, add isMe class
            if (msg.username === chatio.user.username) {
                messageBox.classList.add('isMe');
            }
            messageBox.appendChild(username);
            console.log('message created with', msg);
            console.log('messageBox', messageBox);
            return messageBox;
        },

        botMessage: function(msg) {
            message = this.message(msg);
            message.classList.add('isBot');
            // remove username from bot messages
            message.querySelector('.message-username-display').remove();
            return message;
        },


        // container for all chat messages
        messageContainer: function() {
            const container = document.createElement('div');
            container.setAttribute('id', 'chat-messages-container');
            return container;
        },
        // form for user to send messages
        chatForm: () => {
            const form = document.createElement('form');
            // set form id
            form.setAttribute('id', 'chat-form');
            const input = document.createElement('input');
            const submit = document.createElement('button');
            submit.innerHTML = 'Send';
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('placeholder', 'Message');
            input.setAttribute('maxlength', '200');
            input.setAttribute('id', 'message');
            input.setAttribute('type', 'text');
            input.setAttribute('name', 'message');
            submit.setAttribute('type', 'submit');
            
            form.appendChild(input);
            form.appendChild(submit);
            
            // add event listener to the form
            form.addEventListener('submit', (e) => {
                e.preventDefault();
    
                if (input.value) {
                    chatio.sendMessage({content: input.value, username: chatio.user.username, isBot: false});
                    input.value = '';
                }
            });
            
            return form;
        }
    },
    toggleChat: function() {
        // add collapsed class to container
        this.container.classList.toggle('collapsed');

        // change button text
        document.getElementById('chat-toggle').innerHTML = this.container.classList.contains('collapsed') ? 'Show Chat' : 'Hide Chat';
    }
    
}

