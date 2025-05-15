export const mockModelProvider = [
  // {
  //   active: true,
  //   provider: 'llama.cpp',
  //   settings: [
  //     {
  //       key: 'cont_batching',
  //       title: 'Continuous Batching',
  //       description:
  //         'Allows processing prompts in parallel with text generation, which usually improves performance.',
  //       controller_type: 'checkbox',
  //       controller_props: {
  //         value: true,
  //       },
  //     },
  //     {
  //       key: 'n_parallel',
  //       title: 'Parallel Operations',
  //       description:
  //         'Number of prompts that can be processed simultaneously by the model.',
  //       controller_type: 'input',
  //       controller_props: {
  //         value: '4',
  //         placeholder: '4',
  //         type: 'number',
  //       },
  //     },
  //     {
  //       key: 'cpu_threads',
  //       title: 'CPU Threads',
  //       description:
  //         'Number of CPU cores used for model processing when running without GPU.',
  //       controller_type: 'input',
  //       controller_props: {
  //         value: '1',
  //         placeholder: '1',
  //         type: 'number',
  //       },
  //     },
  //     {
  //       key: 'flash_attn',
  //       title: 'Flash Attention',
  //       description:
  //         'Optimizes memory usage and speeds up model inference using an efficient attention implementation.',
  //       controller_type: 'checkbox',
  //       controller_props: {
  //         value: true,
  //       },
  //     },

  //     {
  //       key: 'caching_enabled',
  //       title: 'Caching',
  //       description:
  //         'Stores recent prompts and responses to improve speed when similar questions are asked.',
  //       controller_type: 'checkbox',
  //       controller_props: {
  //         value: true,
  //       },
  //     },
  //     {
  //       key: 'cache_type',
  //       title: 'KV Cache Type',
  //       description: 'Controls memory usage and precision trade-off.',
  //       controller_type: 'dropdown',
  //       controller_props: {
  //         value: 'f16',
  //         options: [
  //           {
  //             value: 'q4_0',
  //             name: 'q4_0',
  //           },
  //           {
  //             value: 'q8_0',
  //             name: 'q8_0',
  //           },
  //           {
  //             value: 'f16',
  //             name: 'f16',
  //           },
  //         ],
  //       },
  //     },
  //     {
  //       key: 'use_mmap',
  //       title: 'mmap',
  //       description:
  //         'Loads model files more efficiently by mapping them to memory, reducing RAM usage.',
  //       controller_type: 'checkbox',
  //       controller_props: {
  //         value: true,
  //       },
  //     },
  //   ],
  //   models: [
  //     {
  //       id: 'llama3.2:3b',
  //       model: 'llama3.2:3b',
  //       name: 'llama3.2:3b',
  //       capabilities: ['completion', 'tools'],
  //       version: 2,
  //       settings: {
  //         prompt_template:
  //           '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  //         ctx_len: 4096,
  //         n_parallel: 1,
  //         cpu_threads: 1,
  //         ngl: 29,
  //       },
  //     },
  //     {
  //       id: 'deepseek-r1.2:3b',
  //       model: 'deepseek-r1.2:3b',
  //       name: 'deepseek-r1.2:3b',
  //       capabilities: ['completion', 'tools'],
  //       version: 2,
  //       settings: {
  //         prompt_template:
  //           '<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n',
  //         ctx_len: 4096,
  //         n_parallel: 1,
  //         cpu_threads: 1,
  //         ngl: 29,
  //       },
  //     },
  //   ],
  // },
  {
    active: true,
    api_key: '',
    base_url: 'https://api.openai.com/v1',
    explore_models_url: 'https://platform.openai.com/docs/models',
    provider: 'openai',
    settings: [
      {
        key: 'api-key',
        title: 'API Key',
        description:
          "The OpenAI API uses API keys for authentication. Visit your [API Keys](https://platform.openai.com/account/api-keys) page to retrieve the API key you'll use in your requests.",
        controller_type: 'input',
        controller_props: {
          placeholder: 'Insert API Key',
          value: '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description:
          'The base endpoint to use. See the [OpenAI API documentation](https://platform.openai.com/docs/api-reference/chat/create) for more information.',
        controller_type: 'input',
        controller_props: {
          placeholder: 'https://api.openai.com/v1',
          value: 'https://api.openai.com/v1',
        },
      },
    ],
    models: [],
  },
  {
    active: true,
    api_key: '',
    base_url: 'https://api.anthropic.com/v1',
    provider: 'anthropic',
    explore_models_url:
      'https://docs.anthropic.com/en/docs/about-claude/models',
    settings: [
      {
        key: 'api-key',
        title: 'API Key',
        description:
          "The Anthropic API uses API keys for authentication. Visit your [API Keys](https://console.anthropic.com/settings/keys) page to retrieve the API key you'll use in your requests.",
        controller_type: 'input',
        controller_props: {
          placeholder: 'Insert API Key',
          value: '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description:
          'The base endpoint to use. See the [Anthropic API documentation](https://docs.anthropic.com/en/api/messages) for more information.',
        controller_type: 'input',
        controller_props: {
          placeholder: 'https://api.anthropic.com/v1',
          value: 'https://api.anthropic.com/v1',
        },
      },
    ],
    models: [],
  },
  {
    active: true,
    api_key: '',
    base_url: 'https://api.cohere.ai/compatibility/v1',
    explore_models_url: 'https://docs.cohere.com/v2/docs/models',
    provider: 'cohere',
    settings: [
      {
        key: 'api-key',
        title: 'API Key',
        description:
          "The Cohere API uses API keys for authentication. Visit your [API Keys](https://dashboard.cohere.com/api-keys) page to retrieve the API key you'll use in your requests.",
        controller_type: 'input',
        controller_props: {
          placeholder: 'Insert API Key',
          value: '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description:
          'The base OpenAI-compatible endpoint to use. See the [Cohere documentation](https://docs.cohere.com/docs/compatibility-api) for more information.',
        controller_type: 'input',
        controller_props: {
          placeholder: 'https://api.cohere.ai/compatibility/v1',
          value: 'https://api.cohere.ai/compatibility/v1',
        },
      },
    ],
    models: [],
  },
  {
    active: true,
    api_key: '',
    base_url: 'https://openrouter.ai/api/v1',
    explore_models_url: 'https://openrouter.ai/models',
    provider: 'openrouter',
    settings: [
      {
        key: 'api-key',
        title: 'API Key',
        description:
          "The OpenRouter API uses API keys for authentication. Visit your [API Keys](https://openrouter.ai/settings/keys) page to retrieve the API key you'll use in your requests.",
        controller_type: 'input',
        controller_props: {
          placeholder: 'Insert API Key',
          value: '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description:
          'The base endpoint to use. See the [OpenRouter API documentation](https://openrouter.ai/docs/api-reference/overview) for more information.',
        controller_type: 'input',
        controller_props: {
          placeholder: 'https://openrouter.ai/api/v1',
          value: 'https://openrouter.ai/api/v1',
        },
      },
    ],
    models: [
      {
        id: 'deepseek/deepseek-r1:free',
        name: 'DeepSeek-R1 (free)',
        version: '1.0',
        description: '',
        capabilities: ['completion'],
      },
      {
        id: 'qwen/qwen3-30b-a3b:free',
        name: 'Qwen3 30B A3B (free)',
        version: '1.0',
        description: '',
        capabilities: ['completion'],
      },
    ],
  },
  {
    active: true,
    api_key: '',
    base_url: 'https://api.mistral.ai/v1',
    explore_models_url:
      'https://docs.mistral.ai/getting-started/models/models_overview/',
    provider: 'mistral',
    settings: [
      {
        key: 'api-key',
        title: 'API Key',
        description:
          "The Mistral API uses API keys for authentication. Visit your [API Keys](https://console.mistral.ai/api-keys/) page to retrieve the API key you'll use in your requests.",
        controller_type: 'input',
        controller_props: {
          placeholder: 'Insert API Key',
          value: '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description:
          'The base endpoint to use. See the [Mistral documentation](https://docs.mistral.ai/getting-started/models/models_overview/) for more information.',
        controller_type: 'input',
        controller_props: {
          placeholder: 'https://api.mistral.ai/v1',
          value: 'https://api.mistral.ai/v1',
        },
      },
    ],
    models: [],
  },
  {
    active: true,
    api_key: '',
    base_url: 'https://api.groq.com/openai/v1',
    explore_models_url: 'https://console.groq.com/docs/models',
    provider: 'groq',
    settings: [
      {
        key: 'api-key',
        title: 'API Key',
        description:
          "The Groq API uses API keys for authentication. Visit your [API Keys](https://console.groq.com/keys) page to retrieve the API key you'll use in your requests.",
        controller_type: 'input',
        controller_props: {
          placeholder: 'Insert API Key',
          value: '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description:
          'The base OpenAI-compatible endpoint to use. See the [Groq documentation](https://console.groq.com/docs) for more information.',
        controller_type: 'input',
        controller_props: {
          placeholder: 'https://api.groq.com/openai/v1',
          value: 'https://api.groq.com/openai/v1',
        },
      },
    ],
    models: [],
  },
  {
    active: true,
    api_key: '',
    base_url: 'https://generativelanguage.googleapis.com/v1beta/openai',
    explore_models_url: 'https://ai.google.dev/gemini-api/docs/models/gemini',
    provider: 'gemini',
    settings: [
      {
        key: 'api-key',
        title: 'API Key',
        description:
          "The Google API uses API keys for authentication. Visit your [API Keys](https://aistudio.google.com/apikey) page to retrieve the API key you'll use in your requests.",
        controller_type: 'input',
        controller_props: {
          placeholder: 'Insert API Key',
          value: '',
          type: 'password',
          input_actions: ['unobscure', 'copy'],
        },
      },
      {
        key: 'base-url',
        title: 'Base URL',
        description:
          'The base OpenAI-compatible endpoint to use. See the [Gemini documentation](https://ai.google.dev/gemini-api/docs/openai) for more information.',
        controller_type: 'input',
        controller_props: {
          placeholder:
            'https://generativelanguage.googleapis.com/v1beta/openai',
          value: 'https://generativelanguage.googleapis.com/v1beta/openai',
        },
      },
    ],
    models: [],
  },
  // {
  //   active: true,
  //   api_key: '',
  //   base_url: 'https://api.deepseek.com',
  //   explore_models_url: 'https://api-docs.deepseek.com/quick_start/pricing',
  //   provider: 'deepseek',
  //   settings: [
  //     {
  //       key: 'api-key',
  //       title: 'API Key',
  //       description:
  //         "The DeepSeek API uses API keys for authentication. Visit your [API Keys](https://platform.deepseek.com/api_keys) page to retrieve the API key you'll use in your requests.",
  //       controller_type: 'input',
  //       controller_props: {
  //         placeholder: 'Insert API Key',
  //         value: '',
  //         type: 'password',
  //         input_actions: ['unobscure', 'copy'],
  //       },
  //     },
  //     {
  //       key: 'base-url',
  //       title: 'Base URL',
  //       description:
  //         'The base endpoint to use. See the [DeepSeek documentation](https://api-docs.deepseek.com/) for more information.',
  //       controller_type: 'input',
  //       controller_props: {
  //         placeholder: 'https://api.deepseek.com',
  //         value: 'https://api.deepseek.com',
  //       },
  //     },
  //   ],
  //   models: [
  //     {
  //       id: 'deepseek-chat',
  //       name: 'DeepSeek-V3',
  //       version: '1.0',
  //       description:
  //         'The deepseek-chat model has been upgraded to DeepSeek-V3. deepseek-reasoner points to the new model DeepSeek-R1',
  //       capabilities: ['completion'],
  //     },
  //     {
  //       id: 'deepseek-reasoner',
  //       name: 'DeepSeek-R1',
  //       version: '1.0',
  //       description:
  //         'CoT (Chain of Thought) is the reasoning content deepseek-reasoner gives before output the final answer. For details, please refer to Reasoning Model.',
  //       capabilities: ['completion'],
  //     },
  //   ],
  // },
]

export const mockTheads = [
  {
    id: '1',
    title: 'Ultimate Markdown Demonstration',
    isFavorite: false,
    content: [
      {
        role: 'user',
        type: 'text',
        text: {
          value: 'Dow u know Ultimate Markdown Demonstration',
          annotations: [],
        },
      },
      {
        type: 'text',
        role: 'system',
        text: {
          value:
            '# :books: Ultimate Markdown Demonstration\n\nWelcome to the **Ultimate Markdown Demo**! This document covers a wide range of Markdown features.\n\n---\n\n## 1. Headings\n\n# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n\n---\n\n## 2. Text Formatting\n\n- **Bold**\n- *Italic*\n- ***Bold & Italic***\n- ~~Strikethrough~~\n\n> "Markdown is _awesome_!" — *Someone Famous*\n\n---\n\n## 3. Lists\n\n### 3.1. Unordered List\n\n- Item One\n  - Subitem A\n  - Subitem B\n    - Sub-Subitem i\n\n### 3.2. Ordered List\n\n1. First\n2. Second\n    1. Second-First\n    2. Second-Second\n3. Third\n\n---\n\n## 4. Links and Images\n\n- [Visit OpenAI](https://openai.com)\n- Inline Image:\n\n  ![Markdown Logo](https://jan.ai/assets/images/general/logo-mark.svg)\n\n- Linked Image:\n\n  [![Markdown Badge](https://img.shields.io/badge/Markdown-Ready-blue)](https://commonmark.org)\n\n---\n\n## 5. Code\n\n### 5.1. Inline Code\n\nUse the `print()` function in Python.\n\n### 5.2. Code Block\n\n```python\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Markdown"))\n```\n\n### 5.3. Syntax Highlighting (JavaScript)\n\n```javascript\nconst add = (a, b) => a + b;\nconsole.log(add(5, 3));\n```\n\n---\n\n## 6. Tables\n\n| Syntax | Description | Example |\n|--------|-------------|--------|\n| Header | Title       | Here\'s this |\n| Paragraph | Text | And more text |\n\n---\n\n## 7. Blockquotes\n\n> "A blockquote can be used to highlight information or quotes."\n\nNested Blockquote:\n\nLevel 1\n>Level 2\nLevel 3\n\n---\n\n## 8. Task Lists\n\n- [x] Write Markdown\n- [x] Check the output\n- [ ] Celebrate\n\n---\n\n## 9. Footnotes\n\nHere is a simple footnote[^1].\n\n[^1]: This is the footnote explanation.\n\n---\n\n## 10. Horizontal Rules\n\n---\n\n## 11. Emojis\n\n:tada: :sunglasses: :potable_water: :books:\n\n---\n\n## 12. Math (Using LaTeX)\n\nInline math: \\( E = mc^2 \\)\n\nBlock math:\n\n$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$\n\n---\n\n## 13. HTML in Markdown\n\nSometimes you need raw HTML:\n\n<div style="color:blue; font-weight:bold;">This is blue bold text using HTML inside Markdown!</div>\n\n---\n\n# :dart: That\'s a Wrap!\n\nCongratulations, you\'ve seen nearly every feature Markdown supports!',
          annotations: [],
        },
      },
    ],
    model: {
      id: 'gpt-4o',
      provider: 'openai',
    },
  },
  {
    id: '2',
    title: 'Modern JavaScript: A Comprehensive Guide',
    isFavorite: false,
    content: [
      {
        role: 'user',
        type: 'text',
        text: {
          value: 'Explain modern JavaScript',
          annotations: [],
        },
      },
      {
        type: 'text',
        role: 'system',
        text: {
          value:
            "# Modern JavaScript: A Comprehensive Guide\n\nThis guide covers essential concepts and features of modern JavaScript that every developer should know.\n\n## ES6+ Features\n\n### Arrow Functions\n\nArrow functions provide a concise syntax for writing functions and lexically bind the `this` value.\n\n```javascript\n// Traditional function\nfunction add(a, b) {\n  return a + b;\n}\n\n// Arrow function\nconst add = (a, b) => a + b;\n\n// With implicit return\nconst numbers = [1, 2, 3, 4];\nconst doubled = numbers.map(n => n * 2); // [2, 4, 6, 8]\n```\n\n### Destructuring\n\nDestructuring allows you to extract values from arrays or properties from objects into distinct variables.\n\n```javascript\n// Array destructuring\nconst [first, second, ...rest] = [1, 2, 3, 4, 5];\nconsole.log(first); // 1\nconsole.log(second); // 2\nconsole.log(rest); // [3, 4, 5]\n\n// Object destructuring\nconst person = { name: 'John', age: 30, city: 'New York' };\nconst { name, age, city: location } = person;\nconsole.log(name); // 'John'\nconsole.log(age); // 30\nconsole.log(location); // 'New York'\n```\n\n### Spread and Rest Operators\n\nThe spread operator (`...`) allows an iterable to be expanded in places where zero or more arguments or elements are expected.\n\n```javascript\n// Spread with arrays\nconst arr1 = [1, 2, 3];\nconst arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]\n\n// Spread with objects\nconst obj1 = { a: 1, b: 2 };\nconst obj2 = { ...obj1, c: 3 }; // { a: 1, b: 2, c: 3 }\n\n// Rest parameter\nfunction sum(...numbers) {\n  return numbers.reduce((total, num) => total + num, 0);\n}\nconsole.log(sum(1, 2, 3, 4)); // 10\n```\n\n## Asynchronous JavaScript\n\n### Promises\n\nPromises represent the eventual completion (or failure) of an asynchronous operation and its resulting value.\n\n```javascript\nconst fetchData = () => {\n  return new Promise((resolve, reject) => {\n    // Simulating an API call\n    setTimeout(() => {\n      const data = { id: 1, name: 'User' };\n      if (data) {\n        resolve(data);\n      } else {\n        reject('Error fetching data');\n      }\n    }, 1000);\n  });\n};\n\nfetchData()\n  .then(data => console.log(data))\n  .catch(error => console.error(error));\n```\n\n### Async/Await\n\nAsync/await is syntactic sugar built on top of promises, making asynchronous code look and behave more like synchronous code.\n\n```javascript\nconst fetchUser = async (id) => {\n  try {\n    const response = await fetch(`https://api.example.com/users/${id}`);\n    if (!response.ok) throw new Error('Network response was not ok');\n    const user = await response.json();\n    return user;\n  } catch (error) {\n    console.error('Error fetching user:', error);\n    throw error;\n  }\n};\n\n// Using the async function\n(async () => {\n  try {\n    const user = await fetchUser(1);\n    console.log(user);\n  } catch (error) {\n    console.error(error);\n  }\n})();\n```\n\n## Modern JavaScript Patterns\n\n### Module Pattern\n\nES modules provide a way to organize and structure code in separate files.\n\n```javascript\n// math.js\nexport const add = (a, b) => a + b;\nexport const subtract = (a, b) => a - b;\n\n// main.js\nimport { add, subtract } from './math.js';\nconsole.log(add(5, 3)); // 8\n```\n\n### Optional Chaining\n\nOptional chaining (`?.`) allows reading the value of a property located deep within a chain of connected objects without having to check if each reference in the chain is valid.\n\n```javascript\nconst user = {\n  name: 'John',\n  address: {\n    street: '123 Main St',\n    city: 'New York'\n  }\n};\n\n// Without optional chaining\nconst city = user && user.address && user.address.city;\n\n// With optional chaining\nconst city = user?.address?.city;\n```\n\n## Conclusion\n\nModern JavaScript has evolved significantly with ES6+ features, making code more concise, readable, and maintainable. Understanding these concepts is essential for any JavaScript developer working on modern web applications.",
          annotations: [],
        },
      },
    ],
    model: {
      id: 'llama3.2:3b',
      provider: 'llama.cpp',
    },
  },
  {
    id: '3',
    title: 'Reasoning and Tools',
    isFavorite: false,
    content: [
      {
        completed_at: 1746419535.019,
        role: 'user',
        text: {
          annotations: [],
          value: 'Ask question from user',
        },
        type: 'text',
        created_at: 1746419535.019,
        id: '01JTFBEK5BBZ9Y63275WDKRF6D',
        metadata: {},
      },
      {
        completed_at: 1746419535.019,
        role: 'assistant',
        text: {
          annotations: [],
          value: "I'll read the README.md file using the `read_file` function.",
        },
        type: 'text',
        created_at: 1746419535.019,
        id: '01JTFBEK5BBZ9Y63275WDKRF6D',
        metadata: {
          token_speed: 3.5555555555555554,
          tool_calls: [
            {
              response: {
                content: [{ text: '# Jan - Local AI Assistant', type: 'text' }],
              },
              state: 'ready',
              tool: {
                function: {
                  arguments:
                    '{"path": "/Users/louis/Repositories/jan/README.md"}',
                  name: 'read_file',
                },
                id: '01JTFBEN8ZXNM9KB2CM9AY9ZBM',
                type: 'function',
              },
            },
          ],
        },
      },
    ],
    model: {
      id: 'llama3.2:3b',
      provider: 'llama.cpp',
    },
  },
]
