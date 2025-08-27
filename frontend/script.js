const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chat-container');
const askBtn = document.querySelector('#ask');


input.addEventListener('keyup', handleEnter);
askBtn.addEventListener('click', handleAsk);

// create loading state
const loading = document.createElement('div');
loading.className = 'my-6 animate-pulse';
loading.textContent = 'Searching the web...';


// Text genrate function
async function genrate(text){
    /**
     * 1. append message UI
     * 2. Send it to LLM
     * 3. Append response to UI
     */
    // <div class="max-w-fit">hello, I am Assistant. How can i help you?</div>
    const msg = document.createElement('div');
    msg.className = `my-6 rounded-xl bg-neutral-800 p-3 ml-auto max-w-fit`;
    msg.textContent = text;
    chatContainer.appendChild(msg);
    input.value = '';
    // adding loding state
    chatContainer.appendChild(loading);

    // Call Server
    const assistantMessage = await callServer(text);
    const assistantMsgElement = document.createElement('div');
    assistantMsgElement.className = `max-w-fit`;
    assistantMsgElement.textContent = assistantMessage;
    // remove loding state text
    loading.remove();
    chatContainer.appendChild(assistantMsgElement);
}

// server call api
async function callServer(inputText){
    const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
    });

    if(!response.ok){
        throw new Error('Error generating the response...');
    }

    const result = await response.json();
    return result.message;
}

// askBtn click
async function handleAsk(e){
    const text = input.value.trim();
    if(!text){
        return;
    };
    await genrate(text);
}
// handleEnter function
async function handleEnter(e){
    if(e.key === 'Enter'){
        const text = input.value.trim();
        if(!text){
            return;
        };

        await genrate(text);
    }
}