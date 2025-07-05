import './style.css'

document.querySelector('#app').innerHTML = `
  <div class="container mx-auto p-4 max-w-6xl">
    <div class="navbar bg-base-200 rounded-box mb-4">
      <div class="flex-1 flex justify-between items-center">
        <i class="bi bi-robot hidden sm:block ml-4"></i>
        <h1 class="text-xl font-bold px-4 hidden sm:block">ASSISTEN AI</h1>
        <i class="bi bi-robot sm:hidden ml-5"></i>
        <div class="flex-1 flex items-center justify-center">
        <span class="text-xl text-center">
    ASSISTEN AI RYY
         </span>
         </div>
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost m-1">
            <i class="fas fa-chevron-down fa-md"></i>
          </div>
          <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <li>
              <a href="https://github.com/abqoryme" target="_blank" class="flex items-center gap-2">
                <i class="fab fa-github"></i>
                <span class="text-blue-400">@Abqoryme</span>
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/ahmadabkorimudabig" target="_blank" class="flex items-center gap-2">
                <i class="fab fa-instagram"></i>
                <span class="text-blue-400">@Ryy-q</span>
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/share/1ArMFMJMG3/" target="_blank" class="flex items-center gap-2">
                <i class="fab fa-facebook"></i>
                <span class="text-blue-400">@Its_Me</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="bg-base-200 rounded-box p-4 flex flex-col h-[calc(100vh-7rem)]">
      <div id="chat-messages" class="space-y-4 flex-grow mb-4 pr-0 md:pr-3 pb-6 overflow-y-scroll md:overflow-y-auto"></div>
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
`;

let chatHistory = [];
let abortController = null;
const stopButton = document.getElementById('stop-button');

const callGroqAPI = async (message, signal) => {
  const selectedModel = "meta-llama/llama-4-scout-17b-16e-instruct";
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
        temperature: 1,
        max_tokens: 1024,
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

const disableInputField = (disable) => {
  const inputField = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  inputField.disabled = disable;
  sendButton.disabled = disable;
  stopButton.disabled = !disable;

  if (disable) {
    sendButton.classList.remove('btn-active');
    sendButton.classList.add('btn-disabled');
    stopButton.classList.remove('btn-disabled');
    stopButton.classList.add('btn-active');
  } else {
    const hasInput = inputField.value.trim() !== '';
    if (hasInput) {
      sendButton.classList.remove('btn-disabled');
      sendButton.classList.add('btn-active');
    }
    stopButton.classList.remove('btn-active');
    stopButton.classList.add('btn-disabled');
  }
};

document.getElementById('chat-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const input = document.getElementById('user-input');
  const message = input.value.trim();
  const sendButton = document.getElementById('send-button');

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

  addMessage(`How can I help you today ?`, false, true);
});

const greetings = [
  { language: 'English', greeting: 'Hello !' },
  { language: 'Indonesian', greeting: 'Halo !' },
  { language: 'Sundanese', greeting: 'Halo, Kumaha Damang !' },
  { language: 'Japanese', greeting: 'こんにちは！' },
  { language: 'Jawa', greeting: 'Halo, pripun kabare?' }
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

  if (isCodeSnippet && !isUser && !isThinking && !isFirstMessage) {
    const codeContainer = document.createElement('pre');
    codeContainer.className = 'code-snippet bg-base-300 p-4 mt-3 mb-3 rounded-md overflow-x-auto text-sm font-mono';
    codeContainer.textContent = content;

    chatBubble.innerHTML = '';
    chatBubble.appendChild(codeContainer);

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
  } else if (!isUser && !isFirstMessage && !isThinking) {
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

  if (isFirstMessage) {
    const greeting = getRandomGreeting();
    messageTextElement.innerHTML = `${greeting} How can I help you today ?`;
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
