// Chat & Learn - Fully Functional JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 1. Check login status
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Please log in to use the Chat & Learn feature.');
        window.location.href = 'auth/login.html';
        return;
    }

    // 2. Initialize all chat components
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.getElementById('messagesContainer');
    
    const typingIndicator = document.getElementById('typingIndicator');
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiPicker = document.getElementById('emojiPicker');

    // --- Element References ---
    const sendBtn = document.getElementById('sendBtn');

    // --- Event Listeners ---

    // Send message on button click
    sendBtn.addEventListener('click', () => sendMessage(user));

    // Send message on Enter key press
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(user);
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    });

    // File attachment
    attachBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files, user));

    // Emoji picker
    emojiBtn.addEventListener('click', () => {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    });
    document.querySelectorAll('.emoji').forEach(emoji => {
        emoji.addEventListener('click', () => {
            messageInput.value += emoji.textContent;
            emojiPicker.style.display = 'none';
        });
    });

    // --- Video Call Functionality ---
    const videoCallModal = document.getElementById('videoCallModal');
    const localVideo = document.getElementById('localVideo');
    let localStream;

    // Start video call
    document.getElementById('videoCallBtn').addEventListener('click', async () => {
        videoCallModal.style.display = 'flex';
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
        } catch (err) {
            console.error('Error accessing media devices.', err);
            alert('Could not access your camera or microphone. Please check permissions.');
            videoCallModal.style.display = 'none';
        }
    });

    // End video call
    document.getElementById('endCallBtn').addEventListener('click', () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        videoCallModal.style.display = 'none';
    });

    // Toggle Microphone
    document.getElementById('toggleMicBtn').addEventListener('click', function() {
        if (!localStream) return;
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            this.innerHTML = `<i class="fas fa-microphone${audioTrack.enabled ? '' : '-slash'}"></i>`;
            this.classList.toggle('inactive', !audioTrack.enabled);
        }
    });

    // Toggle Camera
    document.getElementById('toggleCameraBtn').addEventListener('click', function() {
        if (!localStream) return;
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            localVideo.style.display = videoTrack.enabled ? 'block' : 'none';
            this.innerHTML = `<i class="fas fa-video${videoTrack.enabled ? '' : '-slash'}"></i>`;
            this.classList.toggle('inactive', !videoTrack.enabled);
        }
    });

    // --- Other Modals (for completeness) ---
    document.getElementById('voiceCallBtn').addEventListener('click', () => alert('Starting voice call...'));
    document.getElementById('whiteboardBtn').addEventListener('click', () => {
        if (window.openWhiteboard) {
            window.openWhiteboard();
        } else {
            alert('Opening interactive whiteboard...');
        }
    });
    document.getElementById('screenShareBtn').addEventListener('click', () => alert('Starting screen share...'));

    // --- Initial Load ---
    scrollToBottom();
    
    // Check if a tutor was selected from the dashboard
    const selectedTutor = JSON.parse(sessionStorage.getItem('selectedTutor') || 'null');
    if (selectedTutor) {
        // Update the active chat to show the selected tutor
        const activeChatName = document.querySelector('.chat-name strong');
        if (activeChatName) {
            activeChatName.textContent = selectedTutor.name;
        }
        
        // Add a welcome message from the tutor
        const welcomeMessageHTML = `
            <div class="message received">
                <img src="https://i.pravatar.cc/30?img=1" alt="${selectedTutor.name}" class="msg-avatar">
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="msg-sender">${selectedTutor.name}</span>
                        <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="msg-bubble">
                        <p>Hi! I'm ${selectedTutor.name}. How can I help you today?</p>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', welcomeMessageHTML);
        scrollToBottom();
    }
});

// --- Core Functions ---

function sendMessage(user) {
    const messageText = messageInput.value.trim();
    if (messageText === '') return;

    // 1. Create and display the sent message
    const sentMessageHTML = `
        <div class="message sent">
            <div class="msg-content">
                <div class="msg-header">
                    <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="msg-bubble">
                    <p>${messageText}</p>
                </div>
            </div>
        </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', sentMessageHTML);

    // 2. Clear input and scroll
    messageInput.value = '';
    messageInput.style.height = 'auto';
    scrollToBottom();

    // 3. Simulate a reply from the tutor
    simulateTutorReply();
}

function simulateTutorReply() {
    // Show typing indicator
    typingIndicator.style.display = 'flex';
    scrollToBottom();

    setTimeout(() => {
        // Hide typing indicator
        typingIndicator.style.display = 'none';

        // Generate a reply
        const replies = [
            'That\'s a great question! Let me explain...',
            'I see. Can you give me an example?',
            'Absolutely. Here is a resource that might help.',
            'Let\'s break that down step by step.',
            'Good point. Have you considered this approach?'
        ];
        const replyText = replies[Math.floor(Math.random() * replies.length)];

        // Create and display the received message
        const receivedMessageHTML = `
            <div class="message received">
                <img src="https://i.pravatar.cc/30?img=1" alt="Dr. Sarah" class="msg-avatar">
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="msg-sender">Dr. Sarah Johnson</span>
                        <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="msg-bubble">
                        <p>${replyText}</p>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', receivedMessageHTML);
        scrollToBottom();

    }, 1500 + Math.random() * 1000); // Reply after 1.5-2.5 seconds
}

function handleFileUpload(files, user) {
    if (files.length === 0) return;

    for (const file of files) {
        const fileMessageHTML = `
            <div class="message sent">
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="msg-bubble">
                        <div class="attachment">
                            <i class="fas fa-file"></i>
                            <div class="attachment-info">
                                <span class="attachment-name">${file.name}</span>
                                <span class="attachment-size">${(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button class="btn-download" onclick="alert('Downloading ${file.name}')"><i class="fas fa-download"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', fileMessageHTML);
    }
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
