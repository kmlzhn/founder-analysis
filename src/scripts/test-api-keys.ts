// Скрипт для проверки API ключей Perplexity и Claude

import { callPerplexity } from '../utils/perplexity';
import { callClaude } from '../utils/claude';
import 'dotenv/config';

// Ключи берутся из переменных окружения (.env.local)

async function testPerplexityAPI() {
  console.log('Тестирование Perplexity API...');
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      console.error('PERPLEXITY_API_KEY не установлен');
      return false;
    }
    const messages = [
      { role: 'user' as const, content: 'Привет, мир!' }
    ];
    
    const response = await callPerplexity(messages, {
      model: 'sonar-pro',
      max_tokens: 100
    });
    
    console.log('Perplexity API работает!');
    console.log('Ответ:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('Ошибка при вызове Perplexity API:', error);
    return false;
  }
}

async function testClaudeAPI() {
  console.log('Тестирование Claude API...');
  try {
    if (!process.env.CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY не установлен');
      return false;
    }
    const messages = [
      { role: 'user' as const, content: 'Привет, мир!' }
    ];
    
    const response = await callClaude(messages, {
      system: 'Ты помощник, который отвечает кратко.',
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 100
    });
    
    console.log('Claude API работает!');
    console.log('Ответ:', response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('Ошибка при вызове Claude API:', error);
    return false;
  }
}

async function runTests() {
  console.log('=== Начало тестирования API ключей ===\n');
  
  const perplexityResult = await testPerplexityAPI();
  console.log('\n---\n');
  const claudeResult = await testClaudeAPI();
  
  console.log('\n=== Результаты тестирования ===');
  console.log('Perplexity API:', perplexityResult ? '✅ Работает' : '❌ Не работает');
  console.log('Claude API:', claudeResult ? '✅ Работает' : '❌ Не работает');
}

runTests().catch(console.error);
