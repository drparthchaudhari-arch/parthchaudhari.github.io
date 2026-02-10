/* ============================================
   MULTIPLAYER LOBBY SYSTEM
   ============================================ */

const LobbySystem = {
    currentLobby: null,
    playerName: '',
    isHost: false,
    lobbies: [],
    
    // Initialize
    init() {
        this.playerName = localStorage.getItem('playerName') || 'Player' + Math.floor(Math.random() * 1000);
        this.loadLobbies();
    },
    
    // Create a new lobby
    createLobby() {
        const code = this.generateLobbyCode();
        const lobby = {
            code: code,
            host: this.playerName,
            players: [{ name: this.playerName, ready: false, isHost: true }],
            game: null,
            status: 'waiting', // waiting, playing, ended
            created: Date.now()
        };
        
        this.lobbies.push(lobby);
        this.currentLobby = lobby;
        this.isHost = true;
        
        this.saveLobbies();
        this.showLobbyModal(lobby);
        
        return code;
    },
    
    // Join existing lobby
    joinLobby(code) {
        code = code.trim().replace(/\D/g, '');
        if (code.length !== 6) {
            alert('Enter a valid 6-digit lobby code.');
            return false;
        }

        const lobby = this.lobbies.find(l => l.code === code);
        
        if (!lobby) {
            alert('Lobby not found!');
            return false;
        }
        
        if (lobby.status !== 'waiting') {
            alert('Game already in progress!');
            return false;
        }
        
        if (lobby.players.length >= 4) {
            alert('Lobby is full!');
            return false;
        }
        
        // Add player
        lobby.players.push({
            name: this.playerName,
            ready: false,
            isHost: false
        });
        
        this.currentLobby = lobby;
        this.isHost = false;
        
        this.saveLobbies();
        this.showLobbyModal(lobby);
        
        return true;
    },
    
    // Leave lobby
    leaveLobby() {
        if (!this.currentLobby) return;
        
        const lobby = this.currentLobby;
        lobby.players = lobby.players.filter(p => p.name !== this.playerName);
        
        // If host leaves, assign new host or delete lobby
        if (this.isHost) {
            if (lobby.players.length > 0) {
                lobby.players[0].isHost = true;
                lobby.host = lobby.players[0].name;
            } else {
                this.lobbies = this.lobbies.filter(l => l.code !== lobby.code);
            }
        }
        
        this.currentLobby = null;
        this.isHost = false;
        
        this.saveLobbies();
        this.hideLobbyModal();
    },
    
    // Toggle ready status
    toggleReady() {
        if (!this.currentLobby) return;
        
        const player = this.currentLobby.players.find(p => p.name === this.playerName);
        if (player) {
            player.ready = !player.ready;
            this.updateLobbyUI();
            this.saveLobbies();
        }
    },
    
    // Start game (host only)
    startGame() {
        if (!this.isHost || !this.currentLobby) return;
        
        const allReady = this.currentLobby.players.every(p => p.ready || p.isHost);
        if (!allReady) {
            alert('All players must be ready!');
            return;
        }
        
        this.currentLobby.status = 'playing';
        this.saveLobbies();
        
        // Start the selected game in multiplayer mode
        this.hideLobbyModal();
        startGame(this.currentLobby.game);
    },
    
    // Generate random lobby code
    generateLobbyCode() {
        const digits = '0123456789';
        let code = '';

        do {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += digits.charAt(Math.floor(Math.random() * digits.length));
            }
        } while (this.lobbies.some(lobby => lobby.code === code));

        return code;
    },
    
    // Show lobby modal
    showLobbyModal(lobby) {
        const modal = document.getElementById('lobby-modal');
        document.getElementById('lobby-code-display').textContent = lobby.code;
        
        this.updateLobbyUI();
        modal.classList.remove('hidden');
        
        // Start polling for updates
        this.startPolling();
    },
    
    // Hide lobby modal
    hideLobbyModal() {
        const modal = document.getElementById('lobby-modal');
        modal.classList.add('hidden');
        this.stopPolling();
    },
    
    // Update lobby UI
    updateLobbyUI() {
        if (!this.currentLobby) return;
        
        const playersContainer = document.getElementById('lobby-players');
        const startBtn = document.getElementById('start-game-btn');
        
        // Update players list
        playersContainer.innerHTML = `
            <h4>Players (${this.currentLobby.players.length}/4)</h4>
            <div class="player-list">
                ${this.currentLobby.players.map(p => `
                    <div class="player-item ${p.isHost ? 'host' : ''}">
                        <div class="player-avatar">${p.name[0]}</div>
                        <div class="player-info">
                            <span class="player-name">${p.name} ${p.name === this.playerName ? '(You)' : ''}</span>
                            <span class="player-status">${p.ready ? 'Ready' : 'Not Ready'}</span>
                        </div>
                        ${p.isHost ? '<span class="host-badge">HOST</span>' : ''}
                        ${p.ready ? '<span class="ready-badge">READY</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Update start button
        if (startBtn) {
            const allReady = this.currentLobby.players.every(p => p.ready || p.isHost);
            startBtn.disabled = !allReady;
        }
    },
    
    // Poll for lobby updates
    pollingInterval: null,
    startPolling() {
        this.pollingInterval = setInterval(() => {
            this.loadLobbies();
            if (this.currentLobby) {
                const updated = this.lobbies.find(l => l.code === this.currentLobby.code);
                if (updated) {
                    this.currentLobby = updated;
                    this.updateLobbyUI();
                    
                    // Check if game started
                    if (updated.status === 'playing') {
                        this.hideLobbyModal();
                        startGame(updated.game);
                    }
                }
            }
        }, 2000);
    },
    
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    },
    
    // Save lobbies to localStorage
    saveLobbies() {
        localStorage.setItem('lobbies', JSON.stringify(this.lobbies));
    },
    
    // Load lobbies from localStorage
    loadLobbies() {
        const saved = localStorage.getItem('lobbies');
        if (saved) {
            this.lobbies = JSON.parse(saved);
            
            // Clean up old lobbies (older than 1 hour)
            const oneHour = 60 * 60 * 1000;
            this.lobbies = this.lobbies.filter(l => Date.now() - l.created < oneHour);
            
            this.updateLobbyList();
        }
    },
    
    // Update lobby list on page
    updateLobbyList() {
        const list = document.getElementById('lobby-list');
        if (!list) return;
        
        const availableLobbies = this.lobbies.filter(l => l.status === 'waiting' && l.players.length < 4);
        
        if (availableLobbies.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No active lobbies</p>';
            return;
        }
        
        list.innerHTML = availableLobbies.map(lobby => `
            <div class="lobby-item">
                <div class="lobby-item-info">
                    <strong>${lobby.host}'s Game</strong>
                    <span>${lobby.players.length}/4 players • Code: ${lobby.code}</span>
                </div>
                <button class="btn btn-play" onclick="joinLobby('${lobby.code}')">
                    <i class="fas fa-sign-in-alt"></i> Join
                </button>
            </div>
        `).join('');
    },
    
    // Copy lobby code
    copyLobbyCode() {
        if (!this.currentLobby) return;
        
        navigator.clipboard.writeText(this.currentLobby.code).then(() => {
            const btn = document.querySelector('.btn-copy');
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    },
    
    // Send chat message
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message || !this.currentLobby) return;
        
        // Add message to chat
        this.addChatMessage(this.playerName, message);
        input.value = '';
    },
    
    // Add chat message
    addChatMessage(author, message) {
        const chat = document.getElementById('lobby-chat');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.innerHTML = `<span class="chat-author">${author}:</span> <span class="chat-text">${message}</span>`;
        chat.appendChild(msgDiv);
        chat.scrollTop = chat.scrollHeight;
    },
    
    // Invite via share
    shareInvite() {
        if (!this.currentLobby) return;
        
        const shareData = {
            title: 'Join my game on Parth Games!',
            text: `Join my game lobby with code: ${this.currentLobby.code}`,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback - copy to clipboard
            const text = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(text).then(() => {
                alert('Invite link copied to clipboard!');
            });
        }
    }
};

// Initialize lobby system
document.addEventListener('DOMContentLoaded', () => {
    LobbySystem.init();
});

// Global functions for HTML onclick handlers
function createLobby() {
    LobbySystem.createLobby();
}

function joinLobby(code) {
    if (!code) {
        code = document.getElementById('lobby-code').value;
    }
    LobbySystem.joinLobby(code);
}

function leaveLobby() {
    LobbySystem.leaveLobby();
}

function toggleReady() {
    LobbySystem.toggleReady();
}

function startMultiplayerGame() {
    LobbySystem.startGame();
}

function copyLobbyCode() {
    LobbySystem.copyLobbyCode();
}

function sendChatMessage() {
    LobbySystem.sendChatMessage();
}

function shareInvite() {
    LobbySystem.shareInvite();
}
