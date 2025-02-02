import './style.css'

document.querySelector('#app').innerHTML = `
 <div class="container mx-auto p-4 max-w-6xl">
  <div class="navbar bg-base-200 rounded-box mb-4">
    <div class="flex-1 flex justify-between items-center">
    <i class="bi bi-robot hidden sm:block ml-4"></i>
      <h1 class="text-xl font-bold px-4 hidden sm:block">CHAT BOT AI</h1>
        <i class="bi bi-robot sm:hidden ml-5"></i>
      <div class="flex-1 flex justify-center">
       <select id="model-select" class="select select-bordered w-60 sm:w-full max-w-xs">
          <option value="gemma2-9b-it">gemma2-9b-it</option>
          <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
          <option value="llama-3.2-1b-preview">llama-3.2-1b-preview</option>
          <option value="llama-3.2-3b-preview">llama-3.2-3b-preview</option>
          <option value="llama-3.2-11b-vision-preview">llama-3.2-11b-vision-preview</option>
          <option value="llama-3.2-90b-vision-preview">llama-3.2-90b-vision-preview</option>
          <option value="llama-guard-3-8b">llama-guard-3-8b</option>
          <option value="llama3-70b-8192">llama3-70b-8192</option>
          <option value="llama3-8b-8192">llama3-8b-8192</option>
          <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
        </select>
      </div>
      <div class="flex gap-4">
        <a href="https://github.com/RevanSP" target="_blank" class="hover:text-base-300">
          <i class="fab fa-github fa-lg"></i>
        </a>
        <a href="https://www.instagram.com/m9nokuro" target="_blank" class="hover:text-base-300">
          <i class="fab fa-instagram fa-lg"></i>
        </a>
        <a href="https://www.facebook.com/profile.php?id=100082958149027" target="_blank" class="hover:text-base-300 mr-4">
          <i class="fab fa-facebook fa-lg"></i>
        </a>
      </div>
    </div>
  </div>
  <div class="bg-base-200 rounded-box p-4 flex flex-col h-[calc(100vh-7rem)]">
<div id="chat-messages" class="space-y-4 flex-grow mb-4 pr-0 md:pr-3 pb-6 overflow-y-scroll md:overflow-y-auto"></div>
 <button id="who-is-reiiv-btn" class="btn btn-circle bg-base-100 border border-base-300 w-full text-white mb-5 p-4 shadow-lg z-20">
  REIIV ?
</button>
  <form id="chat-form" class="flex gap-2">
    <input 
      type="text" 
      id="user-input" 
      class="input input-bordered w-full rounded bg-base-100" 
      placeholder="Type your message ..." 
    />
      <button type="button" class="btn btn-disabled bg-base-100 rounded" id="stop-button" disabled>
    <i class="fa-solid fa-stop"></i>
  </button>
    <button type="submit" class="btn btn-disabled bg-base-100 rounded" id="send-button">
      <i class="fas fa-paper-plane"></i>
    </button>
  </form>
</div>
</div>
`
const callGroqAPI = async (message, signal) => {
  const selectedModel = modelSelect.value;
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [...chatHistory, { role: 'user', content: message }],
        model: selectedModel,
        temperature: 0.7,
        max_tokens: 8000,
      }),
      signal: signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received.';
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const input = document.getElementById('user-input');
  const message = input.value.trim();
  const sendButton = document.querySelector('#chat-form button');

  if (message) {
    disableInputField(true);
    addMessage(message, true);
    chatHistory.push({ role: 'user', content: message });
    input.value = '';

    sendButton.innerHTML = `<span class="loading loading-dots loading-xs"></span>`;
    stopButton.innerHTML = `<i class="fa-solid fa-stop"></i>`;

    const loadingMessage = addMessage('Thinking ...', false, false, true);

    abortController = new AbortController();

    try {
      const response = await callGroqAPI(message, abortController.signal);

      document.getElementById('chat-messages')?.removeChild(loadingMessage);
      addMessage(response, false);

      chatHistory.push({ role: 'assistant', content: response });
    } catch (error) {
      document.getElementById('chat-messages')?.removeChild(loadingMessage);
    } finally {
      sendButton.innerHTML = `<i class="fas fa-paper-plane"></i>`;
      disableInputField(false);

      stopButton.innerHTML = `<i class="fa-solid fa-stop"></i>`;
    }
  }
});

let chatHistory = [];

const stopButton = document.getElementById('stop-button');
let abortController = null;

const disableInputField = (disable) => {
  const inputField = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const whoIsReiivBtn = document.getElementById('who-is-reiiv-btn');
  const modelSelect = document.getElementById('model-select');

  inputField.disabled = disable;
  sendButton.disabled = disable;
  whoIsReiivBtn.disabled = disable;
  modelSelect.disabled = disable;
  stopButton.disabled = !disable;

  if (disable) {
    sendButton.classList.remove('btn-active');
    sendButton.classList.add('btn-disabled');
    whoIsReiivBtn.classList.remove('btn-active');
    whoIsReiivBtn.classList.add('btn-disabled');
    stopButton.classList.remove('btn-disabled');
    stopButton.classList.add('btn-active');
  } else {
    const hasInput = inputField.value.trim() !== '';
    if (hasInput) {
      sendButton.classList.remove('btn-disabled');
      sendButton.classList.add('btn-active');
    }
    whoIsReiivBtn.classList.remove('btn-disabled');
    whoIsReiivBtn.classList.add('btn-active');
    stopButton.classList.remove('btn-active');
    stopButton.classList.add('btn-disabled');
  }
};

stopButton.addEventListener('click', () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
    disableInputField(false);
    addMessage("Process stopped by user.", false);

    stopButton.innerHTML = `<i class="fa-solid fa-stop"></i>`;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const whoIsReiivBtn = document.getElementById('who-is-reiiv-btn');
  let isReiivClicked = false;

  const toggleButtonState = () => {
    if (inputField.value.trim() === '') {
      sendButton.classList.remove('btn-active');
      sendButton.classList.add('btn-disabled');
      sendButton.disabled = true;
    } else {
      sendButton.classList.remove('btn-disabled');
      sendButton.classList.add('btn-active');
      sendButton.disabled = false;
    }
  };

  inputField.addEventListener('input', toggleButtonState);
  toggleButtonState();

  whoIsReiivBtn.addEventListener('click', async () => {
    if (isReiivClicked) return;

    isReiivClicked = true;

    whoIsReiivBtn.disabled = true;
    whoIsReiivBtn.classList.add('opacity-30', 'pointer-events-none');
    whoIsReiivBtn.classList.remove('btn-active');
    whoIsReiivBtn.classList.add('cursor-not-allowed');

    const userMessage = 'REIIV ?';
    disableInputField(true);

    addMessage(userMessage, true);
    chatHistory.push({ role: 'user', content: userMessage });

    const whoIsMessage = "REIIV is the creator and master of this chatbot. A passionate full-stack web developer, REIIV has programmed this chatbot to assist users with a wide range of web-related topics. The chatbot is designed to provide effective assistance and solutions for anything related to web development, from front-end to back-end. REIIV, the creator, is always behind the scenes, continuously enhancing the chatbot's capabilities to improve the user experience.";

    const messageDiv = addMessage(whoIsMessage, false);
    const typingSpeed = 20;
    const messageLength = whoIsMessage.length;
    const typingDuration = typingSpeed * messageLength;

    await new Promise(resolve => setTimeout(resolve, typingDuration));

    const br = document.createElement('br');
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar mt-8 mb-5 flex justify-center';

    const avatarRingDiv = document.createElement('div');
    avatarRingDiv.className = 'ring-primary ring-offset-base-100 w-32 rounded-full ring ring-offset-2';

    const imgElement = document.createElement('img');
    imgElement.src = 'Me.jpg';
    imgElement.alt = 'REIIV';

    avatarRingDiv.appendChild(imgElement);
    avatarDiv.appendChild(avatarRingDiv);

    messageDiv.querySelector('.chat-bubble')?.appendChild(br);
    messageDiv.querySelector('.chat-bubble')?.appendChild(avatarDiv);

    const socialButtonsDiv = document.createElement('div');
    socialButtonsDiv.className = 'flex justify-center gap-3 mt-5 mb-3';

    const githubBtn = document.createElement('a');
    githubBtn.href = 'https://github.com/RevanSP';
    githubBtn.target = '_blank';
    githubBtn.className = 'btn btn-circle';
    githubBtn.innerHTML = `<i class="fab fa-github"></i>`;
    githubBtn.setAttribute('aria-label', 'GitHub');

    const fbBtn = document.createElement('a');
    fbBtn.href = 'https://web.facebook.com/profile.php?id=100082958149027';
    fbBtn.target = '_blank';
    fbBtn.className = 'btn btn-circle';
    fbBtn.innerHTML = `<i class="fab fa-facebook"></i>`;
    fbBtn.setAttribute('aria-label', 'Facebook');

    const igBtn = document.createElement('a');
    igBtn.href = 'https://www.instagram.com/m9nokuro';
    igBtn.target = '_blank';
    igBtn.className = 'btn btn-circle';
    igBtn.innerHTML = `<i class="fab fa-instagram"></i>`;
    igBtn.setAttribute('aria-label', 'Instagram');

    socialButtonsDiv.appendChild(githubBtn);
    socialButtonsDiv.appendChild(fbBtn);
    socialButtonsDiv.appendChild(igBtn);

    messageDiv.querySelector('.chat-bubble')?.appendChild(socialButtonsDiv);

    disableInputField(false);
  });
});

const modelSelect = document.getElementById('model-select');

const greetings = [
  { language: 'English', greeting: 'Hello !' },
  { language: 'Indonesian', greeting: 'Halo !' },
  { language: 'Sundanese', greeting: 'Halo, Kumaha Damang !' },
  { language: 'Japanese', greeting: 'こんにちは！' }
];

const getRandomGreeting = () => {
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex].greeting;
};

const addMessage = (content, isUser = false, isFirstMessage = false, isThinking = false) => {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat ${isUser ? 'chat-end' : 'chat-start'}`;

  const iconClass = isUser ? 'fa-user-secret' : 'fa-robot';
  const iconMargin = isUser ? 'ml-2.5' : 'ml-1.5';

  const languageRegex = /javascript|python|java|html|css|typescript|php|ruby|go|c\+\+|c#|sql|nosql|graphql|node.js|react|angular|vue|express|mongodb|mysql|postgresql|sqlite/i;
  const isCodeSnippet = languageRegex.test(content);

  const chatBubbleClass = isUser ? 'chat-bubble-primary' : '';
  let chatBubbleWidthClass = isCodeSnippet ? 'w-full' : '';

  messageDiv.innerHTML = `
      <div class="chat-image avatar">
          <div class="w-10 rounded-full bg-base-100 border border-base-300 flex items-center justify-center">
              <i class="fas ${iconClass} fa-lg mt-5 ${iconMargin}"></i>
          </div>
      </div>
      <div class="chat-bubble bg-base-100 ${chatBubbleClass} ${chatBubbleWidthClass}">
          <span id="message-text"></span>
      </div>
  `;

  const chatBubble = messageDiv.querySelector('.chat-bubble');
  const messageTextElement = messageDiv.querySelector('#message-text');

  const isStoppedMessage = content.includes("Process stopped by user");
  const isReiivMessage = content.includes("REIIV is the creator and master of this chatbot.");

  if (isReiivMessage) {
    stopButton.disabled = true;
    stopButton.classList.add('btn-disabled');
    stopButton.classList.remove('btn-active');
  } else if (!stopButton.disabled) {
    stopButton.disabled = false;
    stopButton.classList.remove('btn-disabled');
    stopButton.classList.add('btn-active');
  }

  if (isCodeSnippet && !isUser && !isThinking && !isFirstMessage) {
    const codeContainer = document.createElement('pre');
    codeContainer.className = 'code-snippet bg-base-300 p-4 mt-3 mb-3 rounded-md overflow-x-auto text-sm font-mono';
    codeContainer.textContent = content;

    chatBubble.innerHTML = '';
    chatBubble.appendChild(codeContainer);

    if (!isReiivMessage && !isStoppedMessage) {
      const copyButton = document.createElement('button');
      copyButton.className = 'mt-2 btn w-full bg-base-300 btn-xs';
      copyButton.innerText = 'COPY';

      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
          copyButton.innerText = 'COPIED !';
          setTimeout(() => {
            copyButton.innerText = 'COPY';
          }, 3000);
        }).catch((error) => {
          console.error('Failed to copy text:', error);
        });
      });

      chatBubble.appendChild(copyButton);
    }
  } else if (!isUser && !isFirstMessage && !isThinking) {
    const copyButton = document.createElement('button');
    copyButton.className = 'mt-2 btn w-full bg-base-300 btn-xs';
    copyButton.innerText = 'COPY';

    if (!isReiivMessage && !isStoppedMessage) {
      copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
          copyButton.innerText = 'COPIED !';
          setTimeout(() => {
            copyButton.innerText = 'COPY';
          }, 3000);
        }).catch((error) => {
          console.error('Failed to copy text:', error);
        });
      });

      chatBubble.appendChild(copyButton);
    }
  }

  if (isFirstMessage) {
    const greeting = getRandomGreeting();
    messageTextElement.innerHTML = `${greeting} How can I help you today ? I am programmed by &nbsp;<div class="badge rounded bg-base-300 inline-flex items-center py-3"> <i class="bi bi-patch-check-fill w-3 text-blue-600"></i> &nbsp;&nbsp;<strong>REIIV</strong></div>&nbsp; Currently/default, using model : ${modelSelect.value}`;
  } else {
    const typingDelay = 20;
    let currentCharIndex = 0;
    const messageLength = content.length;

    const typeWriterEffect = setInterval(() => {
      if (currentCharIndex < messageLength) {
        messageTextElement.innerHTML += content.charAt(currentCharIndex);
        currentCharIndex++;
      } else {
        clearInterval(typeWriterEffect);
      }
    }, typingDelay);
  }

  document.getElementById('chat-messages')?.appendChild(messageDiv);
  messageDiv.scrollIntoView({ behavior: 'smooth' });

  return messageDiv;
};

addMessage(`How can I help you today ? I am programmed by &nbsp;<div class="badge rounded bg-base-300 inline-flex items-center py-3"> <i class="bi bi-patch-check-fill w-3 text-blue-600"></i>
 &nbsp;&nbsp;<strong>REIIV</strong></div>&nbsp; Currently/default, using model : ${modelSelect.value}`, false, true);