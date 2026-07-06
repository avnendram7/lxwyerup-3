/* ══════════════════════════════════════════════════════════
   LXWYER UP — HELP CHATBOT ENGINE
   Rule-based FAQ bot with smart matching & escalation
══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── FAQ Knowledge Base ──────────────────────────────── */
  const FAQ_DATA = [
    {
      keywords: ['what is', 'lxwyer up', 'lxwyerup', 'about', 'tell me', 'what does', 'what\'s'],
      question: 'What is Lxwyer Up?',
      answer: 'Lxwyer Up is India\'s first AI-powered litigation workspace & CRM for lawyers. It combines case management, AI legal research, court date tracking, document drafting, and client management — all in one intelligent platform built specifically for Indian legal practice.'
    },
    {
      keywords: ['free', 'cost', 'price', 'pricing', 'charge', 'pay', 'subscription', 'plan', 'fee'],
      question: 'Is Lxwyer Up free?',
      answer: 'Yes! The first 500 founding members get full premium access for free during the beta period. No credit card is required, no hidden charges. After the beta, we\'ll offer affordable plans starting as low as ₹499/month — but founding members will always receive special benefits.'
    },
    {
      keywords: ['founding', 'member', 'early access', 'waitlist', 'join', 'signup', 'sign up', 'register', 'how to join'],
      question: 'How do I become a Founding Member?',
      answer: 'Simply scroll down to the signup form on this page and fill in your details — name, email, state, city, practice area, and active cases. Once submitted, you\'ll be registered as a Founding Member and will receive priority access, a permanent founding badge, and free premium features.'
    },
    {
      keywords: ['feature', 'what can', 'do', 'capability', 'offer', 'include', 'tool', 'function'],
      question: 'What features does Lxwyer Up offer?',
      answer: 'Lxwyer Up offers a comprehensive suite:\n\n• 📋 Case Management — Track all your cases in one place\n• 🤖 AI Legal Research — Instant answers from Indian legal databases\n• 📅 Court Date Tracker — Never miss a hearing again\n• 📄 Document Drafting — AI-assisted legal document creation\n• 👥 Client CRM — Manage client relationships efficiently\n• 📊 Analytics — Win rate tracking & case insights\n• 📆 Appointment Calendar — Schedule & manage meetings'
    },
    {
      keywords: ['ai', 'artificial intelligence', 'legal research', 'research', 'lxwyer ai'],
      question: 'How does the AI legal research work?',
      answer: 'Our Lxwyer AI assistant is trained on Indian legal databases and case law. It can help you find relevant judgments, understand legal provisions, draft legal arguments, and provide quick research summaries. Think of it as having a legal research assistant available 24/7, built specifically for Indian courts and laws.'
    },
    {
      keywords: ['who', 'lawyer', 'advocate', 'use', 'for whom', 'target', 'users', 'audience', 'practice area'],
      question: 'Who can use Lxwyer Up?',
      answer: 'Lxwyer Up is built for all practicing advocates and lawyers across India — from solo practitioners to large law firms. We cover all practice areas including criminal law, civil litigation, corporate & commercial law, family law, taxation, arbitration & ADR, and more.'
    },
    {
      keywords: ['safe', 'secure', 'data', 'privacy', 'protect', 'confidential', 'encryption'],
      question: 'Is my data safe?',
      answer: 'Absolutely. Data security is our top priority. All your case data, client information, and documents are encrypted and stored securely. We follow strict privacy standards and will never share your data with third parties. Your confidentiality is non-negotiable.'
    },
    {
      keywords: ['launch', 'when', 'available', 'release', 'date', 'timeline', 'beta', 'coming'],
      question: 'When will Lxwyer Up launch?',
      answer: 'We\'re currently in the early access phase, onboarding our first 500 founding members. The beta version will be available soon to founding members first. Sign up now to secure your spot and be among the first to experience the platform!'
    },
    {
      keywords: ['mobile', 'app', 'phone', 'android', 'ios', 'iphone', 'tablet', 'device'],
      question: 'Is there a mobile app?',
      answer: 'Lxwyer Up is being designed as a web-first platform that works beautifully on all devices — desktop, tablet, and mobile browsers. Dedicated iOS and Android apps are on our roadmap and will be available after the initial launch. As a founding member, you\'ll get early access to mobile apps too!'
    },
    {
      keywords: ['court', 'update', 'hearing', 'date', 'reminder', 'notification', 'alert', 'track'],
      question: 'How does court date tracking work?',
      answer: 'Our court date tracker automatically keeps track of all your upcoming hearings across courts. You\'ll get timely reminders and notifications so you never miss a hearing. The system integrates with your case management dashboard for a complete overview of your schedule.'
    },
    {
      keywords: ['different', 'better', 'compared', 'comparison', 'why', 'special', 'unique', 'advantage'],
      question: 'What makes Lxwyer Up different?',
      answer: 'Unlike generic legal software, Lxwyer Up is built specifically for Indian courts and Indian legal practice. It\'s designed with insights from 300+ Indian lawyers and judges. We combine AI-powered legal research, automated court updates, case management, and a full CRM — all in one unified platform built alongside the legal community.'
    },
    {
      keywords: ['contact', 'email', 'reach', 'support', 'help', 'talk', 'speak'],
      question: 'How can I contact support?',
      answer: 'I\'m here to help with most questions! But if you need personal assistance, you can reach our founder directly.'
    },
    {
      keywords: ['benefit', 'advantage', 'why join', 'what do i get', 'perks', 'reward'],
      question: 'What are the Founding Member benefits?',
      answer: 'As a Founding Member, you\'ll receive:\n\n🏅 Permanent Founding Member Badge\n🚀 Priority access before public launch\n🛠 Direct influence on the product roadmap\n💎 Free premium features during beta\n🤝 Access to an exclusive private community\n\nThese benefits will never be offered again after the first 500 spots are filled!'
    },
    {
      keywords: ['spot', 'remaining', 'left', 'how many', 'available', '500', 'slots'],
      question: 'How many spots are left?',
      answer: 'We\'re filling up fast! Only 500 founding member spots are available in total. Check the counter on this page to see how many spots remain. I\'d recommend signing up soon before they\'re all taken!'
    },
    {
      keywords: ['document', 'draft', 'drafting', 'template', 'write', 'generate', 'create document'],
      question: 'Can Lxwyer Up help with document drafting?',
      answer: 'Yes! Our AI-assisted document drafting feature helps you create legal documents faster and more accurately. From petitions to contracts, the system provides intelligent templates and suggestions tailored to Indian legal formats. It\'s like having a junior associate assist with all your paperwork.'
    },
    {
      keywords: ['crm', 'client', 'manage client', 'client management', 'relationship'],
      question: 'How does the Client CRM work?',
      answer: 'The Client CRM in Lxwyer Up lets you manage all your client relationships in one place. Track client details, communication history, case associations, billing, and appointments. Get a 360° view of each client relationship, making your practice more professional and organized.'
    }
  ];

  /* ─── Greeting Messages ─── */
  const GREETINGS = [
    'Hi there! 👋',
    'Welcome to <strong>Lxwyer Up</strong> support. I\'m here to help you with any questions about our platform.',
    'You can type your question below, or pick one of these popular topics:'
  ];

  const QUICK_QUESTIONS = [
    'What is Lxwyer Up?',
    'Is it free?',
    'What features are offered?',
    'How do I join?',
    'Is my data safe?'
  ];

  /* ─── Fallback Responses ─── */
  const FALLBACK_RESPONSES = [
    'I\'m not sure I have the exact answer for that. Could you try rephrasing your question?',
    'Hmm, I don\'t have specific information about that. Want to try asking differently, or would you like to speak with our team?',
    'That\'s a great question, but it\'s outside what I can help with right now. Would you like to talk to our team directly?',
  ];

  /* ─── State ─── */
  let isOpen = false;
  let isInitialized = false;
  let fallbackCount = 0;
  let tooltipDismissed = false;
  let hasShownPhoneEscalation = false;

  /* ─── Build DOM ──────────────────────────────────────── */
  function buildChatbot() {
    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'chatbot-tooltip';
    tooltip.id = 'chatbotTooltip';
    tooltip.innerHTML = `
      <button class="chatbot-tooltip-close" id="chatbotTooltipClose" aria-label="Dismiss">×</button>
      <div class="chatbot-tooltip-text">
        👋 Need help? Ask me anything about <strong>Lxwyer Up</strong>!
      </div>
    `;
    document.body.appendChild(tooltip);

    // Toggle Button
    const toggle = document.createElement('button');
    toggle.className = 'chatbot-toggle';
    toggle.id = 'chatbotToggle';
    toggle.setAttribute('aria-label', 'Open help chat');
    toggle.innerHTML = `
      <svg class="chatbot-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <svg class="chatbot-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span class="chatbot-badge" id="chatbotBadge">1</span>
    `;
    document.body.appendChild(toggle);

    // Chat Window
    const win = document.createElement('div');
    win.className = 'chatbot-window';
    win.id = 'chatbotWindow';
    win.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10H5a2 2 0 0 0-2 2v1a8 8 0 0 0 16 0v-1a2 2 0 0 0-2-2Z"/>
            <path d="M12 18v4"/>
          </svg>
        </div>
        <div class="chatbot-header-info">
          <div class="chatbot-header-title">Lxwyer Up Support</div>
          <div class="chatbot-header-status">
            <span class="chatbot-header-status-dot"></span>
            Always here to help
          </div>
        </div>
      </div>
      <div class="chatbot-messages" id="chatbotMessages"></div>
      <div class="chatbot-input-area">
        <input
          type="text"
          class="chatbot-input"
          id="chatbotInput"
          placeholder="Type your question..."
          autocomplete="off"
        />
        <button class="chatbot-send-btn" id="chatbotSend" aria-label="Send message" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="chatbot-powered">Powered by <span>Lxwyer Up</span></div>
    `;
    document.body.appendChild(win);

    // Bind events
    bindEvents();

    // Show tooltip after a short delay
    setTimeout(() => {
      if (!tooltipDismissed && !isOpen) {
        tooltip.classList.add('visible');
      }
    }, 3000);
  }

  /* ─── Event Bindings ─────────────────────────────────── */
  function bindEvents() {
    const toggle = document.getElementById('chatbotToggle');
    const input = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('chatbotSend');
    const tooltipClose = document.getElementById('chatbotTooltipClose');
    const tooltip = document.getElementById('chatbotTooltip');

    toggle.addEventListener('click', () => {
      isOpen = !isOpen;
      toggleChat();
    });

    tooltipClose.addEventListener('click', (e) => {
      e.stopPropagation();
      tooltipDismissed = true;
      tooltip.classList.remove('visible');
    });

    tooltip.addEventListener('click', () => {
      tooltipDismissed = true;
      tooltip.classList.remove('visible');
      if (!isOpen) {
        isOpen = true;
        toggleChat();
      }
    });

    input.addEventListener('input', () => {
      sendBtn.disabled = !input.value.trim();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        handleUserInput(input.value.trim());
        input.value = '';
        sendBtn.disabled = true;
      }
    });

    sendBtn.addEventListener('click', () => {
      if (input.value.trim()) {
        handleUserInput(input.value.trim());
        input.value = '';
        sendBtn.disabled = true;
      }
    });
  }

  /* ─── Toggle Chat Open/Close ─────────────────────────── */
  function toggleChat() {
    const toggle = document.getElementById('chatbotToggle');
    const win = document.getElementById('chatbotWindow');
    const badge = document.getElementById('chatbotBadge');
    const tooltip = document.getElementById('chatbotTooltip');

    if (isOpen) {
      toggle.classList.add('active');
      win.classList.add('open');
      badge.style.display = 'none';
      tooltip.classList.remove('visible');
      tooltipDismissed = true;

      if (!isInitialized) {
        isInitialized = true;
        showGreeting();
      }

      setTimeout(() => {
        document.getElementById('chatbotInput').focus();
      }, 400);
    } else {
      toggle.classList.remove('active');
      win.classList.remove('open');
    }
  }

  /* ─── Show Greeting ──────────────────────────────────── */
  function showGreeting() {
    const container = document.getElementById('chatbotMessages');

    GREETINGS.forEach((msg, i) => {
      setTimeout(() => {
        if (i < GREETINGS.length - 1) {
          addBotMessage(msg);
        } else {
          // Last greeting + quick actions
          addBotMessage(msg, true);
        }
      }, i * 600);
    });
  }

  /* ─── Add Bot Message ────────────────────────────────── */
  function addBotMessage(text, showQuickActions = false, showPhone = false) {
    const container = document.getElementById('chatbotMessages');

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chatbot-msg chatbot-msg--bot';

    let html = `
      <div class="chatbot-msg-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10H5a2 2 0 0 0-2 2v1a8 8 0 0 0 16 0v-1a2 2 0 0 0-2-2Z"/>
          <path d="M12 18v4"/>
        </svg>
      </div>
      <div>
        <div class="chatbot-msg-bubble">${formatMessage(text)}</div>
    `;

    if (showPhone && !hasShownPhoneEscalation) {
      hasShownPhoneEscalation = true;
      html += `
        <div class="chatbot-phone-cta">
          <div class="chatbot-phone-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div class="chatbot-phone-info">
            <div class="chatbot-phone-label">Speak to our founder</div>
            <div class="chatbot-phone-number"><a href="tel:+918318216968">+91 83182 16968</a></div>
          </div>
        </div>
      `;
    }

    if (showQuickActions) {
      html += `<div class="chatbot-quick-actions" id="chatbotQuickActions">`;
      QUICK_QUESTIONS.forEach(q => {
        html += `<button class="chatbot-quick-btn" data-question="${escapeHtml(q)}">${q}</button>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    msgDiv.innerHTML = html;
    container.appendChild(msgDiv);
    scrollToBottom();

    // Bind quick action clicks
    if (showQuickActions) {
      setTimeout(() => {
        const btns = msgDiv.querySelectorAll('.chatbot-quick-btn');
        btns.forEach(btn => {
          btn.addEventListener('click', () => {
            const q = btn.getAttribute('data-question');
            handleUserInput(q);
          });
        });
      }, 50);
    }
  }

  /* ─── Add User Message ───────────────────────────────── */
  function addUserMessage(text) {
    const container = document.getElementById('chatbotMessages');

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chatbot-msg chatbot-msg--user';
    msgDiv.innerHTML = `
      <div class="chatbot-msg-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div class="chatbot-msg-bubble">${escapeHtml(text)}</div>
    `;
    container.appendChild(msgDiv);
    scrollToBottom();
  }

  /* ─── Show Typing Indicator ──────────────────────────── */
  function showTyping() {
    const container = document.getElementById('chatbotMessages');

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-typing';
    typingDiv.id = 'chatbotTyping';
    typingDiv.innerHTML = `
      <div class="chatbot-msg-avatar" style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; color: #fff;">
          <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10H5a2 2 0 0 0-2 2v1a8 8 0 0 0 16 0v-1a2 2 0 0 0-2-2Z"/>
          <path d="M12 18v4"/>
        </svg>
      </div>
      <div class="chatbot-typing-dots">
        <span class="chatbot-typing-dot"></span>
        <span class="chatbot-typing-dot"></span>
        <span class="chatbot-typing-dot"></span>
      </div>
    `;
    container.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTyping() {
    const typing = document.getElementById('chatbotTyping');
    if (typing) typing.remove();
  }

  /* ─── Handle User Input ──────────────────────────────── */
  function handleUserInput(text) {
    addUserMessage(text);
    showTyping();

    // Simulate thinking delay
    const delay = 600 + Math.random() * 800;

    setTimeout(() => {
      hideTyping();

      const match = findBestMatch(text);

      if (match) {
        fallbackCount = 0;

        // For contact-related questions, always show phone
        const isContactQ = match.keywords.some(k => ['contact', 'support', 'help', 'talk', 'speak'].includes(k));
        addBotMessage(match.answer, false, isContactQ);

        // Show follow-up quick actions
        setTimeout(() => {
          showFollowUpActions();
        }, 400);
      } else {
        fallbackCount++;

        const fallbackMsg = FALLBACK_RESPONSES[Math.min(fallbackCount - 1, FALLBACK_RESPONSES.length - 1)];
        const shouldShowPhone = fallbackCount >= 2;

        addBotMessage(fallbackMsg, false, shouldShowPhone);

        if (shouldShowPhone && !hasShownPhoneEscalation) {
          // Phone will be shown via addBotMessage
        }

        // Still show some quick actions
        if (fallbackCount < 3) {
          setTimeout(() => {
            showFollowUpActions();
          }, 400);
        }
      }
    }, delay);
  }

  /* ─── Follow-up Quick Actions ────────────────────────── */
  function showFollowUpActions() {
    const container = document.getElementById('chatbotMessages');

    const followUps = [
      'What features are offered?',
      'How do I join?',
      'Is my data safe?',
      'What makes it different?',
      'Talk to someone'
    ];

    // Pick 3 random ones
    const shuffled = followUps.sort(() => 0.5 - Math.random()).slice(0, 3);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'chatbot-msg chatbot-msg--bot';
    actionsDiv.style.paddingLeft = '38px';

    let html = `<div><div class="chatbot-quick-actions">`;
    shuffled.forEach(q => {
      html += `<button class="chatbot-quick-btn" data-question="${escapeHtml(q)}">${q}</button>`;
    });
    html += `</div></div>`;

    actionsDiv.innerHTML = html;
    container.appendChild(actionsDiv);
    scrollToBottom();

    // Bind clicks
    const btns = actionsDiv.querySelectorAll('.chatbot-quick-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const q = btn.getAttribute('data-question');
        if (q === 'Talk to someone') {
          handleTalkToSomeone();
        } else {
          handleUserInput(q);
        }
      });
    });
  }

  /* ─── Talk to someone escalation ─────────────────────── */
  function handleTalkToSomeone() {
    addUserMessage('Talk to someone');
    showTyping();

    setTimeout(() => {
      hideTyping();
      addBotMessage(
        'Of course! I understand you\'d like to speak with a real person. Our founder is personally available to help you. Feel free to call or WhatsApp anytime:',
        false,
        true
      );
    }, 800);
  }

  /* ─── Smart Matching ─────────────────────────────────── */
  function findBestMatch(input) {
    const normalized = input.toLowerCase().replace(/[?!.,]/g, '').trim();
    const words = normalized.split(/\s+/);

    let bestMatch = null;
    let bestScore = 0;

    for (const faq of FAQ_DATA) {
      let score = 0;

      for (const keyword of faq.keywords) {
        // Check if the keyword phrase appears in the input
        if (normalized.includes(keyword.toLowerCase())) {
          // Longer keyword matches are worth more
          score += keyword.split(/\s+/).length * 2;
        }

        // Also check individual word matches
        const kwWords = keyword.toLowerCase().split(/\s+/);
        for (const kw of kwWords) {
          if (words.includes(kw)) {
            score += 1;
          }
        }
      }

      // Bonus for exact question match
      if (normalized === faq.question.toLowerCase().replace(/[?!.,]/g, '').trim()) {
        score += 20;
      }

      if (score > bestScore && score >= 2) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    return bestMatch;
  }

  /* ─── Helpers ────────────────────────────────────────── */
  function formatMessage(text) {
    // Convert \n to <br>
    return text.replace(/\n/g, '<br>');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function scrollToBottom() {
    const container = document.getElementById('chatbotMessages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  /* ─── Init ───────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildChatbot);
  } else {
    buildChatbot();
  }

})();
