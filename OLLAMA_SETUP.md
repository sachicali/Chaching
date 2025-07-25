# Ollama Setup Guide - Free AI Alternative

Ollama provides completely free, local AI capabilities as a fallback when Google Gemini API quota is exceeded. Here's how to set it up:

## 🚀 Quick Setup

### 1. Install Ollama

**macOS (via Homebrew):**
```bash
brew install ollama
```

**Or download from:** https://ollama.ai/download

### 2. Start Ollama Server
```bash
ollama serve
```

### 3. Download a Lightweight Model
```bash
# Download fast 1B parameter model (recommended for development)
ollama pull llama3.2:1b

# Or try other models:
ollama pull phi3:mini        # 3.8B parameters, good balance
ollama pull mistral:7b       # 7B parameters, higher quality
```

### 4. Test the Setup
```bash
ollama run llama3.2:1b "Hello, how are you?"
```

If you see a response, Ollama is working! 🎉

## 🔧 Configuration

The Chaching app is already configured to:
- ✅ Try Google Gemini first
- ✅ Fall back to Ollama when quota exceeded
- ✅ Use mock data if neither is available

### Default Model: `llama3.2:1b`
- **Size:** ~1.3GB download
- **Speed:** Very fast on most hardware
- **Quality:** Good for financial analysis tasks

### Recommended Models by Use Case:

| Model | Size | Use Case |
|-------|------|----------|
| `llama3.2:1b` | 1.3GB | Fast development, low memory |
| `phi3:mini` | 2.3GB | Good balance of speed/quality |
| `mistral:7b` | 4.1GB | Higher quality analysis |

## 🎯 How It Works

1. **Normal Operation:** Chaching uses Google Gemini API
2. **Quota Exceeded:** Automatically switches to Ollama
3. **Ollama Unavailable:** Shows realistic mock data

Console logs will show which AI service is being used:
```
✅ Using Google Gemini for insights
⚠️  Google AI failed, trying Ollama fallback
🤖 Using Ollama for spending anomaly detection
📊 Showing fallback mock data
```

## 🔍 Troubleshooting

### Ollama Not Available?
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve
```

### Model Not Found?
```bash
# List downloaded models
ollama list

# Download the default model
ollama pull llama3.2:1b
```

### Memory Issues?
- Use `llama3.2:1b` (smallest model)
- Close other applications
- Ensure 4GB+ free RAM

## 🌟 Benefits

- **100% Free:** No API keys, quotas, or subscriptions
- **Privacy:** All data stays on your device
- **Offline:** Works without internet
- **Fast:** Local processing, no network delays
- **Reliable:** Always available fallback

## 🚀 Optional: Advanced Setup

### Custom Model Configuration
Edit `src/services/ollama-ai.service.ts`:
```typescript
// Use a different model
const ollamaAI = new OllamaAIService({ 
  model: 'phi3:mini' // or 'mistral:7b'
});
```

### GPU Acceleration
Ollama automatically uses GPU if available (NVIDIA/Metal).

---

**Need Help?** 
- Ollama Docs: https://ollama.ai/docs
- GitHub Issues: https://github.com/anthropics/claude-code/issues