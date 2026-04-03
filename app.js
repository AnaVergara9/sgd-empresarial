function selectChannel(channel) {
    const sub = document.getElementById("subchannels");

    sub.innerHTML = `
        <h2>${channel}</h2>
        <ul>
            <li onclick="selectSubchannel('Finanzas')">Finanzas</li>
            <li onclick="selectSubchannel('Recursos Humanos')">Recursos Humanos</li>
        </ul>
    `;
}
function selectSubchannel(name) {
    const threads = document.getElementById("threads");

    threads.innerHTML = `
        <h2>${name}</h2>
        <ul>
            <li onclick="selectThread('Estados financieros')">Estados financieros</li>
            <li onclick="selectThread('Nómina')">Nómina</li>
        </ul>
    `;
}
function selectThread(thread) {
    const chat = document.getElementById("chat");

    chat.innerHTML = `
        <h2>${thread}</h2>

        <div class="messages">
            <div class="message"><strong>Usuario:</strong> Hola</div>
        </div>

        <div class="input-area">
            <input type="text" placeholder="Escribe un mensaje..." class="message-input">
            <button class="send-button">Enviar</button>
        </div>
    `;
}