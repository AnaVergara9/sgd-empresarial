function selectChannel(channel, element) {

    // quitar active a todos
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.remove('active');
    });

    // poner active al clickeado
    element.classList.add('active');

    const sub = document.getElementById("subchannels");

    sub.innerHTML = `
        <h2>${channel}</h2>
        <ul>
            <li onclick="selectSubchannel('Finanzas', this)">Finanzas</li>
            <li onclick="selectSubchannel('RRHH', this)">RRHH</li>
        </ul>
    `;
}

function selectSubchannel(name, element) {

    document.querySelectorAll('.subchannel-panel li').forEach(li => {
        li.classList.remove('active');
    });

    element.classList.add('active');

    const threads = document.getElementById("threads");

    threads.innerHTML = `
        <h2>${name}</h2>
        <ul>
            <li onclick="selectThread('Estados financieros', this)">Estados financieros</li>
            <li onclick="selectThread('Nómina', this)">Nómina</li>
        </ul>
    `;
}

function selectThread(thread, element) {

    document.querySelectorAll('.thread-panel li').forEach(li => {
        li.classList.remove('active');
    });

    element.classList.add('active');

    const chat = document.getElementById("chat");

    chat.innerHTML = `
        <h2>${thread}</h2>

        <div class="messages">
            <div class="message"><strong>Usuario:</strong> Hola</div>
        </div>

        <div class="input-area">

            <!-- BOTÓN CLIP -->
            <label for="file-input" class="clip-button">📎</label>
            <input type="file" id="file-input" hidden>

            <!-- INPUT MENSAJE -->
            <input type="text" placeholder="Escribe un mensaje..." class="message-input">

            <!-- BOTÓN ENVIAR -->
            <button class="send-button">Enviar</button>
        </div>
    `;
}