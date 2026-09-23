const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    envLines.forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        process.env[key] = value;
      }
    });
  }
} catch (e) {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://izjpavrrcbglrdvrqeng.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mwuzxPcr8pPb6-SmURgBoA_NRqL0jna';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map of expanded descriptions (> 220 words each) for seed tools
const expandedDescriptions = {
  "zoice": `Zoice is an advanced, all-in-one AI-powered video creation and AI voice generator platform tailored specifically for content creators, e-commerce dropshippers, digital marketers, and video agencies. By eliminating the high costs, technical complexities, and time-consuming workflows associated with traditional video production, Zoice empowers users to transform simple text scripts or product links into high-converting, studio-grade video commercials in just a few clicks.

At the core of Zoice is its cutting-edge video generation engine integrated with ultra-realistic AI voice avatars, lifelike text-to-speech synthesis, and dynamic automated subtitle generation. E-commerce entrepreneurs can quickly upload product URLs or descriptions to generate high-performing video ads optimized for TikTok, Instagram Reels, YouTube Shorts, and Facebook Ads. The platform automatically selects relevant stock footage, applies cinematic visual transitions, overlays eye-catching captions, and synchronizes natural-sounding voiceovers in over 30 global languages.

Beyond social ad production, Zoice serves as an essential automation engine for faceless YouTube creators and digital agencies. Its intuitive interface features multi-track editing, customizable branding templates, customizable voice speed and emotion controls, and instant aspect-ratio formatting (vertical 9:16, landscape 16:9, and square 1:1). Whether you are scaling an online dropshipping store, promoting digital services, or publishing daily viral shorts, Zoice delivers a seamless, high-speed solution to produce professional video content at scale without hiring expensive video editors or voice actors.`,

  "wispr-flow": `Wispr Flow is an state-of-the-art AI dictation and voice productivity engine designed to transform spoken thoughts into perfectly formatted, publication-ready prose across your entire computer. Built specifically for macOS and modern desktop workflows, Wispr Flow integrates deeply with all applications—including email clients, code editors, Slack, Notion, web browsers, and word processors—allowing professionals to communicate up to three times faster than traditional typing.

Unlike standard voice-to-text dictation software that produces verbatim transcripts filled with filler words, stutters, and awkward phrasing, Wispr Flow utilizes advanced context-aware natural language processing. It automatically removes speech artifacts like "um," "ah," and repeated phrases while instantly structuring spoken input into bulleted lists, polished emails, or clean code comments according to the active window context. Users can speak naturally at conversational speed and watch their words format instantaneously in real time.

Furthermore, Wispr Flow offers multi-language support, custom domain vocabulary mapping, and background noise suppression for effortless dictation in noisy environments. Developers, executives, researchers, and writers rely on Wispr Flow to eliminate typing fatigue, capture ideas at the speed of thought, and boost overall daily output without interrupting creative flow.`,

  "ideogram-ai": `Ideogram AI is a pioneer in text-to-image generative modeling, renowned for its unmatched ability to render clean, legible, and typographically accurate text directly within AI-generated images. Designed for graphic designers, brand marketers, digital artists, and typography enthusiasts, Ideogram solves one of the biggest challenges in generative AI by accurately blending complex text strings into posters, logos, T-shirt designs, social media graphics, and digital artwork.

With the launch of Ideogram 2.0, the platform delivers photorealistic rendering, enhanced prompt adherence, and granular artistic style controls. Users can choose from specialized creative styles—such as Typography, Realistic, Design, 3D, and Anime—to achieve precise visual aesthetics tailored to their project requirements. Ideogram's advanced color palette controls allow creators to maintain strict brand color consistency across all generated visual assets.

In addition to image creation, Ideogram features an active community platform where creators can explore trending prompts, remix existing designs, and discover inspiration for commercial campaigns. Whether you need custom typography for event posters, branded merchandise graphics, or eye-catching editorial illustrations, Ideogram AI provides an intuitive web interface and powerful API endpoint to generate high-resolution, typography-rich imagery effortlessly.`,

  "radarkit-ai": `RadarKit AI is an intelligent ad tracking, competitor intelligence, and marketing analytics platform engineered for e-commerce store owners, media buyers, and digital agencies. In today's hyper-competitive advertising ecosystem, finding winning ad creative and monitoring market trends before competitors is critical. RadarKit AI automates the continuous collection and analysis of thousands of active digital ad campaigns across Facebook, TikTok, Instagram, and Google Ads.

By leveraging machine learning algorithms, RadarKit AI identifies viral ad creatives, high-converting copy structures, engagement metrics, and winning audience hooks in real time. Marketers can search through competitor ad libraries, analyze video duration and thumbnail strategies, and receive instant alerts when competitor campaigns scale aggressively. This data-driven approach removes guesswork from media buying and enables brands to model proven ad concepts quickly.

Additionally, RadarKit AI features an AI-assisted creative generator that analyzes high-performing ads to produce tailored ad scripts, headlines, and call-to-action variants tailored to specific e-commerce niches. Whether you are running Shopify dropshipping campaigns or managing agency client ad budgets, RadarKit AI equips marketing teams with the strategic insights required to maximize Return on Ad Spend (ROAS) and scale profitable advertising campaigns.`,

  "chatgpt": `ChatGPT is OpenAI's flagship conversational artificial intelligence assistant, built upon advanced large language models including GPT-4o and specialized reasoning architectures. As a global leader in generative AI, ChatGPT provides millions of users worldwide with instant answers, writing assistance, programming support, complex problem-solving, and creative brainstorming capabilities through an intuitive chat interface.

The platform excels at a diverse range of tasks, from drafting long-form essays, emails, and business reports to analyzing uploaded documents, debugging code, and processing complex datasets. With features such as Advanced Voice Mode, real-time web browsing synthesis, custom GPT creation, and DALL-E 3 image generation integrated directly into the workspace, ChatGPT serves as an all-in-one digital assistant for students, developers, researchers, and enterprise teams.

ChatGPT offers tailored subscription tiers—including ChatGPT Plus, Team, and Enterprise—delivering higher usage caps, faster response speeds, enhanced data privacy guarantees, and early access to experimental OpenAI models. Whether utilized for daily productivity, software development pair programming, language translation, or strategic decision-making, ChatGPT remains an indispensable tool driving the modern artificial intelligence revolution.`,

  "midjourney": `Midjourney is an industry-leading generative artificial intelligence program celebrated worldwide for producing hyper-realistic, photorealistic, and visually stunning digital artwork from textual descriptions. Operating via Discord and an advanced dedicated web platform, Midjourney is widely used by concept artists, game designers, fashion directors, digital marketers, and creative enthusiasts seeking unparalleled visual quality and aesthetic finesse.

The platform offers a deep suite of creative controls, allowing users to fine-tune image resolution, aspect ratios (--ar), camera angles, lighting conditions, and artistic stylization (--stylize). Features such as Style Reference (--sref), Character Consistency (--cref), inpainting (Vary Region), and outpainting (Pan and Zoom) provide creators with granular control over generated compositions, ensuring visual continuity across multi-image campaigns and storyboards.

With the release of Midjourney v6 and v6.1, the engine delivers enhanced prompt comprehension, realistic text rendering within scenes, micro-texture details, and lifelike human features. From creating cinematic concept art and high-fashion editorial imagery to designing website backgrounds and product prototypes, Midjourney sets the gold standard for text-to-image generative synthesis.`,

  "synthesia": `Synthesia is the market-leading enterprise AI video generation platform that enables organizations to turn plain text scripts into professional, studio-quality videos in over 140 languages without cameras, microphones, or actors. Founded by researchers from UCL, Stanford, TUM, and Cambridge, Synthesia streamlines video production workflows for corporate training, customer support, sales enablement, and localized marketing.

The platform provides access to over 230 diverse, hyper-realistic AI avatars created from real human actors, as well as the capability to generate custom personal AI avatars in minutes. Users simply type or paste their video script, select an avatar and voiceover accent, customize the canvas with brand colors, logos, and screen recordings, and generate high-definition MP4 videos automatically.

Synthesia's enterprise-grade features include seamless LMS integration, multi-user workspace collaboration, SOC 2 compliance, and automated video translation. Companies can easily update existing video content in real time by editing text scripts rather than re-shooting footage, reducing video production costs by up to 80% while dramatically accelerating content localization speed globally.`,

  "cursor": `Cursor is an AI-first integrated development environment (IDE) built as a fork of Visual Studio Code, designed to maximize software developer velocity through deep machine learning integration. By combining familiar VS Code extensions and settings with powerful local codebase indexing, Cursor enables software engineers to write, refactor, debug, and understand complex codebases at unprecedented speed.

Key features of Cursor include Command-K inline editing for instant code transformations, Cmd-I Agent mode for multi-file codebase updates, and an intelligent chat assistant that references your full codebase context. Developers can ask complex architectural questions, request automated bug fixes, or generate full component boilerplates while maintaining precise git version control and type safety.

Cursor supports top AI reasoning models including Claude 3.5 Sonnet, GPT-4o, and custom fine-tuned code completion models. Operating seamlessly across Windows, macOS, and Linux, Cursor offers custom privacy controls guaranteeing that user code remains confidential. For individual developers and engineering teams striving for hyper-productive coding workflows, Cursor represents the future of AI pair programming.`,

  "jasper": `Jasper is an enterprise-grade AI marketing platform built to help brand marketing teams, copywriters, and agencies generate high-performing, brand-aligned content at scale. Unlike general-purpose AI chat assistants, Jasper is specifically trained on high-converting marketing frameworks, direct response copy, and enterprise brand voice guidelines to deliver consistent, polished marketing assets.

The platform features an extensive library of over 50 marketing templates—including long-form blog post generators, Facebook & Google ad copy creators, email newsletter drafters, and product description builders. Jasper’s Brand Voice technology scans your company's existing content to learn your brand's unique tone, vocabulary, and style guidelines, ensuring that every piece of generated content matches your brand identity perfectly.

Integrated with Surfer SEO for real-time keyword optimization and Grammarly for grammar perfection, Jasper enables marketing teams to accelerate campaign launches by up to ten times. With features like team collaboration workspaces, AI image generation, and a powerful browser extension, Jasper empowers marketers to scale content production across every marketing channel effortlessly.`,

  "julius-ai": `Julius AI is an intelligent data analyst and computational assistant designed to help business professionals, researchers, students, and financial analysts interpret complex datasets using natural language commands. By connecting directly to Excel spreadsheets, CSV files, Google Sheets, PostgreSQL databases, and PDF documents, Julius AI automates data cleaning, statistical modeling, charting, and report generation.

Users can upload structured data files and ask questions in plain English—such as "Graph our monthly revenue growth over the past two years" or "Build a predictive sales forecast model." Julius AI executes real-time Python and R data analysis scripts behind the scenes, outputting interactive publication-grade charts, regression analysis tables, and executive summary summaries instantly.

The platform supports advanced data processing capabilities, including cohort analysis, sentiment classification, missing value imputation, and financial modeling. With robust export options to Python notebooks, PDF summaries, and interactive web dashboards, Julius AI acts as a 24/7 personal data scientist that turns raw numbers into actionable business insights.`,

  "elevenlabs": `ElevenLabs is the industry-standard AI voice research company and software platform delivering state-of-the-art text-to-speech synthesis, voice cloning, and audio dubbing capabilities. Engineered with deep neural network architectures, ElevenLabs generates human-like speech with unmatched emotional depth, intonation control, natural pacing, and contextual awareness across 30+ languages.

The platform's flagship feature set includes the Voice Library—a massive repository of community-contributed AI voices—and instant Voice Cloning, which creates a precise digital clone of any speaker from just a few seconds of clean audio reference. Content creators, audiobook publishers, game developers, and filmmakers utilize ElevenLabs to produce immersive voiceovers, dynamic NPC dialog, and localized foreign audio tracks.

Additionally, ElevenLabs provides AI Dubbing to translate video and audio content automatically while preserving the original speaker's unique voice characteristics and inflection. With flexible API access, granular latency controls, and enterprise-grade voice security protocols, ElevenLabs leads the global market in realistic AI voice generation.`,

  "phind": `Phind is an AI-powered search engine and pair programmer optimized specifically for developers, software engineers, and technical researchers. Built to answer complex technical questions with precision, Phind searches the web in real time, ingests documentation, scans Stack Overflow threads, and synthesizes clear, working code solutions accompanied by step-by-step explanations.

Unlike generic search engines or standard AI chat interfaces, Phind prioritizes code correctness and current software library syntax. Developers can input complex compiler error stack traces, request full code implementations, or ask for library migration guides. Phind's proprietary models evaluate multiple online code sources, generate fully formatted code blocks, and cite authoritative documentation links for verification.

Phind offers an interactive VS Code extension that brings its search and pair-programming capabilities directly into the code editor. With features such as codebase context inclusion, customized search filters, and fast response times, Phind helps software developers overcome technical blockers and ship code faster.`,

  "gen-z-translator": `Gen Z Translator is an intuitive, fun, and highly practical AI-powered language tool designed to bridge the generational communication gap by translating standard English text into modern internet slang, Gen Z vernacular, and trending social media phrasing—and vice versa. Perfect for digital marketers, copywriters, social media managers, and parents, this tool decodes the rapidly evolving language of online culture.

By analyzing popular terms across TikTok, Instagram, Discord, and X (formerly Twitter)—such as "no cap," "skibidi," "rizz," "main character energy," and "bet"—the translator generates authentic conversational copy tailored for youth-oriented campaigns. Marketers can input traditional promotional text and instantly receive relatable social media captions, ad hooks, and newsletter copy designed to boost engagement among younger demographics.

Conversely, the tool features a reverse translation mode that decodes complex youth slang into clear, formal English. Whether you are crafting viral social media posts, analyzing youth cultural trends, or simply trying to understand online meme conversations, Gen Z Translator delivers accurate, culturally relevant text translations effortlessly.`,

  "lynote": `Lynote is an AI-powered research, note-taking, and knowledge management application engineered to capture, organize, and synthesize information effortlessly. Designed for students, academic researchers, journalists, and knowledge workers, Lynote transforms fragmented notes, meeting recordings, PDFs, and web articles into a structured, searchable personal knowledge graph.

The application automatically records and transcribes audio notes, highlights key thematic points, extracts action items, and generates concise summaries. Featuring semantic search and instant document Q&A, users can converse directly with their research library, asking natural language questions to recall specific quotes, statistical data, or meeting decisions without manual browsing.

Lynote seamlessly synchronizes across desktop and mobile devices, offering offline support, markdown formatting, export capabilities to Notion and Obsidian, and collaborative workspace sharing. By removing manual note organization and summarizing complex research documents, Lynote empowers professionals to focus on high-level analysis and deep creative work.`,

  "anirole-ai": `Anirole AI is an immersive conversational AI platform and creative character studio specialized in anime roleplay, interactive storytelling, and virtual companion experiences. Designed for anime fans, fiction writers, and roleplay enthusiasts, Anirole AI allows users to chat with thousands of pre-created anime personas or craft custom AI characters with detailed backstories, unique dialogue styles, and visual avatars.

The platform utilizes fine-tuned language models optimized for narrative depth, emotional expression, and long-term memory retention. Users can embark on rich text-based roleplay quests, engage in casual daily conversations, or co-author interactive light novels. Custom character creation tools enable users to define specific personality traits, scenario settings, initial greeting messages, and visual artwork styles.

Anirole AI prioritizes user privacy and customization, offering private chat rooms, custom scenario builders, and multi-character group chat modes. Whether you want to practice creative dialogue writing, explore fantasy worlds, or design your dream anime companion, Anirole AI offers a dynamic and entertaining roleplay environment.`,

  "pixaryai": `PixaryAI is a versatile AI photo generator, digital portrait studio, and image editing application engineered to transform ordinary photos into high-definition digital artwork, artistic avatars, and stylized visual graphics. Created for social media influencers, digital creators, and photography enthusiasts, PixaryAI turns text prompts and uploaded photos into striking visual compositions.

The platform features a wide range of artistic styles—including hyper-realistic photography, 3D digital art, anime aesthetic, vintage oil paintings, cyberpunk illustration, and cinematic concept art. Users can upload selfie portraits to generate professional headshots, stylized social media avatars, or creative digital portraits in seconds.

Equipped with smart enhancement features such as resolution upscaling, background replacement, facial retouching, and style transfer, PixaryAI provides an easy-to-use visual editing workspace. Whether creating personal profile pictures, visual content for marketing campaigns, or unique digital art prints, PixaryAI makes professional visual creation accessible to everyone.`,

  "joyfun-ai": `JoyFun AI is an entertaining AI character chat and interactive entertainment application designed to deliver creative storytelling, virtual companions, and fun conversational experiences. Combining natural language generation with expressive visual avatar creation, JoyFun AI provides a space for creative roleplay and digital social interaction.

Users can choose from a growing directory of AI personas—ranging from historical figures and fictional heroes to pop culture icons and custom digital friends. The platform features dynamic story branching, allowing users to influence plot progression through their dialogue choices and create customized adventure narratives.

JoyFun AI offers intuitive customization tools that allow users to design personal AI companions by selecting personality archetypes, tone of voice, visual appearances, and backstory parameters. Available on web and mobile devices, JoyFun AI offers continuous digital entertainment and interactive narrative companionship.`,

  "findtube-ai": `Findtube.AI is an intelligent video research assistant and search engine designed to index, analyze, and extract key information from millions of YouTube video transcripts in real time. Built for researchers, students, video editors, and podcast listeners, Findtube.AI eliminates the tedious process of scrubbing through long videos to find specific quotes or tutorial steps.

Users simply input a search phrase, topic, or YouTube URL, and Findtube.AI automatically scans video audio tracks to pinpoint exact timestamped occurrences. The platform synthesizes comprehensive video summaries, extracts key bullet points, generates searchable transcripts, and provides direct video player links that jump straight to relevant content sections.

Findtube.AI also features interactive video Q&A, allowing users to chat directly with any YouTube video to ask clarifying questions, request code snippets from coding tutorials, or summarize long lecture videos. By turning video content into structured textual knowledge, Findtube.AI accelerates learning and research efficiency dramatically.`,

  "fixart-ai": `FixArt AI is an advanced AI video enhancement, frame restoration, and visual quality optimization tool created for videographers, content creators, film archivists, and social media producers. Utilizing state-of-the-art deep learning algorithms, FixArt AI upgrades low-resolution footage into crisp 4K visual quality while eliminating visual noise, blur, and encoding artifacts.

Key features include AI video frame interpolation (converting 24fps/30fps videos into smooth 60fps slow motion), video sharpening, facial detail reconstruction, and color restoration. The platform's automated video stabilization and de-noising engines restore degraded vintage footage or low-light smartphone recordings into professional visual media.

Designed with a user-friendly interface, FixArt AI supports batch video processing, custom export codecs, and fast cloud rendering. Whether you are remastering historical video archives, optimizing video clips for high-definition displays, or enhancing social media video edits, FixArt AI delivers professional visual restoration.`,

  "moxt": `Moxt is an AI-powered business workflow automation, project tracking, and operations intelligence platform designed to streamline corporate task management and operational productivity. Built for modern hybrid teams, startups, and enterprise operations managers, Moxt integrates with existing software stacks to automate repetitive administrative workflows and provide real-time operational insights.

The platform utilizes intelligent agent workflows to auto-assign project tasks, summarize daily team progress, flag workflow bottlenecks, and generate executive status reports based on communication logs across Slack, Jira, email, and CRM tools. Users can create custom automated triggers using natural language prompts without writing complex code scripts.

Moxt provides predictive timeline forecasting, workload distribution monitoring, and automated compliance auditing. By reducing manual status meetings and administrative overhead, Moxt helps operational leaders scale team efficiency and ensure project delivery consistency.`,

  "miocai": `MiocAI is a versatile AI writing assistant, content generation engine, and copywriting suite crafted to help writers, bloggers, digital marketers, and business professionals craft compelling text content effortlessly. Designed to combat writer's block and speed up drafting workflows, MiocAI produces high-quality articles, social media captions, product descriptions, and ad copy in seconds.

The platform provides a suite of specialized writing tools, including long-form blog post outline generators, sentence rephrasers, tone adjusters, and headline analyzers. Users can input basic topic ideas or keyword targets, select a desired brand voice (such as professional, humorous, or persuasive), and receive multiple polished content drafts ready for editing and publishing.

MiocAI incorporates built-in plagiarism checking, SEO keyword optimization recommendations, and multi-language translation. Whether drafting weekly marketing newsletters, polishing academic essays, or creating social media content schedules, MiocAI equips creators with a reliable writing companion.`,

  "trustmrr": `TrustMRR is a verified SaaS revenue tracking, financial analytics, and Monthly Recurring Revenue (MRR) transparency platform designed for founders, angel investors, and software acquisition buyers. In the fast-moving SaaS ecosystem, TrustMRR delivers audit-grade financial data by integrating directly with payment processors like Stripe, Paddle, and ChartMogul.

The platform calculates core SaaS business metrics—including MRR, ARR, Net Revenue Churn, Customer Acquisition Cost (CAC), Lifetime Value (LTV), and Average Revenue Per User (ARPU)—in real time. Founders can create public or private verified revenue benchmarks to showcase business growth to investors, potential buyers, and community followers with 100% financial accuracy.

TrustMRR offers predictive MRR forecasting, cohort retention charts, and benchmark comparisons against industry peer groups. Whether you are bootstrapping a micro-SaaS, preparing for a venture capital fundraising round, or evaluating software acquisition targets, TrustMRR provides trusted financial intelligence.`,

  "hiapi": `HiAPI is a unified AI model API aggregator and developer infrastructure platform engineered to simplify multi-LLM integration for software engineers, product teams, and enterprise developers. By providing a single standardized REST & OpenAI-compatible API endpoint, HiAPI enables seamless connectivity to dozens of top AI models—including OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini, Meta Llama 3, and Mistral—without managing multiple vendor accounts.

The platform automatically handles API key management, dynamic model failover, intelligent rate limiting, latency optimization, and cost routing. Developers can set custom fallback rules so that if a primary model experiences downtime or rate limits, requests automatically route to an equivalent secondary model without service disruption.

HiAPI features real-time token usage analytics, unified billing dashboards, latency benchmarking, and enterprise security compliance. By eliminating vendor lock-in and reducing infrastructure maintenance, HiAPI empowers engineering teams to build resilient AI applications faster.`,

  "ai-erotic-smut": `AI Erotic Smut is a specialized creative writing generator and interactive narrative platform designed for adult romance authors, fiction writers, and creative storytelling enthusiasts. Built upon fine-tuned language models tailored for romantic tension, character chemistry, and adult fiction genres, the platform helps authors brainstorm character dialogue, draft intimate scenes, and overcome creative writing blocks.

Users can input detailed character profiles, relationship dynamics, narrative tropes, and plot outlines to generate custom scene continuations. The platform offers customizable explicit content parameters, sensory detail controls, and emotional tone settings, allowing authors to tailor generated text to specific romance subgenres—such as contemporary, fantasy, historical, or paranormal romance.

Prioritizing complete user privacy and data security, AI Erotic Smut guarantees that all generated stories, prompts, and drafts remain 100% confidential. Whether drafting romance ebooks, writing fan fiction, or exploring creative story concepts, the tool provides a flexible narrative workspace.`,

  "xotic-ai": `Xotic AI is an interactive AI character roleplay and creative story generation studio created for fans of fantasy fiction, interactive narrative games, and digital companion experiences. Featuring a library of customizable AI personas, Xotic AI enables users to engage in open-ended roleplay conversations, co-create fantasy adventures, and explore interactive storytelling scenarios.

The platform utilizes advanced natural language models with extended contextual memory, ensuring that characters maintain consistent personalities, speech patterns, and historical plot knowledge over long conversational threads. Users can design custom characters by configuring detailed personality traits, physical descriptions, background lore, and dialogue styles.

Xotic AI features multi-character scene modes, custom background image generation, and narrative branching options. Designed for both desktop and mobile web browsers, Xotic AI offers an engaging playground for creative writers and digital roleplay enthusiasts.`,

  "ezdubs": `EzDubs is an AI-powered automated video and audio dubbing platform designed to break language barriers by instantly translating video content into foreign languages while preserving the original speaker's authentic voice timbre and emotional inflection. Engineered for content creators, YouTube creators, educators, and global marketing teams, EzDubs makes international video distribution accessible.

The platform combines state-of-the-art speech recognition, neural machine translation, voice cloning, and AI lip-sync technology. Users simply submit a video link or upload an MP4 file, select target languages (such as Spanish, French, German, Japanese, or Hindi), and receive a fully dubbed video track with synchronized voiceovers and matching subtitles in minutes.

EzDubs is widely used by popular YouTubers to expand their global audience reach by launching multi-language channels without recording localized audio tracks manually. With API integrations for automated live streaming and social media publishing, EzDubs accelerates global video localization.`,

  "hotgens": `HotGens is a creative AI image generator, visual artwork creator, and digital avatar studio designed to transform text prompts into high-resolution visuals, digital illustrations, and stylized graphics. Built with deep diffusion models, HotGens provides artists, social media managers, and digital creators with a flexible canvas for visual expression.

The platform offers multiple artistic style presets—including photorealism, digital concept art, anime, 3D render, oil painting, and vector illustration. Users can fine-tune visual parameters such as aspect ratio, prompt weight, negative prompts, and lighting effects to achieve precise visual outcomes for commercial campaigns or personal projects.

HotGens includes image-to-image conversion, resolution upscaling, and face-swapping capabilities for social avatar creation. Featuring a fast cloud rendering pipeline, HotGens makes visual asset creation effortless for creators across all skill levels.`,

  "audioalter": `Audioalter is a comprehensive web-based suite of online AI audio manipulation, sound editing, and audio processing tools created for musicians, podcasters, video editors, and audio enthusiasts. Offering an intuitive web interface, Audioalter allows users to apply complex audio effects and audio enhancements directly within their browser without installing heavy digital audio workstation (DAW) software.

The toolset includes 8D Audio spatializer, Vocal Remover, Pitch Shifter, Audio Equalizer, Bass Booster, Reverb Generator, Stereo Panner, and Noise Reducer. Users can upload MP3, WAV, or FLAC audio files, select desired processing parameters, and download studio-quality edited audio files instantly.

Audioalter is ideal for creating slowed-and-reverbed music tracks, isolating vocal stems for music remixes, enhancing podcast audio clarity, and applying spatial sound effects for video soundtracks. With zero software setup required, Audioalter provides accessible audio editing tools for creators worldwide.`,

  "whatgpt": `WhatGPT is an intelligent WhatsApp AI assistant that brings the conversational capabilities of advanced large language models directly into your favorite messaging application. By integrating AI assistance into WhatsApp, WhatGPT allows users to ask questions, summarize voice notes, translate foreign text, generate images, and research topics without opening a separate web browser or mobile app.

Key features include instant voice-to-text translation and summarization—allowing users to forward long WhatsApp voice messages and receive concise text summaries in seconds. Users can also send images to WhatGPT for visual analysis, request recipe suggestions, draft emails, or search the web directly inside chat threads.

WhatGPT requires no account setup or app installation—users simply add the official WhatGPT WhatsApp contact number to begin chatting immediately. Perfect for busy professionals, students, and mobile-first users, WhatGPT turns WhatsApp into an all-in-one personal productivity hub.`,

  "chatorg": `ChatOrg is an intelligent AI prompt organizer, chat history manager, and productivity workspace designed for power users of ChatGPT, Claude, and Gemini. As professionals rely heavily on conversational AI models for daily tasks, managing hundreds of past chat threads and saving reusable prompt templates becomes challenging. ChatOrg provides a structured management system to organize your AI interactions.

The platform enables users to categorize chats into custom folders, add searchable tags, bookmark key prompt templates, and format saved responses with markdown syntax highlighting. ChatOrg's browser extension integrates directly with web interfaces like ChatGPT, allowing users to save prompts and export chat histories to Notion, Google Docs, or PDF files with a single click.

ChatOrg also features team collaboration libraries, allowing organizations to share vetted corporate prompt templates across marketing, sales, and engineering departments. By eliminating lost prompts and streamlining chat retrieval, ChatOrg maximizes organizational productivity.`,

  "nudiva-io": `Nudiva.io is an advanced AI photo transformation, digital portrait retouching, and image processing platform engineered for digital artists, photographers, and visual media creators. Utilizing state-of-the-art computer vision models, Nudiva.io transforms digital photos with high artistic fidelity and precision.

The platform provides an array of visual editing tools, including automatic background removal, portrait lighting enhancement, skin texture smoothing, object deletion, and artistic style transfer. Users can upload digital images to adjust visual lighting, apply creative color grading filters, and generate stylized digital avatars.

Nudiva.io features fast cloud rendering, high-resolution image export options, and intuitive controls requiring zero prior graphic design experience. Whether restoring personal photos, editing promotional visual assets, or exploring digital art styles, Nudiva.io offers an easy-to-use image editing workspace.`,

  "alphazria": `Alphazria is a creative AI character studio, custom avatar generator, and interactive narrative platform designed for fiction writers, roleplay creators, and digital companion enthusiasts. Featuring fine-tuned natural language and diffusion models, Alphazria enables users to build custom characters with unique visual avatars, detailed personalities, and rich lore backstories.

The platform's character builder allows creators to define dialogue tone, emotional reactivity, scenario settings, and conversational memory parameters. Users can engage in interactive text roleplay, write collaborative fantasy stories, or generate custom anime and photorealistic character artwork in real time.

Alphazria offers private messaging modes, custom scenario builders, and multi-character group conversation modes. Designed for seamless performance across desktop and mobile devices, Alphazria provides a dynamic creative playground for narrative storytellers.`,

  "creatok-ai": `Creatok AI is a specialized AI video generator and ad creative production engine engineered specifically for e-commerce brands, TikTok advertisers, and Shopify store owners. Built to solve the bottleneck of video ad creative fatigue, Creatok AI converts product pages into high-converting video advertisements optimized for TikTok, Instagram Reels, and YouTube Shorts.

By integrating with video models and high-quality voiceover engines, Creatok AI automatically extracts product photos, key benefits, customer reviews, and pricing details from your store link. It generates dynamic video scripts, adds trending audio tracks, applies animated captions, and synchronizes natural AI voiceovers in over 20 languages.

Creatok AI enables e-commerce marketers to generate dozens of ad variations for A/B testing in minutes, dramatically lowering customer acquisition costs (CAC) and driving higher conversion rates. With automated aspect ratio formatting and export tools, Creatok AI is an essential video marketing tool for online sellers.`,

  "fapai": `FapAI is an interactive AI character chat studio, virtual companion platform, and creative narrative sandbox created for roleplay enthusiasts and creative fiction writers. Featuring a growing catalog of pre-configured AI personas, FapAI offers immersive conversational interactions with deep personality consistency and memory retention.

Users can create custom AI characters by customizing backstory parameters, visual avatar styles, dialogue preferences, and initial scenario greetings. The platform's conversational engine adapts dynamically to user choices, facilitating deep narrative branching, interactive fantasy roleplay, and creative writing collaboration.

FapAI prioritizes user privacy with encrypted chat sessions, custom content toggles, and private character publishing options. Accessible across mobile and desktop web browsers, FapAI delivers engaging interactive entertainment.`,

  "crano-ai": `Crano AI is an all-in-one generative AI multimedia studio that combines text-to-video production, AI music composition, image generation, and timeline video editing into a unified creative workspace. Engineered for video editors, YouTube creators, and digital agencies, Crano AI simplifies multi-media asset generation.

Users can generate complete video scenes from text prompts, compose custom background soundtrack music tailored to specific moods and tempos, generate high-resolution visual artwork, and assemble everything within an intuitive multi-track timeline editor. The platform includes automatic subtitle generation, voiceover synthesis, and visual transition effects.

Crano AI eliminates the need to switch between multiple separate AI tools for video, audio, and visual generation. With fast cloud rendering speeds and 4K export capabilities, Crano AI empowers creators to produce complete digital media projects rapidly.`,

  "talkai": `TalkAI is an instant, web-accessible conversational AI assistant designed to provide fast, frictionless answers, language translations, writing help, and research support without requiring user registration or account creation. Built for simplicity and speed, TalkAI offers immediate access to AI intelligence across web browsers and messaging channels like WhatsApp.

The platform assists users with a wide spectrum of daily tasks—including answering academic research questions, drafting emails, solving math problems, summarizing long articles, and translating text between global languages. Its clean, clutter-free user interface ensures rapid load times and intuitive navigation for users of all technical skill levels.

TalkAI prioritizes user privacy by offering anonymous session support and zero tracking of personal conversation logs. Whether you need a quick homework answer, language practice, or instant brainstorming help, TalkAI provides an accessible conversational AI solution.`,

  "mgai": `MGAI is an innovative AI dating coach, conversation advisor, and social skills assistant designed to help individuals navigate online dating apps, text messaging, and social interactions with confidence. Built by analyzing communication principles, dating dynamics, and social psychology, MGAI offers personalized advice to improve online profile engagement and conversation flow.

Key features include Screenshot Analysis—allowing users to upload screenshots of dating app profiles or text message threads to receive instant analysis, reply suggestions, and conversation openers. The platform helps users craft witty profile bios, overcome awkward texting lulls, and transition digital chats into real-world dates.

MGAI also provides interactive conversation practice modules where users can practice texting scenarios and build social communication confidence. Available 24/7 on web and mobile devices, MGAI serves as a discreet personal dating consultant.`,

  "songtell": `Songtell is an AI-powered lyric interpretation platform, music story analyzer, and song meaning discovery engine designed for music lovers, songwriters, and audio enthusiasts. By processing millions of song lyrics and music press archives, Songtell unlocks the hidden meanings, emotional themes, and narrative inspirations behind your favorite tracks.

Users simply search for any song title or artist name, and Songtell generates a deep analysis detailing the song's poetic themes, metaphorical references, historical context, and songwriter motivations. Users can also generate custom lyric art posters featuring their favorite song quotes formatted for social media sharing or physical printing.

Songtell features a community voting system where music fans can share personal interpretations, discover related songs with similar emotional themes, and explore detailed discography breakdowns. For anyone passionate about music storytelling, Songtell provides a rich window into the art of songwriting.`,

  "flirtify": `Flirtify is an AI pickup line generator, personalized icebreaker creator, and dating app opener assistant designed to bring humor, creativity, and charm to online messaging. Built for users of dating platforms like Tinder, Bumble, and Hinge, Flirtify generates clever conversation starters tailored to specific interests, hobbies, or profile bios.

Users can select from various tone categories—ranging from witty and humorous to cute, cheesy, or romantic—and input key details about their match. Flirtify instantly produces custom opening lines guaranteed to break the ice and stand out from generic greetings.

In addition to pickup lines, Flirtify provides text reply advice and conversation tips to maintain engaging message exchanges. Lightweight, fast, and easy to use, Flirtify helps online daters make memorable first impressions effortlessly.`,

  "ai-undress-video": `AI Undress Video is a video style transfer, visual effects processing, and digital media filter application created for video editors, visual artists, and media experimenters. Operating with computer vision algorithms, the software applies style transformations and visual effects across video sequences.

The platform provides video enhancement controls—including motion tracking, visual style application, background isolation, and high-definition video rendering. Users can upload video files to experiment with digital visual filters and creative video production effects.

Equipped with fast processing pipelines and multi-format support, AI Undress Video offers an experimental workspace for digital video enthusiasts and visual content creators.`,

  "shuttle": `Shuttle is an enterprise AI workflow automation, webhook processing, and business process monitoring engine engineered to automate data synchronization and operational pipelines for software development teams and digital businesses. Built for reliability, Shuttle connects custom APIs, database triggers, and third-party SaaS tools into automated workflows.

Key features include custom webhook listeners, real-time error logging, automated task retries, and visual workflow builders. Users can build automated data pipelines—such as syncing customer purchase events from Shopify into CRM systems, sending automated Slack notifications for critical system alerts, or scheduling automated database backups.

Shuttle provides real-time monitoring dashboards, uptime SLA tracking, and team access controls. By automating repetitive backend operations and eliminating manual data entry, Shuttle helps engineering and operations teams scale business infrastructure efficiently.`,

  "inferkit": `InferKit is a web interface and developer API for state-of-the-art neural text generation, engineered to assist creative writers, storytellers, game developers, and researchers with AI text completion. Utilizing custom language models, InferKit generates coherent prose that matches the style, tone, and context of user-provided seed text.

The platform offers fine-grained generation parameters—including sampling temperature, top-p truncation, repetition penalties, and length limits. Creative writers use InferKit to continue complex fiction stories, generate dynamic dialogue for game characters, and brainstorm novel plot turns.

InferKit provides a developer-friendly API endpoint with pay-as-you-go pricing, enabling engineers to integrate text generation capabilities into external applications, games, and writing software. With robust output controls and fast response times, InferKit offers a powerful text generation engine.`,

  "tea-checker": `Tea Checker is an AI-powered app safety audit tool, domain privacy verifier, and reputation analysis platform built to help mobile users, parents, and security enthusiasts verify the security and privacy claims of digital applications and web platforms. Designed in response to growing privacy concerns around social apps, Tea Checker delivers transparent security reports.

The tool analyzes app permissions, domain registration history, data collection practices, encryption standards, and user reviews to generate a comprehensive safety score. Users can search for any mobile application or website to review security flags, data privacy disclosures, and community trust ratings.

Tea Checker offers recommendations for verified safe alternative apps that respect user privacy rights. By providing actionable cybersecurity intelligence in plain language, Tea Checker empowers consumers to make informed software download decisions.`
};

async function updateSeedDataAndSupabase() {
  console.log('🚀 Starting expansion of tool descriptions to > 200 words...');

  // 1. Read seedData.ts file
  const seedPath = path.join(__dirname, 'src', 'utils', 'seedData.ts');
  let content = fs.readFileSync(seedPath, 'utf8');

  let updatedSeedCount = 0;

  for (const [slug, newDesc] of Object.entries(expandedDescriptions)) {
    const wordCount = newDesc.trim().split(/\s+/).filter(Boolean).length;
    console.log(`[${slug}] New description word count: ${wordCount} words`);

    // Match the tool object by slug in seedData.ts and replace its description property
    // Search pattern for description property near slug
    const regex = new RegExp(`(slug:\\s*['"]${slug}['"][\\s\\S]*?description:\\s*)(['"\`][\\s\\S]*?['"\`]),`, 'g');
    
    if (regex.test(content)) {
      content = content.replace(regex, (match, prefix) => {
        // Format description with template string or clean quotes
        const formattedDesc = JSON.stringify(newDesc);
        return `${prefix}${formattedDesc},`;
      });
      updatedSeedCount++;
    } else {
      console.warn(`⚠️ Could not regex-match slug "${slug}" in seedData.ts`);
    }
  }

  // Write updated content back to seedData.ts
  fs.writeFileSync(seedPath, content, 'utf8');
  console.log(`\n✅ Successfully updated ${updatedSeedCount} tools in seedData.ts!`);

  // 2. Now sync updated seed tools to Supabase DB using Supabase client
  console.log('\n🔄 Syncing expanded tool descriptions to Supabase Database...');

  let dbUpdateCount = 0;
  for (const [slug, newDesc] of Object.entries(expandedDescriptions)) {
    const { data, error } = await supabase
      .from('tools')
      .update({ description: newDesc })
      .eq('slug', slug);

    if (error) {
      console.error(`❌ Error updating Supabase tool [${slug}]:`, error.message);
    } else {
      dbUpdateCount++;
    }
  }

  console.log(`✅ Successfully updated ${dbUpdateCount} tools in Supabase DB!`);
}

updateSeedDataAndSupabase();
