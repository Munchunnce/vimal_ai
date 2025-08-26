const input = document.querySelector('#input');
const chatContainer = document.querySelector('#chat-container');
const askBtn = document.querySelector('#ask');


input.addEventListener('keyup', handleEnter);
askBtn.addEventListener('click', handleAsk);


// Text genrate function
function genrate(text){
    /**
     * 1. append message UI
     * 2. Send it to LLM
     * 3. Append response to UI
     */
    const msg = document.createElement('div');
    msg.className = `my-6 rounded-xl bg-neutral-800 p-3 ml-auto max-w-fit`;
    msg.textContent = text;
    chatContainer.appendChild(msg);
    input.value = '';
}

// askBtn click
function handleAsk(e){
    const text = input.value.trim();
    if(!text){
        return;
    };
    genrate(text);
}
// handleEnter function
function handleEnter(e){
    if(e.key === 'Enter'){
        const text = input.value.trim();
        if(!text){
            return;
        };

        genrate(text);
    }
}