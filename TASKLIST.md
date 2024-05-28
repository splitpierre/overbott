## TODO TASKS LIST

### ONGOING TASKS

- Implement preset system (save / manage / export / import / default)

## BACKLOG

### MISC

- Implement TTS/STT provider/workflow

### UI/UX

- Maybe have the drag area be the entire window (context window).
- Create a custom TextInput component that supports slash / (Selection/auto-complete). Also expandable like a text-area
  - /play [music] | /draw [image] | /search [browser] | /study [subject]
- Create a step-by-step guided setup (default preset formation, provider settings, model downloads...)

### PRESET OPTIONS

- Use Memory [boolean] (adds message history in context)
- Mode ['dark' | 'light']
- Search Engine
- Providers
  - LLM Service (OpenAI/Ollama) | TTS/STT
- Preferred Models for:
  - Text Generation | Vision over Image | Retrieval Augmented Generation
- Commands
  - Open Overlay | Open Main Window | Browse

### VOICE GUIDED SYSTEM

- Implement Wake-up word
- Design intents
  - chat_intent (User is simply asking a question)
    - Open Overlay Window > Sends the prompt
  - search_intent (User wants to browse for something)
    - Open Main Window / Maximize > Navigate to Browser > Search
  - rag_intent (User is asking some information about something on his computer)
    - rag_full_vision (User wants information on whats on his screen)
    - rag_vision_browser (User wants information on whats on his browser window)
    - rag_file (User wants information on a file on his computer)
    - rag_directory (User wants information on files in a directory)
  - play_intent (user is requesting to listen to something)
    - Open Main Window > Search/play the music on sidebar
