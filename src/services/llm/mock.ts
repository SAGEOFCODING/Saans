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

    // 4. Children and outdoor play (Prompt 1)
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

    // 5. Morning run / outdoor exercise (Prompt 2)
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

    // 6. Cloth / surgical masks vs N95 (Prompt 3)
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

    // 7. Purifier placement (Prompt 4)
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

    // 8. General air purifier simulation
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

    // 9. Ventilation / opening windows
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

    // 10. Cooking & kitchen chimney
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

    // 11. Scientific myth-busters (houseplants, steam, DIY box-fan)
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
