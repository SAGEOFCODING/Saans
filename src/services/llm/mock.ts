import type { LLMProvider, JsonRequest, StreamRequest, ChatEvent } from './provider';
import { executeTool, toolLookupPlaybook } from './tools';
import stringsEn from '../../data/strings.en.json';
import stringsHi from '../../data/strings.hi.json';

interface ExtractedFacts {
  air?: { aqi: number; category: string; pm25: number; stagnant?: boolean };
  blocks?: Array<{ id: string; actions?: Array<{ id: string; titleEn?: string; deltaPct?: number }> }>;
  civic?: string;
  lang?: 'en' | 'hi';
}

export class MockProvider implements LLMProvider {
  readonly name = 'mock' as const;

  async json<T>(req: JsonRequest<T>): Promise<T> {
    const match = req.user.match(/<facts>([\s\S]*?)<\/facts>/);
    const facts: ExtractedFacts = match ? JSON.parse(match[1]) : {};
    const lang = facts.lang === 'hi' ? 'hi' : 'en';
    const s = lang === 'hi' ? stringsHi : stringsEn;
    const cat = facts.air?.category || 'moderate';
    const headline = String(s.templateNarration.headlineModerate);
    const summary = `${s.templateNarration.summaryPrefix} ${cat}. ${s.templateNarration.summaryReduction} 24%.`;

    const blocks = (facts.blocks || []).map((b) => ({
      id: b.id,
      intro: lang === 'hi' ? `${b.id} सुझाव` : `${b.id} recommendations`,
    }));

    const actions = (facts.blocks || []).flatMap((b) =>
      (b.actions || []).map((a) => ({
        id: a.id,
        tip: a.titleEn || a.id,
        whyPlain: lang === 'hi' ? 'प्रदूषण से सुरक्षा में सहायक।' : 'Helps lower exposure during peak hours.',
      }))
    );

    const watchouts: string[] = [];
    if (facts.air?.stagnant) {
      watchouts.push(lang === 'hi' ? 'हवा रुकी हुई है।' : 'Atmospheric stagnation detected: still, cold air traps smoke.');
    }
    if (facts.civic) watchouts.push(facts.civic);

    const payload = { headline, summary, blocks, actions, watchouts };
    return req.schema.parse(payload);
  }

  async *stream(req: StreamRequest): AsyncIterable<ChatEvent> {
    const rawMsg = req.messages[req.messages.length - 1]?.content || '';
    const cleanMsg = rawMsg.replace(/<\/?user_data>/g, '').trim();
    const isHi = req.lang === 'hi' || /[\u0900-\u097F]/.test(cleanMsg);
    const ctx = req.toolContext;

    // 1. Adversarial instructions / Attempt to manipulate AQI
    if (/ignore\s+previous|say\s+aqi\s+is\s+50|reveal\s+prompt|system\s+prompt/i.test(cleanMsg)) {
      yield* this.yieldTokens(
        isHi
          ? 'मैं सुरक्षा दिशानिर्देशों को अनदेखा नहीं कर सकता या वायु गुणवत्ता डेटा को बदल नहीं सकता। प्रामाणिक वायु डेटा ही रिपोर्ट किया जाता है।'
          : 'I cannot ignore safety guidelines or modify reported air quality metrics. Air quality is monitored through authentic data.'
      );
      return;
    }

    // 2. Medical dosage / drug prescriptions
    if (/dose|salbutamol|inhaler|prescription|दवा|खुराक|इन्हेलर/i.test(cleanMsg)) {
      yield* this.yieldTokens(
        isHi
          ? 'मैं किसी दवा की खुराक या चिकित्सकीय सलाह नहीं दे सकता। कृपया डॉक्टर या फार्मासिस्ट से परामर्श लें।'
          : 'I cannot prescribe medication doses or provide medical diagnoses. Please consult a qualified doctor or pharmacist.'
      );
      return;
    }

    // 3. Off-topic queries (poems, jokes, pets)
    if (/poem|cats|cat\b|story|joke|कविता|बिल्ली|कहानी|चुटकुला/i.test(cleanMsg)) {
      yield* this.yieldTokens(
        isHi
          ? 'मैं विशेष रूप से वायु गुणवत्ता, दिनचर्या और स्वच्छ हवा पर मार्गदर्शन देता हूँ। मैं स्वच्छ हवा के बारे में आपकी क्या मदद कर सकता हूँ?'
          : 'I focus exclusively on air quality, household routines, and low-emission choices. How can I assist you with clean air today?'
      );
      return;
    }

    // 4. Greetings and conversation openers
    if (/^(?:hi|hello|hey|namaste|नमस्ते|सुप्रभात|good\s+morning|good\s+afternoon|good\s+evening)\b/i.test(cleanMsg)) {
      yield* this.yieldTokens(
        isHi
          ? 'नमस्ते! मैं सांस (Saans) स्वच्छ-वायु सहायक हूँ। मैं आपको आज के सुरक्षित समय, कमरे की हवा साफ रखने, मास्क चुनने और परिवार की दिनचर्या में मदद कर सकता हूँ। आप क्या जानना चाहते हैं?'
          : "Hello! I am Saans, your clean-air copilot. I can help with today's outdoor windows, indoor air tips, mask selection, or your family's daily plan. What would you like to check?"
      );
      return;
    }

    // 5. Cloth / surgical masks vs N95 (Prompt 3)
    if (/mask|cloth|surgical|n95|ffp2|मास्क|कपड़े.*मास्क/i.test(cleanMsg)) {
      const res = toolLookupPlaybook('cloth_masks_myth');
      yield { event: 'tool', data: { name: 'lookup_playbook', args: { topic: 'cloth_masks_myth' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'साधारण कपड़े या ढीले सर्जिकल मास्क बारीक PM2.5 कणों को नहीं रोक सकते क्योंकि उनके छिद्र बड़े होते हैं। स्मॉग से सुरक्षित रहने के लिए चेहरे पर अच्छी तरह सील होने वाला N95 या FFP2 रेस्पिरेटर ही पहनें।'
          : 'Cloth bandanas and loose surgical masks do not block microscopic PM2.5 particles because fabric pores are too large. Wear a certified, tightly fitted N95 or FFP2 respirator with an airtight nose seal.'
      );
      return;
    }

    // 6. Children and outdoor play (Prompt 1)
    if (/play|child|kid|park|4\s*pm|खेल|बच्चा|पार्क/i.test(cleanMsg) && ctx) {
      const res = await executeTool('get_best_window', { activity: 'play' }, ctx);
      yield { event: 'tool', data: { name: 'get_best_window', args: { activity: 'play' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'वर्तमान में शाम 4 बजे स्मॉग बढ़ने के कारण बच्चों का बाहर खेलना जोखिम भरा है। बाहर खेलने के लिए सबसे सुरक्षित समय दोपहर के दौरान है। शाम को बच्चों को घर के अंदर ही रखें।'
          : 'Outdoor play around 4 PM is high risk during winter smog due to evening particulate buildup. The best window for outdoor play is in the afternoon. Keep children indoors during peak evening pollution.'
      );
      return;
    }

    // 7. Morning run / outdoor exercise (Prompt 2)
    if (/(?:go\s+for\s+a\s+)?run\b|walk|exercise|morning|jog|7\s*am|सैर|दौड़|व्यायाम|कसरत/i.test(cleanMsg) && ctx) {
      const res = await executeTool('get_best_window', { activity: 'exercise' }, ctx);
      yield { event: 'tool', data: { name: 'get_best_window', args: { activity: 'exercise' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'सुबह 7 बजे के आसपास स्मॉग और वायु प्रदूषण सबसे अधिक रहता है। बाहर टहलने या दौड़ने के लिए दोपहर का समय सबसे बेहतर है। सुबह घर पर ही योग या हल्का व्यायाम करें।'
          : 'The best window for outdoor exercise is in the afternoon. Early morning hours around 7 am have the highest pollution and surface inversion. For morning routines, switch to indoor exercise.'
      );
      return;
    }

    // 8. Purifier placement (Prompt 4)
    if (/(?:where.*(?:place|put)|placement|place.*purifier|purifier.*place|रख|कहाँ|कहां)/i.test(cleanMsg)) {
      const res = toolLookupPlaybook('purifier_sizing');
      yield { event: 'tool', data: { name: 'lookup_playbook', args: { topic: 'purifier_sizing' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'एयर प्यूरीफायर को बेडरूम में रखें जहां परिवार रात भर सोता है। इसे दीवार और दरवाजों से 1-2 फीट दूर रखें ताकि हवा का प्रवाह ठीक रहे, और कमरे की खिड़कियां बंद रखें।'
          : 'Place the air purifier in the bedroom where your family spends 8 hours sleeping. Position it 1–2 feet away from walls and doors to ensure 360° airflow, slightly elevated, with windows closed.'
      );
      return;
    }

    // 9. General air purifier simulation
    if (/purifier|filter|hepa|simulate|exposure|प्यूरीफायर|फिल्टर/i.test(cleanMsg) && ctx) {
      const res = (await executeTool('simulate', { changes: ['bedroom-purifier-night'] }, ctx)) as { deltaPct: number };
      yield { event: 'tool', data: { name: 'simulate', args: { changes: ['bedroom-purifier-night'] }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? `रात में बेडरूम में एयर प्यूरीफायर चलाने से परिवार के प्रदूषण जोखिम में लगभग ${res.deltaPct}% की कमी आती है।`
          : `Running a bedroom air purifier overnight reduces household exposure by approximately ${res.deltaPct}%.`
      );
      return;
    }

    // 10. Ventilation / opening windows
    if (/ventilat|window|खिड़की|हवादार/i.test(cleanMsg) && ctx) {
      const res = await executeTool('get_best_window', { activity: 'ventilate' }, ctx);
      yield { event: 'tool', data: { name: 'get_best_window', args: { activity: 'ventilate' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'कमरे की खिड़कियां केवल दोपहर (12 से 3 बजे) के दौरान खोलें जब धूप से प्रदूषण कम होता है। सुबह और रात में खिड़कियां पूरी तरह बंद रखें।'
          : 'Ventilate rooms only during the warmest afternoon hours (12 PM to 3 PM) when ambient PM2.5 dips. Keep windows and doors tightly shut during cold morning and evening hours.'
      );
      return;
    }

    // 11. Cooking & kitchen chimney
    if (/cook|kitchen|chimney|gas|stove|रसोई|खाना|चिमनी/i.test(cleanMsg)) {
      const res = toolLookupPlaybook('cooking_chimney');
      yield { event: 'tool', data: { name: 'lookup_playbook', args: { topic: 'cooking_chimney' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'खाना बनाते समय रसोई की चिमनी या एग्जॉस्ट पंखा जरूर चलाएं और रसोई का दरवाजा बंद रखें ताकि धुआं बेडरूम में न फैले।'
          : 'Turn on kitchen exhaust chimneys or fans before lighting the stove and keep them running 5-10 minutes after cooking. Keep kitchen doors closed to prevent smoke from spreading.'
      );
      return;
    }

    // 12. Incense, agarbatti, dhoop
    if (/(?:incense|agarbatti|dhoop|candle|अगरबत्ती|धूप)/i.test(cleanMsg)) {
      yield* this.yieldTokens(
        isHi
          ? 'बंद कमरों में अगरबत्ती या धूपबत्ती जलाने से कमरे के अंदर बारीक कणों का भारी प्रदूषण होता है। स्मॉग के दिनों में इन्हें बंद कमरों में न जलाएं।'
          : 'Burning agarbatti, dhoop, or scented candles generates high concentrations of indoor PM2.5 and ultrafine soot. Avoid burning them in closed rooms during smog season.'
      );
      return;
    }

    // 13. Scientific myth-busters (houseplants, steam, DIY box-fan)
    if (/plant|houseplant|पौधे|गमले/i.test(cleanMsg)) {
      const res = toolLookupPlaybook('houseplants_myth');
      yield { event: 'tool', data: { name: 'lookup_playbook', args: { topic: 'houseplants_myth' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'घर के गमले या पौधे हवा से हानिकारक PM2.5 कणों को साफ नहीं कर पाते। इसके लिए HEPA फिल्टर युक्त प्यूरीफायर ही प्रभावी है।'
          : 'Common houseplants do not meaningfully remove fine PM2.5 in real-world homes. HEPA filtration is recommended.'
      );
      return;
    }

    if (/steam|भाप/i.test(cleanMsg)) {
      const res = toolLookupPlaybook('steam_myth');
      yield { event: 'tool', data: { name: 'lookup_playbook', args: { topic: 'steam_myth' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'भाप लेने से फेफड़ों में जमा PM2.5 कण बाहर नहीं निकलते। सबसे सुरक्षित उपाय घर के अंदर रहकर प्रदूषण से बचना है।'
          : 'Inhaling steam does not remove PM2.5 particles from lungs, as particulates penetrate deep into alveoli where steam cannot reach. Focus on reducing inhaled exposure.'
      );
      return;
    }

    if (/diy|box\s+fan|corsi|सस्ता.*प्यूरीफायर/i.test(cleanMsg)) {
      const res = toolLookupPlaybook('diy_filter');
      yield { event: 'tool', data: { name: 'lookup_playbook', args: { topic: 'diy_filter' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'बॉक्स-फैन और MERV-13 फिल्टर को जोड़कर बनाया गया DIY फिल्टर बहुत कम खर्च में कमरे के लिए बेहतरीन एयर क्लीनर बन जाता है।'
          : 'A standard box fan taped securely to a MERV-13 furnace filter creates an effective, low-cost air cleaner for bedrooms.'
      );
      return;
    }

    // 14. Vulnerable groups: Baby, child, elderly, asthma, pregnancy
    if (/(?:baby|infant|pregnant|pregnancy|elderly|senior|asthma|बुजुर्ग|दमा|गर्भवती)/i.test(cleanMsg) && ctx) {
      yield* this.yieldTokens(
        isHi
          ? 'बुजुर्गों, नन्हे बच्चों और सांस के मरीजों को सुबह और रात में बाहर निकलने से पूरी तरह बचना चाहिए। घर के अंदर प्यूरीफायर चलाकर सुरक्षित कमरे में रहें।'
          : 'Vulnerable individuals (infants, seniors, and asthma patients) should stay in clean indoor microenvironments with active HEPA filtration. Avoid all morning and evening outdoor trips.'
      );
      return;
    }

    // 15. Definitions: What is AQI / PM2.5?
    if (/(?:what\s+is\s+aqi|what\s+is\s+pm2\.5|meaning\s+of\s+aqi|aqi\s+क्या\s+है)/i.test(cleanMsg)) {
      yield* this.yieldTokens(
        isHi
          ? 'AQI हवा की सेहत का 0 से 500 तक का पैमाना है। PM2.5 वो अतिसूक्ष्म कण हैं जो बाल से 30 गुना छोटे होते हैं और सांस के जरिए सीधे फेफड़ों में चले जाते हैं।'
          : 'AQI (Air Quality Index) measures air health from 0 to 500. PM2.5 refers to microscopic particles under 2.5 microns (30x thinner than hair) that penetrate deep into the lungs and bloodstream.'
      );
      return;
    }

    // 16. GRAP / Government rules
    if (/(?:grap|restriction|diesel|odd\s+even|gr\s*ap)/i.test(cleanMsg)) {
      yield* this.yieldTokens(
        isHi
          ? 'GRAP (ग्रेडेड रिस्पांस एक्शन प्लान) के तहत गंभीर प्रदूषण में गैर-जरूरी निर्माण कार्यों पर रोक और पुराने भारी वाहनों के संचालन पर प्रतिबंध लागू रहते हैं।'
          : 'Under Delhi-NCR GRAP emergency stages, non-essential construction is halted, polluting commercial diesel vehicles are banned, and public transport frequency is increased.'
      );
      return;
    }

    // 17. General guidance / "What should I do?" / "Tips" / "Help"
    if (/(?:what\s+should\s+i\s+do|how\s+to\s+protect|what\s+can\s+i\s+do|tips|recommendations|advice|\bguide\b|\bhelp\b|क्या\s+करूं|सुझाव|मदद)/i.test(cleanMsg) && ctx) {
      const actions = (await executeTool('get_plan_actions', { domain: 'indoor' }, ctx)) as Array<{ title: string }>;
      yield { event: 'tool', data: { name: 'get_plan_actions', args: { domain: 'indoor' }, result: actions } };
      yield* this.yieldTokens(
        isHi
          ? 'वर्तमान गंभीर प्रदूषण में आपके मुख्य 3 उपाय: 1) रात में बेडरूम में प्यूरीफायर चलाएं; 2) बाहर निकलते समय N95 मास्क पहनें; 3) खिड़कियां दोपहर तक पूरी तरह बंद रखें।'
          : 'For current severe smog, your top actions are: 1) Run your bedroom air purifier overnight; 2) Wear a tight N95 mask when stepping out; 3) Keep windows sealed until afternoon. You can explore and toggle these in your daily plan.'
      );
      return;
    }

    // 18. General air quality inquiry: "How is the air?" / "Is it bad outside?"
    if (/(?:how\s+is\s+the\s+air|air\s+quality|is\s+it\s+bad|current\s+aqi|pollution\s+level|हवा\s+कैसी\s+है|प्रदूषण\s+कितना\s+है)/i.test(cleanMsg) && ctx) {
      const res = (await executeTool('get_air_now', {}, ctx)) as { aqi: number; pm25: number; category: string; visibilityKm?: number };
      yield { event: 'tool', data: { name: 'get_air_now', args: {}, result: res } };
      yield* this.yieldTokens(
        isHi
          ? `वर्तमान में वायु गुणवत्ता ${res.category} श्रेणी में है और AQI ${res.aqi} है (PM2.5: ${res.pm25} µg/m³)। बाहर निकलने से बचें और खिड़कियां बंद रखें।`
          : `Current air is ${res.category.toUpperCase()} with an AQI of ${res.aqi} (PM2.5 is ${res.pm25} µg/m³). Visibility is about ${res.visibilityKm ?? 2} km. Outdoor exposure should be strictly minimized.`
      );
      return;
    }

    // 19. Stepping outside / Going out
    if (/(?:go\s+out|outside|step\s+out|safe\s+outside|बाहर\s+जाना|बाहर\s+निकलना)/i.test(cleanMsg) && ctx) {
      const res = await executeTool('get_best_window', { activity: 'walk' }, ctx);
      yield { event: 'tool', data: { name: 'get_best_window', args: { activity: 'walk' }, result: res } };
      yield* this.yieldTokens(
        isHi
          ? 'इस समय बाहर जाना सुरक्षित नहीं है। यदि बहुत आवश्यक हो तो केवल दोपहर के समय ही निकलें और अच्छी तरह फिट N95 मास्क जरूर पहनें।'
          : 'It is best to avoid outdoor exposure during peak smog. If you must go outside, shift errands to the afternoon window and always wear a tight N95 mask.'
      );
      return;
    }

    // Default: Return current air metrics and grounded advice
    if (ctx) {
      const res = (await executeTool('get_air_now', {}, ctx)) as { aqi: number; pm25: number; category: string };
      yield { event: 'tool', data: { name: 'get_air_now', args: {}, result: res } };
      yield* this.yieldTokens(
        isHi
          ? `वर्तमान में आपके क्षेत्र में PM2.5 ${res.pm25} µg/m³ और AQI ${res.aqi} (${res.category}) है। खिड़कियां बंद रखें और बाहर भारी मेहनत से बचें।`
          : `Right now, PM2.5 is ${res.pm25} µg/m³ and the AQI is ${res.aqi} (${res.category}). Keep windows closed during peak hours.`
      );
      return;
    }

    yield* this.yieldTokens(
      isHi
        ? 'सांस वास्तविक समय में वायु गुणवत्ता की निगरानी कर रहा है। आज मैं आपके परिवार की क्या मदद कर सकता हूँ?'
        : 'Saans is monitoring current urban air quality conditions. How can I assist your family today?'
    );
  }

  private async *yieldTokens(text: string): AsyncIterable<ChatEvent> {
    const parts = text.split(' ');
    for (let i = 0; i < parts.length; i++) {
      const chunk = i === parts.length - 1 ? parts[i] : parts[i] + ' ';
      yield { event: 'token', data: { text: chunk } };
    }
    yield { event: 'done', data: {} };
  }
}
