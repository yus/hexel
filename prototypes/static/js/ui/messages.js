export function addMessage(text, type = 'info', duration = 3000) {
    const msgArea = document.getElementById('message-area');
    const msgId = 'msg-' + Date.now() + '-' + Math.random();
    
    const msgEl = document.createElement('div');
    msgEl.id = msgId;
    msgEl.className = 'message';
    msgEl.textContent = text;
    
    msgArea.appendChild(msgEl);
    
    setTimeout(() => {
        const el = document.getElementById(msgId);
        if (el) el.remove();
    }, duration);
}
