console.log('loading chat.js');
chatio = {
    messages: [],
    container: null,
    messageContainer: null,
    chatForm: null,
    socket: null,
    init: function (container, io) {
        this.socket = io;
        this.container = container;
        // error if container is not found
        if (!this.container) {
            console.error("Container not found");
            return;
        }
        console.log('chatio in:', this);
        
        // add message container to container
        this.messageContainer = this.messageContainer();
        this.container.appendChild(this.messageContainer);
        
        // add chat form to container
        this.chatForm = this.chatForm();
        this.container.appendChild(this.chatForm);
        
        // create the chat messages
        this.messages.forEach((msg) => {
            const message = document.createElement('div');
            message.textContent = msg;
            this.messageContainer.appendChild(message);
        });


        
        
        
        // add event listener to the socket
        
        this.socket.on('chat message', (msg) => {
            console.log('message received: ' + msg);
            this.addMessage(msg);
        }
        );
        
        // create 'message' 
        
    },

    sendMessage: function(msg) {
        console.log('sending message:', msg);
        this.addMessage(msg);
        this.socket.emit('chat message', msg);
    },

    addMessage : function(msg) {
        console.log('adding message:', msg);
        this.messages.push(msg);
        const message = document.createElement('div');
        message.textContent = msg;
        this.messageContainer.appendChild(message);

        // scroll chat-message-display to bottom
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        

        // add to the chat


    },
    messageContainer: function() {
        const container = document.createElement('div');
        container.setAttribute('id', 'chat-message-display');
        return container;
    },
    chatForm: function() {
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
            console.log('submitting form',e);
            console.log('input', input.value);

            if (input.value) {
                this.sendMessage(input.value);
                input.value = '';
            }
        });
        
        return form;
    }
    
}

console.log('chat.js loaded', chatio);